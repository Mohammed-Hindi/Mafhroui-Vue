<template>
  <!-- التقييمات — نظام نماذج الكلية: تقييم المجموعات (ورقة تقييم لكل مجموعة)، نماذج التقييم (تعديل الحقول وطريقة التقييم
       للإدارة العامة ولجنة الإشراف)، والنتائج (جزء المشرف + متوسط المناقشين = الدرجة من 100).
       المشرف: مجموعاته ونموذج المشرف فقط، بلا تعديل نماذج ولا رؤية تقييمات المناقشين. -->
  <div class="dash">
    <header class="dash-head">
      <h2 class="dash-title">التقييمات</h2>
    </header>

    <!-- الإعداد بخطوات: إعداد النماذج ← تقييم المجموعات ← النتائج -->
    <div class="ev-steps-bar">
      <ol class="tk-stepper ev-steps" aria-label="مراحل التقييم">
        <li v-for="(t, i) in steps" :key="t.value" :class="[tab === t.value && 'is-active']">
          <button type="button" @click="tab = t.value"><b>{{ i + 1 }}</b> {{ t.label }}</button>
        </li>
      </ol>
    </div>

    <section v-if="tab === 'groups' || tab === 'results'" class="hm-stats" aria-label="ملخص التقييمات">
      <div class="hm-stat"><span class="hm-stat-label">المجموعات</span><span class="hm-stat-value">{{ groupsWithStatus.length }}</span><span class="hm-stat-split">مكتملة التقييم <b>{{ statusCount('done') }}</b></span></div>
      <div class="hm-stat"><span class="hm-stat-label">قيد التقييم</span><span class="hm-stat-value">{{ statusCount('partial') }}</span><span class="hm-stat-split">لم تُقيَّم <b>{{ statusCount('none') }}</b></span></div>
      <div class="hm-stat"><span class="hm-stat-label">متوسط الدرجات</span><span class="hm-stat-value">{{ avg }}</span><span class="hm-stat-split">من 100 · {{ results.length }} طالبًا</span></div>
      <div class="hm-stat"><span class="hm-stat-label">أعلى درجة</span><span class="hm-stat-value">{{ top?.score ?? '—' }}</span><span class="hm-stat-split">{{ top?.student?.name || '' }}</span></div>
    </section>

    <!-- تقييم المجموعات — بنمط صفحة المجموعات: تصنيف سريع (الدرجة · حالة التقييم) ثم "حدد …" ثم الجدول بالسلايدر والشريط الأخضر -->
    <section v-if="tab === 'groups'" class="dash-card ev-card">
      <div class="dash-card-head">
        <h3>تقييم المجموعات</h3>
        <span class="dash-chip">{{ groupRows.length }} مجموعة</span>
      </div>

      <div class="gr-classes" aria-label="تصنيف المجموعات">
        <div v-for="c in gClasses" :key="c.key" class="gr-class" role="radiogroup" :aria-label="c.label">
          <span class="gr-class-label">{{ c.label }}</span>
          <div class="gr-seg">
            <button
              v-for="o in c.options" :key="o.value" type="button" role="radio"
              :class="c.value === o.value && 'is-active'" :aria-checked="c.value === o.value"
              @click="c.set(o.value)"
            >
              {{ o.label }} <b>{{ o.count }}</b>
            </button>
          </div>
        </div>
      </div>

      <div class="gr-filters" aria-label="تصفية المجموعات">
        <label class="gr-search"><Search :size="16" /><input v-model.trim="gq" type="search" placeholder="بحث برقم الشعبة، المشروع أو الطالب…"></label>
        <label v-if="isStaff" class="gr-pick">
          <span>المشرف</span>
          <select v-model="gSup" class="gr-select">
            <option value="">كل المشرفين</option>
            <option v-for="s in supOptions" :key="s.id" :value="s.id">{{ s.name }}</option>
          </select>
        </label>
      </div>

      <p v-if="loading" class="pt-muted tk-loading">جارٍ التحميل…</p>
      <SlideTable v-else :rows="groupRows" label="المجموعات">
        <template #default="{ rows: pageRows }">
          <div class="pt-wrap">
            <table class="pt ev-groups">
              <thead>
                <tr>
                  <th>الشعبة</th><th>المشروع والطلبة</th><th v-if="isStaff">المشرف</th><th>الدرجة</th>
                  <th class="ev-c">تقييم المشرف</th><th class="ev-c">لجنة المناقشة</th><th class="ev-c">الحالة</th><th />
                </tr>
              </thead>
              <tbody>
                <tr v-for="g in pageRows" :key="g.id" class="is-link" @click="openSheet(g.id)">
                  <td class="pt-strong ev-nowrap">
                    {{ g.section ? `شعبة ${g.section}` : g.name }}
                    <span v-if="g.examining" class="ef-kind is-examiner ev-exam-tag">مناقش</span>
                  </td>
                  <td class="ev-proj">
                    <b>{{ g.project?.name || 'لم يُسجَّل مشروع' }}</b>
                    <span class="pt-muted">{{ g.members.length }} طلاب · {{ g.members.map((m) => m.name).join('، ') }}</span>
                  </td>
                  <td v-if="isStaff" class="ev-nowrap">{{ g.sup.name }}</td>
                  <td class="ev-nowrap">{{ DEGREES[g.degree] || '—' }}</td>
                  <td class="ev-c">
                    <span v-if="g.examining" class="pt-muted">—</span>
                    <span v-else :class="['ev-mark', g.ev.sup && 'is-done']"><Check v-if="g.ev.sup" :size="14" />{{ g.ev.sup ? 'تم' : 'لم يتم' }}</span>
                  </td>
                  <td class="ev-c"><span :class="['ev-mark', g.ev.com && 'is-done']"><Check v-if="g.ev.com" :size="14" />{{ g.ev.com ? 'تم' : 'لم يتم' }}</span></td>
                  <td class="ev-c"><span :class="['rv-pill', STATUS[g.ev.status].tone]">{{ STATUS[g.ev.status].label }}</span></td>
                  <td class="ev-act">
                    <button type="button" :class="['pbtn is-sm', g.examining || g.ev.status !== 'none' ? 'is-outline' : 'is-cyan']" @click.stop="openSheet(g.id)">
                      <ClipboardPen :size="14" /> {{ g.examining ? 'عرض العلامة' : g.ev.status === 'none' ? 'تقييم' : 'فتح التقييم' }}
                    </button>
                  </td>
                </tr>
                <tr v-if="!groupRows.length"><td :colspan="isStaff ? 8 : 7" class="gr-empty">لا توجد مجموعات مطابقة</td></tr>
              </tbody>
            </table>
          </div>
        </template>
        <template #after>
          <div class="gr-sumbar">
            <span>عدد المجموعات: {{ groupRows.length }}</span>
            <span v-for="(l, k) in STATUS" :key="k">{{ l.label }}: {{ groupRows.filter((g) => g.ev.status === k).length }}</span>
            <span>الطلبة: {{ groupRows.reduce((n, g) => n + g.members.length, 0) }}</span>
          </div>
        </template>
      </SlideTable>
    </section>

    <!-- نماذج التقييم -->
    <EvaluationFormEditor v-else-if="tab === 'forms'" />

    <!-- النتائج — بنمط صفحة المجموعات: تصنيف سريع (الدرجة · الفئة · التقدير) ثم "حدد …" ثم جدول بترتيب الطالب -->
    <section v-else class="dash-card ev-card">
      <div class="dash-card-head">
        <h3>نتائج الطلاب</h3>
        <span class="dash-chip">{{ resultRows.length }} طالبًا</span>
      </div>

      <div class="gr-classes" aria-label="تصنيف النتائج">
        <div v-for="c in rClasses" :key="c.key" class="gr-class" role="radiogroup" :aria-label="c.label">
          <span class="gr-class-label">{{ c.label }}</span>
          <div class="gr-seg">
            <button
              v-for="o in c.options" :key="o.value" type="button" role="radio"
              :class="f[c.key] === o.value && 'is-active'" :aria-checked="f[c.key] === o.value"
              @click="f[c.key] = o.value"
            >
              {{ o.label }} <b>{{ o.count }}</b>
            </button>
          </div>
        </div>
      </div>

      <div class="gr-filters" aria-label="تصفية النتائج">
        <label class="gr-search"><Search :size="16" /><input v-model.trim="q" type="search" placeholder="بحث بالطالب أو الرقم الجامعي أو الشعبة أو المشروع…"></label>
        <label v-if="isStaff" class="gr-pick">
          <span>المكان</span>
          <select v-model="f.region" class="gr-select"><option value="">كل المناطق</option><option v-for="(l, k) in REGIONS" :key="k" :value="k">{{ l }}</option></select>
        </label>
        <label v-if="isStaff" class="gr-pick">
          <span>التمييز</span>
          <select v-model="f.featured" class="gr-select"><option value="">الكل</option><option value="yes">مشروع مميّز</option><option value="no">غير مميّز</option></select>
        </label>
      </div>

      <SlideTable :rows="resultRows" label="الطلاب">
        <template #default="{ rows: pageRows }">
          <div class="pt-wrap">
            <table class="pt ev-results">
              <thead>
                <tr>
                  <th class="ev-c">#</th><th>الطالب</th><th>الشعبة والمشروع</th><th>الدرجة</th>
                  <th class="ev-c">المشرف</th><th class="ev-c">المناقشة</th><th class="ev-c">المجموع</th><th class="ev-c">التقدير</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="r in pageRows" :key="r.id" class="is-link" @click="openSheet(r.team?.id)">
                  <td class="ev-c"><span :class="['ev-rank', rank[r.id] <= 3 && 'is-top']">{{ rank[r.id] }}</span></td>
                  <td class="ev-student">
                    <b>{{ r.student?.name }}</b>
                    <small><span class="mono">{{ r.student?.university_number || '—' }}</span> · {{ r.student?.gender === 'female' ? 'طالبة' : 'طالب' }}<template v-if="REGIONS[r.student?.region]"> · {{ REGIONS[r.student.region] }}</template></small>
                  </td>
                  <td class="ev-proj">
                    <b><span class="ev-sec">{{ r.team?.section ? `شعبة ${r.team.section}` : r.team?.name }}</span>{{ r.project?.name || '—' }}<Star v-if="r.project?.is_featured" :size="13" fill="currentColor" class="ev-star" /></b>
                    <span class="pt-muted">{{ r.supervisor?.name || '' }}</span>
                  </td>
                  <td class="ev-nowrap">{{ DEGREES[r.degree] }}</td>
                  <td class="ev-c mono">{{ r.supervisor_score ?? '—' }}</td>
                  <td class="ev-c mono">{{ r.committee_score ?? '—' }}</td>
                  <td class="ev-c">
                    <span class="ev-total">
                      <b class="mono">{{ r.score }}</b>
                      <span class="ev-total-bar"><span :class="r.score < 60 ? 'is-low' : r.score < 80 ? 'is-mid' : ''" :style="{ width: Math.min(100, r.score) + '%' }" /></span>
                    </span>
                  </td>
                  <td class="ev-c"><span :class="['rv-pill', isDone(r) ? gradeTone(r.score) : 'is-pending']">{{ gradeOf(r) }}</span></td>
                </tr>
                <tr v-if="!resultRows.length"><td colspan="8" class="gr-empty">{{ loading ? 'جارٍ التحميل…' : 'لا توجد نتائج مطابقة' }}</td></tr>
              </tbody>
            </table>
          </div>
        </template>
        <template #after>
          <div class="gr-sumbar">
            <span>عدد الطلبة: {{ resultRows.length }}</span>
            <span>متوسط الدرجات: {{ avgOf(resultRows.filter(isDone)) }}</span>
            <span v-for="g in GRADE_NAMES" :key="g">{{ g }}: {{ resultRows.filter((r) => gradeOf(r) === g).length }}</span>
          </div>
        </template>
      </SlideTable>
    </section>
  </div>
</template>

<script>
import { mapState } from 'pinia'
import { Check, ClipboardPen, Search, Star } from 'lucide-vue-next'
import SlideTable from '@/components/ui/SlideTable.vue'
import EvaluationFormEditor from './EvaluationFormEditor.vue'
import api from '@/services/api'
import { useAuthStore } from '@/stores/auth.store'
import { DEGREES, REGIONS, fetchGroups } from '@/utils/progressData'
import { groupGender } from '@/services/adminData'
import { grade, gradeTone } from '@/utils/evaluation'

const STATUS = {
  done: { label: 'مكتمل', tone: 'is-approved' },
  partial: { label: 'قيد التقييم', tone: 'is-pending' },
  none: { label: 'لم يُقيَّم', tone: '' }
}

export default {
  name: 'EvaluationsPage',

  components: { SlideTable, EvaluationFormEditor, Check, ClipboardPen, Search, Star },

  data() {
    return {
      DEGREES, REGIONS, STATUS,
      tab: 'groups',
      groups: [],
      examining: [],
      results: [],
      loading: true,
      gq: '', gSup: '', gDegree: '', gStatus: '', gGender: '', gSpec: '',
      q: '',
      GRADE_NAMES: ['ممتاز', 'جيد جدًا', 'جيد', 'مقبول', 'راسب', 'غير مكتمل'],
      f: { degree: '', gender: '', grade: '', featured: '', region: '', spec: '' }
    }
  },

  computed: {
    ...mapState(useAuthStore, ['userRole']),
    /** الإدارة العامة ولجنة الإشراف: كل الأدوات · المشرف: تقييم مجموعاته والنتائج فقط */
    isStaff() {
      return this.userRole === 'super_admin' || this.userRole === 'committee'
    },
    /** مراحل التقييم: الإدارة واللجنة تبدآن بإعداد النماذج، والمشرف بتقييم مجموعاته */
    steps() {
      return [
        ...(this.isStaff ? [{ value: 'forms', label: 'إعداد نماذج التقييم' }] : []),
        { value: 'groups', label: 'تقييم المجموعات' },
        { value: 'results', label: 'النتائج' }
      ]
    },
    /** تصنيف سريع بنمط صفحة المجموعات، بأعداد من كل المجموعات */
    gClasses() {
      const all = this.groupsWithStatus
      const opt = (value, label, n) => ({ value, label, count: n })
      return [
        {
          key: 'degree', label: 'الدرجة', value: this.gDegree, set: (v) => { this.gDegree = v },
          options: [opt('', 'الكل', all.length), ...Object.entries(DEGREES).map(([k, l]) => opt(k, l, all.filter((g) => g.degree === k).length))]
        },
        {
          key: 'status', label: 'حالة التقييم', value: this.gStatus, set: (v) => { this.gStatus = v },
          options: [opt('', 'الكل', all.length), ...Object.entries(STATUS).map(([k, l]) => opt(k, l.label, all.filter((g) => g.ev.status === k).length))]
        }
      ]
    },
    supOptions() {
      const map = new Map()
      this.groups.forEach((g) => g.sup.id && map.set(g.sup.id, g.sup))
      return [...map.values()]
    },
    /** حالة تقييم كل مجموعة من نتائج الخادم: جزء المشرف وجزء اللجنة لكل طلابها */
    groupsWithStatus() {
      const byTeam = {}
      this.results.forEach((r) => (byTeam[r.team?.id] ||= []).push(r))
      return this.groups.map((g) => {
        const rs = byTeam[g.id] || []
        const all = (key) => g.members.length > 0 && g.members.every((m) => rs.some((r) => r.student?.id === m.id && r[key] != null))
        const sup = all('supervisor_score')
        const com = all('committee_score')
        const any = rs.some((r) => r.supervisor_score != null || r.committee_score != null)
        return { ...g, ev: { sup, com, status: sup && (com || !this.isStaff) ? 'done' : any ? 'partial' : 'none' } }
      }).concat(this.examining.map((t) => {
        const com = t.members.length > 0 && t.members.every((m) => t.results.some((r) => r.student_id === m.id && r.committee_score != null))
        return { ...t, examining: true, sup: t.supervisor || { id: null, name: '—' }, ev: { sup: false, com, status: com ? 'done' : t.results.length ? 'partial' : 'none' } }
      }))
    },
    groupRows() {
      const q = this.gq
      return this.groupsWithStatus.filter((g) =>
        (!q || `${g.section} ${g.name} ${g.project?.name || ''} ${g.members.map((m) => m.name).join(' ')}`.includes(q)) &&
        (!this.gSup || g.sup.id === this.gSup) && (!this.gDegree || g.degree === this.gDegree) && (!this.gStatus || g.ev.status === this.gStatus) &&
        (!this.gGender || groupGender(g) === this.gGender) && (!this.gSpec || g.spec === this.gSpec)
      )
    },
    specs() {
      return [...new Set(this.groups.map((g) => g.spec).filter(Boolean))]
    },
    /** تخصص مجموعة النتيجة (لفلتر المشرف) */
    specByTeam() {
      return Object.fromEntries(this.groups.map((g) => [g.id, g.spec]))
    },
    /** ترتيب الطالب بين كل النتائج (الخادم يرتّبها تنازليًا بالدرجة؛ المتساوون بنفس الترتيب) */
    rank() {
      const out = {}
      this.results.forEach((r, i) => { out[r.id] = i && r.score === this.results[i - 1].score ? out[this.results[i - 1].id] : i + 1 })
      return out
    },
    rClasses() {
      const all = this.results
      const opt = (value, label, n) => ({ value, label, count: n })
      const gender = { key: 'gender', label: 'الفئة', options: [opt('', 'الكل', all.length), opt('male', 'طلاب', all.filter((r) => r.student?.gender !== 'female').length), opt('female', 'طالبات', all.filter((r) => r.student?.gender === 'female').length)] }
      return [
        { key: 'degree', label: 'الدرجة', options: [opt('', 'الكل', all.length), ...Object.entries(DEGREES).map(([k, l]) => opt(k, l, all.filter((r) => r.degree === k).length))] },
        ...(this.isStaff ? [gender] : []),
        { key: 'grade', label: 'التقدير', options: [opt('', 'الكل', all.length), ...this.GRADE_NAMES.map((g) => opt(g, g, all.filter((r) => this.gradeOf(r) === g).length))] }
      ]
    },
    resultRows() {
      const { degree, gender, featured, region } = this.f
      return this.results.filter((r) =>
        (!this.q || `${r.student?.name} ${r.student?.university_number} ${r.team?.section} ${r.team?.name} ${r.project?.name}`.includes(this.q)) &&
        (!degree || r.degree === degree) && (!gender || (gender === 'female') === (r.student?.gender === 'female')) && (!this.f.grade || this.gradeOf(r) === this.f.grade) &&
        (!featured || (featured === 'yes') === !!r.project?.is_featured) && (!region || r.student?.region === region) &&
        (!this.f.spec || this.specByTeam[r.team?.id] === this.f.spec)
      )
    },
    avg() {
      return this.avgOf(this.results)
    },
    top() {
      return this.results[0]
    }
  },

  async created() {
    // الإدارة واللجنة تبدآن من الإعداد
    if (this.isStaff) this.tab = 'forms'
    if (this.steps.some((t) => t.value === this.$route.query.tab)) this.tab = this.$route.query.tab
    const [groups] = await Promise.allSettled([fetchGroups(), this.loadResults(), this.loadExamining()])
    this.groups = groups.value || []
    if (groups.status === 'rejected') this.$toast?.error('تعذّر تحميل المجموعات')
    this.loading = false
  },

  methods: {
    grade,
    gradeTone,

    // GET /evaluations — النتائج النهائية (مرتبة تنازليًا بالدرجة من الخادم)
    async loadResults() {
      try {
        const { data } = await api.get('/evaluations')
        this.results = data.data || data
      } catch {
        this.$toast?.error('تعذّر تحميل نتائج التقييمات')
      }
    },

    // GET /evaluations/examining — المشرف: مجموعات يناقشها (علامة لجنة المناقشة للاطلاع فقط)
    async loadExamining() {
      if (this.isStaff) return
      try {
        const { data } = await api.get('/evaluations/examining')
        this.examining = data
      } catch {
        this.$toast?.error('تعذّر تحميل المجموعات التي تناقشها')
      }
    },

    // ورقة التقييم صفحة مستقلة: super-admin-evaluations ← super-admin-evaluation-sheet
    openSheet(teamId) {
      if (teamId) this.$router.push({ name: this.$route.name.replace('-evaluations', '-evaluation-sheet'), params: { teamId } })
    },

    /** النتيجة مكتملة حين يُقيَّم الطالب من المشرف ولجنة المناقشة؛ غير ذلك لا يُعطى تقديرًا (لا "راسب" لنقص التقييم) */
    isDone(r) {
      return r.supervisor_score != null && r.committee_score != null
    },
    gradeOf(r) {
      return this.isDone(r) ? grade(r.score) : 'غير مكتمل'
    },

    clearResultFilters() {
      this.q = ''
      Object.keys(this.f).forEach((k) => { this.f[k] = '' })
    },

    statusCount(s) {
      return this.groupsWithStatus.filter((g) => g.ev.status === s).length
    },

    avgOf(rows) {
      return rows.length ? Math.round(rows.reduce((n, r) => n + r.score, 0) / rows.length) : '—'
    }
  }
}
</script>
