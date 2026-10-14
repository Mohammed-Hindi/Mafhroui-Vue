<template>
  <!-- الرئيسية للمشرف بنمط رئيسية الإدارة العامة (لوحة مؤشرات، لا سجل): إحصاءات مجموعاته ← مهام مجموعاته + رسم حالتها
       ← المجموعات التي تحتاج متابعة (الأقل إنجازًا / المتأخرة). البيانات: GET /progress (مجموعاته فقط) + GET /teams/{id}/tasks -->
  <div class="dash hd-page">
    <header class="dash-head">
      <h2 class="dash-title">الرئيسية</h2>
    </header>

    <section class="hm-stats" aria-label="إحصاءات مجموعاتي">
      <div v-for="s in stats" :key="s.label" class="hm-stat">
        <span class="hm-stat-label">{{ s.label }}</span>
        <span class="hm-stat-value">{{ s.value }}</span>
        <span class="hm-stat-split">
          <template v-for="(p, i) in s.split" :key="p.label"><span v-if="i" class="hm-sep">·</span>{{ p.label }} <b>{{ p.value }}</b></template>
        </span>
      </div>
    </section>

    <div class="hm-grid">
      <section class="dash-card">
        <div class="dash-card-head">
          <h3>مهام مجموعاتي</h3>
          <div class="hm-filters hm-filters-inline">
            <select v-model="fSpec" class="gr-select" aria-label="التخصص" @change="taskGroup = ''">
              <option value="">كل التخصصات</option>
              <option v-for="s in specs" :key="s" :value="s">{{ s }}</option>
            </select>
            <select v-model="fGender" class="gr-select" aria-label="الجنس" @change="taskGroup = ''">
              <option value="">طلاب وطالبات</option>
              <option value="male">طلاب</option>
              <option value="female">طالبات</option>
            </select>
          </div>
        </div>
        <div class="hm-table-wrap hm-scroll">
          <table class="hm-table">
            <thead><tr><th>المهمة</th><th>المجموعة</th><th>المكلّفون</th><th>تاريخ الإصدار</th><th>موعد التسليم</th><th>الحالة</th></tr></thead>
            <tbody>
              <tr v-for="t in taskRows" :key="t.id" class="is-link" @click="taskGroup = t.groupId">
                <td class="hm-strong">{{ t.title }}</td>
                <td class="hm-muted ad-nowrap">{{ t.group }}</td>
                <td class="hm-muted ad-nowrap">{{ t.assignees }}</td>
                <td><span class="mono">{{ t.issued }}</span></td>
                <td><span class="mono">{{ t.due }}</span></td>
                <td><span :class="['rv-pill', STATE[t.state].pill]">{{ STATE[t.state].label }}</span></td>
              </tr>
              <tr v-if="!taskRows.length"><td colspan="6" class="gr-empty">{{ loading ? 'جارٍ التحميل…' : 'لا توجد مهام' }}</td></tr>
            </tbody>
          </table>
        </div>
        <p class="hm-count">{{ taskRows.length }} مهمة</p>
        <p class="hm-hint">اضغط على أي مهمة لعرض مهام مجموعتها وتحديث الرسم البياني.</p>
      </section>

      <section class="dash-card">
        <div class="dash-card-head">
          <h3>حالة المهام</h3>
          <span class="dash-chip">{{ taskGroup ? groups.find((g) => g.id === taskGroup)?.name : 'كل المجموعات' }}</span>
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

    <section class="dash-card">
      <div class="dash-card-head">
        <h3>مجموعات تحتاج متابعتك</h3>
        <router-link :to="{ name: 'supervisor-teams' }" class="pbtn is-outline is-sm">كل المجموعات</router-link>
      </div>
      <div class="hm-table-wrap">
        <table class="hm-table">
          <thead><tr><th>المجموعة</th><th>المشروع</th><th>المهام المتأخرة</th><th>الإنجاز</th></tr></thead>
          <tbody>
            <tr v-for="g in followUp" :key="g.id" class="is-link" @click="taskGroup = g.id">
              <td class="hm-strong">{{ g.name }}</td>
              <td class="hm-muted">{{ g.project }}</td>
              <td><span :class="['rv-pill', g.late ? 'is-rejected' : 'is-approved']">{{ g.late }}</span></td>
              <td class="sh-progress">
                <span class="gr-progress"><span :class="level(g.percentage)" :style="{ width: g.percentage + '%' }" /></span>
                <span class="gr-pct">{{ g.percentage }}%</span>
              </td>
            </tr>
            <tr v-if="!followUp.length"><td colspan="4" class="gr-empty">{{ loading ? 'جارٍ التحميل…' : 'كل مجموعاتك منتظمة — لا متأخرات وإنجاز فوق 35%' }}</td></tr>
          </tbody>
        </table>
      </div>
    </section>
  </div>
</template>

<script>
import api from '@/services/api'
import { groupGender, loadGroups, normalizeTasks } from '@/services/adminData'
import { level } from '@/utils/progressData'

const STATE = {
  done: { label: 'مكتملة', pill: 'is-approved' },
  open: { label: 'غير مكتملة', pill: 'is-pending' },
  late: { label: 'متأخرة', pill: 'is-rejected' }
}
const pct = (a, b) => (b ? Math.round((a / b) * 100) : 0)

export default {
  name: 'SupervisorHomePage',

  data() {
    return { STATE, groups: [], tasks: [], loading: true, taskGroup: '', fSpec: '', fGender: '' }
  },

  computed: {
    stats() {
      const g = this.groups
      const n = (fn) => g.filter(fn).length
      const students = g.flatMap((x) => x.members)
      const avg = g.length ? Math.round(g.reduce((s, x) => s + x.percentage, 0) / g.length) : 0
      return [
        { label: 'مجموعاتي', value: g.length, split: [{ label: 'دبلوم', value: n((x) => x.degree === 'diploma') }, { label: 'بكالوريوس', value: n((x) => x.degree === 'bachelor') }] },
        { label: 'الطلاب', value: students.length, split: [{ label: 'طلاب', value: students.filter((m) => m.gender !== 'female').length }, { label: 'طالبات', value: students.filter((m) => m.gender === 'female').length }] },
        { label: 'المهام', value: this.tasks.length, split: [{ label: 'منجزة', value: this.tasks.filter((t) => t.state === 'done').length }, { label: 'متأخرة', value: this.tasks.filter((t) => t.state === 'late').length }] },
        { label: 'متوسط الإنجاز', value: `${avg}%`, split: [{ label: 'مرتفع', value: n((x) => x.percentage >= 70) }, { label: 'منخفض', value: n((x) => x.percentage < 35) }] }
      ]
    },
    specs() {
      return [...new Set(this.groups.map((g) => g.spec).filter(Boolean))]
    },
    /** مهام المجموعة المضغوطة، أو مهام مجموعات التخصص والجنس المختارين */
    filteredTasks() {
      const ok = new Set(this.groups.filter((g) => (!this.fSpec || g.spec === this.fSpec) && (!this.fGender || groupGender(g) === this.fGender)).map((g) => g.id))
      return this.tasks.filter((t) => (this.taskGroup ? t.groupId === this.taskGroup : ok.has(t.groupId)))
    },
    taskRows() {
      return this.filteredTasks
        .map((t) => ({ ...t, group: this.groups.find((x) => x.id === t.groupId)?.name || '—', assignees: t.assigneeNames.join('، ') || 'كل الفريق' }))
        .sort((a, b) => b.issued.localeCompare(a.issued))
    },
    chart() {
      const list = this.filteredTasks
      return ['done', 'open', 'late'].map((key) => ({ key, label: STATE[key].label, count: list.filter((t) => t.state === key).length }))
    },
    chartPct() {
      return pct(this.chart[0].count, this.chart.reduce((n, c) => n + c.count, 0))
    },
    donutBg() {
      const total = this.chart.reduce((n, c) => n + c.count, 0)
      if (!total) return 'var(--color-border)'
      let at = 0
      const stops = this.chart.map((c) => {
        const from = at
        at += (c.count / total) * 100
        return `var(--hm-c-${c.key}) ${from}% ${at}%`
      })
      return `conic-gradient(${stops.join(', ')})`
    },
    /** متأخرات أو إنجاز منخفض (أقل من 35%) — الأكثر تأخرًا ثم الأقل إنجازًا */
    followUp() {
      return this.groups
        .map((g) => ({ ...g, late: this.tasks.filter((t) => t.groupId === g.id && t.state === 'late').length }))
        .filter((g) => g.late || g.percentage < 35)
        .sort((a, b) => b.late - a.late || a.percentage - b.percentage)
    }
  },

  async created() {
    try {
      this.groups = await loadGroups()
      const lists = await Promise.allSettled(this.groups.map((g) => api.get(`/teams/${g.id}/tasks`)))
      this.tasks = lists.flatMap((r, i) => normalizeTasks((r.value?.data?.data || r.value?.data || []).map((t) => ({ ...t, team_id: t.team_id ?? this.groups[i].id }))))
    } catch {
      this.$toast?.error('تعذّر تحميل بيانات الرئيسية')
    } finally {
      this.loading = false
    }
  },

  methods: { level }
}
</script>
