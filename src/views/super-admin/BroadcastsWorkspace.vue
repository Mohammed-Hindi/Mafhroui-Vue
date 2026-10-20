<template>
  <!-- مساحة الإعلانات أو الملفات (نفس نظام المهام): ملخص الجهات + فلاتر الخادم + قائمة المرسَلة (المرسل، الجهة، التاريخ، القنوات)
       + تفاصيل الإرسال + نافذة إرسال جديد لمجموعات أو لجنة الإشراف أو المشرفين عبر المنصة وواتساب والبريد -->
  <div class="tk">
    <template v-if="!composeOnly">
    <section class="hm-stats tk-stats bc-stats" aria-label="ملخص المرسَلة">
      <button v-for="s in stats" :key="s.value" type="button" :class="['hm-stat', fAudience === s.value && 'is-active']" @click="fAudience = fAudience === s.value ? '' : s.value">
        <span class="hm-stat-label"><i :class="['tk-dot', `is-${s.dot}`]" />{{ s.label }}</span>
        <span class="hm-stat-value">{{ s.count }}</span>
      </button>
    </section>

    <section class="dash-card">
      <div class="dash-card-head">
        <h3>{{ isFile ? 'الملفات المرسَلة' : 'الإعلانات المرسَلة' }}</h3>
        <button type="button" class="pbtn is-green" @click="openComposer"><Plus :size="16" /> {{ isFile ? 'إرسال ملف' : 'إعلان جديد' }}</button>
      </div>

      <div class="gr-filters tk-filters">
        <label class="gr-search">
          <Search :size="16" />
          <input v-model.trim="q" type="search" :placeholder="isFile ? 'بحث بعنوان الملف أو وصفه…' : 'بحث بعنوان الإعلان أو نصه…'">
        </label>
        <select v-if="isAdmin" v-model="fMember" class="gr-select" aria-label="لجنة الإشراف">
          <option value="">لجنة الإشراف</option>
          <option v-for="m in committee" :key="m.id" :value="m.id">{{ m.name }}</option>
        </select>
        <select v-if="!isSupervisor" v-model="fSup" class="gr-select" aria-label="المشرف">
          <option value="">كل المشرفين</option>
          <option v-for="s in supervisors" :key="s.id" :value="s.id">{{ s.name }}</option>
        </select>
        <select v-model="fGroup" class="gr-select" aria-label="المجموعة">
          <option value="">كل المجموعات</option>
          <option v-for="g in groupOptions" :key="g.id" :value="g.id">{{ g.label }}</option>
        </select>
        <!-- المشرف: المجموعة + التخصص والفئة -->
        <template v-if="isSupervisor">
          <select v-model="fSpec" class="gr-select" aria-label="التخصص">
            <option value="">كل التخصصات</option>
            <option v-for="s in specNames" :key="s" :value="s">{{ s }}</option>
          </select>
          <select v-model="fGender" class="gr-select" aria-label="الفئة">
            <option value="">طلاب وطالبات</option>
            <option value="male">طلاب</option>
            <option value="female">طالبات</option>
          </select>
        </template>
      </div>

      <SkeletonLoader v-if="!loaded" variant="cards" :rows="4" />

      <SlideTable v-else :rows="items" :label="isFile ? 'الملفات' : 'الإعلانات'" :class="loading && 'tk-busy'">
        <template #default="{ rows: pageRows }">
          <div class="pt-wrap">
            <table class="pt tk-table">
              <thead><tr><th>{{ isFile ? 'الملف' : 'الإعلان' }}</th><th>الجهة المرسَل إليها</th><th>المرسِل</th><th>تاريخ الإرسال</th><th>القنوات</th></tr></thead>
              <tbody>
                <tr v-for="b in pageRows" :key="b.batch" class="is-link" @click="detail = b">
                  <td>
                    <div class="pt-strong">{{ b.title || 'بلا عنوان' }}</div>
                    <div v-if="b.body" class="pt-muted tk-desc">{{ b.body }}</div>
                    <div v-if="b.attachments.length" class="bc-att-count"><Paperclip :size="13" /> {{ b.attachments.length }} مرفق</div>
                  </td>
                  <td>
                    <span :class="['bc-aud', `is-${b.audience}`]">{{ AUDIENCE[b.audience] }}</span>
                    <div class="pt-muted bc-recips">{{ recipientsLine(b) }}</div>
                  </td>
                  <td>{{ b.author?.name || '—' }}</td>
                  <td><span class="mono">{{ formatDateTime(b.created_at) }}</span></td>
                  <td><span class="bc-channels"><span v-for="c in b.channels" :key="c" :class="['bc-ch', `is-${c}`]">{{ CHANNELS[c] }}</span></span></td>
                </tr>
                <tr v-if="!items.length"><td colspan="5" class="gr-empty">{{ hasFilters ? 'لا توجد نتائج مطابقة للفلاتر' : (isFile ? 'لم تُرسل ملفات بعد' : 'لم تُرسل إعلانات بعد') }}</td></tr>
              </tbody>
            </table>
          </div>
        </template>
        <template #after>
          <div class="gr-sumbar">
            <span>عدد المرسَلة: {{ items.length }}</span>
            <span>إجمالي المستلمين: {{ totalRecipients }}</span>
            <span>بمرفقات: {{ items.filter((b) => b.attachments.length).length }}</span>
          </div>
        </template>
      </SlideTable>
    </section>

    <!-- تفاصيل الإرسال -->
    <BaseModal :model-value="!!detail" :title="detail ? (detail.title || 'بلا عنوان') : ''" size="lg" @update:model-value="!$event && (detail = null)">
      <div v-if="detail" class="bc-detail">
        <dl class="tk-meta bc-meta">
          <div><dt>المرسِل</dt><dd>{{ detail.author?.name || '—' }}</dd></div>
          <div><dt>تاريخ الإرسال</dt><dd class="mono">{{ formatDateTime(detail.created_at) }}</dd></div>
          <div><dt>الجهة</dt><dd>{{ AUDIENCE[detail.audience] }} ({{ detail.recipients.length }})</dd></div>
          <div><dt>القنوات</dt><dd><span class="bc-channels"><span v-for="c in detail.channels" :key="c" :class="['bc-ch', `is-${c}`]">{{ CHANNELS[c] }}</span></span></dd></div>
        </dl>
        <p v-if="detail.body" class="tl-desc bc-body">{{ detail.body }}</p>
        <section v-if="detail.attachments.length" class="tk-detail-block">
          <h4>المرفقات</h4>
          <ul class="tk-files">
            <li v-for="f in detail.attachments" :key="f.id">
              <FileText :size="16" />
              <span class="tk-file-name">{{ f.name }}</span>
              <span class="pt-muted">{{ formatFileSize(f.size) }}</span>
              <button v-if="!isSupervisor" type="button" class="pbtn is-outline is-sm" @click="download(f)"><Download :size="14" /> تنزيل</button>
            </li>
          </ul>
        </section>
        <section class="tk-detail-block">
          <h4>المستلمون</h4>
          <div class="bc-chips"><span v-for="r in detail.recipients" :key="r.id" class="bc-chip">{{ r.name }}</span></div>
        </section>
      </div>
      <template #footer>
        <button v-if="!isSupervisor" type="button" class="pbtn is-red" :disabled="removing" @click="remove"><Trash2 :size="15" /> {{ removing ? 'جارٍ السحب…' : 'سحب الإرسال' }}</button>
      </template>
    </BaseModal>
    </template>

    <!-- إرسال جديد -->
    <BaseModal v-model="composer" :title="isFile ? 'إرسال ملف' : 'إعلان جديد'" size="xl">
      <!-- فورم مكدّس: قالب (اختياري) ← تفاصيل ← مستلمون ← قنوات الإرسال، في تمرير واحد -->
      <div class="as-form">
      <!-- القوالب الدائمة (للإدارة العامة ولجنة الإشراف) — اختيار قالب يعبّئ التفاصيل -->
      <section v-if="!isSupervisor" class="tk-sec">
        <header class="tk-sec-head"><h4>قالب جاهز</h4><span class="pt-muted">اختياري</span></header>
        <div class="tk-sec-body">
          <TemplatePicker :kind="type" :title="form.title" :body="form.body" @apply="(t) => useTemplate({ title: t.title || '', body: t.body || '' })" />
        </div>
      </section>

      <section :class="['tk-sec', filled && 'is-filled']">
        <header class="tk-sec-head"><h4>{{ isFile ? 'تفاصيل الملف' : 'تفاصيل الإعلان' }}</h4></header>
        <div class="tk-sec-body">
          <label class="pfield">
            <span>{{ isFile ? 'عنوان الملف / المرحلة' : 'العنوان' }} <b v-if="isFile" class="as-req">*</b></span>
            <input v-model.trim="form.title" type="text" maxlength="200" :placeholder="isFile ? 'مثال: نموذج التقرير النهائي' : 'مثال: تنبيه بخصوص موعد المناقشات'">
          </label>
          <label class="pfield">
            <span>{{ isFile ? 'وصف (اختياري)' : 'نص الإعلان' }} <b v-if="!isFile" class="as-req">*</b></span>
            <textarea v-model.trim="form.body" rows="5" maxlength="2000" :placeholder="isFile ? 'تعليمات استخدام الملف' : 'نص الإعلان كما سيصل للمستلمين'" />
            <small class="as-count">{{ form.body.length }} / 2000</small>
          </label>
          <!-- المشرف: إعلان المجموعة نصّي فقط (POST /teams/{id}/announcements بلا مرفقات) -->
          <div v-if="isFile || !isSupervisor" class="pfield">
            <span>{{ isFile ? 'الملفات' : 'مرفقات (اختياري)' }} <b v-if="isFile" class="as-req">*</b></span>
            <FileDropzone v-model="form.files" multiple />
          </div>
        </div>
      </section>

      <section class="tk-sec">
        <header class="tk-sec-head">
          <h4>المستلمون</h4>
          <span class="dash-chip">{{ targets.length }} {{ targetNoun }}</span>
        </header>
        <div class="tk-sec-body">
          <nav :class="['tk-aud', isSupervisor ? 'is-2' : !isAdmin && 'is-3']" aria-label="نوع المستلمين">
            <button type="button" :class="audience === 'groups' && 'is-active'" @click="setAudience('groups')">مجموعات محددة</button>
            <button type="button" :class="audience === 'all' && 'is-active'" @click="setAudience('all')">كل المجموعات</button>
            <button v-if="isAdmin" type="button" :class="audience === 'committee' && 'is-active'" @click="setAudience('committee')">لجنة الإشراف</button>
            <button v-if="!isSupervisor" type="button" :class="audience === 'supervisors' && 'is-active'" @click="setAudience('supervisors')">المشرفون</button>
          </nav>
          <GroupPicker v-if="audience === 'groups'" v-model="selected" :groups="groups" />
          <div v-else-if="audience === 'all'" class="palert is-info">سيصل لكل مجموعات الفصل ({{ groups.length }} مجموعة) وطلابها ومشرفيها.</div>
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
                  <span class="gp-item-main"><b>{{ m.name }}</b><span class="pt-muted mono">{{ m.email || m.whatsapp }}</span></span>
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
        </div>
      </section>

      <!-- قنوات الإرسال (للإدارة العامة ولجنة الإشراف فقط) -->
      <section v-if="!isSupervisor" class="tk-sec">
        <header class="tk-sec-head"><h4>قنوات الإرسال</h4></header>
        <div class="tk-sec-body">
          <ChannelPicker v-model="form.channels" :restricted="!isStaffAudience" />
        </div>
      </section>
      </div>

      <div v-if="warnings.length" class="palert is-warning tk-failed">{{ warnings.join(' · ') }}</div>

      <template #footer>
        <span :class="['as-summary', missing && 'is-missing']">{{ missing || `سيصل لـ ${targets.length} ${targetNoun}` }}</span>
        <button type="button" class="pbtn is-outline" @click="composer = false">إلغاء</button>
        <button type="button" class="pbtn is-green" :disabled="!!missing || sending" @click="send">
          <Send :size="16" /> {{ sending ? 'جارٍ الإرسال…' : (isFile ? 'إرسال الملف' : 'نشر الإعلان') }}
        </button>
      </template>
    </BaseModal>
  </div>
</template>

<script>
import { Download, FileText, Paperclip, Plus, Search, Send, Trash2, X } from 'lucide-vue-next'
import BaseModal from '@/components/ui/BaseModal.vue'
import SlideTable from '@/components/ui/SlideTable.vue'
import FileDropzone from '@/components/shared/FileDropzone.vue'
import GroupPicker from '@/components/shared/GroupPicker.vue'
import TemplatePicker from '@/components/shared/TemplatePicker.vue'
import api from '@/services/api'
import { groupGender } from '@/services/adminData'
import { mapState } from 'pinia'
import { useAuthStore } from '@/stores/auth.store'
import { CHANNELS, downloadAttachment, notifyExternal } from '@/services/announcements'
import ChannelPicker from '@/components/shared/ChannelPicker.vue'
import { formatDateTime, formatFileSize } from '@/utils/formatters'

const AUDIENCE = { groups: 'المجموعات', committee: 'لجنة الإشراف', supervisors: 'المشرفون' }
const emptyForm = () => ({ title: '', body: '', files: [], channels: ['platform'] })

export default {
  name: 'BroadcastsWorkspace',

  components: { BaseModal, SlideTable, ChannelPicker, FileDropzone, GroupPicker, TemplatePicker, Download, FileText, Paperclip, Plus, Search, Send, Trash2, X },

  props: {
    /** announcement | file */
    type: { type: String, required: true },
    groups: { type: Array, default: () => [] },
    /** الإنشاء فقط: نافذة الإرسال وحدها بلا قائمة (للاستدعاء من صفحة التكليفات) */
    composeOnly: { type: Boolean, default: false }
  },

  emits: ['close'],

  data() {
    return {
      filled: false,
      AUDIENCE,
      CHANNELS,
      items: [],
      counts: {},
      loaded: false,
      loading: false,
      reqId: 0,
      q: '',
      fAudience: '',
      fMember: '',
      fGroup: '',
      fSpec: '',
      fGender: '',
      fSup: '',
      committee: [],
      supervisors: [],
      detail: null,
      removing: false,
      composer: false,
      audience: 'groups',
      selected: [],
      memberSel: [],
      staffQ: '',
      step: 0,
      form: emptyForm(),
      sending: false,
      warnings: []
    }
  },

  computed: {
    ...mapState(useAuthStore, ['userRole', 'user']),
    /** الإرسال للجنة الإشراف للإدارة العامة وحدها؛ اللجنة ترسل للمشرفين والمجموعات */
    /** المشرف: نفس الصفحة بصلاحياته — إعلانات مجموعاته وملفات مشاريعها */
    isSupervisor() {
      return this.userRole === 'supervisor'
    },
    isAdmin() {
      return this.userRole === 'super_admin'
    },
    isFile() {
      return this.type === 'file'
    },
    specNames() {
      return [...new Set(this.groups.map((g) => g.spec).filter(Boolean))]
    },
    groupById() {
      return Object.fromEntries(this.groups.map((g) => [g.id, g]))
    },
    groupOptions() {
      return this.groups.map((g) => ({ id: g.id, label: g.section ? `شعبة ${g.section} — ${g.name}` : g.name }))
    },
    /** أعداد الخادم لكل جهة (تتبع كل الفلاتر ما عدا الجهة نفسها) — الضغط على رقم يفلتر بالجهة */
    stats() {
      return [
        { value: '', dot: 'all', label: this.isFile ? 'كل الملفات' : 'كل الإعلانات', count: this.counts.all ?? 0 },
        { value: 'groups', dot: 'in_progress', label: 'للمجموعات', count: this.counts.groups ?? 0 },
        // الإرسال للجنة الإشراف للإدارة العامة وحدها
        ...(this.isAdmin ? [{ value: 'committee', dot: 'review', label: 'للجنة الإشراف', count: this.counts.committee ?? 0 }] : []),
        ...(this.isSupervisor ? [] : [{ value: 'supervisors', dot: 'done', label: 'للمشرفين', count: this.counts.supervisors ?? 0 }])
      ]
    },
    hasFilters() {
      return !!(this.q || this.fAudience || this.fMember || this.fGroup || this.fSup || this.fSpec || this.fGender)
    },
    /** GET /announcements/sent — كل فلتر يُرسل مستقلًا ويُطبّق في الخادم */
    params() {
      const p = { type: this.type, audience: this.fAudience, user_id: this.fMember, team_id: this.fGroup, supervisor_id: this.fSup, q: this.q }
      return Object.fromEntries(Object.entries(p).filter(([, v]) => v !== ''))
    },
    totalRecipients() {
      return this.items.reduce((n, b) => n + b.recipients.length, 0)
    },
    isStaffAudience() {
      return this.audience === 'committee' || this.audience === 'supervisors'
    },
    staffList() {
      return this.audience === 'supervisors' ? this.supervisors : this.committee
    },
    /** خطوة القوالب أولًا للإدارة العامة ولجنة الإشراف (المشرف بلا قوالب) */
    off() {
      return this.isSupervisor ? 0 : 1
    },
    steps() {
      return [...(this.off ? ['القوالب'] : []), this.isFile ? 'تفاصيل الملف' : 'تفاصيل الإعلان', 'المستلمون', 'المراجعة والإرسال']
    },
    /** قائمة اللجنة/المشرفين بعد البحث بالاسم أو البريد */
    staffVisible() {
      const q = this.staffQ.toLowerCase()
      return q ? this.staffList.filter((m) => `${m.name} ${m.email}`.toLowerCase().includes(q)) : this.staffList
    },
    allStaffVisible() {
      return this.staffVisible.length > 0 && this.staffVisible.every((m) => this.memberSel.includes(m.id))
    },
    targets() {
      if (this.isStaffAudience) return this.staffList.filter((m) => this.memberSel.includes(m.id))
      return this.audience === 'all' ? this.groups : this.groups.filter((g) => this.selected.includes(g.id))
    },
    targetNoun() {
      return { committee: 'عضو لجنة', supervisors: 'مشرف' }[this.audience] || 'مجموعة'
    },
    missing() {
      if (this.isFile && !this.form.title) return 'أدخل عنوان الملف'
      if (this.isFile && !this.form.files.length) return 'أرفق ملفًا واحدًا على الأقل'
      if (!this.isFile && !this.form.body) return 'أدخل نص الإعلان'
      if (!this.targets.length) return this.isStaffAudience ? `اختر ${this.targetNoun} واحدًا على الأقل` : 'اختر مجموعة واحدة على الأقل'
      return ''
    }
  },

  watch: {
    // المشرف يجلب ما أرسله بعد وصول قائمة مجموعاته
    groups() {
      if (this.isSupervisor) this.load()
    },
    q() {
      clearTimeout(this.qTimer)
      this.qTimer = setTimeout(this.load, 350)
    },
    fAudience: 'load',
    fMember: 'load',
    fGroup: 'load',
    fSpec: 'load',
    fGender: 'load',
    fSup: 'load',
    // في وضع الإنشاء فقط: إغلاق النافذة يُنهي الاستدعاء من الصفحة الأم
    composer(v) {
      if (this.composeOnly && !v) this.$emit('close')
    }
  },

  async created() {
    if (this.composeOnly) this.openComposer()
    else this.load()
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

    formatDateTime,
    formatFileSize,

    async load() {
      if (this.isSupervisor) return this.loadOwnGroups()
      const id = ++this.reqId
      this.loading = true
      try {
        const { data } = await api.get('/announcements/sent', { params: this.params })
        if (id !== this.reqId) return
        this.items = data.data || []
        this.counts = data.meta?.counts || {}
      } catch (err) {
        if (id === this.reqId) this.$toast?.error(err.normalized?.message || 'تعذّر تحميل المرسَلة')
      } finally {
        if (id === this.reqId) {
          this.loading = false
          this.loaded = true
        }
      }
    },

    /** المشرف: ما أرسله لمجموعاته — الإعلانات (GET /teams/{id}/announcements) أو ملفات المشاريع (GET /projects/{id}/files)،
        مجمّعة كإرسال واحد حسب العنوان والنص ودقيقة الإرسال */
    async loadOwnGroups() {
      const id = ++this.reqId
      this.loading = true
      const me = this.user?.id
      const groups = this.isFile ? this.groups.filter((g) => g.project?.id) : this.groups
      const res = await Promise.allSettled(groups.map((g) => api.get(this.isFile ? `/projects/${g.project.id}/files` : `/teams/${g.id}/announcements`)))
      if (id !== this.reqId) return
      const batches = new Map()
      res.forEach((r, i) => {
        const g = groups[i]
        ;(r.value?.data?.data || r.value?.data || []).forEach((a) => {
          const author = this.isFile ? a.uploaded_by : a.author
          if (author?.id !== me) return
          const at = this.isFile ? a.uploaded_at : a.created_at
          const title = this.isFile ? a.stage : a.title
          const key = `${title}|${a.body || ''}|${String(at).slice(0, 16)}`
          const b = batches.get(key) || { batch: key, title, body: a.body || '', author, created_at: at, audience: 'groups', channels: ['platform'], recipients: [], attachments: [], groupIds: [] }
          b.recipients.push({ id: g.id, name: g.section ? `شعبة ${g.section}` : g.name })
          b.groupIds.push(g.id)
          if (this.isFile) b.attachments.push({ id: a.id, name: String(a.file_path).split('/').pop(), size: 0 })
          batches.set(key, b)
        })
      })
      const q = this.q
      const all = [...batches.values()].sort((x, y) => String(y.created_at).localeCompare(String(x.created_at)))
      // الإرسال يطابق إن كانت إحدى مجموعاته من التخصص والفئة المختارين
      const fits = (gid) => { const g = this.groupById[gid] || {}; return (!this.fSpec || g.spec === this.fSpec) && (!this.fGender || groupGender(g) === this.fGender) }
      this.items = all.filter((b) => (!this.fGroup || b.groupIds.includes(this.fGroup)) && b.groupIds.some(fits) && (!q || `${b.title || ''} ${b.body}`.includes(q)))
      this.counts = { all: all.length, groups: all.length }
      this.loading = false
      this.loaded = true
    },

    recipientsLine(b) {
      const names = b.recipients.map((r) => r.name)
      return names.length > 3 ? `${names.slice(0, 3).join('، ')} و${names.length - 3} آخرين` : names.join('، ')
    },

    async download(f) {
      try {
        await downloadAttachment(f)
      } catch {
        this.$toast?.error('تعذّر تنزيل الملف')
      }
    },

    /** DELETE /announcements/batch/{batch} — يختفي من صناديق كل المستلمين */
    async remove() {
      if (!window.confirm('سحب هذا الإرسال من كل المستلمين؟')) return
      this.removing = true
      try {
        await api.delete(`/announcements/batch/${this.detail.batch}`)
        this.detail = null
        this.$toast?.success('تم سحب الإرسال')
        this.load()
      } catch (err) {
        this.$toast?.error(err.normalized?.message || 'تعذّر سحب الإرسال')
      } finally {
        this.removing = false
      }
    },

    openComposer() {
      this.form = emptyForm()
      this.warnings = []
      this.step = 0
      this.staffQ = ''
      this.selected = this.fGroup ? [this.fGroup] : []
      this.memberSel = this.fMember ? [this.fMember] : this.fSup ? [this.fSup] : []
      this.audience = this.fMember ? 'committee' : this.fSup ? 'supervisors' : 'groups'
      this.composer = true
    },

    setAudience(a) {
      if (this.isStaffAudience !== (a === 'committee' || a === 'supervisors') || this.audience !== a) Object.assign(this, { memberSel: [], staffQ: '' })
      this.audience = a
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

    /** POST /announcements/send (المنصة) ثم واتساب/البريد إن اختيرتا (للمشرفين ولجنة الإشراف فقط) */
    async send() {
      if (this.isSupervisor) return this.sendOwnGroups()
      const f = this.form
      const fd = new FormData()
      fd.append('type', this.type)
      fd.append('audience', this.isStaffAudience ? this.audience : 'groups')
      if (f.title) fd.append('title', f.title)
      if (f.body) fd.append('body', f.body)
      f.channels.forEach((c) => fd.append('channels[]', c))
      this.targets.forEach((t) => fd.append(this.isStaffAudience ? 'user_ids[]' : 'team_ids[]', t.id))
      f.files.forEach((file) => fd.append('files[]', file))

      this.sending = true
      this.warnings = []
      try {
        await api.post('/announcements/send', fd, { headers: { 'Content-Type': 'multipart/form-data' } })
      } catch (err) {
        this.sending = false
        this.warnings = [err.normalized?.message || 'تعذّر الإرسال']
        return
      }

      if (this.isStaffAudience) {
        const kind = this.isFile ? 'ملف' : 'إعلان'
        const text = [f.title, f.body].filter(Boolean).join('\n\n') + (f.files.length ? `\n\n(${kind} بمرفقات — متاح على منصة مسار)` : '')
        this.warnings = await notifyExternal(this.targets, f.channels, f.title || `${kind} من الإدارة العامة — مسار`, text)
      }

      // وصل على المنصة؛ ملاحظات القنوات الإضافية تظهر كتنبيه ولا تُبقي النافذة (منعًا لإرسال مكرر)
      this.sending = false
      this.composer = false
      this.$toast?.success(this.isFile ? 'تم إرسال الملف' : 'تم نشر الإعلان')
      if (this.warnings.length) this.$toast?.warning(this.warnings.join(' · '))
      this.load()
    },

    /** المشرف: إعلان لكل مجموعة (POST /teams/{id}/announcements) أو ملف لمشروع كل مجموعة (POST /projects/{id}/files) */
    async sendOwnGroups() {
      const f = this.form
      this.sending = true
      this.warnings = []
      let ok = 0
      for (const g of this.targets) {
        try {
          if (this.isFile) {
            if (!g.project?.id) throw new Error('لا يوجد مشروع مسجّل')
            for (const file of f.files) {
              const fd = new FormData()
              fd.append('file', file)
              if (f.title) fd.append('stage', f.title)
              await api.post(`/projects/${g.project.id}/files`, fd, { headers: { 'Content-Type': 'multipart/form-data' } })
            }
          } else {
            await api.post(`/teams/${g.id}/announcements`, { title: f.title || null, body: f.body })
          }
          ok += 1
        } catch (err) {
          this.warnings.push(`${g.section ? 'شعبة ' + g.section : g.name}: ${err.normalized?.message || err.message || 'خطأ'}`)
        }
      }
      this.sending = false
      if (ok) {
        this.$toast?.success(this.isFile ? `تم إرسال الملف لـ ${ok} مجموعة` : `تم نشر الإعلان لـ ${ok} مجموعة`)
        if (!this.warnings.length) this.composer = false
        this.load()
      }
    }
  }
}
</script>
