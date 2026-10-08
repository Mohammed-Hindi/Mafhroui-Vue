<template>
  <!-- مخطط تقدّم الفرق للإدارة العامة — تفاعل المشرفين + تقدّم المجموعات وطلابها -->
  <div class="dash">
    <header class="dash-head">
      <div>
        <h2 class="dash-title">تقدّم المشاريع</h2>
        <p class="dash-sub">تفاعل المشرفين مع مجموعاتهم، وإنجاز كل مجموعة وطالب في المهام الموكلة</p>
      </div>
      <slot name="actions" />
    </header>

    <nav class="rv-tabs" aria-label="العرض">
      <button type="button" :class="['rv-tab', tab === 'sup' && 'is-active']" @click="tab = 'sup'">المشرفون <span class="rv-count">{{ supervisors.length }}</span></button>
      <button type="button" :class="['rv-tab', tab === 'grp' && 'is-active']" @click="tab = 'grp'">المجموعات والطلاب <span class="rv-count">{{ groups.length }}</span></button>
    </nav>

    <section class="dash-card">
      <div class="hm-filters">
        <label class="gr-search">
          <Search :size="16" />
          <input v-model.trim="q" type="search" :placeholder="tab === 'sup' ? 'بحث باسم المشرف…' : 'بحث بالمجموعة أو الطالب أو المشرف…'">
        </label>
        <select v-if="tab === 'grp'" v-model="supFilter" class="gr-select" aria-label="المشرف">
          <option value="">كل المشرفين</option>
          <option v-for="s in supervisors" :key="s.id" :value="s.id">{{ s.name }}</option>
        </select>
        <select v-model="specFilter" class="gr-select" aria-label="التخصص">
          <option value="">كل التخصصات</option>
          <option v-for="s in specs" :key="s" :value="s">{{ s }}</option>
        </select>
        <select v-model="degreeFilter" class="gr-select" aria-label="الدرجة">
          <option value="">كل الدرجات</option>
          <option value="diploma">دبلوم</option>
          <option value="bachelor">بكالوريوس</option>
        </select>
        <select v-if="tab === 'grp'" v-model="levelFilter" class="gr-select" aria-label="مستوى الإنجاز">
          <option value="">كل المستويات</option>
          <option value="low">إنجاز منخفض (أقل من 35%)</option>
          <option value="mid">متوسط (35–69%)</option>
          <option value="high">مرتفع (70% فأكثر)</option>
        </select>
        <button v-if="q || supFilter || specFilter || degreeFilter || levelFilter" type="button" class="gr-clear" @click="q = ''; supFilter = ''; specFilter = ''; degreeFilter = ''; levelFilter = ''">مسح الفلاتر</button>
      </div>

      <p v-if="loading" class="pt-muted">جارٍ التحميل…</p>

      <!-- المشرفون -->
      <div v-else-if="tab === 'sup'" class="pt-wrap">
        <table class="pt">
          <thead><tr><th>المشرف</th><th>المجموعات</th><th>الطلاب</th><th>المهام الموكلة</th><th>المنجزة</th><th>المتأخرة</th><th>الاجتماعات</th><th>الملاحظات</th><th>الملفات</th><th>التفاعل</th></tr></thead>
          <tbody>
            <template v-for="s in supRows" :key="s.id">
              <tr :class="['is-link', openSup === s.id && 'is-open']" @click="toggleSup(s)">
                <td class="pt-strong">{{ s.name }}</td>
                <td>{{ s.groups.length }}</td>
                <td>{{ s.students }}</td>
                <td>{{ s.stats ? s.stats.tasks : '…' }}</td>
                <td>{{ s.stats ? s.stats.done : '…' }}</td>
                <td><span :class="lateClass(s.late)">{{ s.late ?? '—' }}</span></td>
                <td>{{ s.stats ? s.stats.meetings : '…' }}</td>
                <td>{{ s.stats ? s.stats.notes : '…' }}</td>
                <td>{{ s.stats ? s.stats.files : '…' }}</td>
                <td>
                  <template v-if="s.stats">
                    <span class="gr-progress"><span :class="level(s.stats.activity)" :style="{ width: s.stats.activity + '%' }" /></span>
                    <span class="gr-pct">{{ s.stats.activity }}%</span>
                  </template>
                  <span v-else class="pt-muted">…</span>
                </td>
              </tr>
              <tr v-if="openSup === s.id" class="pt-sub">
                <td colspan="10">
                  <table class="ev-students">
                    <thead><tr><th>المجموعة</th><th>المشروع</th><th>المهام</th><th>المتأخرة</th><th>الاجتماعات</th><th>تفاعل المشرف</th></tr></thead>
                    <tbody>
                      <tr v-for="t in s.profileTeams" :key="t.team.id">
                        <td class="pt-strong">{{ t.team.name }}<span v-if="t.team.section" class="pt-muted"> · شعبة {{ t.team.section }}</span></td>
                        <td class="pt-muted">{{ t.project?.name || '—' }}</td>
                        <td><span class="mono">{{ t.interaction.tasks_done }}/{{ t.interaction.tasks_total }}</span></td>
                        <td><span :class="lateClass(lateOf(t.team.id))">{{ lateOf(t.team.id) ?? '…' }}</span></td>
                        <td>{{ t.interaction.meetings_count }}</td>
                        <td>
                          <span class="gr-progress is-sm"><span :class="level(t.interaction.activity_score)" :style="{ width: t.interaction.activity_score + '%' }" /></span>
                          <span class="gr-pct">{{ t.interaction.activity_score }}%</span>
                        </td>
                      </tr>
                      <tr v-if="!s.profileTeams.length"><td colspan="6" class="pt-muted">{{ s.stats ? 'لا توجد مجموعات' : 'جارٍ التحميل…' }}</td></tr>
                    </tbody>
                  </table>
                </td>
              </tr>
            </template>
          </tbody>
        </table>
      </div>

      <!-- المجموعات والطلاب -->
      <div v-else class="pt-wrap">
        <table class="pt">
          <thead><tr><th>المجموعة</th><th>المشرف</th><th>المهام (منجزة/موكلة)</th><th>المتأخرة</th><th>الإنجاز</th></tr></thead>
          <tbody>
            <template v-for="g in grpRows" :key="g.id">
              <tr :class="['is-link', openGrp === g.id && 'is-open']" @click="toggleGrp(g)">
                <td><span class="pt-strong">{{ g.name }}</span><span class="pt-muted d-block">{{ g.section ? 'شعبة ' + g.section + ' · ' : '' }}{{ g.project?.name || 'بلا مشروع' }}</span></td>
                <td>{{ g.sup.name }}</td>
                <td><span class="mono">{{ g.tasksDone }}/{{ g.tasksTotal }}</span></td>
                <td><span :class="lateClass(lateOf(g.id))">{{ lateOf(g.id) ?? '—' }}</span></td>
                <td>
                  <span class="gr-progress"><span :class="level(g.percentage)" :style="{ width: g.percentage + '%' }" /></span>
                  <span class="gr-pct">{{ g.percentage }}%</span>
                </td>
              </tr>
              <tr v-if="openGrp === g.id" class="pt-sub">
                <td colspan="5">
                  <table class="ev-students">
                    <thead><tr><th>الطالب</th><th>الموكلة</th><th>المنجزة</th><th>المتأخرة</th><th>نسبة الإنجاز</th></tr></thead>
                    <tbody>
                      <tr v-for="m in g.members" :key="m.id">
                        <td class="pt-strong">{{ m.name }}</td>
                        <td>{{ m.total }}</td>
                        <td>{{ m.done }}</td>
                        <td><span :class="lateClass(studentLate(g.id, m.id))">{{ studentLate(g.id, m.id) ?? '…' }}</span></td>
                        <td>
                          <span class="gr-progress"><span :class="level(m.percentage)" :style="{ width: m.percentage + '%' }" /></span>
                          <span class="gr-pct">{{ m.percentage }}%</span>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                  <ul v-if="tasks[g.id]?.length" class="pb-tasks">
                    <li v-for="t in tasks[g.id]" :key="t.id">
                      <span :class="['rv-pill', t.status === 'done' ? 'is-approved' : isLate(t) ? 'is-rejected' : 'is-pending']">{{ isLate(t) ? 'متأخرة' : TASK_STATUS[t.status] || t.status }}</span>
                      <b>{{ t.title }}</b>
                      <span class="pt-muted">{{ (t.assignees || []).map((a) => a.name).join('، ') || 'كل الفريق' }}<template v-if="t.due_date"> · التسليم {{ formatDate(t.due_date) }}</template></span>
                    </li>
                  </ul>
                </td>
              </tr>
            </template>
            <tr v-if="!grpRows.length"><td colspan="5" class="gr-empty">لا توجد مجموعات مطابقة</td></tr>
          </tbody>
        </table>
      </div>
    </section>
  </div>
</template>

<script>
import { Search } from 'lucide-vue-next'
import api from '@/services/api'
import { fetchGroups, level, TASK_STATUS } from '@/utils/progressData'
import { formatDate } from '@/utils/formatters'

export default {
  name: 'ProgressBoard',

  components: { Search },

  data() {
    return { TASK_STATUS, tab: 'sup', groups: [], profiles: {}, tasks: {}, loading: true, q: '', supFilter: '', specFilter: '', degreeFilter: '', levelFilter: '', openSup: null, openGrp: null }
  },

  computed: {
    supervisors() {
      const map = new Map()
      this.groups.forEach((g) => {
        if (!g.sup.id) return
        if (!map.has(g.sup.id)) map.set(g.sup.id, { id: g.sup.id, name: g.sup.name, groups: [], students: 0 })
        const s = map.get(g.sup.id)
        s.groups.push(g)
        s.students += g.members.length
      })
      return [...map.values()].map((s) => {
        const p = this.profiles[s.id]
        const teams = p?.interaction?.teams || []
        const sum = (k) => teams.reduce((n, t) => n + (t.interaction[k] || 0), 0)
        const lates = s.groups.map((g) => this.lateOf(g.id))
        return {
          ...s,
          profileTeams: teams,
          stats: p ? { tasks: sum('tasks_total'), done: sum('tasks_done'), meetings: sum('meetings_count'), notes: sum('notes_count'), files: sum('files_count'), activity: Math.round(p.interaction?.average_activity ?? 0) } : null,
          late: lates.every((x) => x !== null) ? lates.reduce((n, x) => n + x, 0) : null
        }
      })
    },
    specs() {
      return [...new Set(this.groups.map((g) => g.spec).filter(Boolean))]
    },
    /** المشرف يظهر إن كانت له مجموعة واحدة على الأقل تطابق التخصص/الدرجة */
    supRows() {
      return this.supervisors.filter((s) =>
        (!this.q || s.name.includes(this.q)) &&
        s.groups.some((g) => (!this.specFilter || g.spec === this.specFilter) && (!this.degreeFilter || g.degree === this.degreeFilter))
      )
    },
    grpRows() {
      return this.groups.filter((g) =>
        (!this.q || `${g.name} ${g.sup.name} ${g.members.map((m) => m.name).join(' ')}`.includes(this.q)) &&
        (!this.supFilter || g.sup.id === this.supFilter) &&
        (!this.specFilter || g.spec === this.specFilter) &&
        (!this.degreeFilter || g.degree === this.degreeFilter) &&
        (!this.levelFilter || level(g.percentage) === 'is-' + this.levelFilter)
      )
    }
  },

  async created() {
    try {
      this.groups = await fetchGroups()
    } finally {
      this.loading = false
    }
    this.supervisors.forEach((s) => this.loadProfile(s.id))
  },

  methods: {
    formatDate,
    level,

    async loadProfile(id) {
      try {
        const { data } = await api.get(`/supervisors/${id}/profile`)
        this.profiles = { ...this.profiles, [id]: data }
      } catch {
        // بلا بيانات تفاعل
      }
    },

    async loadTasks(teamId) {
      if (this.tasks[teamId]) return
      try {
        const { data } = await api.get(`/teams/${teamId}/tasks`)
        this.tasks = { ...this.tasks, [teamId]: data.data || data }
      } catch {
        this.tasks = { ...this.tasks, [teamId]: [] }
      }
    },

    toggleSup(s) {
      this.openSup = this.openSup === s.id ? null : s.id
      if (this.openSup) s.groups.forEach((g) => this.loadTasks(g.id))
    },

    toggleGrp(g) {
      this.openGrp = this.openGrp === g.id ? null : g.id
      if (this.openGrp) this.loadTasks(g.id)
    },

    isLate(t) {
      return t.status !== 'done' && t.due_date && new Date(t.due_date) < new Date()
    },

    lateOf(teamId) {
      const list = this.tasks[teamId]
      return list ? list.filter(this.isLate).length : null
    },

    /** المهام المتأخرة للطالب: المكلّف بها صراحة، أو مهام الفريق كله إن لم يُحدَّد مكلّفون */
    studentLate(teamId, studentId) {
      const list = this.tasks[teamId]
      if (!list) return null
      return list.filter((t) => this.isLate(t) && (!(t.assignees || []).length || t.assignees.some((a) => a.id === studentId))).length
    },

    lateClass(n) {
      return n ? 'pb-late' : ''
    }
  }
}
</script>
