<template>
  <!-- مقترحات المشاريع للإدارة العامة — بيانات تجريبية (placeholder):
       جدول بكل المقترحات وحالتها (قيد المراجعة / معتمد / يحتاج تعديل / مرفوض) ← تفاصيل المقترح
       ← قرار مع ملاحظات للمشروع ولكل طالب + إشعار للفريق والمشرف + سجل القرارات -->
  <div class="dash">
    <header class="dash-head">
      <h2 class="dash-title">مقترحات مشاريع التخرج</h2>
      <nav class="hm-tabs" aria-label="طريقة العرض">
        <button type="button" :class="view === 'table' && 'is-active'" @click="view = 'table'">جدول</button>
        <button type="button" :class="view === 'review' && 'is-active'" @click="view = 'review'">مراجعة</button>
      </nav>
    </header>

    <div class="rv-toolbar">
      <nav class="rv-tabs" aria-label="حالة المقترح">
        <button
          v-for="t in tabs" :key="t.value" type="button"
          :class="['rv-tab', tab === t.value && 'is-active']" :aria-pressed="tab === t.value"
          @click="tab = t.value"
        >
          {{ t.label }} <span class="rv-count">{{ count(t.value) }}</span>
        </button>
      </nav>
    </div>

    <section class="gr-filters" aria-label="تصفية المقترحات">
      <label class="gr-search">
        <Search :size="16" />
        <input v-model.trim="search" type="search" placeholder="ابحث بعنوان المشروع أو الشعبة أو المشرف…">
      </label>
      <select v-model="degreeFilter" class="gr-select" aria-label="الدرجة">
        <option value="">دبلوم وبكالوريوس</option>
        <option v-for="(l, k) in DEGREES" :key="k" :value="k">{{ l }}</option>
      </select>
      <select v-model="genderFilter" class="gr-select" aria-label="الفئة">
        <option value="">طلاب وطالبات</option>
        <option value="male">طلاب</option>
        <option value="female">طالبات</option>
      </select>
      <select v-model="supFilter" class="gr-select" aria-label="المشرف">
        <option value="">كل المشرفين</option>
        <option v-for="s in supOptions" :key="s" :value="s">{{ s }}</option>
      </select>
      <button v-if="hasFilters" type="button" class="gr-clear" @click="clearFilters">مسح الفلاتر</button>
      <span class="rv-result">{{ filtered.length }} من {{ count(tab) }}</span>
    </section>

    <!-- جدول كل المقترحات -->
    <div v-if="view === 'table'" class="pt-wrap">
      <table class="pt">
        <thead><tr><th>المشروع</th><th>الشعبة</th><th>المشرف</th><th>الدرجة</th><th>الفئة</th><th>تاريخ التقديم</th><th>الحالة</th><th>آخر ملاحظة</th></tr></thead>
        <tbody>
          <tr v-for="p in filtered" :key="p.id" class="is-link" @click="openReview(p)">
            <td class="pt-strong">{{ p.title }}</td>
            <td>{{ p.section }}</td>
            <td>{{ p.supervisor }}</td>
            <td>{{ DEGREES[p.degree] }}</td>
            <td>{{ p.gender === 'female' ? 'طالبات' : 'طلاب' }}</td>
            <td><span class="mono">{{ p.submittedAt }}</span></td>
            <td><span :class="['rv-pill', STATUS[p.status].pill]">{{ STATUS[p.status].label }}</span></td>
            <td class="pt-muted rv-last-note">{{ p.projectNote || '—' }}</td>
          </tr>
          <tr v-if="!filtered.length"><td colspan="8" class="gr-empty">لا توجد مقترحات مطابقة</td></tr>
        </tbody>
      </table>
    </div>

    <div v-else class="rv-layout">
      <section ref="list" class="rv-list" aria-label="قائمة المقترحات" tabindex="0" @keydown="onListKey">
        <div v-if="!filtered.length" class="dash-empty rv-empty">
          <p>{{ hasFilters ? 'لا توجد مقترحات مطابقة للفلاتر' : 'لا توجد مقترحات' }}</p>
        </div>
        <button
          v-for="p in filtered" :key="p.id" type="button" :data-id="p.id"
          :class="['rv-item', selected?.id === p.id && 'is-selected']"
          @click="select(p)"
        >
          <span :class="['rv-status-dot', STATUS[p.status].pill]" />
          <span class="rv-item-body">
            <span class="rv-item-title">{{ p.title }}</span>
            <span class="rv-item-meta">شعبة {{ p.section }} · {{ p.supervisor }}</span>
            <span class="rv-item-meta">{{ p.spec }} · {{ p.submittedAt }}</span>
          </span>
          <span class="rv-item-side">
            <span :class="['rv-pill', STATUS[p.status].pill]">{{ STATUS[p.status].label }}</span>
            <span v-if="p.rejectionCount" class="rv-item-note">رُفض {{ p.rejectionCount }}×</span>
          </span>
        </button>
      </section>

      <section v-if="selected" :class="['rv-detail', mobileOpen && 'is-open']" aria-live="polite">
        <div class="rv-detail-scroll">
          <button type="button" class="rv-back" @click="mobileOpen = false"><ArrowRight :size="18" /> رجوع للقائمة</button>

          <div v-if="position" class="rv-pager">
            <span class="pt-muted">مقترح {{ position }} من {{ filtered.length }}</span>
            <span class="rv-pager-btns">
              <button type="button" :disabled="position <= 1" @click="step(-1)"><ChevronRight :size="16" /> السابق</button>
              <button type="button" :disabled="position >= filtered.length" @click="step(1)">التالي <ChevronLeft :size="16" /></button>
            </span>
          </div>

          <div class="rv-detail-head">
            <span :class="['rv-pill', STATUS[selected.status].pill]">{{ STATUS[selected.status].label }}</span>
            <h3>{{ selected.title }}</h3>
          </div>

          <dl class="rv-meta">
            <div><dt>الشعبة</dt><dd>{{ selected.section }}</dd></div>
            <div><dt>المشرف</dt><dd>{{ selected.supervisor }}</dd></div>
            <div><dt>التخصص</dt><dd>{{ selected.spec }} · {{ DEGREES[selected.degree] }}</dd></div>
            <div><dt>تاريخ التقديم</dt><dd>{{ selected.submittedAt }}</dd></div>
          </dl>

          <article v-for="s in sections" :key="s.key" class="rv-section">
            <h4>{{ s.label }}</h4>
            <p>{{ selected[s.key] || '—' }}</p>
          </article>

          <!-- القرار: ملاحظات للمشروع + لكل طالب (تُرسل ضمن سبب الرفض/التعديل) -->
          <div v-if="selected.status === 'pending'" class="rv-section">
            <h4>ملاحظات القرار</h4>
            <label class="pfield">
              <span>ملاحظات على المشروع</span>
              <textarea v-model.trim="draft.projectNote" rows="3" placeholder="مثال: وضّحوا نطاق المشروع والفئة المستهدفة" />
            </label>
            <div class="rv-student-notes">
              <label v-for="m in selected.members" :key="m.id" class="pfield">
                <span>ملاحظة للطالب: {{ m.name }}</span>
                <input v-model.trim="draft.studentNotes[m.id]" type="text" placeholder="اختياري">
              </label>
            </div>
            <p class="pt-muted">يصل إشعار تلقائي بالقرار والملاحظات للفريق والمشرف.</p>
          </div>
          <div v-else-if="selected.projectNote" :class="['rv-alert', selected.status === 'approved' && 'is-ok']" role="note">
            <p><b>{{ selected.status === 'changes' ? 'المطلوب تعديله:' : 'سبب الرفض:' }}</b> {{ selected.projectNote }}</p>
          </div>

          <div class="rv-section">
            <h4>سجل المراجعة</h4>
            <p v-if="historyLoading" class="pt-muted">جارٍ التحميل…</p>
            <ol v-else class="tl-log">
              <li v-for="(h, i) in history" :key="i">
                <span class="tl-dot" />
                <span><b>{{ h.who }}</b> {{ h.action }}<template v-if="h.note"> — {{ h.note }}</template></span>
                <span class="pt-muted">{{ h.at }}</span>
              </li>
              <li v-if="!history.length"><span class="tl-dot" /><span class="pt-muted">قُدّم المقترح ولم يُراجع بعد</span><span /></li>
            </ol>
          </div>
        </div>

        <footer class="rv-actions">
          <template v-if="selected.status === 'pending'">
            <button type="button" class="rv-reject" :disabled="!draft.projectNote || deciding" :title="draft.projectNote ? '' : 'اكتب سبب الرفض في ملاحظات المشروع'" @click="decide('rejected')"><X :size="17" /> رفض</button>
            <button type="button" class="rv-file" :disabled="!draft.projectNote || deciding" :title="draft.projectNote ? '' : 'اكتب المطلوب تعديله في ملاحظات المشروع'" @click="decide('changes')"><PencilLine :size="17" /> طلب تعديل</button>
            <button type="button" :class="['rv-approve', confirmId === selected.id && 'is-confirm']" :disabled="deciding" @click="approve">
              <Check :size="17" /> {{ confirmId === selected.id ? 'اضغط مرة أخرى للتأكيد' : 'اعتماد المقترح' }}
            </button>
          </template>
          <span v-else class="rv-decided">تمت مراجعة هذا المقترح — بانتظار إعادة تقديم الفريق إن طُلب تعديل</span>
        </footer>
      </section>
    </div>
  </div>
</template>


<script>
import { mapState, mapActions } from 'pinia'
import { Search, X, Check, ArrowRight, ChevronLeft, ChevronRight, PencilLine } from 'lucide-vue-next'
import api from '@/services/api'
import { useTeamsStore } from '@/stores/teams.store'
import { DEGREES } from '@/utils/progressData'

const STATUS = {
  pending: { label: 'قيد المراجعة', pill: 'is-pending' },
  approved: { label: 'معتمد', pill: 'is-approved' },
  changes: { label: 'يحتاج تعديل', pill: 'is-changes' },
  rejected: { label: 'مرفوض', pill: 'is-rejected' }
}
// الخادم يعرف pending/approved/rejected فقط — "طلب تعديل" يُرسل رفضًا بسبب يبدأ بهذه البادئة (يعيد الفريق التقديم)
const CHANGES_PREFIX = 'مطلوب تعديل: '
const HISTORY = { submit: 'قدّم المقترح', resubmit: 'أعاد تقديم المقترح', reject: 'رفض المقترح', approve: 'اعتمد المقترح' }
const fmt = (v) => (v ? new Date(v).toLocaleString('ar-EG', { dateStyle: 'medium', timeStyle: 'short' }) : '')

export default {
  name: 'ProposalsReview',

  components: { Search, X, Check, ArrowRight, ChevronLeft, ChevronRight, PencilLine },

  data() {
    return {
      DEGREES, STATUS,
      view: 'table',
      tab: 'all',
      search: '',
      degreeFilter: '',
      genderFilter: '',
      supFilter: '',
      confirmId: null,
      selectedId: null,
      mobileOpen: false,
      deciding: false,
      history: [],
      historyLoading: false,
      draft: { projectNote: '', studentNotes: {} },
      tabs: [
        { value: 'all', label: 'الكل' },
        { value: 'pending', label: 'بانتظار المراجعة' },
        { value: 'changes', label: 'يحتاج تعديل' },
        { value: 'approved', label: 'المعتمدة' },
        { value: 'rejected', label: 'المرفوضة' }
      ],
      sections: [
        { key: 'description', label: 'وصف المشروع' },
        { key: 'problems', label: 'المشكلة' },
        { key: 'solutions', label: 'الحل المقترح' },
        { key: 'features', label: 'المميزات والقيمة' }
      ]
    }
  },

  computed: {
    ...mapState(useTeamsStore, ['teams', 'specializations']),

    /** المقترحات من فرق الفصل (GET /teams → project.proposal) */
    proposals() {
      return this.teams.filter((t) => t.project?.proposal).map((t) => {
        const p = t.project.proposal
        const spec = this.specializations.find((s) => s.id === t.specialization_id)
        const reason = p.rejection_reason || ''
        const isChanges = p.status === 'rejected' && reason.startsWith(CHANGES_PREFIX)
        const members = (t.members || []).map((m) => ({ id: m.student?.id ?? m.student_id, name: m.student?.name || '', gender: m.student?.gender }))
        return {
          id: p.id,
          title: p.name,
          section: t.section || t.name,
          spec: spec?.name || '',
          degree: spec?.degree || '',
          gender: members[0]?.gender || '',
          supervisor: t.supervisor?.name || '—',
          submittedAt: String(p.created_at || '').slice(0, 10),
          status: isChanges ? 'changes' : p.status,
          projectNote: isChanges ? reason.slice(CHANGES_PREFIX.length) : reason,
          rejectionCount: p.rejection_count || 0,
          description: p.description,
          problems: p.problems,
          solutions: p.solutions,
          features: p.features_value,
          members
        }
      })
    },
    filtered() {
      const q = this.search
      return this.proposals
        .filter((p) =>
          (this.tab === 'all' || p.status === this.tab) &&
          (!q || `${p.title} ${p.section} ${p.supervisor}`.includes(q)) &&
          (!this.degreeFilter || p.degree === this.degreeFilter) &&
          (!this.genderFilter || p.gender === this.genderFilter) &&
          (!this.supFilter || p.supervisor === this.supFilter)
        )
        .sort((a, b) => a.submittedAt.localeCompare(b.submittedAt))
    },
    supOptions() {
      return [...new Set(this.proposals.map((p) => p.supervisor))]
    },
    hasFilters() {
      return !!(this.search || this.degreeFilter || this.genderFilter || this.supFilter)
    },
    position() {
      const i = this.filtered.findIndex((p) => p.id === this.selected?.id)
      return i === -1 ? 0 : i + 1
    },
    selected() {
      return this.proposals.find((p) => p.id === this.selectedId) || this.filtered[0] || null
    }
  },

  watch: {
    // عند تغيير المقترح المعروض: مسودة جديدة + سجل المراجعة من الخادم
    'selected.id': {
      immediate: true,
      handler(id) {
        this.draft = { projectNote: '', studentNotes: {} }
        if (id) this.loadHistory(id)
      }
    }
  },

  async created() {
    await Promise.all([this.fetchTeams(), this.fetchSpecializations()])
  },

  methods: {
    ...mapActions(useTeamsStore, ['fetchTeams', 'fetchSpecializations', 'approveProposal', 'rejectProposal']),

    count(value) {
      return value === 'all' ? this.proposals.length : this.proposals.filter((p) => p.status === value).length
    },

    select(p) {
      this.selectedId = p.id
      this.confirmId = null
      this.mobileOpen = true
    },

    openReview(p) {
      this.view = 'review'
      this.select(p)
    },

    clearFilters() {
      this.search = ''
      this.degreeFilter = ''
      this.genderFilter = ''
      this.supFilter = ''
    },

    step(delta) {
      const next = this.filtered[this.position - 1 + delta]
      if (!next) return
      this.select(next)
      this.$nextTick(() => this.$refs.list?.querySelector(`[data-id="${next.id}"]`)?.scrollIntoView({ block: 'nearest' }))
    },

    onListKey(e) {
      if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
        e.preventDefault()
        this.step(e.key === 'ArrowDown' ? 1 : -1)
      }
    },

    async loadHistory(id) {
      this.historyLoading = true
      try {
        const { data } = await api.get(`/proposals/${id}/history`)
        if (this.selected?.id !== id) return
        this.history = (data.data || data).map((h) => ({ who: h.user?.name || '—', action: HISTORY[h.action] || h.action, note: h.meta?.reason || '', at: fmt(h.created_at) }))
      } catch {
        this.history = []
      } finally {
        this.historyLoading = false
      }
    },

    /** اعتماد بخطوتين لتجنّب الضغط بالخطأ */
    approve() {
      if (this.confirmId !== this.selected.id) {
        this.confirmId = this.selected.id
        clearTimeout(this.confirmTimer)
        this.confirmTimer = setTimeout(() => { this.confirmId = null }, 4000)
        return
      }
      this.confirmId = null
      this.decide('approved')
    },

    /** القرار عبر الخادم (يرسل الخادم إشعارًا للفريق والمشرف)، ثم تحديث الفرق والسجل */
    async decide(status) {
      const p = this.selected
      const { projectNote, studentNotes } = this.draft
      const studentLines = p.members.filter((m) => studentNotes[m.id]).map((m) => `${m.name}: ${studentNotes[m.id]}`)
      const reason = [projectNote, ...studentLines].filter(Boolean).join(' — ')
      this.deciding = true
      try {
        if (status === 'approved') await this.approveProposal(p.id)
        else await this.rejectProposal(p.id, status === 'changes' ? CHANGES_PREFIX + reason : reason)
        this.$toast?.success(`${STATUS[status].label}: ${p.title} — أُرسل إشعار للفريق والمشرف`)
        await this.fetchTeams()
        this.loadHistory(p.id)
      } catch (err) {
        this.$toast?.error(err.normalized?.message || 'تعذّر حفظ القرار')
      } finally {
        this.deciding = false
      }
    }
  }
}
</script>
