<template>
  <!-- تقدّم المشاريع — جدول موحّد للمجموعات، والمشرف/التخصص/الدرجة/الفئة/المستوى فلاتر متتالية منطقية.
       كل صف قابل للفتح: طلاب المجموعة ثم مهامها. العنوان من التوب بار فلا يتكرّر هنا. -->
  <div class="dash">
    <section class="gr gr-card">
      <!-- فلاتر مجتمعة ومتتالية + تصدير -->
      <div class="gr-filters" aria-label="تصفية تقدّم المشاريع">
        <label class="gr-search">
          <Search :size="16" />
          <input :value="f.q" type="search" :placeholder="isSup ? 'بحث بالمجموعة أو الطالب أو المشروع…' : 'بحث بالمجموعة أو الطالب أو المشرف أو المشروع…'" @input="onSearch($event.target.value)">
        </label>
        <label v-if="!isSup" class="gr-pick">
          <select :value="f.sup" class="gr-select" aria-label="المشرف" @change="setF('sup', $event.target.value)">
            <option value="">كل المشرفين</option>
            <option v-for="s in supOptions" :key="s.id" :value="s.id">{{ s.name }}</option>
          </select>
        </label>
        <label class="gr-pick">
          <select :value="f.spec" class="gr-select" aria-label="التخصص" @change="setF('spec', $event.target.value)">
            <option value="">كل التخصصات</option>
            <option v-for="s in specOptions" :key="s" :value="s">{{ s }}</option>
          </select>
        </label>
        <label v-if="!isSup" class="gr-pick">
          <select :value="f.degree" class="gr-select" aria-label="الدرجة" @change="setF('degree', $event.target.value)">
            <option value="">كل الدرجات</option>
            <option v-for="d in degreeOptions" :key="d.value" :value="d.value">{{ d.label }}</option>
          </select>
        </label>
        <label class="gr-pick">
          <select :value="f.gender" class="gr-select" aria-label="الفئة" @change="setF('gender', $event.target.value)">
            <option v-for="g in genderOptions" :key="g.value" :value="g.value">{{ g.label }}</option>
          </select>
        </label>
        <label class="gr-pick">
          <select :value="f.level" class="gr-select" aria-label="مستوى الإنجاز" @change="setF('level', $event.target.value)">
            <option value="">كل المستويات</option>
            <option value="low">إنجاز منخفض (أقل من 35%)</option>
            <option value="mid">متوسط (35–69%)</option>
            <option value="high">مرتفع (70% فأكثر)</option>
          </select>
        </label>
        <label class="gr-pick gr-pick-rows">
          <select :value="pageSize" class="gr-select" aria-label="عدد الصفوف" @change="pageSize = Number($event.target.value)">
            <option value="25">عرض 25</option>
            <option value="50">عرض 50</option>
            <option value="100">عرض 100</option>
          </select>
        </label>
        <BaseButton class="pb-export" variant="outline" size="sm" :icon="FileDown" :loading="exporting" :disabled="loading" @click="exportPdf">تصدير PDF</BaseButton>
      </div>

      <SlideTable :rows="grpRows" :size="pageSize" label="المجموعات">
        <template #default="{ rows: shown }">
          <div class="gr-table-wrap">
            <table class="gr-table pb-table">
              <thead>
                <tr>
                  <th class="hm-center">الشعبة</th>
                  <th data-rt-title>المجموعة</th>
                  <th v-if="!isSup">المشرف</th>
                  <th class="hm-center">الطلاب</th>
                  <th class="hm-center">المهام</th>
                  <th class="hm-center">المتأخرة</th>
                  <th>الإنجاز</th>
                  <th aria-label="تفاصيل" />
                </tr>
              </thead>
              <tbody v-if="loading">
                <SkeletonLoader variant="table" :cols="isSup ? 7 : 8" :rows="6" />
              </tbody>
              <tbody v-else-if="!grpRows.length">
                <tr><td :colspan="isSup ? 7 : 8" class="gr-empty">لا توجد مجموعات مطابقة للفلاتر</td></tr>
              </tbody>
              <tbody v-else>
                <template v-for="g in shown" :key="g.id">
                  <tr :class="['gr-row', openGrp === g.id && 'is-open']" :aria-expanded="openGrp === g.id" @click="toggleGrp(g)">
                    <td class="hm-center"><span class="ev-sec-chip">{{ g.section ? `شعبة ${g.section}` : '—' }}</span></td>
                    <td class="gr-name-cell">
                      <span class="gr-name">{{ g.name }}</span>
                      <span class="gr-types">{{ g.project?.name || 'بلا مشروع' }}</span>
                    </td>
                    <td v-if="!isSup">{{ g.sup.name || '—' }}</td>
                    <td class="hm-center">{{ g.members.length }}</td>
                    <td class="hm-center"><span class="mono">{{ g.tasksDone }}/{{ g.tasksTotal }}</span></td>
                    <td class="hm-center"><span :class="lateClass(lateOf(g.id))">{{ lateOf(g.id) ?? '—' }}</span></td>
                    <td>
                      <span class="gr-progress"><span :class="level(g.percentage)" :style="{ width: g.percentage + '%' }" /></span>
                      <span class="gr-pct">{{ g.percentage }}%</span>
                    </td>
                    <td class="hm-center"><ChevronDown :size="16" :class="['pb-caret', openGrp === g.id && 'is-open']" /></td>
                  </tr>
                  <tr v-if="openGrp === g.id" class="pt-sub">
                    <td :colspan="isSup ? 7 : 8">
                      <div class="pb-drop">
                        <h5 class="pb-drop-title"><Users :size="15" /> الطلاب <small>{{ g.members.length }}</small></h5>
                        <table class="ev-students">
                          <thead><tr><th>الطالب</th><th>الموكلة</th><th>المنجزة</th><th>المتأخرة</th><th>نسبة الإنجاز</th><th>آخر نشاط</th></tr></thead>
                          <tbody>
                            <tr v-for="m in g.members" :key="m.id">
                              <td class="pt-strong">{{ m.name }}</td>
                              <td>{{ m.total }}</td>
                              <td>{{ m.done }}</td>
                              <td><span :class="lateClass(studentLate(g.id, m.id))">{{ studentLate(g.id, m.id) ?? '…' }}</span></td>
                              <td>
                                <span class="gr-progress is-sm"><span :class="level(m.percentage)" :style="{ width: m.percentage + '%' }" /></span>
                                <span class="gr-pct">{{ m.percentage }}%</span>
                              </td>
                              <td class="ad-nowrap" :title="m.lastActive ? formatDateTime(m.lastActive) : ''">{{ m.lastActive ? formatRelativeTime(m.lastActive) : 'لم يدخل بعد' }}</td>
                            </tr>
                            <tr v-if="!g.members.length"><td colspan="6" class="pt-muted">لا يوجد طلاب</td></tr>
                          </tbody>
                        </table>
                        <h5 class="pb-drop-title"><ListTodo :size="15" /> المهام <small>{{ tasks[g.id]?.length ?? '…' }}</small></h5>
                        <SkeletonLoader v-if="!tasks[g.id]" :rows="2" />
                        <p v-else-if="!tasks[g.id].length" class="pt-muted">لا توجد مهام لهذه المجموعة</p>
                        <ul v-else class="pb-tasks">
                          <li v-for="t in tasks[g.id]" :key="t.id">
                            <span :class="['rv-pill', t.status === 'done' ? 'is-approved' : isLate(t) ? 'is-rejected' : 'is-pending']">{{ isLate(t) ? 'متأخرة' : TASK_STATUS[t.status] || t.status }}</span>
                            <b>{{ t.title }}</b>
                            <span class="pt-muted">{{ (t.assignees || []).map((a) => a.name).join('، ') || 'كل الفريق' }}<template v-if="t.due_date"> · التسليم {{ formatDate(t.due_date) }}</template></span>
                          </li>
                        </ul>
                      </div>
                    </td>
                  </tr>
                </template>
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
import SkeletonLoader from '@/components/ui/SkeletonLoader.vue'
import BaseButton from '@/components/ui/BaseButton.vue'
import { ChevronDown, FileDown, ListTodo, Search, Users } from 'lucide-vue-next'

import { escapeHtml } from '@/utils/exportReport'
import { exportTablePdf } from '@/utils/ucasReports'
import api from '@/services/api'
import { fetchGroups, level, TASK_STATUS } from '@/utils/progressData'
import { formatDate, formatRelativeTime } from '@/utils/formatters'
import { useAuthStore } from '@/stores/auth.store'
import { groupGender } from '@/services/adminData'

const DEGREES = { diploma: 'دبلوم', bachelor: 'بكالوريوس' }

export default {
  name: 'ProgressBoard',

  components: { SlideTable, SkeletonLoader, BaseButton, ChevronDown, Search, Users, ListTodo },

  data() {
    // المشرف: مجموعاته فقط (الخادم يقيّد /progress) بلا فلتر المشرف/الدرجة
    const isSup = useAuthStore().userRole === 'supervisor'
    return {
      isSup, TASK_STATUS, FileDown,
      groups: [], tasks: {}, loading: true,
      pageSize: 25,
      openGrp: null,
      exporting: false,
      f: { q: '', sup: '', spec: '', degree: '', gender: '', level: '' }
    }
  },

  computed: {
    /** الصفوف المعروضة: كل الفلاتر مجتمعة + البحث — محليًا */
    grpRows() {
      return this.groups.filter((g) => this.passes(g, this.f))
    },
    /** خيارات كل فلتر تتضيّق حسب باقي الفلاتر المفعّلة (منطقية متتالية) */
    supOptions() {
      const map = new Map()
      this.baseExcept('sup').forEach((g) => g.sup?.id && map.set(g.sup.id, g.sup))
      return [...map.values()].sort((a, b) => (a.name || '').localeCompare(b.name || '', 'ar'))
    },
    specOptions() {
      return [...new Set(this.baseExcept('spec').map((g) => g.spec).filter(Boolean))].sort((a, b) => a.localeCompare(b, 'ar'))
    },
    degreeOptions() {
      const present = new Set(this.baseExcept('degree').map((g) => String(g.degree)))
      return Object.entries(DEGREES).filter(([k]) => present.has(String(k))).map(([value, label]) => ({ value, label }))
    },
    genderOptions() {
      const present = new Set(this.baseExcept('gender').map((g) => groupGender(g)).filter(Boolean))
      const opts = [{ value: '', label: 'طلاب وطالبات' }]
      if (present.has('male')) opts.push({ value: 'male', label: 'طلاب' })
      if (present.has('female')) opts.push({ value: 'female', label: 'طالبات' })
      return opts
    }
  },

  async created() {
    try {
      this.groups = await fetchGroups()
    } finally {
      this.loading = false
    }
  },

  methods: {
    formatDate,
    formatRelativeTime,
    formatDateTime: (d) => new Date(d).toLocaleString('ar-EG', { dateStyle: 'medium', timeStyle: 'short' }),
    level,

    /** هل تمرّ المجموعة من مجموعة فلاتر (كلها مجتمعة) + البحث */
    passes(g, f) {
      if (f.sup && g.sup?.id !== f.sup) return false
      if (f.spec && g.spec !== f.spec) return false
      if (f.degree && g.degree !== f.degree) return false
      if (f.gender && groupGender(g) !== f.gender) return false
      if (f.level && level(g.percentage) !== 'is-' + f.level) return false
      const q = (f.q || '').trim()
      if (q && !`${g.name} ${g.sup?.name || ''} ${g.project?.name || ''} ${g.members.map((m) => m.name).join(' ')}`.includes(q)) return false
      return true
    },

    /** القائمة مفلترة بكل الفلاتر عدا المفتاح — لاشتقاق خياراته (تتالٍ) */
    baseExcept(key) {
      const f = { ...this.f, [key]: '' }
      return this.groups.filter((g) => this.passes(g, f))
    },

    setF(key, value) {
      this.f = { ...this.f, [key]: value }
    },

    onSearch(value) {
      clearTimeout(this.searchTimer)
      this.searchTimer = setTimeout(() => { this.f = { ...this.f, q: value.trim() } }, 300)
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

    lateClass(n) {
      return n ? 'pb-late' : ''
    },

    /** وصف الفلترة المطبّقة لعنوان التقرير */
    filterLabel() {
      const sup = this.supOptions.find((s) => s.id === this.f.sup)?.name
      const lvl = { low: 'إنجاز منخفض', mid: 'إنجاز متوسط', high: 'إنجاز مرتفع' }[this.f.level]
      const gen = { male: 'طلاب', female: 'طالبات' }[this.f.gender]
      return [this.f.spec, DEGREES[this.f.degree], !this.isSup && sup, gen, lvl, this.f.q && `بحث: ${this.f.q}`].filter(Boolean).join(' · ')
    },

    /** تصدير PDF بترويسة الكلية لجدول المجموعات حسب الفلترة */
    async exportPdf() {
      this.exporting = true
      const e = escapeHtml
      try {
        const head = [{ label: 'الشعبة', width: 60 }, { label: 'المجموعة والمشروع' }]
        if (!this.isSup) head.push({ label: 'المشرف', width: 110 })
        head.push({ label: 'الطلاب', width: 56 }, { label: 'المهام', width: 70 }, { label: 'المتأخرة', width: 66 }, { label: 'الإنجاز', width: 66 })
        await exportTablePdf({
          fileName: `تقدم المشاريع${this.filterLabel() ? ' - ' + this.filterLabel() : ''}.pdf`,
          title: 'تقرير تقدّم المشاريع — المجموعات والطلاب',
          filterLabel: this.filterLabel(),
          perPage: 14,
          head,
          rows: this.grpRows.map((g) => {
            const row = [e(g.section || '—'), `<b>${e(g.name)}</b><br><span style="font-size:12px; color:#444;">${e(g.project?.name || 'بلا مشروع')}</span>`]
            if (!this.isSup) row.push(e(g.sup?.name || '—'))
            row.push(g.members.length, `<span dir="ltr">${g.tasksDone}/${g.tasksTotal}</span>`, this.lateOf(g.id) ?? '—', `<b>${g.percentage}%</b>`)
            return row
          })
        })
        this.$toast?.success('تم تصدير التقرير PDF')
      } catch {
        this.$toast?.error('تعذّر تصدير التقرير')
      } finally {
        this.exporting = false
      }
    }
  }
}
</script>
