<template>
  <!-- مخطط تقدّم الفرق للإدارة العامة — تفاعل المشرفين + تقدّم المجموعات وطلابها -->
  <div class="dash">
    <header class="dash-head">
      <div>
        <h2 class="dash-title">تقدّم المشاريع</h2>
      </div>
      <button type="button" class="pbtn is-cyan" :disabled="loading || exporting" @click="exportPdf"><FileDown :size="16" /> {{ exporting ? 'جارٍ التصدير…' : 'تصدير PDF' }}</button>
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
      <SlideTable v-else-if="tab === 'sup'" :rows="supRows" :label="'المشرفون'">
        <template #default="{ rows: shown }">
          <div class="pt-wrap">
            <table class="pt">
              <thead><tr><th>المشرف</th><th>المجموعات</th><th>الطلاب</th><th>المهام الموكلة</th><th>المنجزة</th><th>المتأخرة</th><th>الاجتماعات</th><th>الملاحظات</th><th>الملفات</th><th>التفاعل</th></tr></thead>
              <tbody>
                <template v-for="s in shown" :key="s.id">
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
        </template>
        <template #after>
          <div class="gr-sumbar">
            <span>عدد المشرفين: {{ supRows.length }}</span>
            <span>المجموعات: {{ supRows.reduce((n, s) => n + s.groups.length, 0) }}</span>
            <span>الطلاب: {{ supRows.reduce((n, s) => n + s.students, 0) }}</span>
            <span>المهام المنجزة: {{ supRows.reduce((n, s) => n + (s.stats?.done || 0), 0) }} / {{ supRows.reduce((n, s) => n + (s.stats?.tasks || 0), 0) }}</span>
            <span>متوسط التفاعل: {{ avgOf(supRows.map((s) => s.stats?.activity).filter((x) => x != null)) }}%</span>
          </div>
        </template>
      </SlideTable>

      <!-- المجموعات والطلاب -->
      <SlideTable v-else :rows="grpRows" :label="'المجموعات'">
        <template #default="{ rows: shown }">
          <div class="pt-wrap">
            <table class="pt">
              <thead><tr><th>المجموعة</th><th>المشرف</th><th>المهام (منجزة/موكلة)</th><th>المتأخرة</th><th>الإنجاز</th></tr></thead>
              <tbody>
                <template v-for="g in shown" :key="g.id">
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
        </template>
        <template #after>
          <div class="gr-sumbar">
            <span>عدد المجموعات: {{ grpRows.length }}</span>
            <span>الطلاب: {{ grpRows.reduce((n, g) => n + g.members.length, 0) }}</span>
            <span>المهام المنجزة: {{ grpRows.reduce((n, g) => n + g.tasksDone, 0) }} / {{ grpRows.reduce((n, g) => n + g.tasksTotal, 0) }}</span>
            <span>متوسط الإنجاز: {{ avgOf(grpRows.map((g) => g.percentage)) }}%</span>
          </div>
        </template>
      </SlideTable>
    </section>
  </div>
</template>

<script>
import SlideTable from '@/components/ui/SlideTable.vue'
import { FileDown, Search } from 'lucide-vue-next'
import { escapeHtml } from '@/utils/exportReport'
import { exportTablePdf } from '@/utils/ucasReports'
import api from '@/services/api'
import { fetchGroups, level, TASK_STATUS } from '@/utils/progressData'
import { formatDate } from '@/utils/formatters'

export default {
  name: 'ProgressBoard',

  components: { SlideTable, FileDown, Search },

  data() {
    return { TASK_STATUS, tab: 'sup', groups: [], profiles: {}, tasks: {}, loading: true, q: '', supFilter: '', specFilter: '', degreeFilter: '', levelFilter: '', openSup: null, openGrp: null, exporting: false }
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

    avgOf(list) {
      return list.length ? Math.round(list.reduce((n, x) => n + x, 0) / list.length) : 0
    },

    /** وصف الفلترة المطبّقة لعنوان التقرير */
    filterLabel() {
      const sup = this.supervisors.find((s) => s.id === this.supFilter)?.name
      const deg = { diploma: 'دبلوم', bachelor: 'بكالوريوس' }[this.degreeFilter]
      const lvl = { low: 'إنجاز منخفض', mid: 'إنجاز متوسط', high: 'إنجاز مرتفع' }[this.levelFilter]
      return [this.specFilter, deg, this.tab === 'grp' && sup, this.tab === 'grp' && lvl, this.q && `بحث: ${this.q}`].filter(Boolean).join(' · ')
    },

    /** تصدير PDF بترويسة الكلية للتبويب الحالي (المشرفون أو المجموعات) حسب الفلترة */
    async exportPdf() {
      this.exporting = true
      const e = escapeHtml
      try {
        if (this.tab === 'sup') {
          await exportTablePdf({
            fileName: `تقدم المشاريع - المشرفون${this.filterLabel() ? ' - ' + this.filterLabel() : ''}.pdf`,
            title: 'تقرير تقدّم المشاريع — تفاعل المشرفين',
            filterLabel: this.filterLabel(),
            landscape: true,
            perPage: 12,
            head: [{ label: 'المشرف' }, { label: 'المجموعات', width: 80 }, { label: 'الطلاب', width: 70 }, { label: 'المهام المنجزة/الموكلة', width: 130 }, { label: 'المتأخرة', width: 80 }, { label: 'الاجتماعات', width: 85 }, { label: 'الملاحظات', width: 80 }, { label: 'الملفات', width: 70 }, { label: 'التفاعل', width: 80 }],
            rows: this.supRows.map((s) => [
              `<b>${e(s.name)}</b>`, s.groups.length, s.students,
              s.stats ? `<span dir="ltr">${s.stats.done}/${s.stats.tasks}</span>` : '—', s.late ?? '—',
              s.stats?.meetings ?? '—', s.stats?.notes ?? '—', s.stats?.files ?? '—', s.stats ? `${s.stats.activity}%` : '—'
            ])
          })
        } else {
          await exportTablePdf({
            fileName: `تقدم المشاريع - المجموعات${this.filterLabel() ? ' - ' + this.filterLabel() : ''}.pdf`,
            title: 'تقرير تقدّم المشاريع — المجموعات والطلاب',
            filterLabel: this.filterLabel(),
            perPage: 14,
            head: [{ label: 'الشعبة', width: 60 }, { label: 'المجموعة والمشروع' }, { label: 'المشرف', width: 110 }, { label: 'المهام', width: 70 }, { label: 'المتأخرة', width: 66 }, { label: 'الإنجاز', width: 66 }],
            rows: this.grpRows.map((g) => [
              e(g.section || '—'), `<b>${e(g.name)}</b><br><span style="font-size:12px; color:#444;">${e(g.project?.name || 'بلا مشروع')}</span>`,
              e(g.sup.name), `<span dir="ltr">${g.tasksDone}/${g.tasksTotal}</span>`, this.lateOf(g.id) ?? '—', `<b>${g.percentage}%</b>`
            ])
          })
        }
        this.$toast?.success('تم تصدير التقرير PDF')
      } catch {
        this.$toast?.error('تعذّر تصدير التقرير')
      } finally {
        this.exporting = false
      }
    },

    lateClass(n) {
      return n ? 'pb-late' : ''
    }
  }
}
</script>
