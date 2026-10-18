<template>
  <!-- الرئيسية للإدارة العامة وللمشرف (نفس التصميم؛ المشرف يرى مجموعاته فقط):
       الإحصاءات ← نشاط المشرفين والمجموعات (بحث + فلاتر + بروفايل) ← مهام وتكليفات كل مجموعة + الرسم البياني -->
  <div ref="root" class="dash">
    <section v-if="hero" class="sa-hero">
      <div class="sa-hero-in">
        <div class="sa-hero-text">
          <span class="sa-hero-eyebrow">{{ isSup ? 'لوحة المشرف' : 'لوحة الإدارة العامة' }}</span>
          <h2 class="sa-hero-title">مرحبًا، {{ firstName }}</h2>
        </div>
        <div class="sa-hero-stats" aria-label="إحصاءات عامة">
          <div v-for="s in stats" :key="s.label" class="sa-stat" :title="s.split.map((p) => `${p.label} ${p.value}`).join(' · ')">
            <b v-if="loading"><span class="sk sa-stat-sk" /></b>
            <b v-else><CountUp :value="s.value" /></b>
            <span>{{ s.label }}</span>
          </div>
        </div>
      </div>
    </section>

    <template v-else>
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
    </template>

    <!-- نشاط المشرفين والمجموعات -->
    <section class="dash-card">
      <div class="dash-card-head">
        <h3>{{ isSup ? 'مجموعاتي وطلابي' : 'مدى نشاط المشرفين والطلاب' }}</h3>
        <span v-if="isSup" class="dash-chip">{{ groups.length }} مجموعة</span>
        <nav v-else class="hm-tabs" aria-label="نوع القائمة">
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
        <select v-else-if="!isSup" v-model="supFilter" class="gr-select" aria-label="المشرف">
          <option value="">كل المشرفين</option>
          <option v-for="s in supervisors" :key="s.id" :value="s.id">{{ s.name }}</option>
        </select>
        <select v-if="tab === 'grp'" v-model="genderFilter" class="gr-select" aria-label="طلاب / طالبات">
          <option value="">طلاب وطالبات</option>
          <option value="male">طلاب</option>
          <option value="female">طالبات</option>
        </select>
        <button v-if="tab === 'sup'" type="button" class="pbtn hm-report" :disabled="exporting || !supRows.length" @click="exportSupReport">
          <Printer :size="17" /> {{ exporting ? 'جارٍ التجهيز…' : 'تقرير المشرفين PDF' }}
        </button>
      </div>

      <!-- كل الصفوف في صندوق بارتفاع ثابت يمرَّر داخليًا (رأس الجدول ثابت) بدل الشرائح -->
      <div :class="['hm-table-wrap', !isSup && 'hm-scroll']">
          <table v-if="tab === 'sup'" class="hm-table">
            <thead><tr><th>المشرف</th><th>التخصص</th><th class="hm-center">المجموعات</th><th>الطلاب</th><th>التفاعل</th><th>آخر تفاعل</th><th>نوع التفاعل</th></tr></thead>
            <tbody>
              <tr v-for="s in supRows" :key="s.id" class="is-link" @click="openProfile('supervisor', s)">
                <td class="hm-strong">{{ s.name }}</td>
                <td class="hm-muted">{{ s.spec }}</td>
                <td class="hm-center">{{ s.groups.length }}</td>
                <td>{{ s.students }}</td>
                <td>
                  <span class="gr-progress"><span :class="level(s.activity)" :style="{ width: s.activity + '%' }" /></span>
                  <span class="gr-pct">{{ s.activity }}%</span>
                </td>
                <td><span class="mono">{{ formatDateTime(s.lastAt) }}</span></td>
                <td class="hm-muted">{{ s.lastAction }}</td>
              </tr>
              <SkeletonLoader v-if="loading" variant="table" :cols="7" :rows="5" />
              <tr v-else-if="!supRows.length"><td colspan="7" class="gr-empty">لا يوجد مشرفون مطابقون</td></tr>
            </tbody>
          </table>
  
          <!-- المشرف: مجموعاته بسلايدر صفحات المجموعات؛ الإدارة العامة: كل الصفوف في صندوق التمرير -->
          <SlideTable v-else v-slot="{ rows: grpPage }" :rows="grpRows" :size="isSup ? 6 : Math.max(grpRows.length, 1)" label="المجموعات">
          <table class="hm-table">
            <thead><tr><th>المجموعة / الطالب</th><th data-rt-show>{{ isSup ? 'المشروع' : 'المشرف' }}</th><th>المهام</th><th>مستوى التقدّم</th></tr></thead>
            <tbody>
              <template v-for="g in grpPage" :key="g.id">
                <tr class="is-link" :aria-expanded="openGroup === g.id" @click="openGroup = openGroup === g.id ? null : g.id">
                  <td class="hm-strong">
                    <ChevronDown :size="14" :class="['hm-caret', openGroup === g.id && 'is-open']" />
                    <span class="rt-section">{{ g.name }}</span> <span class="hm-muted">({{ g.shown.length }})</span>
                  </td>
                  <td class="hm-muted">{{ isSup ? g.project : supName(g.supId) }}</td>
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
                          <span>{{ g.spec }} · {{ DEGREES[g.degree] }}<template v-if="!isSup"> · المشرف: {{ supName(g.supId) }}</template></span>
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
              <SkeletonLoader v-if="loading" variant="table" :cols="4" :rows="5" />
              <tr v-else-if="!grpRows.length"><td colspan="4" class="gr-empty">لا توجد مجموعات مطابقة</td></tr>
            </tbody>
          </table>
          </SlideTable>
      </div>
      <p class="hm-count">{{ tab === 'sup' ? `${supRows.length} مشرف` : `${grpRows.length} مجموعة` }}</p>
    </section>

    <section class="dash-card hm-health">
      <div class="dash-card-head">
        <h3>حالة المشاريع والمهام</h3>
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
      <div class="hm-health-grid">
        <div class="hm-health-tasks">
          <div class="hm-table-wrap hm-scroll">
            <table class="hm-table">
              <thead><tr><th>المهمة / التكليف</th><th class="hm-center">المجموعة</th><th>{{ isSup ? 'المشروع' : 'المشرف' }}</th><th>المكلّفون</th><th>تاريخ الإصدار</th><th>موعد التسليم</th><th>الحالة</th></tr></thead>
              <tbody>
                <tr v-for="t in taskRows" :key="t.id">
                  <td class="hm-strong">{{ t.title }}</td>
                  <!-- الشعبة: زر يعرض كل مهام المجموعة ويحدّث الرسم البياني -->
                  <td class="hm-center"><button type="button" :class="['hm-group-link', taskGroup === t.groupId && 'is-active']" :title="'عرض كل مهام ' + t.group" @click="taskGroup = taskGroup === t.groupId ? '' : t.groupId">{{ t.group }}</button></td>
                  <td class="hm-muted">{{ t.sup }}</td>
                  <td class="hm-muted">{{ t.assignees }}</td>
                  <td><span class="mono">{{ t.issued }}</span></td>
                  <td><span class="mono">{{ t.due }}</span></td>
                  <td><span :class="['rv-pill', STATE[t.state].pill]">{{ STATE[t.state].label }}</span></td>
                </tr>
                <SkeletonLoader v-if="loading || tasksLoading" variant="table" :cols="7" :rows="4" />
                <tr v-else-if="!taskRows.length"><td colspan="7" class="gr-empty">لا توجد مهام</td></tr>
              </tbody>
            </table>
          </div>
          <p class="hm-count">{{ taskRows.length }} مهمة</p>
        </div>

        <div class="hm-health-status">
        <div v-if="loading || tasksLoading" class="hm-prog-sk" aria-label="جارٍ التحميل">
          <span class="sk" style="width: 120px; height: 40px" />
          <span class="sk" style="height: 14px" />
          <SkeletonLoader :rows="4" height="18px" />
        </div>
        <div v-else class="hm-prog">
          <div class="hm-prog-head">
            <b>{{ chartPct }}<small>%</small></b>
            <span>{{ chart[0].count }} من {{ chartTotal }} مهمة مكتملة</span>
          </div>
          <div class="hm-stack" role="img" :aria-label="chart.map((c) => `${c.label} ${c.count}`).join('، ')">
            <span
              v-for="c in chart" v-show="c.count" :key="c.key"
              :class="['hm-seg', 'hm-c-' + c.key]" :style="{ flexGrow: c.count }"
              :data-tip="`${c.label}: ${c.count} (${pctOf(c.count)}%)`" tabindex="0"
            />
            <span v-if="!chartTotal" class="hm-seg is-empty" data-tip="لا توجد مهام" />
          </div>
          <ul class="hm-key">
            <li v-for="c in chart" :key="c.key">
              <span :class="['dash-dot', 'hm-c-' + c.key]" />
              <span>{{ c.label }}</span>
              <b>{{ c.count }}</b>
              <small>{{ pctOf(c.count) }}%</small>
            </li>
          </ul>
        </div>

        <div v-if="!loading && !tasksLoading && !taskGroup && groupProgress.length" class="hm-gprog">
          <h4>تقدّم المجموعات <small>{{ groupProgress.length }}</small></h4>
          <div class="hm-gprog-list">
          <button v-for="g in groupProgress" :key="g.id" type="button" class="hm-gprog-row" :title="`عرض مهام ${g.name}`" @click="taskGroup = g.id">
            <span class="hm-gprog-name">{{ g.name }}</span>
            <span class="hm-gprog-bar"><span :style="{ width: g.pct + '%' }" /></span>
            <span class="hm-gprog-val">{{ g.done }} من {{ g.total }} مهمة مكتملة</span>
          </button>
          </div>
        </div>
        <!-- ملخّص الفصل: يملأ البطاقة بطول بطاقة المهام المجاورة -->
        <dl class="hm-summary">
          <div><dt>المجموعات</dt><dd>{{ groups.length }}</dd></div>
          <div><dt>المهام</dt><dd>{{ chart.reduce((n, c) => n + c.count, 0) }}</dd></div>
          <div><dt>الطلاب</dt><dd>{{ genderCount.male }}</dd></div>
          <div><dt>الطالبات</dt><dd>{{ genderCount.female }}</dd></div>
        </dl>
        </div>
      </div>
    </section>

    <ProfileModal v-model="profileOpen" :kind="profileKind" :person-id="profileId" :name="profileName" />
  </div>
</template>

<script>
import { ref } from 'vue'
import { mapState } from 'pinia'
import { ChevronDown, Search, Printer } from 'lucide-vue-next'
import CountUp from '@/components/ui/CountUp.vue'
import { useAuthStore } from '@/stores/auth.store'
import { ROLES, STORAGE_KEYS } from '@/utils/constants'
import { gsap, useScrollMotion } from '@/composables/useScrollMotion'
import '@/styles/ucas-site.css'
import api from '@/services/api'
import { exportSupervisorsPdf } from '@/utils/ucasReports'
import ProfileModal from '@/components/shared/ProfileModal.vue'
import SlideTable from '@/components/ui/SlideTable.vue'
import { DEGREES, REGIONS } from '@/utils/progressData'
import { formatDateTime } from '@/utils/formatters'
import { loadGroups, loadSupervisors, loadDashboardStats, normalizeTasks } from '@/services/adminData'

const STATE = {
  done: { label: 'مكتملة', pill: 'is-approved' },
  open: { label: 'غير مكتملة', pill: 'is-pending' },
  late: { label: 'متأخرة', pill: 'is-rejected' }
}

const pct = (a, b) => (b ? Math.round((a / b) * 100) : 0)

export default {
  name: 'PortalDashboard',

  components: { ChevronDown, CountUp, Search, Printer, ProfileModal, SlideTable },

  /** حركة الصفحة (الإدارة العامة): البانر يدخل عند الفتح، البطاقات تصعد عند الوصول إليها، والصفوف تتوالى بعد وصول البيانات */
  setup() {
    const root = ref(null)
    const auth = useAuthStore()
    if ([ROLES.SUPER_ADMIN, ROLES.SUPERVISOR].includes(auth.userRole)) {
      useScrollMotion(root, (el) => {
        gsap.timeline({ delay: 0.15 })
          .from(el.querySelectorAll('.sa-hero-text > *'), { y: 24, autoAlpha: 0, duration: 0.7, ease: 'power3.out', stagger: 0.12 })
          .from(el.querySelectorAll('.sa-stat'), { y: 20, autoAlpha: 0, duration: 0.6, ease: 'power2.out', stagger: 0.08 }, '-=0.3')
        // البطاقات تصعد مباشرة بعد البانر (بلا ScrollTrigger: مواضعه تُحسب قبل وصول البيانات فتبقى البطاقات مخفية)
        gsap.from(el.querySelectorAll('.dash-card'), { y: 30, autoAlpha: 0, duration: 0.7, ease: 'power3.out', stagger: 0.1, delay: 0.35, clearProps: 'all' })
      })
    }
    return { root }
  },

  data() {
    return {
      STATE, DEGREES, REGIONS,
      loading: true,
      tasksLoading: useAuthStore().userRole === ROLES.SUPERVISOR,
      groups: [],
      supList: [],
      raw: {},
      supActivity: {},
      tab: useAuthStore().userRole === ROLES.SUPERVISOR ? 'grp' : 'sup',
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
      exporting: false,
      studentGenders: { male: 0, female: 0 }
    }
  },

  computed: {
    ...mapState(useAuthStore, ['userRole', 'userName']),

    isSA() {
      return this.userRole === ROLES.SUPER_ADMIN
    },

    isSup() {
      return this.userRole === ROLES.SUPERVISOR
    },

    hero() {
      return this.isSA || this.isSup
    },

    firstName() {
      // تخطّي الألقاب المختصرة ("م."، "د."، "أ.") إلى الاسم الأول
      return (this.userName || '').split(/\s+/).find((w) => w && !w.endsWith('.')) || 'بك'
    },

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
        return { ...s, groups, students, activity: Math.round(this.supActivity[s.id] ?? fallback), ...this.lastInteraction(s, groups) }
      })
    },

    /** طلاب/طالبات: من الخادم إن توفّر، وإلا من حقل gender في قائمة الطلاب */
    genderCount() {
      if (this.isSup) {
        const all = this.groups.flatMap((x) => x.members)
        return { male: all.filter((m) => m.gender !== 'female').length, female: all.filter((m) => m.gender === 'female').length }
      }
      const g = this.raw.students_by_gender || {}
      return { male: g.male || this.studentGenders.male, female: g.female || this.studentGenders.female }
    },

    stats() {
      if (this.isSup) {
        const g = this.groups
        const n = (fn) => g.filter(fn).length
        const avg = g.length ? Math.round(g.reduce((sum, x) => sum + x.percentage, 0) / g.length) : 0
        return [
          { label: 'مجموعاتي', value: g.length, split: [{ label: 'دبلوم', value: n((x) => x.degree === 'diploma') }, { label: 'بكالوريوس', value: n((x) => x.degree === 'bachelor') }] },
          { label: 'الطلاب', value: this.genderCount.male + this.genderCount.female, split: [{ label: 'طلاب', value: this.genderCount.male }, { label: 'طالبات', value: this.genderCount.female }] },
          { label: 'المهام', value: this.tasks.length, split: [{ label: 'منجزة', value: this.tasks.filter((t) => t.state === 'done').length }, { label: 'متأخرة', value: this.tasks.filter((t) => t.state === 'late').length }] },
          { label: 'متوسط الإنجاز %', value: avg, split: [{ label: 'مرتفع', value: n((x) => x.percentage >= 70) }, { label: 'منخفض', value: n((x) => x.percentage < 35) }] }
        ]
      }
      const assigned = this.groups.reduce((n, g) => n + g.members.length, 0)
      const total = Math.max(this.raw.students_count ?? assigned, assigned)
      return [
        { label: 'المجموعات', value: this.groups.length, split: [{ label: 'المشاريع', value: this.raw.total_projects_this_term ?? this.groups.filter((x) => x.projectId).length }] },
        { label: 'الطلاب الكلي', value: total, split: [{ label: 'طلاب', value: this.genderCount.male }, { label: 'طالبات', value: this.genderCount.female }] },
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
          return { ...t, group: g?.name || '—', sup: (this.isSup ? g?.project : g?.supName) || '—', assignees: t.assigneeNames.join('، ') || 'كل الفريق' }
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

    chartTotal() {
      return this.chart.reduce((n, c) => n + c.count, 0)
    },

    /** تقدّم كل مجموعة لها مهام (الأكثر مهامًا أولًا) — القائمة تمرَّر داخليًا */
    groupProgress() {
      return this.taskGroups
        .map((g) => {
          const list = this.tasks.filter((t) => t.groupId === g.id)
          const done = list.filter((t) => t.state === 'done').length
          return { id: g.id, name: g.name, done, total: list.length, pct: pct(done, list.length) }
        })
        .sort((a, b) => b.total - a.total)
    },

    chartPct() {
      const total = this.chart.reduce((n, c) => n + c.count, 0)
      return pct(this.chart[0].count, total)
    }
  },

  async created() {
    if (this.isSup) return this.loadSupervisorHome()
    const [groups, raw] = await Promise.allSettled([loadGroups(), loadDashboardStats()])
    this.groups = groups.value || []
    this.raw = raw.value || {}
    this.supList = await loadSupervisors(this.groups)
    api.get('/users', { params: { role: 'student', per_page: 1000 } }).then(({ data }) => {
      const rows = Array.isArray(data) ? data : data.data || []
      this.studentGenders = { male: rows.filter((u) => u.gender === 'male').length, female: rows.filter((u) => u.gender === 'female').length }
    }).catch(() => {})
    this.loading = false
    // الإدارة العامة: صفوف الجداول تتوالى بعد وصول البيانات
    this.animateRows()
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
    formatDateTime,

    /** المشرف: مجموعاته فقط (loadGroups يقصرها عليه) ومهامها من /teams/{id}/tasks — لا يملك صلاحية إحصاءات اللجنة */
    async loadSupervisorHome() {
      // آخر نسخة من الجلسة تُعرض فورًا ثم تُحدَّث بالخلفية؛ أول مرة: المجموعات فور وصولها ثم المهام
      const KEY = `sup-home:${localStorage.getItem(STORAGE_KEYS.SEMESTER) || ''}`
      try {
        const cached = JSON.parse(sessionStorage.getItem(KEY) || 'null')
        if (cached) Object.assign(this, { groups: cached.groups, raw: cached.raw, loading: false, tasksLoading: false })
      } catch {
        // بلا كاش
      }
      try {
        this.groups = await loadGroups()
      } catch {
        if (this.loading) this.$toast?.error('تعذّر تحميل بيانات الرئيسية')
      }
      if (this.loading) {
        this.loading = false
        this.animateRows()
      }
      const lists = await Promise.allSettled(this.groups.map((g) => api.get(`/teams/${g.id}/tasks`)))
      this.raw = { latest_tasks: lists.flatMap((r, i) => (r.value?.data?.data || r.value?.data || []).map((t) => ({ ...t, team_id: t.team_id ?? this.groups[i].id }))) }
      this.tasksLoading = false
      try {
        sessionStorage.setItem(KEY, JSON.stringify({ groups: this.groups, raw: this.raw }))
      } catch {
        // التخزين ممتلئ أو محظور
      }
    },

    // الصفوف تتوالى بعد وصول البيانات
    animateRows() {
      if (this.hero && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        this.$nextTick(() => gsap.from(this.$refs.root.querySelectorAll('.hm-table tbody tr'), { x: 18, autoAlpha: 0, duration: 0.4, ease: 'power2.out', stagger: 0.03, clearProps: 'all' }))
      }
    },

    pctOf(n) {
      return pct(n, this.chartTotal)
    },

    /**
     * آخر تفاعل للمشرف: last_active_at (آخر استخدام للمنصة) + آخر مهمة أضافها لمجموعاته من latest_tasks.
     * ponytail: الخادم لا يوفّر سجل أفعال لكل مستخدم، فالنوع محصور في "إضافة مهمة" أو "دخول المنصة"؛
     * يتوسّع عند إضافة endpoint لسجل AuditLog حسب المستخدم.
     */
    lastInteraction(s, groups) {
      const ids = groups.map((g) => g.id)
      const task = this.tasks.filter((t) => ids.includes(t.groupId) && t.createdAt).sort((a, b) => b.createdAt.localeCompare(a.createdAt))[0]
      const active = s.lastActive ? new Date(s.lastActive) : null
      const taskAt = task ? new Date(task.createdAt) : null
      // المهمة هي آخر تفاعل إن لم يُسجَّل استخدام بعدها بأكثر من ساعة
      if (taskAt && (!active || active - taskAt < 3600000)) return { lastAt: task.createdAt, lastAction: `إضافة مهمة «${task.title}»` }
      if (active) return { lastAt: s.lastActive, lastAction: 'دخول واستخدام المنصة' }
      return { lastAt: null, lastAction: 'لا يوجد تفاعل بعد' }
    },

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
