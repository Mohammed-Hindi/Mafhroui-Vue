<template>
  <!-- مساحة المهام: ملخص الحالات + قائمة/لوحة لكل مهام المجموعات + إنشاء مهمة لمجموعات محددة + تفاصيل المهمة -->
  <div class="tk">
    <!-- composeOnly: نافذة الإنشاء وحدها (زر "مهمة جديدة" في صفحات أخرى) بلا قائمة المهام -->
    <template v-if="!composeOnly">
    <section class="dash-card">
      <!-- الإدارة/اللجنة: رأس البطاقة بالعنوان والأزرار — المشرف: بلا رأس -->
      <div v-if="!isSupervisor" class="dash-card-head">
        <h3>المهام</h3>
        <div class="tk-head-tools">
          <button v-if="canAnnounce" type="button" class="pbtn is-outline" @click="$emit('announce')"><Megaphone :size="16" /> إعلان جديد</button>
          <button type="button" class="pbtn is-green" @click="openComposer"><Plus :size="16" /> مهمة جديدة</button>
        </div>
      </div>

      <!-- المشرف: الأزرار بجانب شريط الفلاتر لا داخله ولا فوقه -->
      <div :class="isSupervisor && 'tk-toolbar'">
      <div class="gr-filters tk-filters">
        <label class="gr-search">
          <Search :size="16" />
          <input v-model.trim="q" type="search" placeholder="بحث بعنوان المهمة أو المكلّف…">
        </label>
        <!-- مبدّل العرض: أيقونة جنب البحث (لوحة / قائمة) -->
        <div class="ab-viewtog" role="group" aria-label="طريقة العرض">
          <button type="button" :class="['ab-viewtog-btn', view === 'board' && 'is-active']" :aria-pressed="view === 'board'" title="لوحة" @click="view = 'board'"><Columns3 :size="17" /></button>
          <button type="button" :class="['ab-viewtog-btn', view === 'list' && 'is-active']" :aria-pressed="view === 'list'" title="قائمة" @click="view = 'list'"><List :size="17" /></button>
        </div>
        <!-- فلاتر BaseSelect المعتمدة -->
        <BaseSelect v-model="fStatus" class="tk-filter" placeholder="الحالة" :options="statusOptions" />
        <!-- لجنة الإشراف: الافتراضي مهام المجموعات، واختيار اللجنة أو أحد أعضائها يعرض مهام اللجنة وحدها (منفصلة عن المشرفين) -->
        <BaseSelect v-if="isAdmin" v-model="fCommittee" class="tk-filter" placeholder="لجنة الإشراف" include-placeholder-option :options="committeeOptions" />
        <BaseSelect v-if="!isStaff && !isSupervisor" v-model="fSup" class="tk-filter" placeholder="كل المشرفين" include-placeholder-option :options="supervisorOptions" />
        <BaseSelect v-if="!isStaff" v-model="fGroup" class="tk-filter" placeholder="كل المجموعات" include-placeholder-option value-key="id" label-key="label" :options="groupOptions" />
        <BaseSelect v-if="!isStaff && !isSupervisor" v-model="fDegree" class="tk-filter" placeholder="كل الدرجات" include-placeholder-option :options="degreeOptions" />
        <BaseSelect v-if="!isStaff" v-model="fSpec" class="tk-filter" placeholder="كل التخصصات" include-placeholder-option value-key="id" label-key="name" :options="specOptions" />
        <!-- المشرف: فلترا التخصص والفئة فقط -->
        <BaseSelect v-if="isSupervisor" v-model="fGender" class="tk-filter" placeholder="طلاب وطالبات" include-placeholder-option :options="[{ value: 'male', label: 'طلاب' }, { value: 'female', label: 'طالبات' }]" />
        <!-- عدد الصفوف المعروضة في الجدول (عرض القائمة فقط) -->
        <BaseSelect v-if="view === 'list'" v-model="pageSize" class="tk-filter tk-filter-size" aria-label="عدد الصفوف" :options="pageSizeOptions" />
      </div>
      <div v-if="isSupervisor" class="tk-filters-actions">
        <button v-if="canAnnounce" type="button" class="pbtn is-outline" @click="$emit('announce')"><Megaphone :size="16" /> إعلان جديد</button>
        <button type="button" class="pbtn is-green" @click="openComposer"><Plus :size="16" /> مهمة جديدة</button>
      </div>
      </div>

      <SkeletonLoader v-if="!loaded" variant="cards" :rows="6" />

      <!-- القائمة: سلايدر بنمط سجل المجموعات (6 مهام لكل شريحة) + شريط الملخص الأخضر -->
      <SlideTable v-else-if="view === 'list'" :rows="rows" :size="pageSize" label="المهام" :class="loadingTasks && 'tk-busy'">
        <template #default="{ rows: pageRows }">
          <div class="gr-table-wrap">
            <table class="gr-table evp-table tk-table">
              <thead>
                <tr>
                  <th>المهمة</th>
                  <th class="hm-center">{{ isStaff ? 'عضو اللجنة' : 'المجموعة' }}</th>
                  <th v-if="!isStaff" class="hm-center">المكلّفون</th>
                  <th class="hm-center">موعد التسليم</th>
                  <th class="hm-center">الحالة</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="t in pageRows" :key="t.id" class="gr-row" @click="detail = t">
                  <td>
                    <div class="pt-strong">{{ t.title }}</div>
                    <div v-if="t.description" class="pt-muted tk-desc">{{ t.description }}</div>
                  </td>
                  <td v-if="isStaff" class="hm-center">{{ t.sup }}</td>
                  <td v-else class="hm-center">
                    <div>{{ t.group }}</div>
                    <div class="pt-muted">{{ t.sup }}</div>
                  </td>
                  <td v-if="!isStaff" class="hm-center"><span class="tk-people" :title="names(t)"><span v-for="a in t.assignees.slice(0, 3)" :key="a.id" class="tk-avatar">{{ initials(a.name) }}</span><span v-if="t.assignees.length > 3" class="tk-avatar is-more">+{{ t.assignees.length - 3 }}</span><span v-if="!t.assignees.length" class="pt-muted">كل الفريق</span></span></td>
                  <td class="hm-center tk-nowrap">
                    <div class="mono">{{ t.due ? formatDate(t.due) : '—' }}</div>
                    <div :class="['tk-due', dueTone(t)]">{{ dueLabel(t) }}</div>
                  </td>
                  <td class="hm-center"><span :class="['tk-status', `is-${state(t)}`]">{{ stateLabel(t) }}</span></td>
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
                  <History :size="13" /> {{ canSeeLog(t) ? 'المرفقات والسجل' : 'المرفقات' }} <ChevronDown :size="13" :class="info[t.id] && 'is-open'" />
                </button>
                <div v-if="info[t.id]" class="tk-card-info" @click.stop>
                  <SkeletonLoader v-if="info[t.id] === 'loading'" :rows="3" height="14px" />
                  <template v-else>
                    <p v-if="t.status === 'done'" class="tk-done-by"><Check :size="14" /> أنجزها <b>{{ completedBy(info[t.id].log) || '—' }}</b></p>
                    <h5 class="tk-info-title"><Paperclip :size="14" /> المرفقات <span>{{ info[t.id].files.length }}</span></h5>
                    <ul v-if="info[t.id].files.length" class="tk-files">
                      <li v-for="f in info[t.id].files" :key="f.id || f.file_path" :title="fileName(f.file_path)"><FileText :size="14" /> {{ fileName(f.file_path) }}</li>
                    </ul>
                    <p v-else class="tk-info-empty">لا توجد مرفقات</p>
                    <!-- السجل حسب الدور: الإدارة الكل، اللجنة المشرفين والمجموعات، المشرف مجموعاته -->
                    <template v-if="canSeeLog(t)">
                    <h5 class="tk-info-title"><History :size="14" /> السجل <span>{{ info[t.id].log.length }}</span></h5>
                    <ol v-if="info[t.id].log.length" class="tk-card-log">
                      <li v-for="(e, i) in info[t.id].log" :key="i">
                        <b>{{ e.user?.name || 'النظام' }}</b>
                        <span>{{ describeTaskEvent(e) }}</span>
                        <time>{{ shortDate(e.created_at) }}</time>
                      </li>
                    </ol>
                    <p v-else class="tk-info-empty">لا توجد حركات مسجّلة بعد</p>
                    </template>
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
    </template>

    <!-- إنشاء مهمة -->
    <BaseModal v-model="composer" title="مهمة جديدة" size="lg">
      <!-- فورم مكدّس كقسم واحد متصل بلا عناوين فرعية: قالب (اختياري) ← تفاصيل ← مستلمون ← قنوات -->
      <div class="as-form as-flow">
      <!-- قالب جاهز: أكورديون يفتح/يتسكّر، اختياره يعبّئ العنوان والوصف -->
      <details v-if="!isSupervisor" class="as-acc">
        <summary class="as-acc-head">
          <Paperclip :size="15" />
          <span class="as-acc-t">قالب جاهز <small>اختياري — يعبّئ العنوان والوصف</small></span>
          <ChevronDown :size="17" class="as-acc-chev" />
        </summary>
        <div class="as-acc-body">
          <TemplatePicker kind="task" :title="form.title" :body="form.description" @apply="(t) => useTemplate({ title: t.title || '', description: t.body || '' })" />
        </div>
      </details>

      <section :class="['tk-sec', filled && 'is-filled']">
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

      <section class="tk-sec">
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

      <!-- قنوات الإرسال (للإدارة العامة ولجنة الإشراف فقط) -->
      <section v-if="!isSupervisor" class="tk-sec">
        <div class="tk-sec-body">
          <ChannelPicker v-model="form.channels" :restricted="!isStaffAudience" />
        </div>
      </section>
      </div>

      <div v-if="failed.length" class="palert is-warning tk-failed">
        تعذّر الإنشاء لـ {{ failed.length }}: {{ failed.map((f) => `${f.label} (${f.error})`).join('، ') }}
      </div>

      <template #footer>
        <span :class="['as-summary', !canCreate && 'is-missing']">{{ composeHint }}</span>
        <button type="button" class="pbtn is-outline" @click="composer = false">إلغاء</button>
        <button type="button" class="pbtn is-green" :disabled="!canCreate || sending" @click="create">
          <Send :size="16" /> {{ sending ? `جارٍ الإنشاء… ${done}/${targets.length}` : `إنشاء المهمة (${targets.length})` }}
        </button>
      </template>
    </BaseModal>

    <TaskDetailModal
      v-if="!composeOnly"
      :task="detail" :members="detailMembers" :supervisor="detailSupervisor" :statuses="STATUSES" :show-log="!!detail && canSeeLog(detail)"
      @close="detail = null" @updated="replace" @removed="removeTask"
    />
  </div>
</template>

<script>
import { Check, FileText, Paperclip, CalendarDays, ChevronDown, Columns3, History, List, Megaphone, Plus, Search, Send, Users, X } from 'lucide-vue-next'
import BaseModal from '@/components/ui/BaseModal.vue'
import BaseSelect from '@/components/ui/BaseSelect.vue'
import ChannelPicker from '@/components/shared/ChannelPicker.vue'
import FileDropzone from '@/components/shared/FileDropzone.vue'
import GroupPicker from '@/components/shared/GroupPicker.vue'
import TemplatePicker from '@/components/shared/TemplatePicker.vue'
import SlideTable from '@/components/ui/SlideTable.vue'
import TaskDetailModal from './TaskDetailModal.vue'
import api from '@/services/api'
import { groupGender } from '@/services/adminData'
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

  components: { BaseModal, BaseSelect, ChannelPicker, FileDropzone, GroupPicker, SlideTable, TaskDetailModal, TemplatePicker, Check, FileText, Paperclip, CalendarDays, ChevronDown, Columns3, History, List, Megaphone, Plus, Search, Send, Users, X },

  emits: ['announce'],

  props: {
    groups: { type: Array, default: () => [] },
    composeOnly: { type: Boolean, default: false },
    /** إظهار زر "إعلان جديد" (صفحة التكليفات) — يرسل حدث announce للأب */
    canAnnounce: { type: Boolean, default: false }
  },

  data() {
    return {
      filled: false,
      STATUSES,
      today: localDay(),
      dueChips: [{ label: 'اليوم', days: 0 }, { label: 'غدًا', days: 1 }, { label: 'بعد أسبوع', days: 7 }, { label: 'بعد أسبوعين', days: 14 }],
      tasks: [],
      loadingTasks: false,
      loaded: false,
      counts: {},
      reqId: 0,
      view: 'board',
      pageSize: 25,
      pageSizeOptions: [
        { value: 25, label: 'عرض 25' },
        { value: 50, label: 'عرض 50' },
        { value: 100, label: 'عرض 100' }
      ],
      q: '',
      fCommittee: '',
      fGroup: '',
      fSup: '',
      info: {},
      fDegree: '',
      fSpec: '',
      fGender: '',
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
    ...mapState(useAuthStore, ['userRole', 'user']),
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
      return this.groupPool('group').map((g) => ({ id: g.id, label: g.section ? `شعبة ${g.section} — ${g.name}` : g.name }))
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
      return !!(this.q || this.fCommittee || this.fGroup || this.fSup || this.fStatus || this.fDegree || this.fSpec || this.fGender)
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
    /** مشرف مجموعة المهمة (للضغط عليه وفتح بروفايله) — من بيانات المجموعات، فالـ API لا يُرجعه في تفاصيل المهمة */
    detailSupervisor() {
      return this.detail?.groupId ? (this.groupById[this.detail.groupId]?.sup || null) : null
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
      return [...new Map(this.groupPool('spec').filter((g) => g.specId).map((g) => [g.specId, { id: g.specId, name: g.spec }])).values()]
    },
    /** خيارات فلاتر الشريط بصيغة BaseSelect */
    statusOptions() {
      return this.stats.map((s) => ({ value: s.value, label: `${s.label} (${s.count})` }))
    },
    committeeOptions() {
      return this.committee.map((m) => ({ value: m.id, label: m.name }))
    },
    supervisorOptions() {
      // عند تفعيل درجة/تخصص/فئة: اعرض المشرفين الذين لديهم مجموعات مطابِقة فقط
      if (!(this.fDegree || this.fSpec || this.fGender)) return this.supervisors.map((s) => ({ value: s.id, label: s.name }))
      const ids = new Set(this.groupPool('sup').map((g) => g.sup?.id).filter(Boolean))
      return this.supervisors.filter((s) => ids.has(s.id)).map((s) => ({ value: s.id, label: s.name }))
    },
    degreeOptions() {
      // الدرجات الموجودة فعلًا ضمن المجموعات المطابِقة لباقي الفلاتر (وإلا كل الدرجات)
      const present = new Set(this.groupPool('degree').map((g) => g.degree).filter(Boolean))
      const entries = Object.entries(this.DEGREES)
      return (present.size ? entries.filter(([v]) => present.has(v)) : entries).map(([value, label]) => ({ value, label }))
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
    fSup: 'cascade',
    fDegree: 'cascade',
    fSpec: 'cascade',
    fGender: 'cascade',
    fStatus: 'load'
  },

  async created() {
    this.load()
    // أعضاء اللجنة والمشرفون (GET /users?role=…) لفلاتر المهام وقوائم المستلمين
    const people = (role) => api.get('/users', { params: { role } })
      .then(({ data }) => (data.data || data).map((u) => ({ id: u.id, name: u.name, email: u.email || '', whatsapp: u.whatsapp || '' })))
      .catch(() => [])
    // المشرف يرسل لمجموعاته فقط فلا يحتاج قوائم اللجنة والمشرفين
    if (!this.isSupervisor) [this.committee, this.supervisors] = await Promise.all([people('committee'), people('supervisor')])
  },

  beforeUnmount() {
    clearTimeout(this.qTimer)
  },

  methods: {
    /** القالب: تعبئة العنوان والنص، الانتقال لخطوة التفاصيل، ولمعة قصيرة على الحقول المعبّأة */
    useTemplate(fields) {
      Object.assign(this.form, fields)
      this.step = this.off
      this.filled = false
      requestAnimationFrame(() => { this.filled = true })
      clearTimeout(this.filledTimer)
      this.filledTimer = setTimeout(() => { this.filled = false }, 1600)
    },

    /**
     * سجل حركة المهام في صفحة التكليفات حسب الدور:
     * الإدارة العامة: كل المهام (لجنة الإشراف والمشرفون والمجموعات) · لجنة الإشراف: مهام المشرفين والمجموعات (لا مهام اللجنة نفسها)
     * المشرف: مهام مجموعاته فقط
     */
    canSeeLog(t) {
      if (this.isAdmin) return true
      if (this.isSupervisor) return !!t.groupId
      const committeeIds = new Set(this.committee.map((u) => u.id))
      return !!t.groupId || !(t.assignees || []).some((a) => committeeIds.has(a.id))
    },

    /** تاريخ قصير بأرقام لاتينية للسجل: "16 أكتوبر · 14:05" */
    shortDate(v) {
      const d = new Date(v)
      if (Number.isNaN(d.getTime())) return '—'
      return new Intl.DateTimeFormat('ar-EG-u-nu-latn', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }).format(d)
    },

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
        createdBy: t.created_by?.id ?? null,
        created_by: t.created_by || null,
        groupId: t.team_id,
        // مهمة بلا فريق = مهمة لجنة الإشراف
        group: !t.team_id ? (this.isStaff ? 'لجنة الإشراف' : 'مهمة للمشرف') : section ? `شعبة ${section}` : team.name || g?.name || '—',
        sup: !t.team_id ? (t.assignees || []).map((a) => a.name).join('، ') || '—' : team.supervisor?.name || g?.sup.name || '—'
      }
    },

    /** المجموعات المطابِقة للفلاتر النشطة (المشرف/الدرجة/التخصص/الفئة) عدا الفلتر المستبعد — أساس الخيارات المتتالية */
    groupPool(exclude) {
      return this.groups.filter((g) =>
        (exclude === 'sup' || !this.fSup || g.sup?.id === this.fSup) &&
        (exclude === 'degree' || !this.fDegree || g.degree === this.fDegree) &&
        (exclude === 'spec' || !this.fSpec || g.specId === this.fSpec) &&
        (exclude === 'gender' || !this.fGender || groupGender(g) === this.fGender))
    },

    /** إسقاط الفلاتر التي لم تعد ضمن الخيارات المتاحة بعد تغيّر فلتر أعلى (مثلًا مجموعة لا تخص المشرف المختار) */
    pruneFilters() {
      if (!this.groups.length) return
      if (this.fGroup && !this.groupOptions.some((o) => o.id === this.fGroup)) this.fGroup = ''
      if (this.fSpec && !this.specOptions.some((o) => o.id === this.fSpec)) this.fSpec = ''
      if (this.fDegree && !this.degreeOptions.some((o) => o.value === this.fDegree)) this.fDegree = ''
    },

    /** فلتر متتالٍ: ينظّف الاختيارات غير المتوافقة ثم يعيد الجلب */
    cascade() {
      this.pruneFilters()
      this.load()
    },

    /** GET /tasks بالفلاتر الحالية؛ تُهمل الاستجابات القديمة إذا تغيّر فلتر قبل وصولها */
    async load() {
      if (this.composeOnly) return
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
        (!this.fSpec || g(t).specId === this.fSpec) && (!this.fGender || groupGender(g(t)) === this.fGender) && (!q || `${t.title} ${(t.assignees || []).map((a) => a.name).join(' ')}`.includes(q)))
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
      Object.assign(this, { q: '', fCommittee: '', fGroup: '', fSup: '', fStatus: '', fDegree: '', fSpec: '', fGender: '' })
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
