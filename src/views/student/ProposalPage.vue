<template>
  <!-- المقترحات للطالب — نفس مسار التسليم المعتمد في الإدارة العامة (ProposalsReview):
       المقترح: تقديم ← مراجعة (اعتماد / طلب تعديل / رفض) ← إعادة تقديم
       التقرير النهائي (بعد اعتماد المقترح): رفع (فيديو + PDF + مضغوطة) ← موافقة المشرف ← اعتماد لجنة الإشراف ← أرشفة -->
  <div class="dash hd-page">
    <header class="dash-head"><h2 class="dash-title">المقترحات</h2></header>

    <PortalStepper v-model="view" :items="views" label="أقسام التسليم" />

    <p v-if="teamsLoading && !myTeam" class="dash-card pt-muted">جارٍ التحميل…</p>

    <!-- المقترح -->
    <section v-else-if="view === 'proposal'" class="dash-card sp-card">
      <div class="dash-card-head">
        <h3 class="portal-title">المقترح (Proposal)</h3>
        <span :class="['rv-pill', proposalState.pill]">{{ proposalState.label }}</span>
      </div>

      <!-- المراحل خانات قابلة للفتح: التقديم (النموذج) · الاعتماد -->
      <ol class="sp-track" aria-label="مراحل المقترح">
        <li v-for="(s, i) in proposalTrack" :key="s.label" :class="[s.state && `is-${s.state}`, step === i && 'is-open']">
          <button type="button" :aria-current="step === i ? 'step' : undefined" @click="step = i"><b>{{ i + 1 }}</b> {{ s.label }}</button>
        </li>
      </ol>

      <!-- 2. الاعتماد: الحالة، وعند الرفض أو طلب التعديل سببه + إعادة المحاولة + المحاولات المتبقية -->
      <section v-if="step === 1" class="tk-sec">
        <header class="tk-sec-head"><h4>اعتماد المقترح</h4></header>
        <div class="tk-sec-body">
          <dl class="tk-review">
            <dt>حالة الاعتماد</dt><dd>{{ proposalState.label }}</dd>
            <dt>{{ proposal?.status === 'approved' ? 'تاريخ الاعتماد' : 'آخر تحديث' }}</dt><dd class="mono">{{ proposal ? day(proposal.updated_at) : '—' }}</dd>
            <dt>المحاولات المتبقية</dt><dd><span :class="['pr-count', !attemptsLeft && 'is-bad']">{{ attemptsLeft }}</span> من {{ MAX_ATTEMPTS }}</dd>
          </dl>
          <template v-if="proposal?.status === 'rejected'">
            <p :class="['palert', changesRequested ? 'is-info' : 'is-error']">
              <component :is="changesRequested ? 'PencilLine' : 'XCircle'" :size="18" />
              <span><b>{{ changesRequested ? 'المطلوب تعديله:' : 'سبب الرفض:' }}</b> {{ reasonText || '—' }}</span>
            </p>
            <button v-if="canResubmit" type="button" class="pbtn is-cyan sp-retry" @click="startEdit"><RotateCcw :size="16" /> إعادة المحاولة — تعديل المقترح وإرساله</button>
            <p v-else-if="!attemptsLeft" class="palert is-error"><XCircle :size="18" /><span>تم استنفاد محاولات إعادة التقديم المسموحة — تواصلوا مع لجنة الإشراف.</span></p>
          </template>
          <p v-else-if="proposal?.status === 'approved'" class="palert is-success"><CheckCircle2 :size="18" /><span>تم اعتماد المقترح — يمكنكم الآن رفع التقرير النهائي من تبويب "التقرير النهائي".</span></p>
          <p v-else-if="proposal" class="palert is-info"><Hourglass :size="18" /><span>المقترح قيد المراجعة — يظهر هنا القرار وسبب الرفض إن وُجد.</span></p>
        </div>
      </section>

      <!-- نموذج التقديم (أو إعادة التقديم بعد الرفض/طلب التعديل): بيانات المقترح يمينًا، وملف المقترح والإرسال في لوحة جانبية منفصلة.
           نوع المشروع يحدده الطالب مع كل تقديم (الخادم يشترطه أول مرة ويحدّثه عند إعادة التقديم) -->
      <form v-else-if="showForm" class="sp-wizard" @submit.prevent="submit">
        <!-- تقديم المقترح بخطوات (نفس نمط تسليم التقرير): البيانات ← الفكرة ← الملف ← الإرسال -->
        <p v-if="!canSubmit" class="palert is-info"><Lock :size="18" /><span>عرض تجريبي — لم يُسجَّل مشروع لفريقك بعد، ويُتاح الإرسال بعد تسجيله.</span></p>
        <ol class="sp-steps" aria-label="خطوات تقديم المقترح">
          <li v-for="(s, i) in proposalSteps" :key="s.label" :class="[i === pStep && 'is-current', s.ok && 'is-done']">
            <button type="button" :aria-current="i === pStep ? 'step' : undefined" @click="pStep = i">
              <b><Check v-if="s.ok && i !== pStep" :size="15" /><template v-else>{{ i + 1 }}</template></b>
              <span>{{ s.label }}</span>
            </button>
          </li>
        </ol>

        <section class="tk-sec sp-step-body">
          <header class="tk-sec-head"><h4>{{ proposalSteps[pStep].label }}</h4><span class="pt-muted">الخطوة {{ pStep + 1 }} من {{ proposalSteps.length }}</span></header>
          <div v-if="pStep === 0" class="tk-sec-body">
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
              </div>
              <small>اختر من نوع إلى 3 أنواع — المحدد: {{ form.types.length }} من 3</small>
            </div>
          </div>
          <div v-else-if="pStep === 1" class="tk-sec-body sp-idea">
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
            <small class="pt-muted sp-hint">Shift + Enter لبدء بند جديد</small>
          </div>
          <div v-else-if="pStep === 2" class="tk-sec-body">
            <FileDropzone v-model="form.files" :max-mb="100" />
            <small class="pt-muted">{{ proposal ? 'اختياري — يبقى الملف السابق إن لم ترفع ملفًا جديدًا.' : 'اختياري — ارفع تقرير المقترح، أو اتركه فيُنشأ ملف PDF من النموذج تلقائيًا عند الإرسال.' }}</small>
          </div>
          <div v-else class="tk-sec-body">
            <dl class="tk-review">
              <dt>اسم المشروع</dt><dd>{{ form.name || '—' }}</dd>
              <dt>نوع المشروع</dt><dd>{{ form.types.join('، ') || '—' }}</dd>
              <dt>ملف المقترح</dt><dd>{{ form.files[0]?.name || (proposal ? 'الملف السابق' : 'يُنشأ PDF من النموذج تلقائيًا') }}</dd>
            </dl>
            <p v-if="missing" class="palert is-error"><XCircle :size="18" /><span>{{ missing }}</span></p>
          </div>
        </section>

        <footer class="sp-actions">
          <button v-if="pStep" type="button" class="pbtn is-outline" @click="pStep -= 1">السابق</button>
          <button v-else-if="proposal" type="button" class="pbtn is-outline" @click="editing = false">إلغاء</button>
          <span class="as-summary" />
          <button v-if="pStep < proposalSteps.length - 1" type="button" class="pbtn is-cyan" @click="pStep += 1">التالي</button>
          <button v-else type="submit" class="pbtn is-green" :disabled="!!missing || sending"><Send :size="16" /> {{ sending ? 'جارٍ الإرسال…' : proposal ? 'إعادة إرسال المقترح' : 'إرسال المقترح' }}</button>
        </footer>
      </form>



      <!-- المقترح المُرسل: نفس التقسيم — البيانات يمينًا، والملف والإجراءات في اللوحة الجانبية -->
      <div v-else class="sp-split">
        <div class="sp-main">
          <section class="tk-sec">
            <header class="tk-sec-head"><h4>بيانات المشروع</h4></header>
            <div class="tk-sec-body">
              <dl class="tk-review">
                <dt>اسم المشروع</dt><dd>{{ proposal.name || '—' }}</dd>
                <dt>نوع المشروع</dt><dd>{{ projectTypes.join('، ') || '—' }}</dd>
                <dt>تاريخ التقديم</dt><dd class="mono">{{ day(proposal.created_at) }}</dd>
                <dt>آخر تحديث</dt><dd class="mono">{{ day(proposal.updated_at) }}</dd>
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
        </div>
        <aside class="sp-side">
          <section class="tk-sec">
            <header class="tk-sec-head"><h4>ملف المقترح</h4></header>
            <div class="tk-sec-body">
              <button type="button" class="pbtn is-outline" @click="openProposal"><FileText :size="16" /> فتح ملف المقترح</button>
              <button v-if="canResubmit && !editing" type="button" class="pbtn is-cyan" @click="startEdit"><PencilLine :size="16" /> تعديل المقترح وإعادة إرساله</button>
            </div>
          </section>
        </aside>
      </div>
    </section>

    <!-- التقرير النهائي: تسليم بخطوات (التقرير ← رابط الفيديو ← الملفات المضغوطة ← التسليم)، وبعد التسليم الملفات المسلّمة فقط -->
    <section v-else class="dash-card sp-card">
      <div class="dash-card-head">
        <h3 class="portal-title">التقرير النهائي للمشروع</h3>
      </div>

      <!-- رُفض التقرير: السبب + إعادة التسليم -->
      <p v-if="reportRejected && !reportEditing" class="palert is-error">
        <XCircle :size="18" />
        <span><b>رُفض التقرير من {{ rejectedBy(finalReport) }}:</b> {{ finalReport.review_note || '—' }} — عدّل التقرير وأعد تسليمه.</span>
      </p>

      <!-- التسليم بخطوات (مفتوح في أي وقت — الخادم لا يشترط اعتماد المقترح) -->
      <form v-if="showReportForm" class="sp-wizard" @submit.prevent="submitReport">
        <p v-if="!canSubmit" class="palert is-info"><Lock :size="18" /><span>عرض تجريبي — لم يُسجَّل مشروع لفريقك بعد، ويُتاح التسليم بعد تسجيله.</span></p>
        <ol class="sp-steps" aria-label="خطوات التسليم">
          <li v-for="(s, i) in reportSteps" :key="s.label" :class="[i === rStep && 'is-current', s.ok && 'is-done']">
            <button type="button" :aria-current="i === rStep ? 'step' : undefined" @click="rStep = i">
              <b><Check v-if="s.ok && i !== rStep" :size="15" /><template v-else>{{ i + 1 }}</template></b>
              <span>{{ s.label }}</span>
            </button>
          </li>
        </ol>

        <section class="tk-sec sp-step-body">
          <header class="tk-sec-head"><h4>{{ reportSteps[rStep].label }} <b v-if="reportSteps[rStep].req" class="as-req">*</b></h4><span class="pt-muted">الخطوة {{ rStep + 1 }} من {{ reportSteps.length }}</span></header>
          <div class="tk-sec-body">
            <FileDropzone v-if="rStep === 0" v-model="reportForm.files" :max-mb="100" />
            <label v-else-if="rStep === 1" class="pfield">
              <span>رابط فيديو العرض (يوتيوب)</span>
              <input v-model.trim="reportForm.video_url" type="url" dir="ltr" placeholder="https://www.youtube.com/watch?v=…">
            </label>
            <template v-else-if="rStep === 2">
              <!-- ponytail: الملفات المضغوطة placeholder — لا تُرسل حتى يوفّر الخادم حقلها -->
              <FileDropzone v-model="reportForm.zip" :max-mb="100" />
              <small class="pt-muted">الكود المصدري والمخرجات (ZIP / RAR) — اختياري.</small>
            </template>
            <template v-else>
              <dl class="tk-review">
                <dt>التقرير النهائي</dt><dd>{{ reportForm.files[0]?.name || '—' }}</dd>
                <dt>فيديو العرض</dt><dd class="mono sp-link">{{ reportForm.video_url || '—' }}</dd>
                <dt>الملفات المضغوطة</dt><dd>{{ reportForm.zip.map((f) => f.name).join('، ') || 'لا يوجد' }}</dd>
              </dl>
              <p v-if="reportMissing" class="palert is-error"><XCircle :size="18" /><span>{{ reportMissing }}</span></p>
            </template>
          </div>
        </section>

        <footer class="sp-actions">
          <button v-if="rStep" type="button" class="pbtn is-outline" @click="rStep -= 1">السابق</button>
          <button v-else-if="reportRejected" type="button" class="pbtn is-outline" @click="reportEditing = false">إلغاء</button>
          <span class="as-summary" />
          <button v-if="rStep < reportSteps.length - 1" type="button" class="pbtn is-cyan" @click="rStep += 1">التالي</button>
          <button v-else type="submit" class="pbtn is-green" :disabled="!!reportMissing || uploading"><Send :size="16" /> {{ uploading ? 'جارٍ التسليم…' : 'تسليم التقرير النهائي' }}</button>
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
            <li v-if="finalReport.video_url">
              <PlayCircle :size="20" />
              <span><b>فيديو العرض</b><small class="pt-muted mono sp-link">{{ finalReport.video_url }}</small></span>
              <a :href="finalReport.video_url" target="_blank" rel="noopener" class="pbtn is-outline is-sm">مشاهدة</a>
            </li>
          </ul>
          <button v-if="reportRejected && canSubmit && !reportEditing" type="button" class="pbtn is-cyan sp-retry" @click="startReportEdit"><RotateCcw :size="16" /> إعادة تسليم التقرير</button>
        </div>
      </section>
    </section>
  </div>
</template>

<script>
import { mapState, mapActions } from 'pinia'
import { Check, CheckCircle2, ClipboardList, Hourglass, RotateCcw, FileCheck, FileText, Lock, PencilLine, PlayCircle, Send, XCircle } from 'lucide-vue-next'
import { latestReport, rejectedBy } from '@/utils/finalReport'
import PortalStepper from '@/components/shared/PortalStepper.vue'
import FileDropzone from '@/components/shared/FileDropzone.vue'
import { PROJECT_TYPES, PROPOSAL_CHANGES_PREFIX } from '@/utils/constants'
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

/** مراحل المسار: ما قبل `done` مكتمل، والمرحلة `done` الحالية، أو مرفوضة عند `rejectedAt` */
const track = (labels, done, rejectedAt = -1) => labels.map((label, i) => ({
  label,
  state: i === rejectedAt ? 'rejected' : i < done ? 'done' : i === done ? 'active' : ''
}))

export default {
  name: 'StudentProposalPage',

  components: { Check, CheckCircle2, Hourglass, RotateCcw, FileText, Lock, PencilLine, PlayCircle, Send, XCircle, PortalStepper, FileDropzone },

  data() {
    return {
      MAX_ATTEMPTS,
      PROJECT_TYPES,
      view: 'proposal',
      step: 0,
      editing: false,
      sending: false,
      reportEditing: false,
      rStep: 0,
      pStep: 0,
      uploading: false,
      reportForm: { files: [], video_url: '', zip: [] },
      form: { name: '', description: '', problems: '', solutions: '', features_value: '', types: [], files: [] }
    }
  },

  computed: {
    ...mapState(useTeamsStore, ['teams', 'teamsLoading']),
    ...mapState(useAuthStore, ['user']),

    views() {
      return [
        { key: 'proposal', label: 'المقترح', icon: ClipboardList },
        { key: 'report', label: 'التقرير النهائي', icon: FileCheck }
      ]
    },

    myTeam() {
      return this.teams.find((t) => t.members?.some((m) => m.student?.id === this.user?.id))
    },

    proposal() {
      return this.myTeam?.project?.proposal || null
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

    proposalTrack() {
      const labels = ['تقديم المقترح', 'اعتماد المقترح']
      const s = this.proposal?.status
      if (!s) return track(labels, 0)
      if (s === 'rejected') return track(labels, 1, 1)
      return track(labels, s === 'approved' ? 2 : 1)
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

    projectTypes() {
      return this.myTeam?.project?.types || []
    },

    /** خطوات تقديم المقترح — ok: الخطوة مكتملة (الملف اختياري عند إعادة التقديم) */
    proposalSteps() {
      const f = this.form
      return [
        { label: 'بيانات المشروع', ok: !!f.name && f.types.length > 0 },
        { label: 'فكرة المشروع', ok: !!(f.description || f.problems || f.solutions || f.features_value).trim() },
        { label: 'ملف المقترح', ok: f.files.length > 0 || !!this.proposal },
        { label: 'الإرسال', ok: false }
      ]
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

    /** أول تسليم (في أي وقت — بلا شرط اعتماد المقترح)، أو إعادة التسليم بعد الرفض */
    showReportForm() {
      return !this.finalReport || (this.canSubmit && this.reportRejected && this.reportEditing)
    },

    /** خطوات التسليم — ok: الخطوة مكتملة */
    reportSteps() {
      const f = this.reportForm
      return [
        { label: 'التقرير النهائي (PDF)', req: true, ok: f.files.length > 0 },
        { label: 'رابط فيديو العرض', req: true, ok: !!f.video_url },
        { label: 'الملفات المضغوطة', req: false, ok: f.zip.length > 0 },
        { label: 'التسليم', req: false, ok: false }
      ]
    },

    reportMissing() {
      if (!this.canSubmit) return 'عرض تجريبي — يُتاح التسليم بعد تسجيل مشروع لفريقك'
      if (!this.reportForm.files.length) return 'أرفق التقرير النهائي (PDF)'
      if (!this.reportForm.video_url) return 'أضف رابط فيديو العرض'
      return ''
    }
  },

  watch: {
    // بعد اعتماد المقترح يُفتح قسم التقرير النهائي مباشرة
    'proposal.status': {
      immediate: true,
      handler(s) {
        if (s === 'approved') this.view = 'report'
        // بعد الإرسال تُفتح خانة الاعتماد (الحالة وسبب الرفض والمحاولات المتبقية)
        if (s) this.step = 1
      }
    }
  },

  async created() {
    await this.fetchTeams()
    // أول تقديم: نوع المشروع المسجّل مسبقًا (إن وُجد) محدد مبدئيًا ويمكن تغييره
    if (!this.proposal) this.form.types = this.projectTypes.slice(0, 3)
  },

  methods: {
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
        await this.submitFinalReport(this.myTeam.project.id, { file: this.reportForm.files[0], video_url: this.reportForm.video_url })
        this.$toast?.success('تم رفع التقرير — بانتظار موافقة المشرف')
        this.reportForm = { files: [], video_url: '', zip: [] }
        this.reportEditing = false
        this.rStep = 0
        await this.fetchTeams()
      } catch (err) {
        this.$toast?.error(err.normalized?.message || 'تعذّر رفع التقرير')
      } finally {
        this.uploading = false
      }
    },

    startReportEdit() {
      this.rStep = 0
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

    toggleType(t) {
      this.form.types = this.form.types.includes(t) ? this.form.types.filter((x) => x !== t) : [...this.form.types, t]
    },

    startEdit() {
      const p = this.proposal
      this.form = { name: p.name || '', description: p.description || '', problems: p.problems || '', solutions: p.solutions || '', features_value: p.features_value || '', types: this.projectTypes.slice(0, 3), files: [] }
      this.editing = true
      this.step = 0
      this.pStep = 0
    },

    /** POST /proposals (أول تقديم) أو PUT /proposals/{id} (إعادة تقديم بعد الرفض أو طلب التعديل) */
    async submit() {
      const { files, types, ...fields } = this.form
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
