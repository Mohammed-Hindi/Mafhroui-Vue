<template>
  <!-- الرئيسية للإدارة العامة — بيانات تجريبية (placeholder) بلا ربط بالخادم:
       الإحصاءات ← نشاط المشرفين والمجموعات (بحث + فلاتر + بروفايل) ← مهام وتكليفات كل مجموعة + الرسم البياني -->
  <div class="dash">
    <header class="dash-head">
      <h2 class="dash-title">الرئيسية</h2>
    </header>

    <!-- الإحصاءات -->
    <section class="hm-stats" aria-label="إحصاءات عامة">
      <div v-for="s in stats" :key="s.label" class="hm-stat">
        <span class="hm-stat-label">{{ s.label }}</span>
        <span class="hm-stat-value">{{ s.value }}</span>
        <span class="hm-stat-split">
          <template v-for="(p, i) in s.split" :key="p.label"><span v-if="i" class="hm-sep">·</span>{{ p.label }} <b>{{ p.value }}</b></template>
        </span>
      </div>
    </section>

    <!-- نشاط المشرفين والمجموعات -->
    <section class="dash-card">
      <div class="dash-card-head">
        <h3>مدى نشاط المشرفين والطلاب</h3>
        <nav class="hm-tabs" aria-label="نوع القائمة">
          <button type="button" :class="tab === 'sup' && 'is-active'" @click="setTab('sup')">المشرفون <span>{{ supervisors.length }}</span></button>
          <button type="button" :class="tab === 'grp' && 'is-active'" @click="setTab('grp')">المجموعات <span>{{ groups.length }}</span></button>
        </nav>
      </div>

      <div class="hm-filters">
        <label class="gr-search">
          <Search :size="16" />
          <input v-model.trim="q" type="search" :placeholder="tab === 'sup' ? 'بحث باسم المشرف…' : 'بحث باسم المجموعة أو الطالب…'">
        </label>
        <select v-if="tab === 'sup'" v-model="specFilter" class="gr-select" aria-label="التخصص">
          <option value="">كل التخصصات</option>
          <option v-for="s in specOptions" :key="s" :value="s">{{ s }}</option>
        </select>
        <select v-else v-model="supFilter" class="gr-select" aria-label="المشرف">
          <option value="">كل المشرفين</option>
          <option v-for="s in supervisors" :key="s.id" :value="s.id">{{ s.name }}</option>
        </select>
        <select v-if="tab === 'grp'" v-model="genderFilter" class="gr-select" aria-label="طلاب / طالبات">
          <option value="">طلاب وطالبات</option>
          <option value="male">طلاب</option>
          <option value="female">طالبات</option>
        </select>
        <button v-if="tab === 'sup'" type="button" class="pbtn is-green hm-report" :disabled="exporting || !supRows.length" @click="exportSupReport">
          <Printer :size="17" /> {{ exporting ? 'جارٍ التجهيز…' : 'تقرير المشرفين PDF' }}
        </button>
      </div>

      <div class="hm-table-wrap">
        <table v-if="tab === 'sup'" class="hm-table">
          <thead><tr><th>المشرف</th><th>التخصص</th><th>المجموعات</th><th>الطلاب</th><th>التفاعل</th></tr></thead>
          <tbody>
            <tr v-for="s in supRows" :key="s.id" class="is-link" @click="openProfile('supervisor', s)">
              <td class="hm-strong">{{ s.name }}</td>
              <td class="hm-muted">{{ s.spec }}</td>
              <td>{{ s.groups.length }}</td>
              <td>{{ s.students }}</td>
              <td>
                <span class="gr-progress"><span :class="level(s.activity)" :style="{ width: s.activity + '%' }" /></span>
                <span class="gr-pct">{{ s.activity }}%</span>
              </td>
            </tr>
            <tr v-if="!supRows.length"><td colspan="5" class="gr-empty">لا يوجد مشرفون مطابقون</td></tr>
          </tbody>
        </table>

        <table v-else class="hm-table">
          <thead><tr><th>المجموعة / الطالب</th><th>المشرف</th><th>المهام</th><th>مستوى التقدّم</th></tr></thead>
          <tbody>
            <template v-for="g in grpRows" :key="g.id">
              <tr class="is-link" :aria-expanded="openGroup === g.id" @click="openGroup = openGroup === g.id ? null : g.id">
                <td class="hm-strong">
                  <ChevronDown :size="14" :class="['hm-caret', openGroup === g.id && 'is-open']" />
                  {{ g.name }} <span class="hm-muted">({{ g.shown.length }})</span>
                </td>
                <td class="hm-muted">{{ supName(g.supId) }}</td>
                <td><span class="mono">{{ g.done }}/{{ g.tasksTotal }}</span></td>
                <td>
                  <span class="gr-progress"><span :class="level(g.percentage)" :style="{ width: g.percentage + '%' }" /></span>
                  <span class="gr-pct">{{ g.percentage }}%</span>
                </td>
              </tr>
              <tr v-if="openGroup === g.id" class="hm-drop-row">
                <td colspan="4">
                  <div class="hm-drop">
                    <header class="hm-drop-head">
                      <div>
                        <b>{{ g.project }}</b>
                        <span>{{ g.spec }} · {{ DEGREES[g.degree] }} · المشرف: {{ supName(g.supId) }}</span>
                      </div>
                      <span class="dash-chip">{{ g.shown.length }} من {{ g.members.length }} طلاب</span>
                    </header>
                    <ul class="hm-drop-list">
                      <li v-for="m in g.shown" :key="m.id">
                        <button type="button" class="hm-member" @click="openProfile('student', m, g)">
                          <span class="hm-avatar" aria-hidden="true">{{ m.name.charAt(0) }}</span>
                          <span class="hm-member-info">
                            <b>{{ m.name }}</b>
                            <span><span class="mono">{{ m.uni }}</span> · {{ m.gender === 'female' ? 'طالبة' : 'طالب' }} · {{ REGIONS[m.region] }}</span>
                          </span>
                          <span class="hm-member-tasks">المهام <b class="mono">{{ m.done }}/{{ m.total }}</b></span>
                          <span class="hm-member-progress">
                            <span class="gr-progress"><span :class="level(m.percentage)" :style="{ width: m.percentage + '%' }" /></span>
                            <span class="gr-pct">{{ m.percentage }}%</span>
                          </span>
                        </button>
                      </li>
                    </ul>
                  </div>
                </td>
              </tr>
            </template>
            <tr v-if="!grpRows.length"><td colspan="4" class="gr-empty">لا توجد مجموعات مطابقة</td></tr>
          </tbody>
        </table>
      </div>
      <p class="hm-hint">{{ tab === 'sup' ? 'اضغط على المشرف لعرض البروفايل.' : 'اضغط على المجموعة لعرض طلابها، وعلى الطالب لعرض البروفايل.' }}</p>
    </section>

    <!-- المهام والتكليفات لكل مجموعة + الرسم البياني -->
    <div class="hm-grid">
      <section class="dash-card">
        <div class="dash-card-head">
          <h3>المهام والتكليفات</h3>
          <div class="hm-filters hm-filters-inline">
            <select v-model="taskGroup" class="gr-select" aria-label="المجموعة">
              <option value="">كل المجموعات</option>
              <option v-for="g in taskGroups" :key="g.id" :value="g.id">{{ g.name }}</option>
            </select>
            <select v-model="taskState" class="gr-select" aria-label="حالة المهمة">
              <option value="">كل الحالات</option>
              <option value="done">مكتملة</option>
              <option value="open">غير مكتملة</option>
              <option value="late">متأخرة</option>
            </select>
          </div>
        </div>
        <div class="hm-table-wrap">
          <table class="hm-table">
            <thead><tr><th>المهمة / التكليف</th><th>المجموعة</th><th>المشرف</th><th>المكلّفون</th><th>تاريخ الإصدار</th><th>موعد التسليم</th><th>الحالة</th></tr></thead>
            <tbody>
              <tr v-for="t in taskRows" :key="t.id" class="is-link" @click="taskGroup = t.groupId">
                <td class="hm-strong">{{ t.title }}</td>
                <td class="hm-muted">{{ t.group }}</td>
                <td class="hm-muted">{{ t.sup }}</td>
                <td class="hm-muted">{{ t.assignees }}</td>
                <td><span class="mono">{{ t.issued }}</span></td>
                <td><span class="mono">{{ t.due }}</span></td>
                <td><span :class="['rv-pill', STATE[t.state].pill]">{{ STATE[t.state].label }}</span></td>
              </tr>
              <tr v-if="!taskRows.length"><td colspan="7" class="gr-empty">لا توجد مهام</td></tr>
            </tbody>
          </table>
        </div>
        <p class="hm-hint">اضغط على أي مهمة لعرض مهام مجموعتها وتحديث الرسم البياني.</p>
      </section>

      <section class="dash-card">
        <div class="dash-card-head">
          <h3>حالة المهام</h3>
          <span class="dash-chip">{{ chartTitle }}</span>
        </div>
        <div class="hm-donut" role="img" :aria-label="chart.map((c) => `${c.label} ${c.count}`).join('، ')" :style="{ background: donutBg }">
          <span><b>{{ chartPct }}%</b>مكتملة</span>
        </div>
        <ul class="hm-legend">
          <li v-for="c in chart" :key="c.key">
            <span :class="['dash-dot', 'hm-c-' + c.key]" />{{ c.label }}
            <b>{{ c.count }}</b>
          </li>
        </ul>
      </section>
    </div>

    <ProfileModal v-model="profileOpen" :kind="profileKind" :person-id="profileId" :name="profileName" />
  </div>
</template>

<script>
import { ChevronDown, Search, Printer } from 'lucide-vue-next'
import api from '@/services/api'
import { exportSupervisorsPdf } from '@/utils/ucasReports'
import ProfileModal from '@/components/shared/ProfileModal.vue'
import { DEGREES, REGIONS } from '@/utils/progressData'
import { loadGroups, loadSupervisors, loadDashboardStats, normalizeTasks } from '@/services/adminData'

const STATE = {
  done: { label: 'مكتملة', pill: 'is-approved' },
  open: { label: 'غير مكتملة', pill: 'is-pending' },
  late: { label: 'متأخرة', pill: 'is-rejected' }
}

const pct = (a, b) => (b ? Math.round((a / b) * 100) : 0)

export default {
  name: 'PortalDashboard',

  components: { ChevronDown, Search, Printer, ProfileModal },

  data() {
    return {
      STATE, DEGREES, REGIONS,
      loading: true,
      groups: [],
      supList: [],
      raw: {},
      supActivity: {},
      tab: 'sup',
      q: '',
      specFilter: '',
      supFilter: '',
      genderFilter: '',
      openGroup: null,
      taskGroup: '',
      taskState: '',
      profileOpen: false,
      profileKind: 'student',
      profileId: null,
      profileName: '',
      exporting: false
    }
  },

  computed: {
    /** آخر المهام الموكلة (GET /committee/dashboard-stats → latest_tasks) */
    tasks() {
      return normalizeTasks(this.raw.latest_tasks)
    },

    supervisors() {
      return this.supList.map((s) => {
        const groups = this.groups.filter((g) => g.supId === s.id)
        const students = groups.reduce((n, g) => n + g.members.length, 0)
        // التفاعل من /supervisors/{id}/profile، وإلى أن يصل: متوسط تقدّم مجموعاته
        const fallback = groups.length ? Math.round(groups.reduce((n, g) => n + g.percentage, 0) / groups.length) : 0
        return { ...s, groups, students, activity: Math.round(this.supActivity[s.id] ?? fallback) }
      })
    },

    stats() {
      const assigned = this.groups.reduce((n, g) => n + g.members.length, 0)
      const total = Math.max(this.raw.students_count ?? assigned, assigned)
      const g = this.raw.students_by_gender || {}
      return [
        { label: 'المجموعات', value: this.groups.length, split: [{ label: 'المشاريع', value: this.raw.total_projects_this_term ?? this.groups.filter((x) => x.projectId).length }] },
        { label: 'الطلاب الكلي', value: total, split: [{ label: 'طلاب', value: g.male ?? 0 }, { label: 'طالبات', value: g.female ?? 0 }] },
        { label: 'المصنّفون على مجموعات', value: assigned, split: [{ label: 'غير مصنّفين', value: total - assigned }] },
        { label: 'المشرفون', value: this.supervisors.length, split: [{ label: 'التخصصات', value: this.specOptions.length }] }
      ]
    },

    specOptions() {
      return [...new Set(this.supList.map((s) => s.spec).filter(Boolean))]
    },

    supRows() {
      return this.supervisors
        .filter((s) => (!this.q || s.name.includes(this.q)) && (!this.specFilter || s.spec === this.specFilter))
        .sort((a, b) => b.activity - a.activity)
    },

    /** فلتر طلاب/طالبات يخفي غير المطابقين داخل المجموعة، والمجموعة الفارغة تختفي */
    grpRows() {
      return this.groups
        .map((g) => ({ ...g, shown: g.members.filter((m) => !this.genderFilter || m.gender === this.genderFilter) }))
        .filter((g) =>
          g.shown.length &&
          (!this.supFilter || g.supId === this.supFilter) &&
          (!this.q || `${g.name} ${g.members.map((s) => s.name).join(' ')}`.includes(this.q))
        )
    },

    taskGroups() {
      return this.groups.filter((g) => this.tasks.some((t) => t.groupId === g.id))
    },

    taskRows() {
      return this.tasks
        .filter((t) => (!this.taskGroup || t.groupId === this.taskGroup) && (!this.taskState || (this.taskState === 'open' ? t.state !== 'done' : t.state === this.taskState)))
        .map((t) => {
          const g = this.groups.find((x) => x.id === t.groupId)
          return { ...t, group: g?.name || '—', sup: g?.supName || '—', assignees: t.assigneeNames.join('، ') || 'كل الفريق' }
        })
        .sort((a, b) => b.issued.localeCompare(a.issued))
    },

    /** الرسم البياني يتبع المجموعة المختارة في فلتر المهام */
    chart() {
      const list = this.tasks.filter((t) => !this.taskGroup || t.groupId === this.taskGroup)
      return ['done', 'open', 'late'].map((key) => ({ key, label: STATE[key].label, count: list.filter((t) => t.state === key).length }))
    },

    chartTitle() {
      return this.taskGroup ? this.groups.find((g) => g.id === this.taskGroup)?.name : 'كل المجموعات'
    },

    chartPct() {
      const total = this.chart.reduce((n, c) => n + c.count, 0)
      return pct(this.chart[0].count, total)
    },

    donutBg() {
      const total = this.chart.reduce((n, c) => n + c.count, 0) || 1
      let at = 0
      const stops = this.chart.map((c) => {
        const from = at
        at += (c.count / total) * 100
        return `var(--hm-c-${c.key}) ${from}% ${at}%`
      })
      return `conic-gradient(${stops.join(', ')})`
    }
  },

  async created() {
    const [groups, raw] = await Promise.allSettled([loadGroups(), loadDashboardStats()])
    this.groups = groups.value || []
    this.raw = raw.value || {}
    this.supList = await loadSupervisors(this.groups)
    this.loading = false
    // متوسط تفاعل كل مشرف — طلب لكل مشرف بالتوازي
    this.supList.forEach(async (s) => {
      try {
        const { data } = await api.get(`/supervisors/${s.id}/profile`)
        this.supActivity = { ...this.supActivity, [s.id]: data.interaction?.average_activity ?? 0 }
      } catch {
        // يبقى متوسط تقدّم المجموعات
      }
    })
  },

  methods: {
    setTab(tab) {
      this.tab = tab
      this.q = ''
    },

    supName(id) {
      return this.supList.find((s) => s.id === id)?.name || '—'
    },

    openProfile(kind, row) {
      this.profileKind = kind
      this.profileId = row.id
      this.profileName = row.name
      this.profileOpen = true
    },

    /** تقرير PDF: كل مشرف (حسب البحث والتخصص) مع مجموعاته ونوع المشروع والدرجة والفئة والمكان */
    async exportSupReport() {
      this.exporting = true
      try {
        const ids = this.supRows.map((s) => s.id)
        await exportSupervisorsPdf(this.groups.filter((g) => ids.includes(g.supId)), this.supList)
      } finally {
        this.exporting = false
      }
    },

    level(p) {
      return p >= 70 ? 'is-high' : p >= 35 ? 'is-mid' : 'is-low'
    }
  }
}
</script>
