<template>
  <!-- نتائج تقييمات مشاريع التخرج — بيانات تجريبية (placeholder):
       معايير التقييم وأوزانها + نتائج كل الطلاب مع فلترة (دبلوم/بكالوريوس، طلاب/طالبات، مميّز، غزة/الجنوب) -->
  <div class="dash">
    <header class="dash-head">
      <h2 class="dash-title">نتائج التقييمات</h2>
    </header>

    <section class="hm-stats" aria-label="ملخص النتائج">
      <div class="hm-stat"><span class="hm-stat-label">الطلاب</span><span class="hm-stat-value">{{ rows.length }}</span><span class="hm-stat-split">في {{ groupsCount }} مجموعة</span></div>
      <div class="hm-stat"><span class="hm-stat-label">متوسط الدرجات</span><span class="hm-stat-value">{{ avg }}</span><span class="hm-stat-split">من 100</span></div>
      <div class="hm-stat"><span class="hm-stat-label">أعلى درجة</span><span class="hm-stat-value">{{ top?.score ?? '—' }}</span><span class="hm-stat-split">{{ top?.name || '' }}</span></div>
      <div class="hm-stat"><span class="hm-stat-label">التقديرات</span><span class="hm-stat-value">{{ gradeCount('ممتاز') }}</span><span class="hm-stat-split">ممتاز · جيد جدًا <b>{{ gradeCount('جيد جدًا') }}</b></span></div>
    </section>

    <div class="ev-layout">
      <!-- المعايير -->
      <section class="dash-card">
        <div class="dash-card-head">
          <h3>معايير التقييم</h3>
          <span :class="['dash-chip', totalWeight !== 100 && 'is-bad']">المجموع {{ totalWeight }} / 100</span>
        </div>
        <ul class="ev-criteria">
          <li v-for="(c, i) in criteria" :key="i">
            <input v-model.trim="c.name" type="text" class="ev-input" placeholder="اسم المعيار">
            <input v-model.number="c.weight" type="number" min="1" max="100" class="ev-input ev-weight" aria-label="الوزن">
            <button type="button" class="ev-remove" title="حذف المعيار" @click="criteria.splice(i, 1)"><X :size="15" /></button>
          </li>
        </ul>
        <button type="button" class="gr-add" @click="criteria.push({ name: '', weight: 10 })"><Plus :size="15" /> إضافة معيار</button>
      </section>

      <!-- النتائج -->
      <section class="dash-card">
        <div class="dash-card-head">
          <h3>نتائج الطلاب</h3>
          <span class="dash-chip">{{ rows.length }} طالبًا</span>
        </div>
        <div class="hm-filters">
          <label class="gr-search"><Search :size="16" /><input v-model.trim="q" type="search" placeholder="بحث بالطالب أو الشعبة أو المشروع…"></label>
          <select v-model="f.degree" class="gr-select" aria-label="الدرجة"><option value="">دبلوم وبكالوريوس</option><option v-for="(l, k) in DEGREES" :key="k" :value="k">{{ l }}</option></select>
          <select v-model="f.gender" class="gr-select" aria-label="الفئة"><option value="">طلاب وطالبات</option><option value="male">طلاب</option><option value="female">طالبات</option></select>
          <select v-model="f.featured" class="gr-select" aria-label="التمييز"><option value="">مميّز وغير مميّز</option><option value="yes">مشروع مميّز</option><option value="no">غير مميّز</option></select>
          <select v-model="f.region" class="gr-select" aria-label="المكان"><option value="">غزة والجنوب</option><option v-for="(l, k) in REGIONS" :key="k" :value="k">{{ l }}</option></select>
          <button v-if="hasFilters" type="button" class="gr-clear" @click="clearFilters">مسح الفلاتر</button>
        </div>

        <div class="pt-wrap">
          <table class="pt">
            <thead>
              <tr>
                <th>الطالب</th><th>الشعبة / المشروع</th><th>الدرجة</th><th>الفئة</th><th>المكان</th>
                <th v-for="c in criteria" :key="c.name" class="ev-crit">{{ c.name }} <span class="pt-muted">/{{ c.weight }}</span></th>
                <th>المجموع</th><th>التقدير</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="r in rows" :key="r.id">
                <td class="pt-strong">{{ r.name }}</td>
                <td><span class="d-block">{{ r.section }}</span><span class="pt-muted">{{ r.project }}<Star v-if="r.featured" :size="13" fill="currentColor" class="ev-star" /></span></td>
                <td>{{ DEGREES[r.degree] }}</td>
                <td>{{ r.gender === 'female' ? 'طالبة' : 'طالب' }}</td>
                <td>{{ REGIONS[r.region] }}</td>
                <td v-for="c in criteria" :key="c.name" class="mono">{{ Math.round((c.weight * r.score) / 100) }}</td>
                <td><b>{{ r.score }}</b></td>
                <td><span :class="['rv-pill', r.score >= 80 ? 'is-approved' : r.score >= 70 ? 'is-pending' : 'is-rejected']">{{ grade(r.score) }}</span></td>
              </tr>
              <tr v-if="!rows.length"><td :colspan="7 + criteria.length" class="gr-empty">{{ loading ? 'جارٍ التحميل…' : 'لا توجد نتائج مطابقة' }}</td></tr>
            </tbody>
          </table>
        </div>
      </section>
    </div>
  </div>
</template>

<script>
import { Search, Plus, X, Star } from 'lucide-vue-next'
import { DEGREES, REGIONS } from '@/utils/progressData'
import api from '@/services/api'

const GRADES = [[90, 'ممتاز'], [80, 'جيد جدًا'], [70, 'جيد'], [60, 'مقبول'], [0, 'راسب']]

export default {
  name: 'EvaluationsPage',

  components: { Search, Plus, X, Star },

  data() {
    return {
      DEGREES, REGIONS,
      criteria: [
        { name: 'العرض والتقديم', weight: 20 },
        { name: 'جودة المنتج والتنفيذ', weight: 30 },
        { name: 'التوثيق والتقرير', weight: 20 },
        { name: 'الإجابة على الأسئلة', weight: 20 },
        { name: 'العمل الجماعي', weight: 10 }
      ],
      results: [],
      loading: true,
      q: '',
      f: { degree: '', gender: '', featured: '', region: '' }
    }
  },

  computed: {
    totalWeight() {
      return this.criteria.reduce((n, c) => n + (Number(c.weight) || 0), 0)
    },
    /** نتائج التقييمات من الخادم (GET /evaluations) */
    students() {
      return this.results.map((e) => ({
        id: e.id,
        name: e.student?.name || '—',
        gender: e.student?.gender,
        region: e.student?.region,
        section: e.team?.section || e.team?.name || '',
        project: e.project?.name || '—',
        featured: !!e.project?.is_featured,
        degree: e.degree,
        score: e.score ?? 0,
        notes: e.notes,
        groupId: e.team?.id
      }))
    },
    rows() {
      const { degree, gender, featured, region } = this.f
      return this.students
        .filter((s) =>
          (!this.q || `${s.name} ${s.section} ${s.project}`.includes(this.q)) &&
          (!degree || s.degree === degree) && (!gender || s.gender === gender) &&
          (!featured || (featured === 'yes') === !!s.featured) && (!region || s.region === region)
        )
        .sort((a, b) => b.score - a.score)
    },
    groupsCount() {
      return new Set(this.rows.map((r) => r.groupId)).size
    },
    avg() {
      return this.rows.length ? Math.round(this.rows.reduce((n, r) => n + r.score, 0) / this.rows.length) : '—'
    },
    top() {
      return this.rows[0]
    },
    hasFilters() {
      return !!this.q || Object.values(this.f).some(Boolean)
    }
  },

  async created() {
    try {
      const { data } = await api.get('/evaluations')
      this.results = data.data || data
    } catch {
      this.$toast?.error('تعذّر تحميل نتائج التقييمات')
    } finally {
      this.loading = false
    }
  },

  methods: {
    grade(score) {
      return GRADES.find(([min]) => score >= min)[1]
    },
    gradeCount(label) {
      return this.rows.filter((r) => this.grade(r.score) === label).length
    },
    clearFilters() {
      this.q = ''
      this.f = { degree: '', gender: '', featured: '', region: '' }
    }
  }
}
</script>
