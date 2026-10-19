<template>
  <!-- سجل المجموعات للإدارة العامة — بيانات تجريبية (placeholder) بلا ربط بالخادم، بنمط بوابة الكلية (200639 → 200940):
       بطاقة بيضاء واحدة: عنوان + الفصل ← أزرار الإدارة ← التصنيف ← "حدد …" ← جدول برأس سماوي ← شريط ملخص أخضر ← أزرار الملفات
       رقم المجموعة = رقم الشعبة من ملف الاستيراد، والفرز الأساسي حسب التخصص -->
  <section class="gr gr-card">
    <header class="gr-card-head">
      <div class="gr-card-title">
        <span class="dash-chip">{{ semesterName }}</span>
        <span class="dash-chip">{{ rows.length }} مجموعة</span>
      </div>
      <div class="gr-card-actions">
        <slot name="actions" />
        <BaseButton v-if="!isSupervisor" variant="outline" :icon="FileSpreadsheet" :disabled="!rows.length || !!exporting" @click="exportExcel">
          {{ exporting === 'excel' ? 'جارٍ التجهيز…' : 'تصدير Excel' }}
        </BaseButton>
        <BaseButton variant="outline" :icon="Printer" :disabled="!rows.length || !!exporting" @click="exportSupReport">
          {{ exporting === 'sups' ? 'جارٍ التجهيز…' : isSupervisor ? 'طباعة تقرير المجموعات' : 'طباعة تقرير المشرفين' }}
        </BaseButton>
      </div>
    </header>

    <div class="gr-filters" aria-label="تصفية المجموعات">
      <label class="gr-search">
        <Search :size="16" />
        <input v-model.trim="q" type="search" placeholder="بحث برقم الشعبة، المشروع، المشرف أو الطالب…">
      </label>
      <!-- المشرف يرى مجموعاته فقط: فلترا الدرجة والمكان والتخصص والمشرف والحجم بلا معنى له -->
      <BaseSelect v-if="userRole !== 'supervisor'" v-model="f.degree" class="min-w-[140px]" aria-label="الدرجة" placeholder="كل الدرجات" include-placeholder-option :options="degreeSelectOptions" />
      <BaseSelect v-model="f.gender" class="min-w-[140px]" aria-label="الفئة" placeholder="طلاب وطالبات" include-placeholder-option :options="genderSelectOptions" />
      <BaseSelect v-if="userRole !== 'supervisor'" v-model="f.region" class="min-w-[150px]" aria-label="مكان التواجد" placeholder="كل المناطق" include-placeholder-option :options="regionSelectOptions" />
      <BaseSelect v-if="userRole !== 'supervisor'" v-model="f.spec" class="min-w-[170px]" aria-label="التخصص" placeholder="كل التخصصات" include-placeholder-option :options="specSelectOptions" />
      <!-- المشرف يرى مجموعاته فقط: فلتر المشرف بلا معنى له -->
      <BaseSelect v-if="userRole !== 'supervisor'" v-model="f.sup" class="min-w-[180px]" aria-label="المشرف" placeholder="كل المشرفين" include-placeholder-option :options="supSelectOptions" />
      <!-- المشرف: فلترа التخصص والجنس فقط -->
      <BaseSelect v-if="userRole !== 'supervisor'" v-model="f.size" class="min-w-[140px]" aria-label="حجم الفريق" placeholder="حجم الفريق" include-placeholder-option :options="sizeSelectOptions" />
      <BaseSelect v-model="pageSize" class="min-w-[110px]" aria-label="عدد الصفوف" :options="pageSizeOptions" />
    </div>

    <SlideTable :rows="rows" :size="pageSize" label="المجموعات">
      <template #default="{ rows: pageRows }">
        <div class="gr-table-wrap">
          <table class="gr-table">
            <thead>
              <tr>
                <th class="w-12" aria-label="فتح" />
                <th data-rt-title>رقم المجموعة</th>
                <th data-rt-show>المشروع</th>
                <th v-if="!isSupervisor" data-rt-show>المشرف</th>
                <th class="gr-hide-md">التخصص</th>
                <th class="gr-hide-md">الطلاب</th>
                <th>التقدّم</th>
              </tr>
            </thead>
            <tbody v-if="!rows.length">
              <SkeletonLoader v-if="loading" variant="table" :cols="isSupervisor ? 6 : 7" :rows="8" />
              <tr v-else><td :colspan="isSupervisor ? 6 : 7" class="gr-empty">لا توجد مجموعات مطابقة للفلاتر</td></tr>
            </tbody>
            <template v-else>
              <tbody v-for="g in pageRows" :key="g.id" :class="['gr-group', isOpen(g.id) && 'is-open']">
                <tr class="gr-row" @click="toggle(g)">
                  <td>
                    <button type="button" class="gr-toggle" :aria-expanded="isOpen(g.id)" :aria-label="`تفاصيل ${g.name}`" @click.stop="toggle(g)">
                      <ChevronLeft :size="16" />
                    </button>
                  </td>
                  <td><span class="gr-section">{{ g.section }}</span></td>
                  <td class="gr-name-cell">
                    <span class="gr-name">{{ g.project }}</span>
                    <span class="gr-project">{{ STATUS[g.projectStatus] }}</span>
                    <span v-if="g.types.length" class="gr-types">{{ g.types.join(' · ') }}</span>
                  </td>
                  <td v-if="!isSupervisor">{{ g.supName }}</td>
                  <td class="gr-hide-md">
                    <span class="gr-spec">{{ g.spec }}</span>
                    <span class="gr-degree">{{ DEGREES[g.degree] }}</span>
                  </td>
                  <td class="gr-hide-md">
                    <span class="gr-students" :title="g.shown.map((m) => m.name).join('، ')">{{ g.shown.map((m) => m.name.split(' ')[0]).join('، ') }}</span>
                    <span class="gr-count">{{ g.members.length }}/4</span>
                  </td>
                  <td>
                    <span class="gr-progress"><span :class="levelClass(g.percentage)" :style="{ width: g.percentage + '%' }" /></span>
                    <span class="gr-pct">{{ g.percentage }}%</span>
                  </td>
                </tr>
  
                <tr v-if="isOpen(g.id)" class="gr-detail-row">
                  <td :colspan="isSupervisor ? 6 : 7">
                    <div class="gr-detail">
                      <div class="gr-members gr-detail-full">
                        <table>
                          <thead>
                            <tr><th>الطالب</th><th>الرقم الجامعي</th><th>الجنس</th><th>مكان التواجد</th><th v-if="isSupervisor">واتساب</th><th v-if="isSupervisor">البريد</th><th>المهام</th><th>التقدّم</th></tr>
                          </thead>
                          <tbody>
                            <tr v-for="m in g.shown" :key="m.id">
                              <td><button type="button" class="gr-member-name gr-link" title="عرض بروفايل الطالب" @click="openPerson('student', m.id, m.name)"><span class="gm-av" aria-hidden="true">{{ m.name.charAt(0) }}</span>{{ m.name }}</button></td>
                              <td><span class="mono">{{ m.uni }}</span></td>
                              <td><span :class="['gm-chip', m.gender === 'female' && 'is-f']">{{ GENDERS[m.gender] || '—' }}</span></td>
                              <td>{{ REGIONS[m.region] || '—' }}</td>
                              <td v-if="isSupervisor"><span class="mono">{{ m.whatsapp || '—' }}</span></td>
                              <td v-if="isSupervisor"><span class="mono">{{ m.email || '—' }}</span></td>
                              <td><span class="mono">{{ m.done }}/{{ m.total }}</span></td>
                              <td>
                                <span class="gr-progress is-sm"><span :class="levelClass(m.percentage)" :style="{ width: m.percentage + '%' }" /></span>
                                <span class="gr-pct">{{ m.percentage }}%</span>
                              </td>
                            </tr>
                          </tbody>
                        </table>
                      </div>
                      <aside class="gr-side">
                        <!-- المشرف: الشعبة ووصف المشروع (المطلوب في صفحة المجموعات) -->
                        <template v-if="isSupervisor">
                          <h4>الشعبة</h4>
                          <p class="gr-sup">{{ g.section }}</p>
                          <h4>وصف المشروع</h4>
                          <p class="gr-desc">{{ g.description || 'لا يوجد وصف' }}</p>
                        </template>
                        <h4>مهام المجموعة</h4>
                        <div class="gr-stats">
                          <div><b>{{ g.tasksTotal }}</b><span>موكلة</span></div>
                          <div><b>{{ g.done }}</b><span>منجزة</span></div>
                          <div><b>{{ g.tasksTotal - g.done }}</b><span>متبقية</span></div>
                        </div>
  
                        <h4>نوع المشروع</h4>
                        <!-- يحدده الطالب مع المقترح ويعدّله المشرف فقط (الخادم يقصر تعديل النوع عليه) -->
                        <ProjectTypes
                          class="gr-ptypes" :project-id="g.projectId" :types="g.types" :editable="userRole === 'supervisor' && !!g.projectId"
                          @saved="(types) => { g.types = types; g.type = types.join('، ') }"
                        />

                        <!-- نفس تفاصيل الإدارة العامة للمشرف أيضًا، على مجموعاته فقط -->
                        <h4>{{ isSupervisor ? 'تفاعلي مع المجموعة' : 'تفاعل المشرف مع المجموعة' }}</h4>
                        <p v-if="!isSupervisor" class="gr-sup">
                          <button type="button" class="gr-link" title="عرض بروفايل المشرف" @click="openPerson('supervisor', g.supId, g.supName)">{{ g.supName }}</button>
                        </p>
                        <template v-if="g.act">
                          <div class="gr-activity">
                            <span class="gr-progress"><span :class="levelClass(g.act.activity_score)" :style="{ width: g.act.activity_score + '%' }" /></span>
                            <span class="gr-pct">{{ g.act.activity_score }}%</span>
                          </div>
                          <dl class="gr-kv">
                            <div><dt>الاجتماعات</dt><dd>{{ g.act.meetings_count ?? 0 }}</dd></div>
                            <div><dt>الملاحظات على المهام</dt><dd>{{ g.act.notes_count ?? 0 }}</dd></div>
                            <div><dt>الملفات المرفوعة</dt><dd>{{ g.act.files_count ?? 0 }}</dd></div>
                          </dl>
                        </template>
                        <SkeletonLoader v-else-if="supLoading[g.supId]" :rows="3" />
                        <p v-else class="gr-muted">لا تتوفر بيانات نشاط</p>
  
                      </aside>
                      <div class="gr-members gr-timeline">
                        <header class="tl-head">
                          <h4>المهام والإعلانات والملفات</h4>
                          <span class="tl-count">{{ g.timeline.length }}</span>
                        </header>
                        <!-- القسم كاملًا يتمرّر (الرأس ثابت أعلاه) بشريط رفيع بهوية مسار -->
                        <div class="tl-wrap">
                          <SkeletonLoader v-if="!timelines[g.id] || timelines[g.id].loading" :rows="4" height="46px" />
                          <p v-else-if="!g.timeline.length" class="tl-empty">لا توجد مهام أو إعلانات بعد</p>
                          <ul v-else class="tl-list">
                            <li v-for="i in g.timeline" :key="i.key" :class="'is-' + i.type">
                              <span class="tl-ic"><component :is="ITEM_TYPES[i.type].icon" :size="16" /></span>
                              <div class="tl-body">
                                <b :title="i.title">{{ i.title }}</b>
                                <span class="tl-meta">
                                  <span>{{ i.kind }}</span>
                                  <span class="mono">{{ i.date }}</span>
                                  <span v-if="i.due" class="tl-due">التسليم <span class="mono">{{ i.due }}</span></span>
                                </span>
                              </div>
                              <span v-if="i.status" :class="['rv-pill', i.status.pill]">{{ i.status.label }}</span>
                            </li>
                          </ul>
                        </div>
                        </div>
                      </div>
                  </td>
                </tr>
              </tbody>
            </template>
          </table>
        </div>
      </template>

      <!-- شريط الملخص الأخضر أسفل الجدول (نمط "المعدل الفصلي" في البوابة) -->
      <template #after>
        <div class="gr-sumbar">
          <span>عدد المجموعات: {{ rows.length }}</span>
          <span>عدد الطلاب: {{ studentsCount }}</span>
          <span>متوسط التقدّم: {{ avgProgress }}%</span>
        </div>
      </template>
    </SlideTable>


    <ProfileModal v-model="profile.open" :kind="profile.kind" :person-id="profile.id" :name="profile.name" />

    <!-- إضافة مهمة / إعلان / ملف (محلي فقط) -->
  </section>
</template>

<script>
import SlideTable from '@/components/ui/SlideTable.vue'
import ProjectTypes from '@/components/shared/ProjectTypes.vue'
import BaseSelect from '@/components/ui/BaseSelect.vue'
import BaseButton from '@/components/ui/BaseButton.vue'
import { Search, ChevronLeft, FileSpreadsheet, Printer, ListTodo, Megaphone, Paperclip } from 'lucide-vue-next'
import ProfileModal from '@/components/shared/ProfileModal.vue'
import { DEGREES, GENDERS, REGIONS, PROJECT_STATUS as STATUS, level } from '@/utils/progressData'
import { exportSupervisorsPdf } from '@/utils/ucasReports'
import { exportStyledExcel } from '@/utils/exportReport'
import api from '@/services/api'
import { mapState } from 'pinia'
import { useAuthStore } from '@/stores/auth.store'

import { loadGroups, loadSupervisors, loadGroupTimeline, activeSemesterName } from '@/services/adminData'

/** حالة المهمة في القائمة: مكتملة / متأخرة (تجاوزت موعدها) / جارية */
const taskStatus = (t) => {
  if (t.status === 'done') return { label: 'مكتملة', pill: 'is-approved' }
  if (t.due && t.due < new Date().toISOString().slice(0, 10)) return { label: 'متأخرة', pill: 'is-rejected' }
  return { label: 'جارية', pill: 'is-pending' }
}

const ITEM_TYPES = {
  task: { label: 'مهمة', icon: ListTodo, pill: 'is-pending' },
  announcement: { label: 'إعلان', icon: Megaphone, pill: 'is-approved' },
  file: { label: 'ملف', icon: Paperclip, pill: 'is-rejected' }
}

const EMPTY_FILTERS = { degree: '', gender: '', region: '', spec: '', sup: '', size: '' }

export default {
  name: 'GroupsRegister',

  components: { SlideTable, ProjectTypes, BaseSelect, BaseButton, Search, ChevronLeft, FileSpreadsheet, Printer, ProfileModal },

  data() {
    return {
      DEGREES, GENDERS, REGIONS, STATUS, ITEM_TYPES,
      loading: true,
      list: [],
      supList: [],
      timelines: {},
      supProfiles: {},
      supLoading: {},
      q: '',
      pageSize: 25,
      pageSizeOptions: [
        { value: 25, label: 'عرض 25' },
        { value: 50, label: 'عرض 50' },
        { value: 100, label: 'عرض 100' }
      ],
      f: { ...EMPTY_FILTERS },
      openIds: [],
      exporting: '',
      profile: { open: false, kind: 'student', id: null, name: '' }
    }
  },

  computed: {
    ...mapState(useAuthStore, ['userRole']),
    /** المشرف: مجموعاته فقط (من الخادم) وبصلاحياته — بيانات الطلاب كاملة وأماكنهم، المشروع ووصفه ونوعه، الشعبة، طباعة تقرير */
    isSupervisor() {
      return this.userRole === 'supervisor'
    },
    semesterName() {
      return activeSemesterName()
    },

    groups() {
      return this.list.map((g) => {
        const shown = g.members.filter((m) => (!this.f.gender || m.gender === this.f.gender) && (!this.f.region || m.region === this.f.region))
        const act = this.supProfiles[g.supId]?.interaction?.teams?.find((t) => t.team.id === g.id)?.interaction || null
        const tl = this.timelines[g.id] || { tasks: [], announcements: [] }
        const timeline = [
          ...tl.tasks.map((t) => ({ key: `t${t.id}`, type: 'task', title: t.title, kind: 'مهمة', date: t.issued, due: t.due, status: taskStatus(t) })),
          ...tl.announcements.map((a) => ({ key: `a${a.id}`, type: 'announcement', title: [a.title, a.body].filter(Boolean).join(' — '), kind: 'إعلان', date: String(a.created_at || '').slice(0, 10) }))
        ].sort((x, y) => y.date.localeCompare(x.date))
        return { ...g, shown, act, timeline }
      })
    },

    specOptions() {
      return [...new Set(this.groups.map((g) => g.spec))]
    },

    specSelectOptions() {
      return this.specOptions.map((s) => ({ value: s, label: s }))
    },
    supSelectOptions() {
      return this.supList.map((s) => ({ value: s.id, label: s.name }))
    },
    sizeSelectOptions() {
      return [1, 2, 3, 4].map((n) => ({ value: n, label: `${n} ${n === 1 ? 'طالب' : 'طلاب'}` }))
    },

    /** التصنيف مع أعداد الطلاب في كل فئة */
    degreeSelectOptions() {
      return Object.entries(DEGREES).map(([value, label]) => ({ value, label }))
    },
    genderSelectOptions() {
      return [
        { value: 'male', label: 'طلاب' },
        { value: 'female', label: 'طالبات' }
      ]
    },
    regionSelectOptions() {
      return Object.entries(REGIONS).map(([value, label]) => ({ value, label }))
    },

    /** وصف الفلترة الحالية لتقرير المشرفين (مثل: بكالوريوس · طالبات · غزة) */
    filterLabel() {
      const f = this.f
      return [
        DEGREES[f.degree], { male: 'طلاب', female: 'طالبات' }[f.gender], REGIONS[f.region], f.spec,
        this.supList.find((s) => s.id === f.sup)?.name, f.size && `${f.size} طلاب`, this.q && `بحث: ${this.q}`
      ].filter(Boolean).join(' · ')
    },

    hasFilters() {
      return !!this.q || Object.values(this.f).some(Boolean)
    },

    /** التخصص هو معيار الفرز الأساسي، ثم الدرجة، ثم رقم الشعبة */
    rows() {
      const q = this.q
      const f = this.f
      return this.groups
        .filter((g) => {
          if (q && !`${g.section} ${g.project} ${g.supName} ${g.members.map((m) => m.name).join(' ')}`.includes(q)) return false
          if (f.degree && g.degree !== f.degree) return false
          if (f.spec && g.spec !== f.spec) return false
          if (f.sup && g.supId !== f.sup) return false
          if (f.size && g.members.length !== Number(f.size)) return false
          return g.shown.length > 0
        })
        .sort((a, b) => a.spec.localeCompare(b.spec, 'ar') || a.degree.localeCompare(b.degree) || a.section.localeCompare(b.section, 'en', { numeric: true }))
    },


    studentsCount() {
      return this.rows.reduce((n, g) => n + g.shown.length, 0)
    },

    avgProgress() {
      if (!this.rows.length) return 0
      return Math.round(this.rows.reduce((n, g) => n + g.percentage, 0) / this.rows.length)
    }
  },

  async created() {
    try {
      this.list = await loadGroups()
    } catch {
      this.$toast?.error('تعذّر تحميل المجموعات')
    } finally {
      this.loading = false
    }
    this.supList = await loadSupervisors(this.list)
  },

  methods: {
    isOpen(id) {
      return this.openIds.includes(id)
    },

    toggle(g) {
      if (this.isOpen(g.id)) {
        this.openIds = this.openIds.filter((x) => x !== g.id)
        return
      }
      this.openIds = [...this.openIds, g.id]
      this.loadTimeline(g.id)
      this.loadSupProfile(g.supId)
    },

    /** مهام وإعلانات المجموعة (GET /teams/{id}/tasks + /announcements) */
    async loadTimeline(id, force = false) {
      if (this.timelines[id] && !force) return
      this.timelines = { ...this.timelines, [id]: { loading: true, tasks: [], announcements: [] } }
      this.timelines = { ...this.timelines, [id]: { loading: false, ...(await loadGroupTimeline(id)) } }
    },

    /** تفاعل المشرف مع كل مجموعة (GET /supervisors/{id}/profile → interaction.teams) */
    async loadSupProfile(id) {
      if (!id || this.supProfiles[id] || this.supLoading[id]) return
      this.supLoading = { ...this.supLoading, [id]: true }
      try {
        const { data } = await api.get(`/supervisors/${id}/profile`)
        this.supProfiles = { ...this.supProfiles, [id]: data }
      } catch {
        // تظهر "لا تتوفر بيانات نشاط"
      } finally {
        this.supLoading = { ...this.supLoading, [id]: false }
      }
    },

    clearFilters() {
      this.q = ''
      this.f = { ...EMPTY_FILTERS }
    },

    levelClass: level,

    openPerson(kind, id, name) {
      if (id) this.profile = { open: true, kind, id, name }
    },

    async exportExcel() {
      this.exporting = 'excel'
      try {
        await exportStyledExcel({
          fileName: 'مجموعات-مشاريع-التخرج.xlsx',
          sheetTitle: 'المجموعات',
          columns: [
            { key: 'section', label: 'الشعبة', width: 12 },
            { key: 'spec', label: 'التخصص' },
            { key: 'degree', label: 'الدرجة', width: 14 },
            { key: 'project', label: 'المشروع', width: 30 },
            { key: 'sup', label: 'المشرف' },
            { key: 'name', label: 'الطالب', width: 26 },
            { key: 'uni', label: 'الرقم الجامعي', width: 16 },
            { key: 'gender', label: 'الجنس', width: 10 },
            { key: 'region', label: 'مكان التواجد', width: 14 },
            { key: 'progress', label: 'التقدّم', width: 10 }
          ],
          rowGroups: this.rows.map((g) => g.shown.map((m) => ({
            section: g.section, spec: g.spec, degree: DEGREES[g.degree], project: g.project, sup: g.supName,
            name: m.name, uni: m.uni, gender: GENDERS[m.gender], region: REGIONS[m.region], progress: `${m.percentage}%`
          }))),
          mergeKeys: ['section', 'spec', 'degree', 'project', 'sup']
        })
      } finally {
        this.exporting = ''
      }
    },

    /** تقرير كل مشرف ومجموعاته (نوع المشروع، الدرجة، طلاب/طالبات، مكان التواجد) — بنفس الفلترة الحالية */
    async exportSupReport() {
      this.exporting = 'sups'
      try {
        await exportSupervisorsPdf(this.rows.map((g) => ({ ...g, members: g.shown })), this.supList, this.filterLabel)
      } finally {
        this.exporting = ''
      }
    }
  }
}
</script>
