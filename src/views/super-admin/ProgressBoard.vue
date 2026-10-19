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
        <BaseButton class="pb-export" variant="outline" size="md" :icon="FileDown" :loading="exporting" :disabled="loading" @click="exportPdf">تصدير PDF</BaseButton>
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
                              <td class="pt-strong"><button type="button" class="pb-link" @click.stop="openStudent(g, m)">{{ m.name }}</button></td>
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
                          <li v-for="t in tasks[g.id]" :key="t.id" class="pb-task-li" role="button" tabindex="0" @click="openTask(t)" @keydown.enter="openTask(t)">
                            <span :class="['rv-pill', t.status === 'done' ? 'is-approved' : isLate(t) ? 'is-rejected' : 'is-pending']">{{ isLate(t) ? 'متأخرة' : TASK_STATUS[t.status] || t.status }}</span>
                            <b>{{ t.title }}</b>
                            <span class="pt-muted">{{ (t.assignees || []).map((a) => a.name).join('، ') || 'كل الفريق' }}<template v-if="t.due_date"> · التسليم {{ formatDate(t.due_date) }}</template></span>
                            <ChevronLeft :size="16" class="pb-task-go" />
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

    <!-- بطاقة الطالب: معلوماته وإحصاؤه ومهامه — للقراءة فقط -->
    <BaseModal :model-value="!!stu" :title="stu ? stu.m.name : ''" :description="stu ? stu.g.name : ''" size="lg" @update:model-value="!$event && closeStudent()">
      <div v-if="stu" class="pbm">
        <div class="pbm-stats">
          <div class="pbm-stat"><span>الموكلة</span><b>{{ stu.m.total }}</b></div>
          <div class="pbm-stat"><span>المنجزة</span><b>{{ stu.m.done }}</b></div>
          <div class="pbm-stat"><span>المتأخرة</span><b :class="lateClass(studentLate(stu.g.id, stu.m.id))">{{ studentLate(stu.g.id, stu.m.id) ?? '—' }}</b></div>
          <div class="pbm-stat"><span>نسبة الإنجاز</span><b>{{ stu.m.percentage }}%</b></div>
        </div>
        <div class="pbm-bar"><span class="gr-progress"><span :class="level(stu.m.percentage)" :style="{ width: stu.m.percentage + '%' }" /></span></div>

        <dl class="pbm-kv">
          <div><dt>المشروع</dt><dd>{{ stu.g.project?.name || 'بلا مشروع' }}</dd></div>
          <div v-if="!isSup"><dt>المشرف</dt><dd>{{ stu.g.sup.name || '—' }}</dd></div>
          <div><dt>التخصص</dt><dd>{{ stu.g.spec || '—' }}</dd></div>
          <div><dt>الدرجة</dt><dd>{{ degreeLabel(stu.g.degree) }}</dd></div>
          <div><dt>الفئة</dt><dd>{{ genderLabel(stu.m.gender) }}</dd></div>
          <div><dt>الرقم الجامعي</dt><dd>{{ stu.m.uid || '—' }}</dd></div>
          <div v-if="stu.m.email"><dt>البريد</dt><dd dir="ltr">{{ stu.m.email }}</dd></div>
          <div><dt>آخر نشاط</dt><dd>{{ stu.m.lastActive ? formatRelativeTime(stu.m.lastActive) : 'لم يدخل بعد' }}</dd></div>
        </dl>

        <h5 class="pb-drop-title"><ListTodo :size="15" /> مهام الطالب <small>{{ studentTasks(stu.g.id, stu.m.id).length }}</small></h5>
        <SkeletonLoader v-if="!tasks[stu.g.id]" :rows="2" />
        <p v-else-if="!studentTasks(stu.g.id, stu.m.id).length" class="pt-muted">لا مهام مُسندة لهذا الطالب — مهام الفريق تُتابَع على مستوى المجموعة.</p>
        <ul v-else class="pbm-tasks">
          <li v-for="t in studentTasks(stu.g.id, stu.m.id)" :key="t.id" :class="['pbm-task', stuTaskOpen === t.id && 'is-open']">
            <button type="button" class="pbm-task-head" @click="toggleStuTask(t)">
              <span :class="['rv-pill', t.status === 'done' ? 'is-approved' : isLate(t) ? 'is-rejected' : 'is-pending']">{{ isLate(t) ? 'متأخرة' : TASK_STATUS[t.status] || t.status }}</span>
              <b>{{ t.title }}</b>
              <span v-if="t.due_date" class="pt-muted">التسليم {{ formatDate(t.due_date) }}</span>
              <ChevronDown :size="16" class="pbm-task-caret" />
            </button>
            <div v-if="stuTaskOpen === t.id" class="pbm-task-body">
              <SkeletonLoader v-if="stuTaskLoading" :rows="2" />
              <template v-else>
                <p v-if="stuTaskDetail && stuTaskDetail.description" class="tl-desc">{{ stuTaskDetail.description }}</p>
                <p v-else class="pt-muted">لا يوجد وصف لهذه المهمة.</p>
                <div v-if="stuTaskDetail && stuTaskDetail.files && stuTaskDetail.files.length" class="pbm-sec">
                  <h6 class="pbm-task-h"><FileText :size="14" /> المرفقات <small>{{ stuTaskDetail.files.length }}</small></h6>
                  <ul class="tk-files">
                    <li v-for="f in stuTaskDetail.files" :key="f.id">
                      <FileText :size="16" />
                      <span class="tk-file-name">{{ fileName(f.file_path) }}</span>
                      <span class="pt-muted">{{ f.uploaded_by?.name || '' }} · {{ formatDate(f.created_at) }}</span>
                    </li>
                  </ul>
                </div>
                <div v-if="stuTaskDetail && stuTaskDetail.notes && stuTaskDetail.notes.length" class="pbm-sec">
                  <h6 class="pbm-task-h">الملاحظات <small>{{ stuTaskDetail.notes.length }}</small></h6>
                  <ul class="tk-notes">
                    <li v-for="n in stuTaskDetail.notes" :key="n.id">
                      <span class="tk-avatar">{{ initials(n.user?.name) }}</span>
                      <div>
                        <b>{{ n.user?.name || '—' }}</b> <span class="pt-muted">{{ formatDateTime(n.created_at) }}</span>
                        <p>{{ n.note }}</p>
                      </div>
                    </li>
                  </ul>
                </div>
                <div v-if="stuTaskLog.length" class="pbm-sec">
                  <h6 class="pbm-task-h">سجل الحركة</h6>
                  <ol class="tl-log">
                    <li v-for="(e, i) in stuTaskLog" :key="i">
                      <span class="tl-dot" />
                      <span><b>{{ e.user?.name || 'النظام' }}</b> {{ describe(e) }}</span>
                      <span class="pt-muted">{{ formatDateTime(e.created_at) }}</span>
                    </li>
                  </ol>
                </div>
              </template>
            </div>
          </li>
        </ul>
      </div>
    </BaseModal>

    <!-- تفاصيل المهمة: الحالة والوصف والمرفقات والملاحظات وسجل الحركة — للقراءة فقط -->
    <BaseModal :model-value="!!taskSel" :title="taskSel ? taskSel.title : ''" size="lg" @update:model-value="!$event && closeTask()">
      <div v-if="taskSel" class="pbm">
        <div class="pbm-taskhead">
          <span :class="['rv-pill', taskSel.status === 'done' ? 'is-approved' : isLate(taskSel) ? 'is-rejected' : 'is-pending']">{{ isLate(taskSel) ? 'متأخرة' : TASK_STATUS[taskSel.status] || taskSel.status }}</span>
          <span v-if="taskSel.due_date" class="pt-muted">التسليم {{ formatDate(taskSel.due_date) }}</span>
        </div>
        <dl class="pbm-kv">
          <div><dt>المكلّفون</dt><dd>{{ (taskSel.assignees || []).map((a) => a.name).join('، ') || 'كل الفريق' }}</dd></div>
          <div v-if="taskSel.status === 'done' && completedBy(taskLog)"><dt>أنجزها</dt><dd>{{ completedBy(taskLog) }}</dd></div>
        </dl>

        <section class="pbm-sec">
          <h5 class="pb-drop-title">الوصف والتعليمات</h5>
          <SkeletonLoader v-if="taskLoading" :rows="2" />
          <p v-else-if="taskDetail && taskDetail.description" class="tl-desc">{{ taskDetail.description }}</p>
          <p v-else class="pt-muted">لا يوجد وصف لهذه المهمة.</p>
        </section>

        <section v-if="taskLoading || (taskDetail && taskDetail.files && taskDetail.files.length)" class="pbm-sec">
          <h5 class="pb-drop-title"><FileText :size="15" /> المرفقات <small>{{ taskDetail && taskDetail.files ? taskDetail.files.length : 0 }}</small></h5>
          <ul v-if="taskDetail && taskDetail.files && taskDetail.files.length" class="tk-files">
            <li v-for="f in taskDetail.files" :key="f.id">
              <FileText :size="16" />
              <span class="tk-file-name">{{ fileName(f.file_path) }}</span>
              <span class="pt-muted">{{ f.uploaded_by?.name || '' }} · {{ formatDate(f.created_at) }}</span>
            </li>
          </ul>
        </section>

        <section v-if="taskLoading || (taskDetail && taskDetail.notes && taskDetail.notes.length)" class="pbm-sec">
          <h5 class="pb-drop-title">الملاحظات <small>{{ taskDetail && taskDetail.notes ? taskDetail.notes.length : 0 }}</small></h5>
          <ul v-if="taskDetail && taskDetail.notes && taskDetail.notes.length" class="tk-notes">
            <li v-for="n in taskDetail.notes" :key="n.id">
              <span class="tk-avatar">{{ initials(n.user?.name) }}</span>
              <div>
                <b>{{ n.user?.name || '—' }}</b> <span class="pt-muted">{{ formatDateTime(n.created_at) }}</span>
                <p>{{ n.note }}</p>
              </div>
            </li>
          </ul>
        </section>

        <section v-if="taskLog.length" class="pbm-sec">
          <h5 class="pb-drop-title">سجل الحركة</h5>
          <ol class="tl-log">
            <li v-for="(e, i) in taskLog" :key="i">
              <span class="tl-dot" />
              <span><b>{{ e.user?.name || 'النظام' }}</b> {{ describe(e) }}</span>
              <span class="pt-muted">{{ formatDateTime(e.created_at) }}</span>
            </li>
          </ol>
        </section>
      </div>
    </BaseModal>
  </div>
</template>

<script>
import SlideTable from '@/components/ui/SlideTable.vue'
import SkeletonLoader from '@/components/ui/SkeletonLoader.vue'
import BaseButton from '@/components/ui/BaseButton.vue'
import BaseModal from '@/components/ui/BaseModal.vue'
import { ChevronDown, ChevronLeft, FileDown, FileText, ListTodo, Search, Users } from 'lucide-vue-next'

import { escapeHtml } from '@/utils/exportReport'
import { exportTablePdf } from '@/utils/ucasReports'
import api from '@/services/api'
import { completedBy, describeTaskEvent, fetchGroups, level, TASK_STATUS } from '@/utils/progressData'
import { formatDate, formatDateTime, formatRelativeTime, initials } from '@/utils/formatters'
import { useAuthStore } from '@/stores/auth.store'
import { groupGender } from '@/services/adminData'

const DEGREES = { diploma: 'دبلوم', bachelor: 'بكالوريوس' }

export default {
  name: 'ProgressBoard',

  components: { SlideTable, SkeletonLoader, BaseButton, BaseModal, ChevronDown, ChevronLeft, FileText, Search, Users, ListTodo },

  data() {
    // المشرف: مجموعاته فقط (الخادم يقيّد /progress) بلا فلتر المشرف/الدرجة
    const isSup = useAuthStore().userRole === 'supervisor'
    return {
      isSup, TASK_STATUS, FileDown,
      groups: [], tasks: {}, loading: true,
      pageSize: 25,
      openGrp: null,
      exporting: false,
      stu: null,
      stuTaskOpen: null, stuTaskDetail: null, stuTaskLog: [], stuTaskLoading: false,
      taskSel: null, taskDetail: null, taskLog: [], taskLoading: false,
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
    formatDateTime,
    initials,
    completedBy,
    describe: describeTaskEvent,
    fileName: (path = '') => path.split('/').pop(),
    degreeLabel: (d) => DEGREES[d] || '—',
    genderLabel: (g) => (g === 'female' ? 'طالبة' : g === 'male' ? 'طالب' : '—'),
    level,

    /** بطاقة الطالب */
    openStudent(g, m) {
      this.stu = { g, m }
      this.stuTaskOpen = null
      this.loadTasks(g.id)
    },

    closeStudent() {
      this.stu = null
      this.stuTaskOpen = null
      this.stuTaskDetail = null
      this.stuTaskLog = []
    },

    /** مهام الطالب الشخصية فقط (المُسندة إليه صراحةً) — مطابِقة لإحصائه؛
        مهام "كل الفريق" تُتابَع على مستوى المجموعة لا الفرد */
    studentTasks(teamId, studentId) {
      const list = this.tasks[teamId] || []
      return list.filter((t) => (t.assignees || []).some((a) => a.id === studentId))
    },

    /** فتح/طيّ تفاصيل مهمة داخل بطاقة الطالب (انسدال لا مودال فوق مودال) */
    async toggleStuTask(t) {
      if (this.stuTaskOpen === t.id) { this.stuTaskOpen = null; return }
      this.stuTaskOpen = t.id
      this.stuTaskDetail = null
      this.stuTaskLog = []
      this.stuTaskLoading = true
      try {
        const [detail, log] = await Promise.allSettled([api.get(`/tasks/${t.id}`), api.get(`/tasks/${t.id}/activity`)])
        this.stuTaskDetail = detail.value?.data?.data || detail.value?.data || {}
        this.stuTaskLog = log.value?.data || []
      } finally {
        this.stuTaskLoading = false
      }
    },

    /** تفاصيل المهمة: الوصف والمرفقات والملاحظات وسجل الحركة — للقراءة */
    async openTask(t) {
      this.taskSel = t
      this.taskDetail = null
      this.taskLog = []
      this.taskLoading = true
      try {
        const [detail, log] = await Promise.allSettled([api.get(`/tasks/${t.id}`), api.get(`/tasks/${t.id}/activity`)])
        this.taskDetail = detail.value?.data?.data || detail.value?.data || {}
        this.taskLog = log.value?.data || []
      } finally {
        this.taskLoading = false
      }
    },

    closeTask() {
      this.taskSel = null
      this.taskDetail = null
      this.taskLog = []
    },

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

    /** المهام المتأخرة للطالب: المُسندة إليه صراحةً فقط — متوافقة مع إحصائه الشخصي */
    studentLate(teamId, studentId) {
      const list = this.tasks[teamId]
      if (!list) return null
      return list.filter((t) => this.isLate(t) && (t.assignees || []).some((a) => a.id === studentId)).length
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
