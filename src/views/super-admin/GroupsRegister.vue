<template>
  <!-- سجل المجموعات للإدارة العامة — بيانات تجريبية (placeholder) بلا ربط بالخادم، بنمط بوابة الكلية (200639 → 200940):
       بطاقة بيضاء واحدة: عنوان + الفصل ← أزرار الإدارة ← التصنيف ← "حدد …" ← جدول برأس سماوي ← شريط ملخص أخضر ← أزرار الملفات
       رقم المجموعة = رقم الشعبة من ملف الاستيراد، والفرز الأساسي حسب التخصص -->
  <section class="gr gr-card">
    <header class="gr-card-head">
      <div class="gr-card-title">
        <h3>سجل المجموعات</h3>
        <span>{{ semesterName }}</span>
      </div>
      <div class="gr-card-actions"><slot name="actions" /></div>
    </header>

    <!-- التصنيف (يعمل كفلتر سريع) -->
    <div class="gr-classes" aria-label="تصنيف الطلاب والمجموعات">
      <div v-for="c in classes" :key="c.key" class="gr-class" role="radiogroup" :aria-label="c.label">
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

    <!-- "حدد …" بنمط البوابة: عنوان الحقل بجانبه -->
    <div class="gr-filters" aria-label="تصفية المجموعات">
      <label class="gr-search">
        <Search :size="16" />
        <input v-model.trim="q" type="search" placeholder="بحث برقم الشعبة، المشروع، المشرف أو الطالب…">
      </label>
      <label class="gr-pick">
        <span>حدد التخصص</span>
        <select v-model="f.spec" class="gr-select">
          <option value="">كل التخصصات</option>
          <option v-for="s in specOptions" :key="s" :value="s">{{ s }}</option>
        </select>
      </label>
      <label class="gr-pick">
        <span>حدد المشرف</span>
        <select v-model="f.sup" class="gr-select">
          <option value="">كل المشرفين</option>
          <option v-for="s in supList" :key="s.id" :value="s.id">{{ s.name }}</option>
        </select>
      </label>
      <label class="gr-pick">
        <span>حجم الفريق</span>
        <select v-model="f.size" class="gr-select">
          <option value="">من 1 حتى 4</option>
          <option v-for="n in 4" :key="n" :value="n">{{ n }} {{ n === 1 ? 'طالب' : 'طلاب' }}</option>
        </select>
      </label>
      <button v-if="hasFilters" type="button" class="gr-clear" @click="clearFilters">مسح الفلاتر</button>
    </div>

    <Transition :name="slideDir" mode="out-in">
      <div :key="page" class="gr-table-wrap">
        <table class="gr-table">
          <thead>
            <tr>
              <th class="w-12" aria-label="فتح" />
              <th>رقم المجموعة (الشعبة)</th>
              <th>المشروع</th>
              <th>المشرف</th>
              <th class="gr-hide-md">التخصص</th>
              <th class="gr-hide-md">الطلاب</th>
              <th>التقدّم</th>
            </tr>
          </thead>
          <tbody v-if="!rows.length">
            <tr><td colspan="7" class="gr-empty">{{ loading ? 'جارٍ تحميل المجموعات…' : 'لا توجد مجموعات مطابقة للفلاتر' }}</td></tr>
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
                </td>
                <td>{{ g.supName }}</td>
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
                <td colspan="7">
                  <div class="gr-detail">
                    <aside class="gr-side">
                      <h4>مهام المجموعة</h4>
                      <div class="gr-stats">
                        <div><b>{{ g.tasksTotal }}</b><span>موكلة</span></div>
                        <div><b>{{ g.done }}</b><span>منجزة</span></div>
                        <div><b>{{ g.tasksTotal - g.done }}</b><span>متبقية</span></div>
                      </div>
  
                      <h4>تفاعل المشرف مع المجموعة</h4>
                      <p class="gr-sup">
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
                      <p v-else class="gr-muted">{{ supLoading[g.supId] ? 'جارٍ تحميل نشاط المشرف…' : 'لا تتوفر بيانات نشاط' }}</p>
  
                      <h4>إضافة للمجموعة</h4>
                      <div class="gr-add-row">
                        <button v-for="(t, key) in ITEM_TYPES" :key="key" type="button" class="gr-tool" @click="openAdd(g, key)">
                          <component :is="t.icon" :size="15" /> {{ t.label }}
                        </button>
                      </div>
                    </aside>
  
                    <div class="gr-members">
                      <table>
                        <thead>
                          <tr><th>الطالب</th><th>الرقم الجامعي</th><th>الجنس</th><th>مكان التواجد</th><th>المهام</th><th>التقدّم</th></tr>
                        </thead>
                        <tbody>
                          <tr v-for="m in g.shown" :key="m.id">
                            <td><button type="button" class="gr-member-name gr-link" title="عرض بروفايل الطالب" @click="openPerson('student', m.id, m.name)">{{ m.name }}</button></td>
                            <td><span class="mono">{{ m.uni }}</span></td>
                            <td>{{ GENDERS[m.gender] }}</td>
                            <td>{{ REGIONS[m.region] }}</td>
                            <td><span class="mono">{{ m.done }}/{{ m.total }}</span></td>
                            <td>
                              <span class="gr-progress is-sm"><span :class="levelClass(m.percentage)" :style="{ width: m.percentage + '%' }" /></span>
                              <span class="gr-pct">{{ m.percentage }}%</span>
                            </td>
                          </tr>
                        </tbody>
                      </table>
  
                      <table class="gr-items">
                        <thead><tr><th>المهام والإعلانات والملفات</th><th>النوع</th><th>التاريخ</th><th>موعد التسليم</th></tr></thead>
                        <tbody>
                          <tr v-if="!timelines[g.id] || timelines[g.id].loading"><td colspan="4" class="gr-muted">جارٍ التحميل…</td></tr>
                          <tr v-else-if="!g.timeline.length"><td colspan="4" class="gr-muted">لا توجد مهام أو إعلانات بعد</td></tr>
                          <tr v-for="i in g.timeline" :key="i.key">
                            <td>{{ i.title }}</td>
                            <td><span :class="['rv-pill', i.pill]">{{ i.kind }}</span></td>
                            <td><span class="mono">{{ i.date }}</span></td>
                            <td><span class="mono">{{ i.due || '—' }}</span></td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>
                </td>
              </tr>
            </tbody>
          </template>
        </table>
      </div>
    </Transition>

    <!-- شريط الملخص الأخضر أسفل الجدول (نمط "المعدل الفصلي" في البوابة) -->
    <div class="gr-sumbar">
      <span>عدد المجموعات: {{ rows.length }}</span>
      <span>عدد الطلاب: {{ studentsCount }}</span>
      <span>متوسط التقدّم: {{ avgProgress }}%</span>
    </div>

    <!-- شرائح: 7 مجموعات في كل شريحة -->
    <nav v-if="lastPage > 1" class="gr-slider" aria-label="شرائح المجموعات">
      <button type="button" class="gr-slide-btn" :disabled="page === 1" aria-label="الشريحة السابقة" @click="go(page - 1)"><ChevronRight :size="18" /></button>
      <div class="gr-dots">
        <button
          v-for="p in lastPage" :key="p" type="button" :class="p === page && 'is-active'"
          :aria-label="`الشريحة ${p}`" :aria-current="p === page ? 'true' : undefined" @click="go(p)"
        />
      </div>
      <button type="button" class="gr-slide-btn" :disabled="page === lastPage" aria-label="الشريحة التالية" @click="go(page + 1)"><ChevronLeft :size="18" /></button>
      <span class="gr-slide-info">المجموعات {{ (page - 1) * pageSize + 1 }}–{{ Math.min(page * pageSize, rows.length) }} من {{ rows.length }}</span>
    </nav>

    <!-- أزرار الملفات أسفل البطاقة: الطباعة خضراء والتصدير سماوي (نمط "طباعة الجدول" / "للإطلاع على الخطة") -->
    <footer class="gr-card-foot">
      <button type="button" class="pbtn is-green" :disabled="!rows.length || !!exporting" @click="exportRoster">
        <Printer :size="17" /> {{ exporting === 'roster' ? 'جارٍ التجهيز…' : 'طباعة كشف الشعب' }}
      </button>
      <button type="button" class="pbtn is-cyan" :disabled="!rows.length || !!exporting" @click="exportExcel">
        <FileSpreadsheet :size="17" /> {{ exporting === 'excel' ? 'جارٍ التجهيز…' : 'تصدير Excel' }}
      </button>
    </footer>

    <ProfileModal v-model="profile.open" :kind="profile.kind" :person-id="profile.id" :name="profile.name" />

    <!-- إضافة مهمة / إعلان / ملف (محلي فقط) -->
    <BaseModal v-model="add.open" :title="add.group ? `${ITEM_TYPES[add.type].label} — ${add.group.name}` : ''" size="md">
      <form id="gr-add-form" class="gr-form" @submit.prevent="saveAdd">
        <label>
          <span>{{ add.type === 'file' ? 'وصف الملف' : 'العنوان' }}</span>
          <input v-model.trim="add.title" required class="gr-input">
        </label>
        <label v-if="add.type === 'announcement'">
          <span>نص الإعلان</span>
          <textarea v-model.trim="add.body" rows="4" required class="gr-input" />
        </label>
        <template v-if="add.type === 'task'">
          <label>
            <span>موعد التسليم</span>
            <input v-model="add.due" type="date" required class="gr-input">
          </label>
          <fieldset>
            <legend>المكلّفون (بدون اختيار = كل الفريق)</legend>
            <label v-for="m in add.group.members" :key="m.id" class="gr-check">
              <input v-model="add.assignees" type="checkbox" :value="m.id"> {{ m.name }}
            </label>
          </fieldset>
        </template>
        <label v-if="add.type === 'file'">
          <span>الملف</span>
          <input type="file" required class="gr-input" @change="add.file = $event.target.files[0] || null">
        </label>
      </form>
      <template #footer>
        <button type="button" class="gr-tool" @click="add.open = false">إلغاء</button>
        <button type="submit" form="gr-add-form" class="gr-tool is-primary" :disabled="add.saving">{{ add.saving ? 'جارٍ الحفظ…' : 'حفظ' }}</button>
      </template>
    </BaseModal>
  </section>
</template>

<script>
import { Search, ChevronLeft, ChevronRight, FileSpreadsheet, Printer, ListTodo, Megaphone, Paperclip } from 'lucide-vue-next'
import BaseModal from '@/components/ui/BaseModal.vue'
import ProfileModal from '@/components/shared/ProfileModal.vue'
import { DEGREES, GENDERS, REGIONS, PROJECT_STATUS as STATUS, level } from '@/utils/progressData'
import { exportRosterPdf } from '@/utils/ucasReports'
import { exportStyledExcel } from '@/utils/exportReport'
import api from '@/services/api'

import { loadGroups, loadSupervisors, loadGroupTimeline, activeSemesterName } from '@/services/adminData'

const ITEM_TYPES = {
  task: { label: 'مهمة', icon: ListTodo, pill: 'is-pending' },
  announcement: { label: 'إعلان', icon: Megaphone, pill: 'is-approved' },
  file: { label: 'ملف', icon: Paperclip, pill: 'is-rejected' }
}

const EMPTY_FILTERS = { degree: '', gender: '', region: '', spec: '', sup: '', size: '' }

export default {
  name: 'GroupsRegister',

  components: { Search, ChevronLeft, ChevronRight, FileSpreadsheet, Printer, BaseModal, ProfileModal },

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
      f: { ...EMPTY_FILTERS },
      openIds: [],
      page: 1,
      pageSize: 7,
      slideDir: 'gr-slide-next',
      exporting: '',
      add: { open: false, saving: false, group: null, type: 'task', title: '', body: '', due: '', assignees: [], file: null },
      profile: { open: false, kind: 'student', id: null, name: '' }
    }
  },

  computed: {
    semesterName() {
      return activeSemesterName()
    },

    groups() {
      return this.list.map((g) => {
        const shown = g.members.filter((m) => (!this.f.gender || m.gender === this.f.gender) && (!this.f.region || m.region === this.f.region))
        const act = this.supProfiles[g.supId]?.interaction?.teams?.find((t) => t.team.id === g.id)?.interaction || null
        const tl = this.timelines[g.id] || { tasks: [], announcements: [] }
        const timeline = [
          ...tl.tasks.map((t) => ({ key: `t${t.id}`, title: t.title, kind: 'مهمة', pill: ITEM_TYPES.task.pill, date: t.issued, due: t.due })),
          ...tl.announcements.map((a) => ({ key: `a${a.id}`, title: [a.title, a.body].filter(Boolean).join(' — '), kind: 'إعلان', pill: ITEM_TYPES.announcement.pill, date: String(a.created_at || '').slice(0, 10) }))
        ].sort((x, y) => y.date.localeCompare(x.date))
        return { ...g, shown, act, timeline }
      })
    },

    specOptions() {
      return [...new Set(this.groups.map((g) => g.spec))]
    },

    /** التصنيف مع أعداد الطلاب في كل فئة */
    classes() {
      const all = this.groups.flatMap((g) => g.members.map((m) => ({ ...m, degree: g.degree })))
      const opts = (key, labels) => [
        { value: '', label: 'الكل', count: all.length },
        ...Object.entries(labels).map(([value, label]) => ({ value, label, count: all.filter((m) => m[key] === value).length }))
      ]
      return [
        { key: 'degree', label: 'الدرجة', options: opts('degree', DEGREES) },
        { key: 'gender', label: 'الجنس', options: opts('gender', { male: 'طلاب', female: 'طالبات' }) },
        { key: 'region', label: 'مكان التواجد', options: opts('region', REGIONS) }
      ]
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

    lastPage() {
      return Math.max(1, Math.ceil(this.rows.length / this.pageSize))
    },

    pageRows() {
      const start = (this.page - 1) * this.pageSize
      return this.rows.slice(start, start + this.pageSize)
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

  watch: {
    rows() {
      if (this.page > this.lastPage) this.page = 1
    }
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

    openAdd(g, type) {
      this.add = { open: true, saving: false, group: g, type, title: '', body: '', due: '', assignees: [], file: null }
    },

    /** إضافة مهمة / إعلان / ملف للمجموعة عبر الـ API ثم تحديث تفاصيلها وتقدّمها */
    async saveAdd() {
      const { group, type, title, body, due, assignees, file } = this.add
      this.add.saving = true
      try {
        if (type === 'task') {
          await api.post(`/teams/${group.id}/tasks`, { title, description: body || null, due_date: due || null, ...(assignees.length ? { assignee_ids: assignees } : {}) })
        } else if (type === 'announcement') {
          await api.post(`/teams/${group.id}/announcements`, { title: title || null, body })
        } else {
          if (!group.projectId) throw new Error('المجموعة بلا مشروع مسجّل — لا يمكن رفع ملف')
          const fd = new FormData()
          fd.append('file', file)
          if (title) fd.append('stage', title)
          await api.post(`/projects/${group.projectId}/files`, fd, { headers: { 'Content-Type': 'multipart/form-data' } })
        }
        this.add.open = false
        this.$toast?.success(`تمت إضافة ${ITEM_TYPES[type].label} إلى ${group.name}`)
        this.loadTimeline(group.id, true)
        if (type === 'task') this.list = await loadGroups()
      } catch (err) {
        this.$toast?.error(err.normalized?.message || err.message || 'تعذّر الحفظ')
      } finally {
        this.add.saving = false
      }
    },

    go(p) {
      this.slideDir = p > this.page ? 'gr-slide-next' : 'gr-slide-prev'
      this.page = p
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

    async exportRoster() {
      this.exporting = 'roster'
      try {
        await exportRosterPdf(this.rows.map((g) => ({ ...g, members: g.shown })))
      } finally {
        this.exporting = ''
      }
    }
  }
}
</script>
