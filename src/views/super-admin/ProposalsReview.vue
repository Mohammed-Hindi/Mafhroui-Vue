<template>
  <!-- مقترحات مشاريع التخرج للإدارة العامة — بطاقة بنمط البوابة:
       تبويبات الحالة بعدّادات ← فلاتر منفصلة تُرسل للخادم (GET /proposals) ← جدول برأس سماوي
       ← "عرض المقترح": نافذة منبثقة (المقترح / محاولات الرفض / التقارير) مع لوحة جانبية بالقرار -->
  <section class="gr gr-card">
    <!-- قائمة المقترحات -->
    <header class="gr-card-head">
      <div class="gr-card-title">
        <h3>مقترحات مشاريع التخرج</h3>
      </div>
    </header>

    <!-- الحالة (فلتر مستقل) -->
    <nav class="rv-tabs" aria-label="حالة المقترح">
      <button
        v-for="t in tabs" :key="t.value" type="button"
        :class="['rv-tab', f.status === t.value && 'is-active', 'is-' + (t.value || 'all')]" :aria-pressed="f.status === t.value"
        @click="setFilter('status', t.value)"
      >
        {{ t.label }} <span class="rv-count">{{ count(t.value) }}</span>
      </button>
    </nav>

    <!-- كل فلتر منفصل: اختيار أحدها يلغي البقية، والنتيجة من الخادم -->
    <div class="gr-filters" aria-label="تصفية المقترحات">
      <label class="gr-search">
        <Search :size="16" />
        <input :value="f.search" type="search" :placeholder="isSupervisor ? 'بحث بالمشروع أو الفريق أو الشعبة…' : 'بحث بالمشروع أو الفريق أو الشعبة أو المشرف…'" @input="onSearch($event.target.value)">
      </label>
      <!-- المشرف: فلتر التخصص والفئة فقط (التخصص محليًا — الخادم لا يفلتر به) -->
      <label v-if="isSupervisor" class="gr-pick">
        <span>التخصص</span>
        <select :value="f.spec" class="gr-select" @change="setFilter('spec', $event.target.value)">
          <option value="">كل التخصصات</option>
          <option v-for="s in specs" :key="s" :value="s">{{ s }}</option>
        </select>
      </label>
      <label v-if="!isSupervisor" class="gr-pick">
        <span>الدرجة</span>
        <select :value="f.degree" class="gr-select" @change="setFilter('degree', $event.target.value)">
          <option value="">دبلوم وبكالوريوس</option>
          <option v-for="(l, k) in DEGREES" :key="k" :value="k">{{ l }}</option>
        </select>
      </label>
      <label class="gr-pick">
        <span>الفئة</span>
        <select :value="f.gender" class="gr-select" @change="setFilter('gender', $event.target.value)">
          <option value="">طلاب وطالبات</option>
          <option value="male">طلاب</option>
          <option value="female">طالبات</option>
        </select>
      </label>
      <label v-if="!isSupervisor" class="gr-pick">
        <span>المشرف</span>
        <select :value="f.supervisor_id" class="gr-select" @change="setFilter('supervisor_id', $event.target.value)">
          <option value="">كل المشرفين</option>
          <option v-for="s in supervisors" :key="s.id" :value="s.id">{{ s.name }}</option>
        </select>
      </label>
    </div>

    <SlideTable :rows="rows" :size="5" label="المقترحات">
      <template #default="{ rows: slideRows }">
        <div class="gr-table-wrap">
          <table class="gr-table pr-table">
            <thead>
              <tr>
                <th data-rt-show>المشروع</th><th data-rt-title>الفريق / الشعبة</th><th v-if="!isSupervisor">المشرف</th><th>الدرجة</th><th>تاريخ التقديم</th>
                <th>الحالة</th><th>مرات الرفض</th><th>التقارير</th><th aria-label="عرض" />
              </tr>
            </thead>
            <tbody>
              <tr v-for="p in slideRows" :key="p.id" class="gr-row" @click="open(p)">
                <td><span class="gr-name">{{ p.name }}</span></td>
                <td><span v-if="p.team?.section" class="rt-section">شعبة {{ p.team.section }}</span><span class="d-block">{{ p.team?.name || '—' }}</span></td>
                <td v-if="!isSupervisor">{{ p.supervisor?.name || '—' }}</td>
                <td>{{ DEGREES[p.degree] || '—' }}</td>
                <td><span class="mono">{{ day(p.created_at) }}</span></td>
                <td><span :class="['rv-pill', STATUS[p.status].pill]">{{ STATUS[p.status].label }}</span></td>
                <td><span :class="['pr-count', rejectCount(p) && 'is-bad']">{{ rejectCount(p) }}</span></td>
                <td><span class="pr-count">{{ p.final_reports.length }}</span></td>
                <td @click.stop><button type="button" class="pbtn is-cyan is-sm" @click="open(p)"><Eye :size="15" /> عرض المقترح</button></td>
              </tr>
              <SkeletonLoader v-if="loading && !rows.length" variant="table" :cols="isSupervisor ? 8 : 9" :rows="5" />
              <tr v-else-if="!rows.length"><td :colspan="isSupervisor ? 8 : 9" class="gr-empty">لا توجد مقترحات مطابقة</td></tr>
            </tbody>
          </table>
        </div>
      </template>

      <!-- شريط الملخص الأخضر أسفل الجدول (نفس سجل المجموعات) — يتبع الفلاتر -->
      <template #after>
        <div class="gr-sumbar">
          <span>عدد المقترحات: {{ rows.length }}</span>
          <span>بانتظار المراجعة: {{ rows.filter((p) => p.status === 'pending').length }}</span>
          <span>المعتمدة: {{ rows.filter((p) => p.status === 'approved').length }}</span>
          <span>مرات الرفض: {{ rows.reduce((n, p) => n + rejectCount(p), 0) }}</span>
        </div>
      </template>
    </SlideTable>

    <!-- عرض المقترح: نافذة منبثقة (رأس بالحالة والتنقّل ← المحتوى + لوحة جانبية بالقرار) -->
    <BaseModal :model-value="!!view.p" :title="view.p?.name || ''" size="xl" @update:model-value="!$event && close()">
      <div v-if="view.p" class="prd prd-modal">
        <header class="prd-head">
          <div class="prd-title">
            <span :class="['rv-pill', STATUS[view.p.status].pill]">{{ STATUS[view.p.status].label }}</span>
            <p class="pt-muted">
              {{ view.p.team?.name || '—' }}<template v-if="view.p.team?.section"> · المجموعة {{ view.p.team.section }}</template>
              · المشرف {{ view.p.supervisor?.name || '—' }}
            </p>
          </div>
          <div class="prd-head-tools">
            <div v-if="rows.length > 1 && viewIndex > -1" class="prd-nav">
              <span class="pt-muted">المقترح {{ viewIndex + 1 }} من {{ rows.length }}</span>
              <button type="button" class="prd-step" :disabled="viewIndex === 0" aria-label="المقترح السابق" @click="open(rows[viewIndex - 1])"><ChevronRight :size="18" /></button>
              <button type="button" class="prd-step" :disabled="viewIndex === rows.length - 1" aria-label="المقترح التالي" @click="open(rows[viewIndex + 1])"><ChevronLeft :size="18" /></button>
            </div>
            <button type="button" class="pbtn is-outline" @click="openFile(`/proposals/${view.p.id}/download`)"><FileText :size="16" /> ملف المقترح</button>
          </div>
        </header>

        <!-- سبب الرفض: فقط لمقترح مرفوض (أو مطلوب تعديله)، في مكان بارز أعلى النافذة -->
        <div v-if="['rejected', 'changes'].includes(view.p.status) && view.p.rejection_reason" class="prd-reject" role="alert">
          <span class="prd-reject-ic"><XCircle :size="20" /></span>
          <div>
            <b>{{ view.p.status === 'changes' ? 'المطلوب تعديله' : 'سبب رفض المقترح' }}</b>
            <p>{{ view.p.rejection_reason }}</p>
          </div>
        </div>

        <div class="prd-body">
          <div class="prd-main">
            <nav class="hm-tabs pr-tabs" aria-label="أقسام المقترح">
              <button type="button" :class="view.tab === 'proposal' && 'is-active'" @click="view.tab = 'proposal'">المقترح</button>
              <button type="button" :class="view.tab === 'rejections' && 'is-active'" @click="view.tab = 'rejections'">محاولات الرفض <span>{{ Math.max(rejectCount(view.p), rejections.length) }}</span></button>
              <button type="button" :class="view.tab === 'reports' && 'is-active'" @click="view.tab = 'reports'">التقارير <span>{{ view.p.final_reports.length }}</span></button>
            </nav>

            <!-- المقترح -->
            <div v-if="view.tab === 'proposal'" class="pr-pane">
              <h4 class="pr-h">وصف المشروع</h4>
              <p class="pr-text">{{ view.p.description || '—' }}</p>
              <h4 class="pr-h">أعضاء الفريق</h4>
              <ul class="rv-members">
                <li v-for="m in view.p.members" :key="m.id"><span class="rv-avatar">{{ (m.name || '?').charAt(0) }}</span><span>{{ m.name }}</span></li>
              </ul>
            </div>

            <!-- محاولات الرفض: كل رفض بسببه وتاريخه، ضمن سجل التقديم -->
            <div v-else-if="view.tab === 'rejections'" class="pr-pane">
              <SkeletonLoader v-if="view.loading" :rows="5" />
              <template v-else>
                <!-- المحاولات المستخدمة من المسموح (تقديم أولي + محاولتا إعادة) -->
                <div class="pr-meter">
                  <span class="pr-meter-label">المحاولات المستخدمة</span>
                  <span class="pr-meter-dots" aria-hidden="true">
                    <i v-for="n in MAX_ATTEMPTS" :key="n" :class="n <= attemptsUsed && (n <= rejections.length ? 'is-bad' : 'is-on')" />
                  </span>
                  <b>{{ attemptsUsed }} من {{ MAX_ATTEMPTS }}</b>
                </div>
                <p v-if="!rejections.length" class="tk-info-empty">لم يُرفض هذا المقترح من قبل.</p>
                <ol v-else class="pr-rejects">
                  <li v-for="(r, i) in rejections" :key="i">
                    <header>
                      <span class="pr-attempt-no">{{ i + 1 }}</span>
                      <b>المحاولة {{ i + 1 }}</b>
                      <span :class="['rv-pill', r.changes ? 'is-pending' : 'is-rejected']">{{ r.changes ? 'طلب تعديل' : 'رفض' }}</span>
                      <time>{{ r.at }}</time>
                    </header>
                    <p class="pr-reject-reason">{{ r.reason || 'بدون سبب مذكور' }}</p>
                    <dl class="pr-reject-meta">
                      <div><dt>المراجِع</dt><dd>{{ r.who }}</dd></div>
                      <div v-if="r.submittedAt"><dt>المقترح المقدَّم</dt><dd>{{ r.submittedAt }}<template v-if="r.submittedBy"> · {{ r.submittedBy }}</template></dd></div>
                    </dl>
                    <!-- الخادم يحفظ آخر ملف مقترح فقط، فالملف يُعرض مع آخر محاولة -->
                    <button v-if="i === rejections.length - 1" type="button" class="pr-report-file is-inline" @click="openFile(`/proposals/${view.p.id}/download`)"><FileText :size="16" /><span>ملف المقترح</span></button>
                  </li>
                </ol>
              </template>
              <h4 v-if="view.history.length" class="pr-h">سجل التقديم</h4>
              <ol class="tl-log">
                <li v-for="(h, i) in view.history" :key="i">
                  <span class="tl-dot" /><span><b>{{ h.who }}</b> {{ h.action }}</span><span class="pt-muted">{{ h.at }}</span>
                </li>
              </ol>
            </div>

            <!-- التقارير النهائية (قد تكون أكثر من نسخة) -->
            <div v-else class="pr-pane">
              <p v-if="!view.p.final_reports.length" class="pt-muted">لم يُرفع تقرير نهائي بعد.</p>
              <ul v-else class="pr-reports">
                <li v-for="(r, i) in view.p.final_reports" :key="r.id">
                  <span class="pr-attempt-no">{{ view.p.final_reports.length - i }}</span>
                  <div>
                    <b>{{ i === 0 ? 'أحدث تقرير' : `نسخة ${view.p.final_reports.length - i}` }}</b>
                    <span class="pt-muted">{{ day(r.created_at) }} · رفعه {{ r.uploaded_by || '—' }}</span>
                    <!-- مسار الاعتماد: من اعتمد التقرير في المرة الأولى (المشرف) والثانية (لجنة الإشراف) — GET /projects/{id}/final-reports -->
                    <span v-if="reportInfo(r)" class="pr-review">
                      <span :class="['rv-pill', REVIEW[reportInfo(r).review_status || 'pending_supervisor']?.tone]">{{ REVIEW[reportInfo(r).review_status || 'pending_supervisor']?.label }}</span>
                      <span v-if="reportInfo(r).supervisor_reviewer" class="pt-muted">اعتماد المشرف: {{ reportInfo(r).supervisor_reviewer.name }}</span>
                      <span v-if="reportInfo(r).committee_reviewer" class="pt-muted">اعتماد اللجنة: {{ reportInfo(r).committee_reviewer.name }}</span>
                      <span v-if="reportInfo(r).review_note" class="pt-muted">الملاحظة: {{ reportInfo(r).review_note }}</span>
                    </span>
                    <!-- المشرف: موافقته ترفع التقرير للجنة الإشراف (POST /final-reports/{id}/review) -->
                    <span v-if="isSupervisor && i === 0 && reportInfo(r)?.review_status === 'pending_supervisor'" class="pr-review-act">
                      <input v-model.trim="reportNote" type="text" class="ev-input" placeholder="سبب الرفض (مطلوب عند الرفض)">
                      <button type="button" class="pbtn is-red is-sm" :disabled="reviewing || !reportNote" @click="reviewLatest(r, false)">رفض</button>
                      <button type="button" class="pbtn is-green is-sm" :disabled="reviewing" @click="reviewLatest(r, true)">موافقة ورفع للجنة</button>
                    </span>
                  </div>
                  <button type="button" class="pr-report-file" @click="openFile(`/final-reports/${r.id}/download`)"><FileText :size="18" /><span>عرض التقرير</span></button>
                </li>
              </ul>
            </div>
          </div>

          <aside class="prd-side">
            <section class="prd-card">
              <h4>بيانات المقترح</h4>
              <dl class="prd-kv">
                <div><dt>الفريق</dt><dd>{{ view.p.team?.name || '—' }}</dd></div>
                <div><dt>رقم المجموعة</dt><dd>{{ view.p.team?.section || '—' }}</dd></div>
                <div><dt>المشرف</dt><dd>{{ view.p.supervisor?.name || '—' }}</dd></div>
                <div><dt>الدرجة</dt><dd>{{ DEGREES[view.p.degree] || '—' }}</dd></div>
                <div><dt>نوع المشروع</dt><dd>{{ view.p.types?.length ? view.p.types.join('، ') : '—' }}</dd></div>
                <div><dt>تاريخ التقديم</dt><dd class="mono">{{ day(view.p.created_at) }}</dd></div>
                <div><dt>آخر تحديث</dt><dd class="mono">{{ day(view.p.updated_at) }}</dd></div>
                <div><dt>مرات الرفض</dt><dd><span :class="['pr-count', rejectCount(view.p) && 'is-bad']">{{ rejectCount(view.p) }}</span></dd></div>
                <div><dt>التقارير</dt><dd><span class="pr-count">{{ view.p.final_reports.length }}</span></dd></div>
              </dl>
            </section>

            <!-- القرار (للمقترح المعلّق فقط) -->
            <section v-if="view.p.status === 'pending'" class="prd-card prd-decision">
              <h4>القرار</h4>
              <label class="pfield">
                <span>ملاحظات على المشروع (مطلوبة للرفض وطلب التعديل)</span>
                <textarea v-model.trim="draft.projectNote" rows="4" placeholder="مثال: وضّحوا نطاق المشروع والفئة المستهدفة" />
              </label>
              <button type="button" class="pbtn is-green" :disabled="deciding" @click="decide('approved')"><Check :size="16" /> {{ deciding ? 'جارٍ الحفظ…' : 'اعتماد المقترح' }}</button>
              <div class="prd-decision-row">
                <button type="button" class="pbtn is-outline" :disabled="!draft.projectNote || deciding" @click="decide('changes')"><PencilLine :size="16" /> طلب تعديل</button>
                <button type="button" class="pbtn is-red" :disabled="!draft.projectNote || deciding" @click="decide('rejected')"><X :size="16" /> رفض</button>
              </div>
            </section>
            <p v-else class="prd-decided">تم البتّ في هذا المقترح: <b>{{ STATUS[view.p.status].label }}</b></p>
          </aside>
        </div>
      </div>
    </BaseModal>
  </section>
</template>

<script>
import { markRaw } from 'vue'
import { Search, X, Check, Eye, FileText, PencilLine, ChevronLeft, ChevronRight, Layers, Hourglass, CheckCircle2, XCircle } from 'lucide-vue-next'
import SlideTable from '@/components/ui/SlideTable.vue'
import BaseModal from '@/components/ui/BaseModal.vue'
import api from '@/services/api'
import { useTeamsStore } from '@/stores/teams.store'
import { DEGREES } from '@/utils/progressData'
import { REVIEW, reviewReport } from '@/utils/finalReport'
import { PROPOSAL_CHANGES_PREFIX } from '@/utils/constants'
import { mapState } from 'pinia'
import { useAuthStore } from '@/stores/auth.store'

const STATUS = {
  pending: { label: 'قيد المراجعة', pill: 'is-pending' },
  approved: { label: 'معتمد', pill: 'is-approved' },
  changes: { label: 'يحتاج تعديل', pill: 'is-changes' },
  rejected: { label: 'مرفوض', pill: 'is-rejected' }
}
const CHANGES_PREFIX = PROPOSAL_CHANGES_PREFIX
/** محاولات التقديم المسموحة — تطابق ProposalService::MAX_REJECTIONS (نفس ثابت صفحة مقترح الطالب) */
const MAX_ATTEMPTS = 3
const HISTORY = { submit: 'قدّم المقترح', resubmit: 'أعاد تقديم المقترح', reject: 'رفض المقترح' }
const EMPTY = { status: '', degree: '', gender: '', supervisor_id: '', search: '', spec: '' }
const specOf = (p) => p.project?.team?.specialization?.name || ''
const fmt = (v) => (v ? new Date(v).toLocaleString('ar-EG', { dateStyle: 'medium', timeStyle: 'short' }) : '')

export default {
  name: 'ProposalsReview',

  components: { Search, X, Check, Eye, FileText, PencilLine, ChevronLeft, ChevronRight, XCircle, BaseModal, SlideTable },

  data() {
    return {
      DEGREES, STATUS, MAX_ATTEMPTS,
      all: [],
      rows: [],
      loading: true,
      f: { ...EMPTY },
      deciding: false,
      view: { tab: 'proposal', p: null, loading: false, history: [], raw: [] },
      draft: { projectNote: '' },
      REVIEW,
      reports: [],
      reportNote: '',
      reviewing: false,
      tabs: [
        { value: '', label: 'الكل', icon: markRaw(Layers) },
        { value: 'pending', label: 'بانتظار المراجعة', icon: markRaw(Hourglass) },
        { value: 'changes', label: 'يحتاج تعديل', icon: markRaw(PencilLine) },
        { value: 'approved', label: 'المعتمدة', icon: markRaw(CheckCircle2) },
        { value: 'rejected', label: 'المرفوضة', icon: markRaw(XCircle) }
      ]
    }
  },

  computed: {
    ...mapState(useAuthStore, ['userRole', 'user']),
    specs() {
      return [...new Set(this.all.map(specOf).filter(Boolean))]
    },
    /** المشرف: نفس الصفحة بصلاحياته — مقترحات مجموعاته (الخادم يقيّدها) + موافقته على التقرير النهائي */
    isSupervisor() {
      return this.userRole === 'supervisor'
    },
    /** موقع المقترح المفتوح ضمن القائمة الحالية (للتنقّل السابق/التالي) */
    viewIndex() {
      return this.view.p ? this.rows.findIndex((r) => r.id === this.view.p.id) : -1
    },
    supervisors() {
      const map = new Map()
      this.all.forEach((p) => p.supervisor && map.set(p.supervisor.id, p.supervisor))
      return [...map.values()]
    },
    /** كل رفض بسببه (من سجل المراجعة) */
    /** المحاولات المستخدمة: عدد مرات التقديم (أولي + إعادات)، ولا يقل عن مرات الرفض */
    attemptsUsed() {
      const subs = this.view.raw.filter((h) => ['submit', 'resubmit'].includes(h.action)).length
      return Math.min(MAX_ATTEMPTS, Math.max(subs, this.rejections.length + (this.view.p?.status === 'pending' ? 1 : 0), 1))
    },

    rejections() {
      const list = this.view.raw.map((h, i) => ({ h, i })).filter(({ h }) => h.action === 'reject').map(({ h, i }) => {
        const reason = h.meta?.reason || ''
        const changes = reason.startsWith(CHANGES_PREFIX)
        // التقديم الذي رُفض: آخر تقديم/إعادة تقديم قبل هذا الرفض
        const sub = this.view.raw.slice(0, i).reverse().find((x) => ['submit', 'resubmit'].includes(x.action))
        return { changes, reason: changes ? reason.slice(CHANGES_PREFIX.length) : reason, who: h.user?.name || '—', at: fmt(h.created_at), submittedAt: sub ? fmt(sub.created_at) : '', submittedBy: sub?.user?.name || '' }
      })
      // سجلات قديمة بلا سجل مراجعة: نعرض الرفض الحالي على الأقل
      const p = this.view.p
      if (!list.length && p && ['rejected', 'changes'].includes(p.status) && p.rejection_reason) {
        list.push({ changes: p.status === 'changes', reason: p.rejection_reason, who: '—', at: fmt(p.updated_at) })
      }
      return list
    }
  },

  watch: {
    // زر الرجوع في المتصفح: إزالة ?proposal تعيد للقائمة
    '$route.query.proposal'(id) {
      if (!id && this.view.p) this.view = { tab: 'proposal', p: null, loading: false, history: [], raw: [] }
    }
  },

  async created() {
    await this.reload()
    // رابط مباشر لمقترح (?proposal=ID) — يفتحه داخل الصفحة
    const id = Number(this.$route.query.proposal)
    const p = id && this.all.find((x) => x.id === id)
    if (p) this.open(p)
  },

  methods: {
    day: (v) => (v ? String(v).slice(0, 10) : '—'),

    // بيانات قديمة قد ترفض بلا عدّاد: المرفوض حاليًا يُحسب مرة على الأقل
    rejectCount(p) {
      return p.rejection_count || (['rejected', 'changes'].includes(p.status) ? 1 : 0)
    },

    count(status) {
      return status ? this.all.filter((p) => p.status === status).length : this.all.length
    },

    /** المشرف يرى مقترحات وتقارير مجموعاته فقط (لا يُعتمد على تقييد الخادم وحده) */
    mine(list) {
      return this.isSupervisor ? list.filter((p) => p.supervisor?.id === this.user?.id) : list
    },

    /** القائمة الكاملة (للعدّادات وقائمة المشرفين) + القائمة المفلترة من الخادم */
    async reload() {
      const [all] = await Promise.allSettled([api.get('/proposals')])
      this.all = this.mine(all.value?.data || [])
      await this.fetchRows()
    },

    async fetchRows() {
      this.loading = true
      try {
        const params = Object.fromEntries(Object.entries(this.f).filter(([k, v]) => v !== '' && k !== 'spec'))
        const rows = Object.keys(params).length ? this.mine((await api.get('/proposals', { params })).data) : this.all
        this.rows = this.f.spec ? rows.filter((p) => specOf(p) === this.f.spec) : rows
      } catch {
        this.rows = []
        this.$toast?.error('تعذّر تحميل المقترحات')
      } finally {
        this.loading = false
      }
    },

    /** فلتر واحد فقط في كل مرة: اختيار فلتر يُفرغ البقية */
    setFilter(key, value) {
      this.f = { ...EMPTY, [key]: value }
      this.fetchRows()
    },

    onSearch(value) {
      clearTimeout(this.searchTimer)
      this.searchTimer = setTimeout(() => this.setFilter('search', value.trim()), 350)
    },

    /** تفاصيل التقرير (الحالة والمعتمدون) من GET /projects/{id}/final-reports */
    reportInfo(r) {
      return this.reports.find((x) => x.id === r.id) || null
    },

    async loadReports(p) {
      this.reports = []
      if (!p.project_id || !p.final_reports?.length) return
      try {
        const { data } = await api.get(`/projects/${p.project_id}/final-reports`)
        if (this.view.p?.id === p.id) this.reports = data.data || data
      } catch {
        // يبقى العرض المختصر
      }
    },

    async reviewLatest(r, approve) {
      this.reviewing = true
      try {
        await reviewReport(r.id, approve, approve ? null : this.reportNote)
        this.reportNote = ''
        this.$toast?.success(approve ? 'تمت الموافقة ورُفع التقرير للجنة الإشراف' : 'تم رفض التقرير')
        await this.loadReports(this.view.p)
      } catch (err) {
        this.$toast?.error(err.normalized?.message || 'تعذّر حفظ القرار')
      } finally {
        this.reviewing = false
      }
    },

    async open(p) {
      this.view = { tab: 'proposal', p, loading: true, history: [], raw: [] }
      this.loadReports(p)
      this.draft = { projectNote: '' }
      // من القائمة: push (زر الرجوع في المتصفح يعيد للقائمة) · بين المقترحات: replace
      if (String(this.$route.query.proposal) !== String(p.id)) this.$router[this.$route.query.proposal ? 'replace' : 'push']({ query: { ...this.$route.query, proposal: p.id } })
      try {
        const { data } = await api.get(`/proposals/${p.id}/history`)
        if (this.view.p?.id !== p.id) return
        this.view.raw = data.data || data
        this.view.history = this.view.raw.map((h) => ({ who: h.user?.name || '—', action: HISTORY[h.action] || h.action, at: fmt(h.created_at) }))
      } catch {
        // يبقى السجل فارغًا
      } finally {
        this.view.loading = false
      }
    },

    /** العودة للقائمة بنفس الفلاتر والشريحة */
    close() {
      this.view = { tab: 'proposal', p: null, loading: false, history: [], raw: [] }
      const { proposal, ...query } = this.$route.query
      if (proposal) this.$router.replace({ query })
    },

    openFile(path) {
      useTeamsStore().openProtectedFile(path).catch(() => this.$toast?.error('تعذّر فتح الملف'))
    },

    /** القرار عبر الخادم (يرسل إشعارًا للفريق والمشرف)، ثم تحديث القوائم */
    async decide(status) {
      const p = this.view.p
      if (status === 'approved' && !window.confirm(`اعتماد مقترح "${p.name}"؟`)) return
      const reason = this.draft.projectNote
      this.deciding = true
      try {
        if (status === 'approved') await api.post(`/proposals/${p.id}/approve`)
        else await api.post(`/proposals/${p.id}/reject`, { rejection_reason: status === 'changes' ? CHANGES_PREFIX + reason : reason })
        this.$toast?.success(`${STATUS[status].label}: ${p.name} — أُرسل إشعار للفريق والمشرف`)
        await this.reload()
        // يبقى المقترح مفتوحًا بحالته الجديدة
        const fresh = this.all.find((x) => x.id === p.id)
        if (fresh) this.view.p = fresh
      } catch (err) {
        this.$toast?.error(err.normalized?.message || 'تعذّر حفظ القرار')
      } finally {
        this.deciding = false
      }
    }
  }
}
</script>
