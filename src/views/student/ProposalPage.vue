<template>
  <!-- مقترحات الطالب — صفحة واحدة متكيّسة بلا تبويبات ولا خطوات:
       قبل اعتماد المقترح يظهر أعلاه هو (تقديم ← مراجعة ← إعادة تقديم)، وبعد الاعتماد يختفي ويحل محله التقرير النهائي.
       المقترح: تقديم (نموذج مسطّح) ← مراجعة (اعتماد / طلب تعديل / رفض) ← إعادة تقديم
       التقرير النهائي (بعد الاعتماد): رفع (فيديو + PDF) ← موافقة المشرف ← اعتماد لجنة الإشراف ← أرشفة -->
  <div class="dash hd-page">
    <div v-if="!teamsLoaded && !myTeam" class="dash-card"><SkeletonLoader :rows="4" /></div>

    <!-- المقترح: أي حالة قبل الاعتماد (لم يُرسل / قيد المراجعة / مرفوض) -->
    <section v-else-if="!proposalApproved" class="dash-card sp-card">
      <div class="dash-card-head">
        <h3 class="portal-title">المقترح المشروع</h3>
        <span :class="['rv-pill', proposalState.pill]">{{ proposalState.label }}</span>
      </div>

      <!-- رفض أو طلب تعديل: السبب، وعند نفاد المحاولات التنبيه -->
      <p v-if="proposal?.status === 'rejected'" :class="['palert', changesRequested ? 'is-info' : 'is-error']">
        <component :is="changesRequested ? 'PencilLine' : 'XCircle'" :size="18" />
        <span><b>{{ changesRequested ? 'المطلوب تعديله:' : 'سبب الرفض:' }}</b> {{ reasonText || '—' }}</span>
      </p>
      <p v-if="proposal?.status === 'rejected' && !attemptsLeft" class="palert is-error">
        <XCircle :size="18" />
        <span>تم استنفاد محاولات إعادة التقديم المسموحة — تواصلوا مع لجنة الإشراف.</span>
      </p>

      <!-- نموذج التقديم (أو إعادة التقديم بعد الرفض/طلب التعديل): مكدّس بلا خطوات
           نوع المشروع يحدده الطالب مع كل تقديم (الخادم يشترطه أول مرة ويحدّثه عند إعادة التقديم) -->
      <form v-if="showForm" class="sp-form" @submit.prevent="submit">
        <p v-if="!canSubmit" class="palert is-info"><Lock :size="18" /><span>عرض تجريبي — لم يُسجَّل مشروع لفريقك بعد، ويُتاح الإرسال بعد تسجيله.</span></p>

        <section class="tk-sec">
          <header class="tk-sec-head"><h4>بيانات المشروع</h4></header>
          <div class="tk-sec-body">
            <label class="pfield">
              <span>اسم المشروع <b class="as-req">*</b></span>
              <input v-model.trim="form.name" type="text" maxlength="200" placeholder="مثال: نظام حجز القاعات الجامعية">
            </label>
            <div class="pfield">
              <span>نوع المشروع <b class="as-req">*</b></span>
              <div class="tk-chips" role="group" aria-label="نوع المشروع">
                <button
                  v-for="t in PROJECT_TYPES" :key="t" type="button" :aria-pressed="form.types.includes(t)"
                  :class="['tk-chip', form.types.includes(t) && 'is-on']" :disabled="!form.types.includes(t) && form.types.length >= 3"
                  @click="toggleType(t)"
                >
                  {{ t }}
                </button>
                <button
                  type="button" :aria-pressed="otherOn" :class="['tk-chip', otherOn && 'is-on']"
                  :disabled="!otherOn && form.types.length >= 3" @click="toggleOther"
                >
                  أخرى
                </button>
              </div>
              <input v-if="otherOn" v-model="otherType" type="text" maxlength="50" class="mt-2" placeholder="اكتب نوع المشروع">
              <small>اختر من نوع إلى 3 أنواع — المحدد: {{ form.types.length }} من 3</small>
            </div>
          </div>
        </section>

        <section class="tk-sec">
          <header class="tk-sec-head"><h4>فكرة المشروع</h4></header>
          <div class="tk-sec-body">
            <label class="pfield">
              <span>وصف المشروع</span>
              <textarea v-model="form.description" rows="2" @keydown.enter.shift.exact.prevent="bullet($event, 'description')" placeholder="فكرة المشروع باختصار" />
            </label>
            <label class="pfield">
              <span>المشكلة</span>
              <textarea v-model="form.problems" rows="2" @keydown.enter.shift.exact.prevent="bullet($event, 'problems')" placeholder="ما المشكلة التي يحلها المشروع؟" />
            </label>
            <label class="pfield">
              <span>الحل المقترح</span>
              <textarea v-model="form.solutions" rows="2" @keydown.enter.shift.exact.prevent="bullet($event, 'solutions')" placeholder="كيف يحل المشروع المشكلة؟" />
            </label>
            <label class="pfield">
              <span>المميزات والقيمة</span>
              <textarea v-model="form.features_value" rows="2" @keydown.enter.shift.exact.prevent="bullet($event, 'features_value')" placeholder="ما الذي يميّز المشروع وما قيمته للمستفيدين؟" />
            </label>
            <small class="pt-muted">Shift + Enter لبدء بند جديد</small>
          </div>
        </section>

        <section class="tk-sec">
          <header class="tk-sec-head"><h4>ملف المقترح</h4></header>
          <div class="tk-sec-body">
            <FileDropzone v-model="form.files" :max-mb="100" />
            <small class="pt-muted">{{ proposal ? 'اختياري — يبقى الملف السابق إن لم ترفع ملفًا جديدًا.' : 'اختياري — ارفع تقرير المقترح، أو اتركه فيُنشأ ملف PDF من النموذج تلقائيًا عند الإرسال.' }}</small>
          </div>
        </section>

        <p v-if="missing" class="palert is-error"><XCircle :size="18" /><span>{{ missing }}</span></p>

        <footer class="sp-actions">
          <button v-if="proposal" type="button" class="pbtn is-outline" @click="editing = false">إلغاء</button>
          <span class="as-summary" />
          <button type="submit" class="pbtn is-green" :disabled="!!missing || sending"><Send :size="16" /> {{ sending ? 'جارٍ الإرسال…' : proposal ? 'إعادة إرسال المقترح' : 'إرسال المقترح' }}</button>
        </footer>
      </form>

      <!-- ما سُلِّم: البيانات والفكرة، والملف وإعادة المحاولة -->
      <template v-else>
        <section class="tk-sec">
          <header class="tk-sec-head"><h4>بيانات المشروع</h4><span class="pt-muted mono">{{ day(proposal.created_at) }}</span></header>
          <div class="tk-sec-body">
            <dl class="tk-review">
              <dt>اسم المشروع</dt><dd>{{ proposal.name || '—' }}</dd>
              <dt>نوع المشروع</dt><dd>{{ projectTypes.join('، ') || '—' }}</dd>
              <dt>آخر تحديث</dt><dd class="mono">{{ day(proposal.updated_at) }}</dd>
              <dt>المحاولات المتبقية</dt><dd><span :class="['pr-count', !attemptsLeft && 'is-bad']">{{ attemptsLeft }}</span> من {{ MAX_ATTEMPTS }}</dd>
            </dl>
          </div>
        </section>
        <section v-if="proposalTexts.length" class="tk-sec">
          <header class="tk-sec-head"><h4>فكرة المشروع</h4></header>
          <div class="tk-sec-body">
            <div v-for="s in proposalTexts" :key="s.label" class="sp-text">
              <h4 class="pr-h">{{ s.label }}</h4>
              <p class="pr-text">{{ s.value }}</p>
            </div>
          </div>
        </section>
        <footer class="sp-actions">
          <button type="button" class="pbtn is-outline" @click="openProposal"><FileText :size="16" /> فتح ملف المقترح</button>
          <span class="as-summary" />
          <button v-if="canResubmit" type="button" class="pbtn is-cyan" @click="startEdit"><PencilLine :size="16" /> تعديل المقترح وإعادة إرساله</button>
        </footer>
      </template>
    </section>

    <!-- التقرير النهائي: بعد اعتماد المقترح فقط — يحل محل المقترح لا يجاوره -->
    <section v-else class="dash-card sp-card">
      <div class="dash-card-head">
        <h3 class="portal-title">التقرير النهائي للمشروع</h3>
      </div>

      <!-- رُفض التقرير: السبب + إعادة التسليم -->
      <p v-if="reportRejected && !reportEditing" class="palert is-error">
        <XCircle :size="18" />
        <span><b>رُفض التقرير من {{ rejectedBy(finalReport) }}:</b> {{ finalReport.review_note || '—' }} — عدّل التقرير وأعد تسليمه.</span>
      </p>

      <!-- التسليم: مكدّس بلا خطوات — الخادم لا يشترط اعتماد المقترح داخليًا لكن القسم لا يظهر إلا بعد الاعتماد -->
      <form v-if="showReportForm" class="sp-form" @submit.prevent="submitReport">
        <p v-if="!canSubmit" class="palert is-info"><Lock :size="18" /><span>عرض تجريبي — لم يُسجَّل مشروع لفريقك بعد، ويُتاح التسليم بعد تسجيله.</span></p>

        <section class="tk-sec">
          <header class="tk-sec-head"><h4>التقرير النهائي (PDF) <b class="as-req">*</b></h4></header>
          <div class="tk-sec-body">
            <FileDropzone v-model="reportForm.files" :max-mb="100" />
          </div>
        </section>

        <section class="tk-sec">
          <header class="tk-sec-head"><h4>فيديو العرض <b class="as-req">*</b></h4></header>
          <div class="tk-sec-body">
            <label class="pfield">
              <span>رابط فيديو العرض (يوتيوب)</span>
              <input v-model.trim="reportForm.video_url" type="url" dir="ltr" placeholder="https://www.youtube.com/watch?v=…">
            </label>
            <div class="pfield">
              <span>صورة غلاف الفيديو <small class="pt-muted">(اختيارية)</small></span>
              <!-- الصورة غلاف الفيديو في معرض المشاريع، والضغط عليها يشغّل الفيديو -->
              <label :class="['sp-cover', coverPreview && 'has-image']">
                <img v-if="coverPreview" :src="coverPreview" alt="معاينة صورة المشروع">
                <span v-else><ImagePlus :size="30" /><b>اختر صورة تعبّر عن المشروع</b><small class="pt-muted">تظهر في معرض المشاريع غلافًا للفيديو — PNG أو JPG أو WEBP حتى 5MB، ويفضّل أن تكون عرضية (16:10)</small></span>
                <span v-if="coverPreview" class="sp-cover-play" aria-hidden="true"><PlayCircle :size="44" /></span>
                <input type="file" accept="image/png,image/jpeg,image/webp" hidden @change="pickCover">
              </label>
              <p v-if="coverError" class="palert is-error"><XCircle :size="18" /><span>{{ coverError }}</span></p>
              <button v-if="reportForm.cover" type="button" class="pbtn is-outline is-sm" @click="reportForm.cover = null">إزالة الصورة</button>
            </div>
          </div>
        </section>

        <section class="tk-sec">
          <header class="tk-sec-head"><h4>الملفات المضغوطة</h4></header>
          <div class="tk-sec-body">
            <!-- ponytail: الملفات المضغوطة placeholder — لا تُرسل حتى يوفّر الخادم حقلها -->
            <FileDropzone v-model="reportForm.zip" :max-mb="100" />
            <small class="pt-muted">الكود المصدري والمخرجات (ZIP / RAR) — اختياري.</small>
          </div>
        </section>

        <p v-if="reportMissing" class="palert is-error"><XCircle :size="18" /><span>{{ reportMissing }}</span></p>

        <footer class="sp-actions">
          <button v-if="reportRejected" type="button" class="pbtn is-outline" @click="reportEditing = false">إلغاء</button>
          <span class="as-summary" />
          <button type="submit" class="pbtn is-green" :disabled="!!reportMissing || uploading"><Send :size="16" /> {{ uploading ? 'جارٍ التسليم…' : 'تسليم التقرير النهائي' }}</button>
        </footer>
      </form>

      <!-- بعد التسليم: الملفات المسلّمة فقط -->
      <section v-else class="tk-sec">
        <header class="tk-sec-head"><h4>الملفات المسلّمة</h4><span class="pt-muted mono">{{ day(finalReport.created_at) }}</span></header>
        <div class="tk-sec-body">
          <ul class="sp-files">
            <li>
              <FileText :size="20" />
              <span><b>التقرير النهائي</b><small class="pt-muted">PDF</small></span>
              <button type="button" class="pbtn is-outline is-sm" @click="openReport">فتح</button>
            </li>
            <li v-if="finalReport.cover_url">
              <img :src="finalReport.cover_url" alt="صورة المشروع" class="sp-cover-thumb">
              <span><b>صورة المشروع</b><small class="pt-muted">تظهر في معرض الأعمال</small></span>
              <a :href="finalReport.cover_url" target="_blank" rel="noopener" class="pbtn is-outline is-sm">عرض</a>
            </li>
            <li v-if="finalReport.video_url">
              <PlayCircle :size="20" />
              <span><b>فيديو العرض</b><small class="pt-muted mono sp-link">{{ finalReport.video_url }}</small></span>
              <a :href="finalReport.video_url" target="_blank" rel="noopener" class="pbtn is-outline is-sm">مشاهدة</a>
            </li>
          </ul>
          <button v-if="reportRejected && canSubmit" type="button" class="pbtn is-cyan sp-retry" @click="startReportEdit"><RotateCcw :size="16" /> إعادة تسليم التقرير</button>
        </div>
      </section>
    </section>
  </div>
</template>

<script>
import { mapState, mapActions } from 'pinia'
import { ImagePlus, Lock, PencilLine, RotateCcw, FileText, PlayCircle, Send, XCircle } from 'lucide-vue-next'
import { latestReport, rejectedBy } from '@/utils/finalReport'
import FileDropzone from '@/components/shared/FileDropzone.vue'
import { PROJECT_TYPES, PROPOSAL_CHANGES_PREFIX, isOtherType } from '@/utils/constants'
import { proposalPdfFile } from '@/utils/ucasReports'
import { useTeamsStore } from '@/stores/teams.store'
import { useAuthStore } from '@/stores/auth.store'

/** محاولات التقديم المسموحة (تقديم أولي + محاولتا إعادة) — تطابق ProposalService::MAX_REJECTIONS في الخادم */
const MAX_ATTEMPTS = 3

const PROPOSAL_STATE = {
  none: { label: 'لم يُرسل بعد', pill: '' },
  pending: { label: 'قيد المراجعة', pill: 'is-pending' },
  approved: { label: 'معتمد', pill: 'is-approved' },
  changes: { label: 'يحتاج تعديل', pill: 'is-changes' },
  rejected: { label: 'مرفوض', pill: 'is-rejected' }
}

export default {
  name: 'StudentProposalPage',

  components: { ImagePlus, Lock, PencilLine, RotateCcw, FileText, PlayCircle, Send, XCircle, FileDropzone },

  data() {
    return {
      MAX_ATTEMPTS,
      PROJECT_TYPES,
      editing: false,
      sending: false,
      reportEditing: false,
      uploading: false,
      reportForm: { files: [], video_url: '', cover: null, zip: [] },
      coverPreview: '',
      coverError: '',
      otherOpen: false,
      form: { name: '', description: '', problems: '', solutions: '', features_value: '', types: [], files: [] }
    }
  },

  computed: {
    ...mapState(useTeamsStore, ['teams', 'teamsLoaded']),
    ...mapState(useAuthStore, ['user']),

    myTeam() {
      return this.teams.find((t) => t.members?.some((m) => m.student?.id === this.user?.id))
    },

    proposal() {
      return this.myTeam?.project?.proposal || null
    },

    /** بعد الاعتماد يختفي قسم المقترح ويحل محله التقرير النهائي */
    proposalApproved() {
      return this.proposal?.status === 'approved'
    },

    // الخادم يعرف pending/approved/rejected فقط — "طلب تعديل" رفضٌ سببه يبدأ بالبادئة (كما في ProposalsReview)
    changesRequested() {
      return this.proposal?.status === 'rejected' && (this.proposal.rejection_reason || '').startsWith(PROPOSAL_CHANGES_PREFIX)
    },

    reasonText() {
      return (this.proposal?.rejection_reason || '').replace(PROPOSAL_CHANGES_PREFIX, '')
    },

    proposalState() {
      if (!this.proposal) return PROPOSAL_STATE.none
      return PROPOSAL_STATE[this.changesRequested ? 'changes' : this.proposal.status] || PROPOSAL_STATE.pending
    },

    /** الخادم يمنع إعادة التقديم بعد MAX_ATTEMPTS مرات رفض (ProposalService::MAX_REJECTIONS) */
    attemptsLeft() {
      return Math.max(0, MAX_ATTEMPTS - (this.proposal?.rejection_count || 0))
    },

    proposalTexts() {
      const p = this.proposal || {}
      return [
        { label: 'وصف المشروع', value: p.description },
        { label: 'المشكلة', value: p.problems },
        { label: 'الحل المقترح', value: p.solutions },
        { label: 'المميزات والقيمة', value: p.features_value }
      ].filter((s) => s.value)
    },

    // أي طالب في الفريق يرفع المقترح والتقرير النهائي (الخادم يسمح لكل أعضاء الفريق)
    canSubmit() {
      return !!this.myTeam?.project
    },

    canResubmit() {
      return this.canSubmit && this.proposal?.status === 'rejected' && this.attemptsLeft > 0
    },

    showForm() {
      // بلا مشروع مسجّل: النموذج يظهر كعرض تجريبي (placeholder) والإرسال معطّل
      return !this.proposal || (this.canResubmit && this.editing)
    },

    otherOn() {
      return this.otherOpen || this.form.types.some(isOtherType)
    },

    otherType: {
      get() {
        return this.form.types.find(isOtherType) || ''
      },
      set(v) {
        this.form.types = [...this.form.types.filter((t) => !isOtherType(t)), ...(v.trim() ? [v] : [])]
      }
    },

    projectTypes() {
      return this.myTeam?.project?.types || []
    },

    missing() {
      if (!this.canSubmit) return 'عرض تجريبي — يُتاح الإرسال بعد تسجيل مشروع لفريقك'
      if (!this.form.name) return 'أدخل اسم المشروع'
      if (!this.form.types.length) return 'اختر نوع المشروع'
      return ''
    },

    finalReport() {
      return latestReport(this.myTeam?.project)
    },

    reportStatus() {
      return this.finalReport ? this.finalReport.review_status || 'pending_supervisor' : 'none'
    },

    reportRejected() {
      return this.reportStatus === 'rejected'
    },

    /** أول تسليم، أو إعادة التسليم بعد الرفض */
    showReportForm() {
      return !this.finalReport || (this.canSubmit && this.reportRejected && this.reportEditing)
    },

    reportMissing() {
      if (!this.canSubmit) return 'عرض تجريبي — يُتاح التسليم بعد تسجيل مشروع لفريقك'
      if (!this.reportForm.files.length) return 'أرفق التقرير النهائي (PDF)'
      if (!this.reportForm.video_url) return 'أضف رابط فيديو العرض'
      return ''
    }
  },

  watch: {
    // معاينة صورة المشروع المختارة (تُحرّر الذاكرة عند الاستبدال)
    'reportForm.cover'(file) {
      if (this.coverPreview) URL.revokeObjectURL(this.coverPreview)
      this.coverPreview = file ? URL.createObjectURL(file) : ''
    }
  },

  async created() {
    await this.fetchTeams()
    // أول تقديم: نوع المشروع المسجّل مسبقًا (إن وُجد) محدد مبدئيًا ويمكن تغييره
    if (!this.proposal) this.form.types = this.projectTypes.slice(0, 3)
  },

  beforeUnmount() {
    if (this.coverPreview) URL.revokeObjectURL(this.coverPreview)
  },

  methods: {
    /** صورة المشروع: صورة فقط وحتى 5MB */
    pickCover(e) {
      const file = e.target.files?.[0]
      e.target.value = ''
      if (!file) return
      this.coverError = !/^image\/(png|jpeg|webp)$/.test(file.type) ? 'اختر صورة PNG أو JPG أو WEBP' : file.size > 5 * 1024 * 1024 ? 'حجم الصورة أكبر من 5MB' : ''
      if (!this.coverError) this.reportForm.cover = file
    },

    ...mapActions(useTeamsStore, ['fetchTeams', 'openProtectedFile', 'submitProposal', 'updateProposal', 'submitFinalReport']),
    rejectedBy,

    day(v) {
      return v ? new Date(v).toLocaleDateString('en-CA') : '—'
    },

    openProposal() {
      const ext = this.proposal.pdf_path?.split('.').pop() || 'pdf'
      this.openProtectedFile(`/proposals/${this.proposal.id}/download`, `مقترح-${this.proposal.name}.${ext}`).catch(() => {})
    },

    openReport() {
      this.openProtectedFile(`/final-reports/${this.finalReport.id}/download`, 'التقرير-النهائي.pdf').catch(() => {})
    },

    // POST /projects/{id}/final-reports — تقرير جديد يبدأ مسار الاعتماد من المشرف
    async submitReport() {
      this.uploading = true
      try {
        await this.submitFinalReport(this.myTeam.project.id, { file: this.reportForm.files[0], video_url: this.reportForm.video_url, cover: this.reportForm.cover })
        this.$toast?.success('تم رفع التقرير — بانتظار موافقة المشرف')
        this.reportForm = { files: [], video_url: '', cover: null, zip: [] }
        this.reportEditing = false
        await this.fetchTeams()
      } catch (err) {
        this.$toast?.error(err.normalized?.message || 'تعذّر رفع التقرير')
      } finally {
        this.uploading = false
      }
    },

    startReportEdit() {
      this.reportEditing = true
    },

    /** Shift+Enter داخل الحقل النصي يبدأ بندًا جديدًا (• ) عند موضع المؤشر */
    bullet(e, key) {
      const el = e.target
      // أول بند: يُضاف • للسطر الأول أيضًا
      const head = this.form[key].trim() && !this.form[key].startsWith('• ') ? '• ' : ''
      const v = head + this.form[key]
      const at = el.selectionStart + head.length
      const ins = v.trim() ? '\n• ' : '• '
      this.form[key] = v.slice(0, at) + ins + v.slice(el.selectionEnd + head.length)
      this.$nextTick(() => el.setSelectionRange(at + ins.length, at + ins.length))
    },

    // "أخرى": يفتح حقلًا نصيًا، وقيمته تُحفظ نوعًا ضمن form.types
    toggleOther() {
      if (this.otherOn) {
        this.otherOpen = false
        this.form.types = this.form.types.filter((t) => !isOtherType(t))
      } else {
        this.otherOpen = true
      }
    },

    toggleType(t) {
      this.form.types = this.form.types.includes(t) ? this.form.types.filter((x) => x !== t) : [...this.form.types, t]
    },

    startEdit() {
      const p = this.proposal
      this.form = { name: p.name || '', description: p.description || '', problems: p.problems || '', solutions: p.solutions || '', features_value: p.features_value || '', types: this.projectTypes.slice(0, 3), files: [] }
      this.editing = true
    },

    /** POST /proposals (أول تقديم) أو PUT /proposals/{id} (إعادة تقديم بعد الرفض أو طلب التعديل) */
    async submit() {
      const { files, ...fields } = this.form
      const types = fields.types.map((t) => t.trim()).filter(Boolean)
      delete fields.types
      const payload = Object.fromEntries(Object.entries(fields).map(([k, v]) => [k, v.trim()]).filter(([, v]) => v !== ''))
      if (files[0]) payload.pdf = files[0]
      types.forEach((t, i) => { payload[`types[${i}]`] = t })
      this.sending = true
      try {
        // أول تقديم بلا ملف مرفوع: يُنشأ ملف PDF من بيانات النموذج (الخادم يشترط ملفًا)
        if (!payload.pdf && !this.proposal) payload.pdf = await proposalPdfFile({ ...this.form, ...payload, types }, this.myTeam?.name || '')
        if (this.proposal) await this.updateProposal(this.proposal.id, payload)
        else await this.submitProposal({ ...payload, project_id: this.myTeam.project.id })
        this.$toast?.success('تم إرسال المقترح للمراجعة')
        this.editing = false
        await this.fetchTeams()
      } catch (err) {
        this.$toast?.error(err.normalized?.message || 'تعذّر إرسال المقترح')
      } finally {
        this.sending = false
      }
    }
  }
}
</script>
