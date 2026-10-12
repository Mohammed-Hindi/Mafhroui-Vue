<template>
  <!-- مساحة المهام: ملخص الحالات + قائمة/لوحة لكل مهام المجموعات + إنشاء مهمة لمجموعات محددة + تفاصيل المهمة -->
  <div class="tk">
    <section class="hm-stats tk-stats" aria-label="ملخص المهام">
      <button v-for="s in stats" :key="s.value" type="button" :class="['hm-stat', fStatus === s.value && 'is-active']" @click="fStatus = fStatus === s.value ? '' : s.value">
        <span class="hm-stat-label"><i :class="['tk-dot', `is-${s.value || 'all'}`]" />{{ s.label }}</span>
        <span class="hm-stat-value">{{ s.count }}</span>
      </button>
    </section>

    <section class="dash-card">
      <div class="dash-card-head">
        <h3>المهام</h3>
        <div class="tk-head-tools">
          <nav class="hm-tabs" aria-label="طريقة العرض">
            <button type="button" :class="view === 'list' && 'is-active'" @click="view = 'list'"><List :size="15" /> قائمة</button>
            <button type="button" :class="view === 'board' && 'is-active'" @click="view = 'board'"><Columns3 :size="15" /> لوحة</button>
          </nav>
          <button type="button" class="pbtn is-green" @click="openComposer"><Plus :size="16" /> مهمة جديدة</button>
        </div>
      </div>

      <div class="gr-filters tk-filters">
        <label class="gr-search">
          <Search :size="16" />
          <input v-model.trim="q" type="search" placeholder="بحث بعنوان المهمة أو المكلّف…">
        </label>
        <!-- لجنة الإشراف: الافتراضي مهام المجموعات، واختيار اللجنة أو أحد أعضائها يعرض مهام اللجنة وحدها (منفصلة عن المشرفين) -->
        <select v-if="isAdmin" v-model="fCommittee" class="gr-select" aria-label="لجنة الإشراف">
          <option value="">لجنة الإشراف</option>
          <option v-for="m in committee" :key="m.id" :value="m.id">{{ m.name }}</option>
        </select>
        <select v-if="!isStaff && !isSupervisor" v-model="fSup" class="gr-select" aria-label="المشرف">
          <option value="">كل المشرفين</option>
          <option v-for="s in supervisors" :key="s.id" :value="s.id">{{ s.name }}</option>
        </select>
        <select v-if="!isStaff" v-model="fGroup" class="gr-select" aria-label="المجموعة">
          <option value="">كل المجموعات</option>
          <option v-for="g in groupOptions" :key="g.id" :value="g.id">{{ g.label }}</option>
        </select>
        <select v-if="!isStaff" v-model="fDegree" class="gr-select" aria-label="الدرجة">
          <option value="">كل الدرجات</option>
          <option v-for="(l, k) in DEGREES" :key="k" :value="k">{{ l }}</option>
        </select>
        <select v-if="!isStaff" v-model="fSpec" class="gr-select" aria-label="التخصص">
          <option value="">كل التخصصات</option>
          <option v-for="s in specOptions" :key="s.id" :value="s.id">{{ s.name }}</option>
        </select>
        <button v-if="hasFilters" type="button" class="pbtn is-outline is-sm" @click="clearFilters">مسح الفلاتر</button>
      </div>

      <p v-if="!loaded" class="pt-muted tk-loading">جارٍ تحميل المهام…</p>

      <!-- القائمة: سلايدر بنمط سجل المجموعات (6 مهام لكل شريحة) + شريط الملخص الأخضر -->
      <SlideTable v-else-if="view === 'list'" :rows="rows" label="المهام" :class="loadingTasks && 'tk-busy'">
        <template #default="{ rows: pageRows }">
          <div class="pt-wrap">
            <table class="pt tk-table">
              <thead><tr><th>المهمة</th><th>{{ isStaff ? 'عضو اللجنة' : 'المجموعة' }}</th><th v-if="!isStaff">المكلّفون</th><th>موعد التسليم</th><th>الحالة</th></tr></thead>
              <tbody>
                <tr v-for="t in pageRows" :key="t.id" class="is-link" @click="detail = t">
                  <td>
                    <div class="pt-strong">{{ t.title }}</div>
                    <div v-if="t.description" class="pt-muted tk-desc">{{ t.description }}</div>
                  </td>
                  <td v-if="isStaff">{{ t.sup }}</td>
                  <td v-else>
                    <div>{{ t.group }}</div>
                    <div class="pt-muted">{{ t.sup }}</div>
                  </td>
                  <td v-if="!isStaff"><span class="tk-people" :title="names(t)"><span v-for="a in t.assignees.slice(0, 3)" :key="a.id" class="tk-avatar">{{ initials(a.name) }}</span><span v-if="t.assignees.length > 3" class="tk-avatar is-more">+{{ t.assignees.length - 3 }}</span><span v-if="!t.assignees.length" class="pt-muted">كل الفريق</span></span></td>
                  <td>
                    <div class="mono">{{ t.due ? formatDate(t.due) : '—' }}</div>
                    <div :class="['tk-due', dueTone(t)]">{{ dueLabel(t) }}</div>
                  </td>
                  <td><span :class="['tk-status', `is-${state(t)}`]">{{ stateLabel(t) }}</span></td>
                </tr>
                <tr v-if="!rows.length"><td :colspan="isStaff ? 4 : 5" class="gr-empty">{{ hasFilters ? 'لا توجد مهام مطابقة للفلاتر' : 'لا توجد مهام بعد — ابدأ بإنشاء مهمة جديدة' }}</td></tr>
              </tbody>
            </table>
          </div>
        </template>
        <template #after>
          <div class="gr-sumbar">
            <span v-for="s in summary" :key="s">{{ s }}</span>
          </div>
        </template>
      </SlideTable>

      <!-- اللوحة: متابعة فقط — الحالة يحرّكها المشرف والطلاب، والإدارة ترسل المهام وتتابعها. كل عمود يمرَّر داخله -->
      <template v-else>
        <div :class="['tk-board', loadingTasks && 'tk-busy']">
          <section v-for="col in columns" :key="col.value" class="tk-col">
            <header class="tk-col-head"><i :class="['tk-dot', `is-${col.value}`]" />{{ col.label }} <span>{{ col.items.length }}</span></header>
            <div class="tk-col-body">
              <article v-for="t in col.items" :key="t.id" class="tk-card" tabindex="0" @click="detail = t" @keydown.enter="detail = t">
                <b>{{ t.title }}</b>
                <span class="pt-muted">{{ isStaff ? t.sup : `${t.group} · ${t.sup}` }}</span>
                <span class="tk-card-who"><Users :size="13" /> {{ names(t) }}</span>
                <footer>
                  <span :class="['tk-due', dueTone(t)]"><CalendarDays :size="13" /> {{ t.due ? dueLabel(t) : 'بلا موعد' }}</span>
                  <span :class="['tk-status', `is-${state(t)}`]">{{ stateLabel(t) }}</span>
                </footer>
                <!-- للمسؤول: المرفقات ومن أنجزها وسجل الحركة — يُجلب عند الفتح (GET /tasks/{id} + /activity) -->
                <button type="button" class="tk-card-more" :aria-expanded="!!info[t.id]" @click.stop="toggleInfo(t)">
                  <History :size="13" /> المرفقات والسجل <ChevronDown :size="13" :class="info[t.id] && 'is-open'" />
                </button>
                <div v-if="info[t.id]" class="tk-card-info" @click.stop>
                  <p v-if="info[t.id] === 'loading'" class="pt-muted">جارٍ التحميل…</p>
                  <template v-else>
                    <p v-if="t.status === 'done'"><b>أنجزها:</b> {{ completedBy(info[t.id].log) || '—' }}</p>
                    <p><b>المرفقات ({{ info[t.id].files.length }}):</b> {{ info[t.id].files.map((f) => fileName(f.file_path)).join('، ') || 'لا يوجد' }}</p>
                    <ol v-if="info[t.id].log.length" class="tk-card-log">
                      <li v-for="(e, i) in info[t.id].log" :key="i"><b>{{ e.user?.name || 'النظام' }}</b> {{ describeTaskEvent(e) }} <span class="pt-muted">{{ formatDate(e.created_at) }}</span></li>
                    </ol>
                    <p v-else class="pt-muted">لا توجد حركات مسجّلة بعد.</p>
                  </template>
                </div>
              </article>
              <p v-if="!col.items.length" class="tk-col-empty">لا توجد مهام</p>
            </div>
          </section>
        </div>
        <div class="gr-sumbar">
          <span v-for="s in summary" :key="s">{{ s }}</span>
        </div>
      </template>
    </section>

    <!-- إنشاء مهمة -->
    <BaseModal v-model="composer" title="مهمة جديدة" size="xl">
      <!-- خطوات الإنشاء: التفاصيل ← المستلمون ← المراجعة والإرسال -->
      <ol class="tk-stepper">
        <li v-for="(s, i) in steps" :key="s" :class="[i === step && 'is-active', i < step && 'is-done']">
          <button type="button" @click="step = i"><b>{{ i + 1 }}</b> {{ s }}</button>
        </li>
      </ol>

      <!-- 1. تفاصيل المهمة -->
      <!-- 0. القوالب الدائمة (للإدارة العامة ولجنة الإشراف) — اختيار قالب يعبّئ التفاصيل وينتقل إليها -->
      <section v-if="!isSupervisor" v-show="step === 0" class="tk-sec">
        <header class="tk-sec-head"><h4>القوالب</h4></header>
        <div class="tk-sec-body">
          <TemplatePicker kind="task" :title="form.title" :body="form.description" @apply="(t) => { Object.assign(form, { title: t.title || '', description: t.body || '' }); step = off }" />
        </div>
      </section>

      <section v-show="step === off" class="tk-sec">
        <header class="tk-sec-head"><h4>تفاصيل المهمة</h4></header>
        <div class="tk-sec-body">
          <label class="pfield">
            <span>عنوان المهمة <b class="as-req">*</b></span>
            <input v-model.trim="form.title" type="text" maxlength="200" placeholder="مثال: تسليم الفصل الثاني من التقرير">
          </label>
          <label class="pfield">
            <span>الوصف والتعليمات</span>
            <textarea v-model.trim="form.description" rows="5" placeholder="ما المطلوب تسليمه، وكيف، ومعايير القبول" />
          </label>
          <div class="pfield">
            <span>موعد التسليم</span>
            <input v-model="form.due" type="date" :min="today">
            <div class="tk-chips">
              <button v-for="c in dueChips" :key="c.days" type="button" :class="['tk-chip', form.due === addDays(c.days) && 'is-on']" @click="form.due = addDays(c.days)">{{ c.label }}</button>
              <button v-if="form.due" type="button" class="tk-chip" @click="form.due = ''">بلا موعد</button>
            </div>
          </div>
          <div class="pfield">
            <span>إرفاق ملفات للمهمة (اختياري)</span>
            <FileDropzone v-model="form.files" multiple />
          </div>
        </div>
      </section>

      <!-- 2. المستلمون -->
      <section v-show="step === off + 1" class="tk-sec">
        <header class="tk-sec-head">
          <h4>المستلمون</h4>
          <span class="dash-chip">{{ targets.length }} {{ targetNoun }}</span>
        </header>
        <div class="tk-sec-body">
          <nav :class="['tk-aud', isSupervisor ? 'is-2' : !isAdmin && 'is-3']" aria-label="نوع المستلمين">
            <button type="button" :class="audience === 'groups' && 'is-active'" @click="audience = 'groups'">مجموعات محددة</button>
            <button type="button" :class="audience === 'all' && 'is-active'" @click="audience = 'all'">كل المجموعات</button>
            <button v-if="isAdmin" type="button" :class="audience === 'committee' && 'is-active'" @click="setAudience('committee')">لجنة الإشراف</button>
            <button v-if="!isSupervisor" type="button" :class="audience === 'supervisors' && 'is-active'" @click="setAudience('supervisors')">المشرفون</button>
          </nav>
          <GroupPicker v-if="audience === 'groups'" v-model="selected" :groups="groups" />
          <div v-else-if="audience === 'all'" class="palert is-info">ستُنشأ المهمة لكل مجموعات الفصل ({{ groups.length }} مجموعة).</div>
          <!-- لجنة الإشراف أو المشرفون: مهمة مستقلة لكل شخص محدد يتابع حالتها بنفسه -->
          <div v-else class="tk-people-pick">
            <label class="gr-search">
              <Search :size="16" />
              <input v-model.trim="staffQ" type="search" :placeholder="audience === 'supervisors' ? 'بحث باسم المشرف أو بريده…' : 'بحث باسم العضو أو بريده…'">
            </label>
            <div class="gp-bar">
              <label class="gp-check">
                <input type="checkbox" :checked="allStaffVisible" :indeterminate.prop="!allStaffVisible && staffVisible.some((m) => memberSel.includes(m.id))" @change="toggleStaffVisible">
                تحديد الظاهر ({{ staffVisible.length }})
              </label>
              <span class="pt-muted">المحدّد: <b>{{ memberSel.length }}</b> من {{ staffList.length }}</span>
            </div>
            <ul class="gp-list">
              <li v-for="m in staffVisible" :key="m.id">
                <label :class="['gp-item', memberSel.includes(m.id) && 'is-on']">
                  <input v-model="memberSel" type="checkbox" :value="m.id">
                  <span class="gp-item-main"><b>{{ m.name }}</b><span class="pt-muted mono">{{ m.email }}</span></span>
                </label>
              </li>
              <li v-if="!staffList.length" class="gr-empty">{{ audience === 'supervisors' ? 'لا يوجد مشرفون' : 'لا يوجد أعضاء في لجنة الإشراف' }}</li>
              <li v-else-if="!staffVisible.length" class="gr-empty">لا توجد نتائج مطابقة</li>
            </ul>
          </div>
          <!-- المحدَّدون كرقائق قابلة للإزالة (لا تظهر مع "كل المجموعات") -->
          <div v-if="audience !== 'all' && targets.length" class="tk-picked">
            <span v-for="t in targets" :key="t.id" class="tk-picked-chip">
              {{ t.name }}
              <button type="button" :aria-label="`إزالة ${t.name}`" @click="unpick(t.id)"><X :size="14" /></button>
            </span>
          </div>
          <!-- المنتسبون للمهمة: طلاب كل مجموعة محددة؛ مجموعة بلا تحديد = المهمة لكل أعضائها -->
          <div v-if="audience === 'groups' && targets.length" class="pfield">
            <span>المنتسبون للمهمة</span>
            <div class="as-groups">
              <div v-for="g in targets" :key="g.id" class="as-group">
                <b>{{ g.section ? `شعبة ${g.section} — ` : '' }}{{ g.name }}</b>
                <div class="as-assignees">
                  <label v-for="m in g.members" :key="m.id" class="gp-check">
                    <input v-model="form.assignees" type="checkbox" :value="m.id"> {{ m.name }}
                  </label>
                  <span v-if="!g.members.length" class="pt-muted">لا يوجد طلاب</span>
                </div>
              </div>
            </div>
            <small>بدون تحديد في مجموعة = المهمة لكل أعضائها.</small>
          </div>
        </div>
      </section>

      <!-- 3. المراجعة والإرسال — ponytail: ملخص مبدئي (placeholder)، يُوسَّع لمعاينة كاملة عند الحاجة -->
      <section v-show="step === off + 2" class="tk-sec">
        <header class="tk-sec-head"><h4>المراجعة والإرسال</h4></header>
        <div class="tk-sec-body">
          <dl class="tk-review">
            <dt>العنوان</dt><dd>{{ form.title || '—' }}</dd>
            <dt>موعد التسليم</dt><dd>{{ form.due || 'بلا موعد' }}</dd>
            <dt>المرفقات</dt><dd>{{ form.files.length ? form.files.map((x) => x.name).join('، ') : 'لا يوجد' }}</dd>
            <dt v-if="audience === 'groups'">المنتسبون</dt><dd v-if="audience === 'groups'">{{ pickedAssignees.length ? `${pickedAssignees.length} طالبًا محددًا` : 'كل أعضاء المجموعات' }}</dd>
            <dt>المستلمون</dt><dd>{{ targets.length }} {{ targetNoun }}</dd>
          </dl>
          <ChannelPicker v-if="!isSupervisor" v-model="form.channels" :restricted="!isStaffAudience" />
        </div>
      </section>

      <div v-if="failed.length" class="palert is-warning tk-failed">
        تعذّر الإنشاء لـ {{ failed.length }}: {{ failed.map((f) => `${f.label} (${f.error})`).join('، ') }}
      </div>

      <template #footer>
        <span :class="['as-summary', !canCreate && 'is-missing']">{{ composeHint }}</span>
        <button v-if="step" type="button" class="pbtn is-outline" @click="step -= 1">السابق</button>
        <button v-else type="button" class="pbtn is-outline" @click="composer = false">إلغاء</button>
        <button v-if="step < steps.length - 1" type="button" class="pbtn is-cyan" @click="step += 1">التالي</button>
        <button v-else type="button" class="pbtn is-green" :disabled="!canCreate || sending" @click="create">
          <Send :size="16" /> {{ sending ? `جارٍ الإنشاء… ${done}/${targets.length}` : `إنشاء المهمة (${targets.length})` }}
        </button>
      </template>
    </BaseModal>

    <TaskDetailModal
      :task="detail" :members="detailMembers" :statuses="STATUSES"
      @close="detail = null" @updated="replace" @removed="removeTask"
    />
  </div>
</template>

<script>
import { CalendarDays, ChevronDown, Columns3, History, List, Plus, Search, Send, Users, X } from 'lucide-vue-next'
import BaseModal from '@/components/ui/BaseModal.vue'
import ChannelPicker from '@/components/shared/ChannelPicker.vue'
import FileDropzone from '@/components/shared/FileDropzone.vue'
import GroupPicker from '@/components/shared/GroupPicker.vue'
import TemplatePicker from '@/components/shared/TemplatePicker.vue'
import SlideTable from '@/components/ui/SlideTable.vue'
import TaskDetailModal from './TaskDetailModal.vue'
import api from '@/services/api'
import { mapState } from 'pinia'
import { useAuthStore } from '@/stores/auth.store'
import { notifyExternal } from '@/services/announcements'
import { formatDate, initials } from '@/utils/formatters'
import { DEGREES, completedBy, describeTaskEvent } from '@/utils/progressData'

const STATUSES = [
  { value: 'pending', label: 'لم تبدأ' },
  { value: 'in_progress', label: 'قيد التنفيذ' },
  { value: 'review', label: 'قيد المراجعة' },
  { value: 'done', label: 'مكتملة' }
]
const localDay = (d = new Date()) => d.toLocaleDateString('en-CA')
const emptyForm = () => ({ title: '', description: '', due: '', files: [], assignees: [], channels: ['platform'] })


export default {
  name: 'TasksWorkspace',

  components: { BaseModal, ChannelPicker, FileDropzone, GroupPicker, SlideTable, TaskDetailModal, TemplatePicker, CalendarDays, ChevronDown, Columns3, History, List, Plus, Search, Send, Users, X },

  props: {
    groups: { type: Array, default: () => [] }
  },

  data() {
    return {
      STATUSES,
      today: localDay(),
      dueChips: [{ label: 'اليوم', days: 0 }, { label: 'غدًا', days: 1 }, { label: 'بعد أسبوع', days: 7 }, { label: 'بعد أسبوعين', days: 14 }],
      tasks: [],
      loadingTasks: false,
      loaded: false,
      counts: {},
      reqId: 0,
      view: 'list',
      q: '',
      fCommittee: '',
      fGroup: '',
      fSup: '',
      info: {},
      fDegree: '',
      fSpec: '',
      DEGREES,
      fStatus: '',
      committee: [],
      supervisors: [],
      detail: null,
      composer: false,
      step: 0,
      audience: 'groups',
      selected: [],
      memberSel: [],
      staffQ: '',
      form: emptyForm(),
      sending: false,
      done: 0,
      failed: []
    }
  },

  computed: {
    ...mapState(useAuthStore, ['userRole']),
    /** الإرسال للجنة الإشراف للإدارة العامة وحدها؛ اللجنة ترسل للمشرفين والمجموعات */
    /** المشرف: نفس الصفحة بصلاحياته — مجموعاته فقط عبر /teams/{id}/tasks */
    isSupervisor() {
      return this.userRole === 'supervisor'
    },
    isAdmin() {
      return this.userRole === 'super_admin'
    },
    /** خطوة القوالب أولًا للإدارة العامة ولجنة الإشراف (المشرف بلا قوالب) */
    off() {
      return this.isSupervisor ? 0 : 1
    },
    steps() {
      return [...(this.off ? ['القوالب'] : []), 'تفاصيل المهمة', 'المستلمون', 'المراجعة والإرسال']
    },
    /** عرض مهام لجنة الإشراف (منفصلة)، وإلا مهام المجموعات ومعها مهام المشرفين أنفسهم */
    isStaff() {
      return this.fCommittee !== ''
    },
    /** قائمة المستلمين في نافذة الإنشاء حسب التبويب */
    staffList() {
      return this.audience === 'supervisors' ? this.supervisors : this.committee
    },
    /** قائمة اللجنة/المشرفين بعد البحث بالاسم أو البريد */
    staffVisible() {
      const q = this.staffQ.toLowerCase()
      return q ? this.staffList.filter((m) => `${m.name} ${m.email}`.toLowerCase().includes(q)) : this.staffList
    },
    allStaffVisible() {
      return this.staffVisible.length > 0 && this.staffVisible.every((m) => this.memberSel.includes(m.id))
    },
    groupById() {
      return Object.fromEntries(this.groups.map((g) => [g.id, g]))
    },
    groupOptions() {
      return this.groups.map((g) => ({ id: g.id, label: g.section ? `شعبة ${g.section} — ${g.name}` : g.name }))
    },
    /** أعداد الحالات من الخادم (meta.counts) — تتبع كل الفلاتر ما عدا الحالة نفسها */
    stats() {
      return [
        { value: '', label: 'كل المهام', count: this.counts.all ?? 0 },
        ...STATUSES.map((s) => ({ ...s, count: this.counts[s.value] ?? 0 })),
        { value: 'late', label: 'متأخرة', count: this.counts.late ?? 0 }
      ]
    },
    hasFilters() {
      return !!(this.q || this.fCommittee || this.fGroup || this.fSup || this.fStatus || this.fDegree || this.fSpec)
    },
    /** معاملات GET /tasks — كل فلتر يُرسل مستقلًا ويُطبّق في الخادم */
    params() {
      const person = this.fCommittee
      const p = { audience: this.isStaff ? 'committee' : 'groups', assignee_id: person, team_id: this.fGroup, supervisor_id: this.fSup, degree: this.fDegree, specialization_id: this.fSpec, status: this.fStatus, q: this.q }
      return Object.fromEntries(Object.entries(p).filter(([, v]) => v !== ''))
    },
    /** شريط الملخص الأخضر — من نتائج الخادم بالفلاتر الحالية */
    summary() {
      const all = this.counts.all ?? 0
      return [
        `عدد المهام: ${this.rows.length}`,
        `المكتملة: ${this.counts.done ?? 0}`,
        `المتأخرة: ${this.counts.late ?? 0}`,
        `نسبة الإنجاز: ${all ? Math.round(((this.counts.done ?? 0) / all) * 100) : 0}%`
      ]
    },
    // الترتيب من الخادم: المتأخرة أولًا ثم الأقرب موعدًا
    rows() {
      return this.tasks
    },
    columns() {
      return STATUSES.map((s) => ({ ...s, items: this.rows.filter((t) => t.status === s.value) }))
    },
    // مكلّفو مهمة المجموعة من طلابها، ومهمة بلا مجموعة من نفس جهة المكلّف الحالي (اللجنة أو المشرفون)
    detailMembers() {
      if (!this.detail) return []
      if (this.detail.groupId) return this.groupById[this.detail.groupId]?.members || []
      const ids = this.detail.assignees.map((a) => a.id)
      return this.supervisors.some((s) => ids.includes(s.id)) ? this.supervisors : this.committee
    },
    isStaffAudience() {
      return this.audience === 'committee' || this.audience === 'supervisors'
    },
    /** المستلمون: المجموعات المحددة (تُرسل دفعة واحدة) أو أعضاء اللجنة/المشرفون (مهمة لكل شخص) */
    targets() {
      if (this.isStaffAudience) return this.staffList.filter((m) => this.memberSel.includes(m.id))
      return this.audience === 'all' ? this.groups : this.groups.filter((g) => this.selected.includes(g.id))
    },
    /** المكلّفون المحددون من طلاب المجموعات المحددة حاليًا فقط (إلغاء تحديد مجموعة يُسقط طلابها) */
    pickedAssignees() {
      const ids = new Set(this.targets.flatMap((g) => g.members.map((m) => m.id)))
      return this.form.assignees.filter((id) => ids.has(id))
    },
    specOptions() {
      return [...new Map(this.groups.filter((g) => g.specId).map((g) => [g.specId, { id: g.specId, name: g.spec }])).values()]
    },
    canCreate() {
      return !!this.form.title && this.targets.length > 0
    },
    targetNoun() {
      return { committee: 'عضو لجنة', supervisors: 'مشرف' }[this.audience] || 'مجموعة'
    },
    composeHint() {
      if (!this.form.title) return 'أدخل عنوان المهمة'
      if (!this.targets.length) return `اختر ${this.targetNoun} واحدًا على الأقل`.replace('مجموعة واحدًا', 'مجموعة واحدة')
      return `ستُنشأ لـ ${this.targets.length} ${this.targetNoun}`
    }
  },

  watch: {
    // المشرف يجلب مهام مجموعاته بعد وصول قائمة المجموعات
    groups() {
      if (this.isSupervisor) this.load()
    },
    // البحث بتأخير قصير حتى لا يُرسل طلب مع كل حرف، وباقي الفلاتر فورًا
    q() {
      clearTimeout(this.qTimer)
      this.qTimer = setTimeout(this.load, 350)
    },
    // لجنة الإشراف منفصلة: اختيار عضو يمسح فلتري المجموعة والمشرف
    fCommittee(v) {
      if (v) Object.assign(this, { fGroup: '', fSup: '', fDegree: '', fSpec: '' })
      this.load()
    },
    fGroup: 'load',
    fSup: 'load',
    fDegree: 'load',
    fSpec: 'load',
    fStatus: 'load'
  },

  async created() {
    this.load()
    // أعضاء اللجنة والمشرفون (GET /users?role=…) لفلاتر المهام وقوائم المستلمين
    const people = (role) => api.get('/users', { params: { role } })
      .then(({ data }) => (data.data || data).map((u) => ({ id: u.id, name: u.name, email: u.email || '', whatsapp: u.whatsapp || '' })))
      .catch(() => [])
    ;[this.committee, this.supervisors] = await Promise.all([people('committee'), people('supervisor')])
  },

  beforeUnmount() {
    clearTimeout(this.qTimer)
  },

  methods: {
    formatDate,
    initials,
    completedBy,
    describeTaskEvent,
    fileName: (path = '') => path.split('/').pop(),

    /** فتح/طي تفاصيل البطاقة: المرفقات وسجل الحركة يُجلبان مرة واحدة لكل فتح */
    async toggleInfo(t) {
      if (this.info[t.id]) {
        this.info = { ...this.info, [t.id]: undefined }
        return
      }
      this.info = { ...this.info, [t.id]: 'loading' }
      const [detail, log] = await Promise.allSettled([api.get(`/tasks/${t.id}`), api.get(`/tasks/${t.id}/activity`)])
      const d = detail.value?.data?.data || detail.value?.data || {}
      if (this.info[t.id]) this.info = { ...this.info, [t.id]: { files: d.files || [], log: log.value?.data || [] } }
    },

    addDays(n) {
      const d = new Date()
      d.setDate(d.getDate() + n)
      return localDay(d)
    },

    /** المجموعة والمشرف من team المرفق بالمهمة (GET /tasks)، وإلا من قائمة المجموعات */
    normalize(t) {
      const team = t.team || {}
      const g = this.groupById[t.team_id]
      const section = team.section ?? g?.section
      return {
        id: t.id,
        title: t.title,
        description: t.description || '',
        status: t.status,
        due: t.due_date || '',
        assignees: t.assignees || [],
        groupId: t.team_id,
        // مهمة بلا فريق = مهمة لجنة الإشراف
        group: !t.team_id ? (this.isStaff ? 'لجنة الإشراف' : 'مهمة للمشرف') : section ? `شعبة ${section}` : team.name || g?.name || '—',
        sup: !t.team_id ? (t.assignees || []).map((a) => a.name).join('، ') || '—' : team.supervisor?.name || g?.sup.name || '—'
      }
    },

    /** GET /tasks بالفلاتر الحالية؛ تُهمل الاستجابات القديمة إذا تغيّر فلتر قبل وصولها */
    async load() {
      if (this.isSupervisor) return this.loadOwnGroups()
      const id = ++this.reqId
      this.loadingTasks = true
      try {
        const { data } = await api.get('/tasks', { params: this.params })
        if (id !== this.reqId) return
        this.tasks = (data.data || []).map(this.normalize)
        this.counts = data.meta?.counts || {}
      } catch (err) {
        if (id === this.reqId) this.$toast?.error(err.normalized?.message || 'تعذّر تحميل المهام')
      } finally {
        if (id === this.reqId) {
          this.loadingTasks = false
          this.loaded = true
        }
      }
    },

    /** المشرف: مهام مجموعاته (GET /teams/{id}/tasks لكل مجموعة) والفلاتر والأعداد محليًا */
    async loadOwnGroups() {
      const id = ++this.reqId
      this.loadingTasks = true
      const lists = await Promise.allSettled(this.groups.map((g) => api.get(`/teams/${g.id}/tasks`)))
      if (id !== this.reqId) return
      const all = lists.flatMap((r, i) => (r.value?.data?.data || r.value?.data || []).map((t) => ({ ...t, team_id: t.team_id ?? this.groups[i].id })))
      const g = (t) => this.groupById[t.team_id] || {}
      const q = this.q
      const base = all.filter((t) => (!this.fGroup || t.team_id === this.fGroup) && (!this.fDegree || g(t).degree === this.fDegree) &&
        (!this.fSpec || g(t).specId === this.fSpec) && (!q || `${t.title} ${(t.assignees || []).map((a) => a.name).join(' ')}`.includes(q)))
      const late = (t) => t.status !== 'done' && t.due_date && t.due_date < this.today
      this.counts = { all: base.length, late: base.filter(late).length }
      STATUSES.forEach((st) => { this.counts[st.value] = base.filter((t) => t.status === st.value).length })
      this.tasks = base
        .filter((t) => !this.fStatus || (this.fStatus === 'late' ? late(t) : t.status === this.fStatus))
        .sort((a, b) => (late(b) - late(a)) || String(a.due_date || '9').localeCompare(String(b.due_date || '9')))
        .map(this.normalize)
      this.loadingTasks = false
      this.loaded = true
    },

    state(t) {
      return t.status !== 'done' && t.due && t.due < this.today ? 'late' : t.status
    },

    dueDays(t) {
      return Math.round((Date.parse(t.due) - Date.parse(this.today)) / 864e5)
    },

    dueLabel(t) {
      if (!t.due) return 'بلا موعد'
      if (t.status === 'done') return 'مكتملة'
      const d = this.dueDays(t)
      if (d < 0) return `متأخرة ${-d} يوم`
      return d === 0 ? 'اليوم' : d === 1 ? 'غدًا' : `بعد ${d} أيام`
    },

    dueTone(t) {
      if (!t.due || t.status === 'done') return ''
      const d = this.dueDays(t)
      return d < 0 ? 'is-late' : d <= 2 ? 'is-soon' : ''
    },

    names(t) {
      return t.assignees.map((a) => a.name).join('، ') || 'كل أعضاء المجموعة'
    },

    stateLabel(t) {
      return this.state(t) === 'late' ? 'متأخرة' : STATUSES.find((s) => s.value === t.status)?.label || t.status
    },

    // بعد التعديل يُعاد الجلب: الموعد أو المكلّفون قد يُخرجون المهمة من الفلاتر ويغيّرون الأعداد
    replace(raw) {
      if (this.detail?.id === raw.id) this.detail = this.normalize(raw)
      this.load()
    },

    removeTask() {
      this.detail = null
      this.load()
    },

    clearFilters() {
      Object.assign(this, { q: '', fCommittee: '', fGroup: '', fSup: '', fStatus: '', fDegree: '', fSpec: '' })
    },

    openComposer() {
      this.form = emptyForm()
      this.failed = []
      this.step = 0
      this.selected = this.fGroup ? [this.fGroup] : []
      // تُفتح النافذة على الجهة المعروضة، والشخص المختار في الفلتر محدد مسبقًا
      const person = this.fCommittee
      this.audience = this.isStaff ? 'committee' : 'groups'
      this.memberSel = person ? [person] : []
      this.composer = true
    },

    toggleStaffVisible() {
      const ids = this.staffVisible.map((m) => m.id)
      this.memberSel = this.allStaffVisible
        ? this.memberSel.filter((id) => !ids.includes(id))
        : [...new Set([...this.memberSel, ...ids])]
    },

    /** إزالة مستلم من رقائق المحدَّدين (مجموعة أو شخص حسب الجهة) */
    unpick(id) {
      if (this.isStaffAudience) this.memberSel = this.memberSel.filter((x) => x !== id)
      else this.selected = this.selected.filter((x) => x !== id)
    },

    /** تبديل تبويب المستلمين بين اللجنة والمشرفين يمسح الاختيار السابق (قائمتان مختلفتان) */
    setAudience(a) {
      if (this.audience !== a) Object.assign(this, { memberSel: [], staffQ: '' })
      this.audience = a
    },

    /** مهمة لكل مستلم (مجموعة أو عضو لجنة أو مشرف)، ثم POST /tasks/{id}/files لكل مرفق */
    async create() {
      const f = this.form
      const targets = this.targets
      const noun = this.targetNoun
      this.sending = true
      this.done = 0
      this.failed = []
      const payload = { title: f.title, description: f.description || null, due_date: f.due || null }
      const attach = async (task, label) => {
        for (const file of f.files) {
          const fd = new FormData()
          fd.append('file', file)
          await api.post(`/tasks/${task.id}/files`, fd, { headers: { 'Content-Type': 'multipart/form-data' } })
            .catch(() => this.failed.push({ label, error: `لم يُرفق «${file.name}»` }))
        }
      }
      let created = 0

      if (this.isStaffAudience) {
        // POST /staff/tasks — مهمة مستقلة لكل عضو لجنة أو مشرف
        const reached = []
        for (const m of targets) {
          try {
            const { data } = await api.post('/staff/tasks', { ...payload, user_id: m.id })
            created += 1
            reached.push(m)
            await attach(data.data || data, m.name)
          } catch (err) {
            this.failed.push({ label: m.name, error: err.normalized?.message || 'خطأ' })
          }
          this.done += 1
        }
        // واتساب/البريد (للمشرفين ولجنة الإشراف فقط) لمن أُنشئت مهمته فعلًا
        if (reached.length && f.channels.length > 1) {
          const text = [`مهمة جديدة من الإدارة العامة: ${f.title}`, f.due && `موعد التسليم: ${f.due}`, f.description, 'التفاصيل على منصة مسار ← مهامي'].filter(Boolean).join('\n\n')
          const warnings = await notifyExternal(reached, f.channels, `مهمة جديدة: ${f.title}`, text)
          if (warnings.length) this.$toast?.warning(warnings.join(' · '))
        }
      } else if (this.isSupervisor) {
        // المشرف: POST /teams/{id}/tasks لكل مجموعة، والمكلّفون المحددون من طلابها فقط
        for (const g of targets) {
          const ids = new Set(g.members.map((m) => m.id))
          const assignee_ids = this.pickedAssignees.filter((x) => ids.has(x))
          try {
            const { data } = await api.post(`/teams/${g.id}/tasks`, { ...payload, ...(assignee_ids.length ? { assignee_ids } : {}) })
            created += 1
            await attach(data.data || data, g.name)
          } catch (err) {
            this.failed.push({ label: g.name, error: err.normalized?.message || 'خطأ' })
          }
          this.done += 1
        }
      } else {
        // POST /tasks/batch — كل المجموعات في طلب واحد، والخادم يُشعر كل مشرف مرة واحدة مهما تعدّدت مجموعاته
        const assignees = this.audience === 'groups' ? this.pickedAssignees : []
        try {
          const { data } = await api.post('/tasks/batch', { ...payload, team_ids: targets.map((g) => g.id), ...(assignees.length ? { assignee_ids: assignees } : {}) })
          const tasks = data.data || data
          created = tasks.length
          for (const task of tasks) {
            await attach(task, this.groupById[task.team_id]?.name || '')
            this.done += 1
          }
        } catch (err) {
          this.failed.push({ label: 'المجموعات', error: err.normalized?.message || 'خطأ' })
        }
      }
      this.sending = false
      if (created) {
        this.$toast?.success(`أُنشئت المهمة لـ ${created} ${noun}`)
        this.load()
      }
      if (!this.failed.length) this.composer = false
    }
  }
}
</script>
