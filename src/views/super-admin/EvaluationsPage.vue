<template>
  <!-- التقييمات — هوية المسار المسطّحة (نفس المواعيد/التقدّم/المقترحات):
       إعداد النماذج كبطاقة قابلة للطي أعلى الصفحة (للإدارة واللجنة) ← مؤشرات سريعة ← بطاقة "تقييم المجموعات"
       (فلاتر بنمطنا + جدول منزلق + شريط ملخّص) ← بطاقة "نتائج الطلاب". بلا عنوان صفحة مكرّر (التوب بار يعرضه). -->
  <div class="dash evp-page">
    <!-- 1) إعداد نماذج التقييم — بطاقة قابلة للطي أعلى الصفحة (كإعدادات الجدولة) -->
    <section v-if="isStaff" id="ev-forms" class="dash-card">
      <div class="dash-card-head dp-set-head">
        <button type="button" class="dp-set-toggle" :aria-expanded="formsOpen" @click="formsOpen = !formsOpen">
          <span class="dp-set-titles">
            <h3>إعداد نماذج التقييم</h3>
            <small class="dp-set-count">بنود النموذج وطريقة التقييم وأوزان الأقسام</small>
          </span>
          <ChevronDown :size="18" :class="['dp-set-caret', formsOpen && 'is-open']" />
        </button>
      </div>
      <div v-show="formsOpen" class="dp-set-body">
        <EvaluationFormEditor />
      </div>
    </section>

    <!-- 2) مؤشرات سريعة -->
    <div class="dp-kpis evp-kpis">
      <div class="dp-kpi"><b>{{ groupsWithStatus.length }}</b><span>{{ isStaff ? 'المجموعات' : 'مجموعات أناقشها' }}</span></div>
      <div class="dp-kpi is-good"><b>{{ statusCount('done') }}</b><span>مكتمل التقييم</span></div>
      <div class="dp-kpi is-warn"><b>{{ statusCount('partial') }}</b><span>قيد التقييم</span></div>
      <div class="dp-kpi"><b>{{ avg }}</b><span>متوسط الدرجات</span></div>
    </div>

    <!-- 3) تقييم المجموعات -->
    <section class="gr gr-card evp-card">
      <div class="gr-card-title">
        <h3>تقييم المجموعات</h3>
        <span class="dash-chip">{{ groupTable.length }} من {{ groupsWithStatus.length }} مجموعة</span>
      </div>

      <div class="gr-filters" aria-label="تصفية المجموعات">
        <label class="gr-search">
          <Search :size="16" />
          <input v-model.trim="gq" type="search" placeholder="بحث برقم الشعبة أو المشروع أو الطالب…">
        </label>
        <label class="gr-pick">
          <select v-model="gStatus" class="gr-select" aria-label="الحالة">
            <option value="">كل الحالات ({{ groupsWithStatus.length }})</option>
            <option v-for="(l, k) in STATUS" :key="k" :value="k">{{ l.label }} ({{ statusCount(k) }})</option>
          </select>
        </label>
        <label class="gr-pick">
          <select v-model="gDept" class="gr-select" aria-label="القسم">
            <option value="">كل الأقسام</option>
            <option v-for="d in departmentFilterOptions" :key="d.value" :value="d.value">{{ d.label }}</option>
          </select>
        </label>
        <label class="gr-pick">
          <select v-model="gSpec" class="gr-select" aria-label="التخصص">
            <option value="">كل التخصصات</option>
            <option v-for="s in gSpecOptions" :key="s.value" :value="s.value">{{ s.label }}</option>
          </select>
        </label>
        <label v-if="isStaff" class="gr-pick">
          <select v-model="gSup" class="gr-select" aria-label="المشرف">
            <option value="">كل المشرفين</option>
            <option v-for="s in supSelectOptions" :key="s.value" :value="s.value">{{ s.label }}</option>
          </select>
        </label>
        <label class="gr-pick gr-pick-rows">
          <select v-model.number="gSize" class="gr-select" aria-label="عدد الصفوف">
            <option :value="25">عرض 25</option>
            <option :value="50">عرض 50</option>
            <option :value="100">عرض 100</option>
          </select>
        </label>
      </div>

      <SlideTable :rows="groupTable" :size="gSize" label="المجموعات">
        <template #default="{ rows: shown }">
          <div class="gr-table-wrap">
            <table class="gr-table evp-table">
              <thead>
                <tr>
                  <th class="hm-center">الشعبة</th>
                  <th>المشروع والطلبة</th>
                  <th v-if="isStaff">المشرف</th>
                  <th>الدرجة</th>
                  <th class="hm-center">المشرف</th>
                  <th class="hm-center">اللجنة</th>
                  <th class="hm-center">الحالة</th>
                  <th aria-label="إجراء" />
                </tr>
              </thead>
              <tbody>
                <tr v-for="g in shown" :key="g.id" class="gr-row" @click="openSheet(g.id)">
                  <td class="hm-center"><span class="ev-sec-chip">{{ g.section }}</span></td>
                  <td>
                    <span class="gr-name">{{ g.projectName }}</span>
                    <span class="evp-mems">
                      <span v-for="name in g.members" :key="name" class="evp-mem">{{ name }}</span>
                    </span>
                  </td>
                  <td v-if="isStaff" class="pt-strong"><button v-if="g.supId" type="button" class="ev-suplink" title="عرض بروفايل المشرف ومجموعاته" @click.stop="openPerson('supervisor', g.supId, g.sup)">{{ g.sup }}</button><span v-else>{{ g.sup }}</span></td>
                  <td>{{ g.degree }}</td>
                  <td class="hm-center"><span :class="['rv-pill', g.supMark ? 'is-approved' : '']">{{ g.supMark ? 'تم' : 'لم يتم' }}</span></td>
                  <td class="hm-center"><span :class="['rv-pill', g.comMark ? 'is-approved' : '']">{{ g.comMark ? 'تم' : 'لم يتم' }}</span></td>
                  <td class="hm-center"><span :class="['rv-pill', STATUS_PILL[g.status]]">{{ STATUS[g.status].label }}</span></td>
                  <td @click.stop>
                    <button type="button" class="pbtn is-cyan is-sm" @click="openSheet(g.id)">
                      <ClipboardPen :size="15" /> {{ g.examining ? 'عرض العلامة' : g.status === 'none' ? 'تقييم' : 'فتح التقييم' }}
                    </button>
                  </td>
                </tr>
                <SkeletonLoader v-if="loading && !groupTable.length" variant="table" :cols="isStaff ? 8 : 7" :rows="5" />
                <tr v-else-if="!groupTable.length"><td :colspan="isStaff ? 8 : 7" class="gr-empty">لا توجد مجموعات مطابقة</td></tr>
              </tbody>
            </table>
          </div>
        </template>
        <template #after>
          <div class="gr-sumbar">
            <span>عدد المجموعات: {{ groupTable.length }}</span>
            <span v-for="(l, k) in STATUS" :key="k">{{ l.label }}: {{ groupTable.filter((g) => g.status === k).length }}</span>
            <span>الطلبة: {{ groupTable.reduce((n, g) => n + g.members.length, 0) }}</span>
          </div>
        </template>
      </SlideTable>
    </section>

    <!-- 4) نتائج الطلاب -->
    <section class="gr gr-card evp-card">
      <div class="gr-card-title">
        <h3>نتائج الطلاب</h3>
        <span class="dash-chip">{{ resultTable.length }} طالبًا</span>
      </div>

      <div class="gr-filters" aria-label="تصفية النتائج">
        <label class="gr-search">
          <Search :size="16" />
          <input v-model.trim="rq" type="search" placeholder="بحث بالطالب أو الرقم الجامعي أو الشعبة…">
        </label>
        <label v-if="isStaff" class="gr-pick">
          <select v-model="f.dept" class="gr-select" aria-label="القسم">
            <option value="">كل الأقسام</option>
            <option v-for="d in departmentFilterOptions" :key="d.value" :value="d.value">{{ d.label }}</option>
          </select>
        </label>
        <label v-if="isStaff" class="gr-pick">
          <select v-model="f.spec" class="gr-select" aria-label="التخصص">
            <option value="">كل التخصصات</option>
            <option v-for="s in rSpecOptions" :key="s.value" :value="s.value">{{ s.label }}</option>
          </select>
        </label>
        <label v-if="isStaff" class="gr-pick">
          <select v-model="f.degree" class="gr-select" aria-label="الدرجة">
            <option value="">دبلوم وبكالوريوس</option>
            <option v-for="d in degreeSelectOptions" :key="d.value" :value="d.value">{{ d.label }}</option>
          </select>
        </label>
        <label v-if="isStaff" class="gr-pick">
          <select v-model="f.gender" class="gr-select" aria-label="الفئة">
            <option value="">طلاب وطالبات</option>
            <option v-for="g in genderSelectOptions" :key="g.value" :value="g.value">{{ g.label }}</option>
          </select>
        </label>
        <label v-if="isStaff" class="gr-pick">
          <select v-model="f.region" class="gr-select" aria-label="المنطقة">
            <option value="">كل المناطق</option>
            <option v-for="r in regionSelectOptions" :key="r.value" :value="r.value">{{ r.label }}</option>
          </select>
        </label>
        <label v-if="isStaff" class="gr-pick">
          <select v-model="f.featured" class="gr-select" aria-label="التميّز">
            <option value="">الكل</option>
            <option value="yes">مشروع مميّز</option>
            <option value="no">غير مميّز</option>
          </select>
        </label>
        <label class="gr-pick">
          <select v-model="f.grade" class="gr-select" aria-label="التقدير">
            <option value="">كل التقديرات</option>
            <option v-for="g in GRADE_NAMES" :key="g" :value="g">{{ g }}</option>
          </select>
        </label>
        <label class="gr-pick gr-pick-rows">
          <select v-model.number="rSize" class="gr-select" aria-label="عدد الصفوف">
            <option :value="25">عرض 25</option>
            <option :value="50">عرض 50</option>
            <option :value="100">عرض 100</option>
          </select>
        </label>
      </div>

      <SlideTable :rows="resultTable" :size="rSize" label="النتائج">
        <template #default="{ rows: shown }">
          <div class="gr-table-wrap">
            <table class="gr-table evp-table">
              <thead>
                <tr>
                  <th class="hm-center">الترتيب</th>
                  <th>الطالب</th>
                  <th>المشروع</th>
                  <th>الدرجة</th>
                  <th class="hm-center">المشرف</th>
                  <th class="hm-center">اللجنة</th>
                  <th class="hm-center">المجموع</th>
                  <th class="hm-center">التقدير</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="r in shown" :key="r.id" class="gr-row" @click="openSheet(r.teamId)">
                  <td class="hm-center"><b class="evp-rank">{{ r.rank }}</b></td>
                  <td>
                    <span class="gr-name">{{ r.name }}</span>
                    <span class="evp-sub"><span class="mono">{{ r.number }}</span> · {{ r.gender }} · {{ r.section }}</span>
                  </td>
                  <td>
                    <span class="gr-name">{{ r.projectName }}<Star v-if="r.featured" :size="12" fill="currentColor" class="ev-star" /></span>
                    <span class="evp-sub"><button v-if="r.supId" type="button" class="ev-suplink" title="عرض بروفايل المشرف ومجموعاته" @click.stop="openPerson('supervisor', r.supId, r.supName)">{{ r.supName }}</button><template v-else>{{ r.supName }}</template></span>
                  </td>
                  <td>{{ r.degree }}</td>
                  <td class="hm-center"><span class="mono">{{ r.supScore ?? '—' }}</span></td>
                  <td class="hm-center"><span class="mono">{{ r.comScore ?? '—' }}</span></td>
                  <td class="hm-center">
                    <span class="evp-score">
                      <span class="evp-score-bar"><span :style="{ width: Math.min(100, Number(r.score) || 0) + '%' }" /></span>
                      <b class="mono">{{ r.score ?? '—' }}</b>
                    </span>
                  </td>
                  <td class="hm-center"><span :class="['rv-pill', VARIANT_PILL[r.variant]]">{{ r.gradeLabel }}</span></td>
                </tr>
                <SkeletonLoader v-if="loading && !resultTable.length" variant="table" :cols="8" :rows="5" />
                <tr v-else-if="!resultTable.length"><td colspan="8" class="gr-empty">لا توجد نتائج مطابقة</td></tr>
              </tbody>
            </table>
          </div>
        </template>
        <template #after>
          <div class="gr-sumbar">
            <span>عدد الطلبة: {{ resultTable.length }}</span>
            <span>متوسط الدرجات: {{ avg }}</span>
            <span v-for="g in GRADE_NAMES" :key="g">{{ g }}: {{ resultTable.filter((r) => r.gradeLabel === g).length }}</span>
          </div>
        </template>
      </SlideTable>
    </section>

    <ProfileModal v-model="profile.open" :kind="profile.kind" :person-id="profile.id" :name="profile.name" />
  </div>
</template>

<script>
import { mapState } from 'pinia'
import { ClipboardPen, Search, Star, ChevronDown } from 'lucide-vue-next'
import SlideTable from '@/components/ui/SlideTable.vue'
import SkeletonLoader from '@/components/ui/SkeletonLoader.vue'
import EvaluationFormEditor from './EvaluationFormEditor.vue'
import ProfileModal from '@/components/shared/ProfileModal.vue'
import api from '@/services/api'
import { useAuthStore } from '@/stores/auth.store'
import { useTeamsStore } from '@/stores/teams.store'
import { DEGREES, GENDERS, REGIONS, fetchGroups } from '@/utils/progressData'
import { grade } from '@/utils/evaluation'

const STATUS = {
  done: { label: 'مكتمل', variant: 'success' },
  partial: { label: 'قيد التقييم', variant: 'info' },
  none: { label: 'لم يُقيَّم', variant: 'neutral' }
}
const STATUS_PILL = { done: 'is-approved', partial: 'is-pending', none: '' }

const EMPTY_FILTERS = { degree: '', gender: '', grade: '', featured: '', region: '', dept: '', spec: '' }

const GRADE_VARIANTS = {
  ممتاز: 'success',
  'جيد جدًا': 'success',
  جيد: 'success',
  مقبول: 'warning',
  راسب: 'error',
  'غير مكتمل': 'neutral'
}
const VARIANT_PILL = { success: 'is-approved', info: 'is-pending', warning: 'is-pending', error: 'is-rejected', neutral: '' }

export default {
  name: 'EvaluationsPage',

  components: { SlideTable, SkeletonLoader, EvaluationFormEditor, ProfileModal, Search, ClipboardPen, Star, ChevronDown },

  data() {
    return {
      DEGREES, REGIONS, STATUS, STATUS_PILL, VARIANT_PILL, GRADE_NAMES: Object.keys(GRADE_VARIANTS),
      ClipboardPen,
      formsOpen: (() => { try { return localStorage.getItem('ev-forms-open') === '1' } catch { return false } })(),
      groups: [],
      examining: [],
      results: [],
      loading: true,
      gq: '', rq: '', gSup: '', gStatus: '', gDept: '', gSpec: '',
      gSize: 25, rSize: 25,
      f: { ...EMPTY_FILTERS },
      profile: { open: false, kind: 'supervisor', id: null, name: '' }
    }
  },

  watch: {
    // تذكّر حالة بطاقة إعداد النماذج (مفتوحة/مطوية) بين التحديثات
    formsOpen(open) {
      try { localStorage.setItem('ev-forms-open', open ? '1' : '0') } catch { /* تجاهل */ }
    },
    // تتابع قسم→تخصص: تغيير القسم يصفّر التخصص الخارج عن نطاقه
    gDept() {
      if (this.gSpec && !this.gSpecOptions.some((o) => o.value === this.gSpec)) this.gSpec = ''
    },
    'f.dept'() {
      if (this.f.spec && !this.rSpecOptions.some((o) => o.value === this.f.spec)) this.f.spec = ''
    }
  },

  computed: {
    ...mapState(useAuthStore, ['userRole']),
    ...mapState(useTeamsStore, ['departmentFilterOptions']),
    isStaff() {
      return this.userRole === 'super_admin' || this.userRole === 'committee'
    },
    /** تخصصات القسم المحدَّد (تتابع قسم→تخصص) — لكل جدول فلتره */
    gSpecOptions() {
      return useTeamsStore().specializationFilterOptionsForDept(this.gDept)
    },
    rSpecOptions() {
      return useTeamsStore().specializationFilterOptionsForDept(this.f.dept)
    },
    /** قسم/تخصص كل مجموعة حسب معرّفها — لفلترة النتائج بالقسم/التخصص عبر الفريق */
    groupInfoById() {
      const m = {}
      this.groups.forEach((g) => { m[g.id] = { dept: g.dept, spec: g.spec } })
      return m
    },
    supSelectOptions() {
      const map = new Map()
      this.groups.forEach((g) => g.sup?.id && map.set(g.sup.id, g.sup))
      return [...map.values()].map((s) => ({ value: s.id, label: s.name }))
    },
    degreeSelectOptions() {
      return Object.entries(DEGREES).map(([value, label]) => ({ value, label }))
    },
    genderSelectOptions() {
      return Object.entries(GENDERS).map(([value, label]) => ({ value, label }))
    },
    regionSelectOptions() {
      return Object.entries(REGIONS).map(([value, label]) => ({ value, label }))
    },
    /**
     * حالة تقييم كل مجموعة.
     * الإدارة/اللجنة: كل المجموعات. المشرف: المجموعات التي يناقشها فقط (كلجنة مناقشة) — لا مجموعاته التي يشرف عليها.
     */
    groupsWithStatus() {
      if (!this.isStaff) {
        return this.examining.map((t) => {
          const com = t.members.length > 0 && t.members.every((m) => t.results.some((r) => r.student_id === m.id && r.committee_score != null))
          return { ...t, examining: true, sup: t.supervisor || { id: null, name: '—' }, ev: { sup: false, com, status: com ? 'done' : t.results.length ? 'partial' : 'none' } }
        })
      }
      const byTeam = {}
      this.results.forEach((r) => (byTeam[r.team?.id] ||= []).push(r))
      return this.groups.map((g) => {
        const rs = byTeam[g.id] || []
        const all = (key) => g.members.length > 0 && g.members.every((m) => rs.some((r) => r.student?.id === m.id && r[key] != null))
        const sup = all('supervisor_score')
        const com = all('committee_score')
        const any = rs.some((r) => r.supervisor_score != null || r.committee_score != null)
        return { ...g, ev: { sup, com, status: sup && com ? 'done' : any ? 'partial' : 'none' } }
      })
    },
    groupTable() {
      const q = this.gq
      return this.groupsWithStatus
        .filter((g) =>
          (!q || `${g.section} ${g.name} ${g.project?.name || ''} ${g.members.map((m) => m.name).join(' ')}`.includes(q)) &&
          (!this.gDept || g.dept === this.gDept) && (!this.gSpec || g.spec === this.gSpec) &&
          (!this.gSup || g.sup.id === this.gSup) && (!this.gStatus || g.ev.status === this.gStatus)
        )
        .map((g) => ({
          id: g.id,
          section: g.section ? `شعبة ${g.section}` : g.name,
          projectName: g.project?.name || 'لم يُسجَّل مشروع',
          members: g.members.map((m) => m.name),
          sup: g.sup.name,
          supId: g.sup?.id ?? null,
          degree: DEGREES[g.degree] || '—',
          supMark: g.ev.sup,
          comMark: g.ev.com,
          status: g.ev.status,
          examining: !!g.examining
        }))
    },
    rank() {
      const out = {}
      let place = 0
      this.results.forEach((r, i) => { if (!i || r.score !== this.results[i - 1].score) place++; out[r.id] = place })
      return out
    },
    resultTable() {
      const { degree, gender, featured, region } = this.f
      const q = this.rq
      return this.results
        .filter((r) => {
          const info = this.groupInfoById[r.team?.id] || {}
          return (!q || `${r.student?.name} ${r.student?.university_number} ${r.team?.section} ${r.team?.name} ${r.project?.name}`.includes(q)) &&
          (!this.f.dept || info.dept === this.f.dept) && (!this.f.spec || info.spec === this.f.spec) &&
          (!degree || r.degree === degree) && (!gender || (gender === 'female') === (r.student?.gender === 'female')) &&
          (!this.f.grade || this.gradeOf(r) === this.f.grade) &&
          (!featured || (featured === 'yes') === !!r.project?.is_featured) && (!region || r.student?.region === region)
        })
        .map((r) => {
          const label = this.gradeOf(r)
          return {
            ...r,
            teamId: r.team?.id,
            rank: this.rank[r.id],
            name: r.student?.name || '—',
            number: r.student?.university_number || '—',
            gender: r.student?.gender === 'female' ? 'طالبة' : 'طالب',
            section: r.team?.section ? `شعبة ${r.team.section}` : r.team?.name || '—',
            projectName: r.project?.name || '—',
            featured: !!r.project?.is_featured,
            supName: r.supervisor?.name || '',
            supId: r.supervisor?.id ?? null,
            degree: DEGREES[r.degree] || '—',
            supScore: r.supervisor_score,
            comScore: r.committee_score,
            score: r.score,
            gradeLabel: label,
            variant: GRADE_VARIANTS[label] || 'neutral'
          }
        })
    },
    statusCount() {
      return (k) => this.groupsWithStatus.filter((g) => g.ev.status === k).length
    },
    avg() {
      const scored = this.results.filter((r) => r.score != null && !Number.isNaN(Number(r.score)))
      return scored.length ? Math.round(scored.reduce((n, r) => n + Number(r.score), 0) / scored.length) : '—'
    }
  },

  async created() {
    useTeamsStore().fetchOrgCatalog().catch(() => {})
    const [groups] = await Promise.allSettled([fetchGroups(), this.loadResults(), this.loadExamining()])
    this.groups = groups.value || []
    if (groups.status === 'rejected') this.$toast?.error('تعذّر تحميل المجموعات')
    this.loading = false
  },

  methods: {
    grade,

    /** فتح بروفايل المشرف (مع مجموعاته) */
    openPerson(kind, id, name) {
      if (!id) return
      this.profile = { open: true, kind, id, name }
    },

    async loadResults() {
      try {
        const { data } = await api.get('/evaluations')
        this.results = data.data || data
      } catch {
        this.$toast?.error('تعذّر تحميل نتائج التقييمات')
      }
    },

    async loadExamining() {
      if (this.isStaff) return
      try {
        const { data } = await api.get('/evaluations/examining')
        this.examining = data
      } catch {
        this.$toast?.error('تعذّر تحميل المجموعات التي تناقشها')
      }
    },

    openSheet(teamId) {
      if (teamId) this.$router.push({ name: this.$route.name.replace('-evaluations', '-evaluation-sheet'), params: { teamId } })
    },

    isDone(r) {
      return r.supervisor_score != null && r.committee_score != null
    },

    gradeOf(r) {
      return this.isDone(r) ? grade(r.score) : 'غير مكتمل'
    }
  }
}
</script>
