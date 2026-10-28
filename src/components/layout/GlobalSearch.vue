<template>
  <!-- بحث شامل عميق في التوب بار (الإدارة العامة + لجنة الإشراف):
       أوامر مباشرة · مشاريع (بالاسم) · مجموعات · طلاب (بالاسم/الرقم الجامعي/الواتساب) ·
       مشرفون (بالاسم/التخصص/الواتساب) · مهام (بالاسم) · إعلانات وتكليفات (بالعنوان/النص).
       الأمر يُنفَّذ مباشرة، والشخص يفتح بروفايله، والمجموعة تفتح في صفحتها،
       والمشروع/المهمة/الإعلان يفتح في نافذة تفاصيل فيها زر «فتح الصفحة» حين توجد صفحة له. -->
  <div ref="root" class="gsearch">
    <label class="gsearch-field" :class="open && 'is-focus'">
      <Search :size="16" />
      <input
        ref="input" v-model.trim="q" type="search" :placeholder="placeholder"
        role="combobox" aria-label="بحث شامل" :aria-expanded="open" aria-controls="gsearch-list" autocomplete="off"
        @focus="onFocus" @keydown.down.prevent="move(1)" @keydown.up.prevent="move(-1)" @keydown.enter.prevent="runActive" @keydown.esc="close"
      >
    </label>

    <transition name="portal-drop">
      <div v-if="open && q" id="gsearch-list" class="gsearch-panel" role="listbox">
        <p v-if="loading" class="gsearch-note">جارٍ تحضير البحث…</p>
        <p v-else-if="!flat.length" class="gsearch-note">لا نتائج لـ «{{ q }}»</p>
        <template v-else>
          <section v-for="sec in sections" :key="sec.key" class="gsearch-sec">
            <h4>{{ sec.title }}</h4>
            <button
              v-for="it in sec.items" :key="it._id" type="button" role="option" :aria-selected="activeId === it._id"
              :class="['gsearch-item', activeId === it._id && 'is-active']" @mousemove="activeId = it._id" @click="run(it)"
            >
              <span class="gsearch-ic"><component :is="it.icon" :size="16" /></span>
              <span class="gsearch-main"><b>{{ it.label }}</b><small v-if="it.sub">{{ it.sub }}</small></span>
              <span class="gsearch-tag">{{ sec.tag }}</span>
            </button>
          </section>
        </template>
      </div>
    </transition>

    <!-- بروفايل الطالب/المشرف -->
    <ProfileModal v-model="profileOpen" :kind="profileKind" :person-id="profileId" :name="profileName" />

    <!-- تفاصيل المشروع / المهمة / الإعلان (قراءة فقط، مع زر فتح الصفحة حين تتوفّر) -->
    <BaseModal v-model="detailOpen" :title="detail ? detail.label : ''" :size="detail && detail.kind === 'announcement' ? 'lg' : 'md'">
      <template v-if="detail && detail.kind === 'project'">
        <dl class="sv-info gsearch-detail">
          <div><dt>الشعبة :</dt><dd>{{ detail.section || '—' }}</dd></div>
          <div><dt>المشرف :</dt><dd>{{ detail.supName || '—' }}</dd></div>
          <div><dt>التخصص :</dt><dd>{{ [detail.spec, DEGREES[detail.degree]].filter(Boolean).join(' · ') || '—' }}</dd></div>
          <div><dt>حالة المشروع :</dt><dd>{{ PROJECT_STATUS[detail.status] || '—' }}</dd></div>
          <div><dt>عدد الطلاب :</dt><dd>{{ detail.membersCount }}</dd></div>
          <div v-if="detail.description"><dt>الوصف :</dt><dd>{{ detail.description }}</dd></div>
        </dl>
      </template>

      <template v-else-if="detail && detail.kind === 'task'">
        <dl class="sv-info gsearch-detail">
          <div><dt>الحالة :</dt><dd>{{ TASK_STATUS[detail.status] || detail.status }}</dd></div>
          <div><dt>الجهة :</dt><dd>{{ detail.group || '—' }}</dd></div>
          <div><dt>المكلّفون :</dt><dd>{{ detail.assigneeNames || '—' }}</dd></div>
          <div><dt>تاريخ التسليم :</dt><dd>{{ detail.due ? formatDate(detail.due) : 'بلا موعد' }}</dd></div>
          <div v-if="detail.description"><dt>الوصف :</dt><dd class="gsearch-detail-body">{{ detail.description }}</dd></div>
        </dl>
      </template>

      <template v-else-if="detail && detail.kind === 'announcement'">
        <dl class="sv-info gsearch-detail">
          <div><dt>النوع :</dt><dd>{{ ANN_TYPE[detail.type] || 'إعلان' }}</dd></div>
          <div><dt>الجهة :</dt><dd>{{ ANN_AUDIENCE[detail.audience] || '—' }}</dd></div>
          <div><dt>التاريخ :</dt><dd>{{ detail.created_at ? formatDate(detail.created_at) : '—' }}</dd></div>
          <div v-if="detail.recipientsText"><dt>المستلمون :</dt><dd>{{ detail.recipientsText }}</dd></div>
        </dl>
        <p v-if="detail.body" class="gsearch-detail-body">{{ detail.body }}</p>
        <div v-if="detail.attachments && detail.attachments.length" class="gsearch-detail-files">
          <h4 class="portal-title">المرفقات</h4>
          <span v-for="f in detail.attachments" :key="f.id" class="gsearch-file"><Paperclip :size="13" /> {{ f.name }}</span>
        </div>
      </template>

      <template v-if="detail && detail.to" #footer>
        <button type="button" class="pbtn is-primary" @click="goToDetail">فتح الصفحة</button>
      </template>
    </BaseModal>
  </div>
</template>

<script>
import { Search, Users, GraduationCap, UserCheck, UserPlus, KeyRound, Building2, Megaphone, CalendarClock, ClipboardCheck, ClipboardList, LifeBuoy, TrendingUp, FolderKanban, Paperclip } from 'lucide-vue-next'
import { mapState } from 'pinia'
import api from '@/services/api'
import { useAuthStore } from '@/stores/auth.store'
import { ROLES } from '@/utils/constants'
import { loadGroups, loadSupervisors } from '@/services/adminData'
import { DEGREES, PROJECT_STATUS } from '@/utils/progressData'
import { formatDate } from '@/utils/formatters'
import ProfileModal from '@/components/shared/ProfileModal.vue'
import BaseModal from '@/components/ui/BaseModal.vue'

// تسميات عربية لحالة المهمة ونوع الإعلان وجهته
const TASK_STATUS = { pending: 'بانتظار البدء', in_progress: 'قيد التنفيذ', review: 'قيد المراجعة', done: 'منجزة' }
const ANN_TYPE = { announcement: 'إعلان', file: 'ملف', rating: 'تقييم' }
const ANN_AUDIENCE = { groups: 'المجموعات', committee: 'لجنة الإشراف', supervisors: 'المشرفون' }

export default {
  name: 'GlobalSearch',

  components: { Search, Paperclip, ProfileModal, BaseModal },

  data() {
    return {
      TASK_STATUS, ANN_TYPE, ANN_AUDIENCE, DEGREES, PROJECT_STATUS,
      q: '',
      open: false,
      loading: false,
      loaded: false,
      data: { groups: [], supervisors: [], students: [], tasks: [], announcements: [] },
      activeId: 0,
      profileOpen: false,
      profileKind: 'student',
      profileId: null,
      profileName: '',
      detailOpen: false,
      detail: null
    }
  },

  computed: {
    ...mapState(useAuthStore, ['userRole', 'portalPrefix']),

    placeholder() {
      return 'بحث: طالب، مشرف، مشروع، مهمة، إعلان، رقم جامعي/واتساب…'
    },

    isCommittee() {
      return this.userRole === ROLES.COMMITTEE
    },

    /** المشاريع المسجّلة مُشتقّة من المجموعات (مجموعة واحدة لكل مشروع) */
    projects() {
      const seen = new Set()
      const out = []
      for (const g of this.data.groups) {
        if (!g.projectId || seen.has(g.projectId)) continue
        seen.add(g.projectId)
        out.push({
          id: g.projectId, groupId: g.id, name: g.project, section: g.section, supName: g.supName,
          spec: g.spec, degree: g.degree, status: g.projectStatus, description: g.description, membersCount: g.members?.length || 0
        })
      }
      return out
    },

    /** الأوامر المتاحة حسب الدور — كل أمر يُنفَّذ مباشرة (صفحة أو نموذج إضافة). المسارات بالأسماء لاختلافها بين الدورين */
    commandDefs() {
      if (this.isCommittee) {
        return [
          { id: 'c-teams', label: 'المجموعات', keywords: ['مجموعة', 'مجموعات', 'فرق', 'شعبة'], icon: Users, to: { name: 'committee-teams' } },
          { id: 'c-members', label: 'إدارة الأعضاء', keywords: ['اعضاء', 'أعضاء', 'طلاب', 'مشرفين', 'ادارة'], icon: UserCheck, to: { name: 'committee-members' } },
          { id: 'c-assign', label: 'التكليفات والإعلانات', keywords: ['تكليف', 'اعلان', 'إعلان', 'assignment'], icon: Megaphone, to: { name: 'committee-assignments' } },
          { id: 'c-appt', label: 'مواعيد المناقشات', keywords: ['مناقشة', 'موعد', 'مناقشات'], icon: CalendarClock, to: { name: 'committee-appointments' } },
          { id: 'c-eval', label: 'التقييمات', keywords: ['تقييم', 'تقييمات', 'درجات'], icon: ClipboardCheck, to: { name: 'committee-evaluations' } },
          { id: 'c-prop', label: 'المقترحات', keywords: ['مقترح', 'مقترحات', 'proposal'], icon: ClipboardList, to: { name: 'committee-proposals' } },
          { id: 'c-prog', label: 'تقدّم المشاريع', keywords: ['تقدم', 'تقدّم', 'انجاز', 'إنجاز'], icon: TrendingUp, to: { name: 'committee-progress' } },
          { id: 'c-tickets', label: 'الشكاوى والملاحظات', keywords: ['شكوى', 'شكاوى', 'ملاحظة', 'دعم'], icon: LifeBuoy, to: { name: 'committee-tickets' } }
        ]
      }
      // الإدارة العامة
      return [
        { id: 'a-student', label: 'إضافة طالب', keywords: ['اضافة طالب', 'إضافة طالب', 'طالب جديد', 'add student'], icon: GraduationCap, to: { name: 'super-admin-members', query: { kind: 'student', add: 1 } } },
        { id: 'a-sup', label: 'إضافة مشرف', keywords: ['اضافة مشرف', 'إضافة مشرف', 'مشرف جديد', 'add supervisor'], icon: UserCheck, to: { name: 'super-admin-members', query: { kind: 'supervisor', add: 1 } } },
        { id: 'a-com', label: 'إضافة عضو لجنة', keywords: ['اضافة لجنة', 'عضو لجنة', 'إضافة عضو'], icon: UserPlus, to: { name: 'super-admin-members', query: { kind: 'committee', add: 1 } } },
        { id: 'a-members', label: 'إدارة الأعضاء', keywords: ['اعضاء', 'أعضاء', 'ادارة الاعضاء', 'طلاب', 'مشرفين'], icon: Users, to: { name: 'super-admin-members' } },
        { id: 'a-struct', label: 'الأقسام والتخصصات والفصول', keywords: ['هيكل', 'اقسام', 'أقسام', 'تخصص', 'تخصصات', 'فصل', 'فصول'], icon: Building2, to: { name: 'super-admin-structure' } },
        { id: 'a-cred', label: 'إرسال بيانات الدخول', keywords: ['بيانات الدخول', 'دعوة', 'كلمة مرور', 'credentials'], icon: KeyRound, to: { name: 'super-admin-credentials' } },
        { id: 'a-assign', label: 'التكليفات والإعلانات', keywords: ['تكليف', 'اعلان', 'إعلان', 'assignment'], icon: Megaphone, to: { name: 'super-admin-assignments' } },
        { id: 'a-eval', label: 'التقييمات', keywords: ['تقييم', 'تقييمات', 'درجات'], icon: ClipboardCheck, to: { name: 'super-admin-evaluations' } },
        { id: 'a-tickets', label: 'الشكاوى والملاحظات', keywords: ['شكوى', 'شكاوى', 'ملاحظة', 'دعم'], icon: LifeBuoy, to: { name: 'super-admin-tickets' } }
      ]
    },

    sections() {
      const q = this.q
      if (!q) return []
      const hit = (...vals) => vals.some((v) => v && String(v).includes(q))
      const cmds = this.commandDefs
        .filter((c) => c.label.includes(q) || c.keywords.some((k) => k.includes(q)))
        .map((c) => ({ id: c.id, label: c.label, sub: 'أمر مباشر', icon: c.icon, kind: 'command', to: c.to }))
      // المشاريع بالاسم (مع التخصص واسم المشرف)
      const projects = this.projects
        .filter((p) => hit(p.name, p.spec, p.supName))
        .slice(0, 6)
        .map((p) => ({ ...p, label: p.name, sub: [p.section, p.supName].filter(Boolean).join(' · '), icon: FolderKanban, kind: 'project' }))
      // المجموعات تظهر للجنة فقط (الإدارة العامة لا تملك صفحة مجموعات)
      const groups = this.isCommittee
        ? this.data.groups
          .filter((g) => hit(g.name, g.project, g.section, g.spec))
          .slice(0, 6)
          .map((g) => ({ id: g.id, label: g.name, sub: [g.project, g.spec, DEGREES[g.degree]].filter(Boolean).join(' · '), icon: Users, kind: 'group' }))
        : []
      // الطلاب بالاسم أو الرقم الجامعي أو رقم الواتساب
      const students = this.data.students
        .filter((s) => hit(s.name, s.uni, s.whatsapp, s.groupName))
        .slice(0, 6)
        .map((s) => ({ id: s.id, label: s.name, sub: [s.uni, s.whatsapp, s.groupName].filter(Boolean).join(' · '), icon: GraduationCap, kind: 'student', name: s.name }))
      // المشرفون بالاسم أو التخصص أو رقم الواتساب
      const sups = this.data.supervisors
        .filter((s) => hit(s.name, s.spec, s.whatsapp))
        .slice(0, 5)
        .map((s) => ({ id: s.id, label: s.name, sub: [s.spec || 'مشرف', s.whatsapp].filter(Boolean).join(' · '), icon: UserCheck, kind: 'supervisor', name: s.name }))
      // المهام بالاسم (أو اسم المكلّف)
      const tasks = this.data.tasks
        .filter((t) => hit(t.title, t.assigneeNames, t.group))
        .slice(0, 6)
        .map((t) => ({ ...t, label: t.title, sub: [t.group, TASK_STATUS[t.status]].filter(Boolean).join(' · '), icon: ClipboardList, kind: 'task' }))
      // الإعلانات والتكليفات بالعنوان أو النص
      const anns = this.data.announcements
        .filter((a) => hit(a.title, a.body))
        .slice(0, 5)
        .map((a) => ({ ...a, label: a.title || ANN_TYPE[a.type] || 'إعلان', sub: [ANN_TYPE[a.type], ANN_AUDIENCE[a.audience]].filter(Boolean).join(' · '), icon: Megaphone, kind: 'announcement' }))

      const secs = []
      if (cmds.length) secs.push({ key: 'cmd', title: 'أوامر', tag: 'أمر', items: cmds })
      if (projects.length) secs.push({ key: 'prj', title: 'المشاريع', tag: 'مشروع', items: projects })
      if (groups.length) secs.push({ key: 'grp', title: 'المجموعات', tag: 'مجموعة', items: groups })
      if (students.length) secs.push({ key: 'std', title: 'الطلاب', tag: 'طالب', items: students })
      if (sups.length) secs.push({ key: 'sup', title: 'المشرفون', tag: 'مشرف', items: sups })
      if (tasks.length) secs.push({ key: 'tsk', title: 'المهام', tag: 'مهمة', items: tasks })
      if (anns.length) secs.push({ key: 'ann', title: 'الإعلانات والتكليفات', tag: 'إعلان', items: anns })
      let i = 0
      for (const s of secs) for (const it of s.items) it._id = i++
      return secs
    },

    flat() {
      return this.sections.flatMap((s) => s.items)
    }
  },

  watch: {
    q() {
      this.open = true
      this.activeId = 0
    }
  },

  mounted() {
    document.addEventListener('pointerdown', this.onOutside)
  },

  beforeUnmount() {
    document.removeEventListener('pointerdown', this.onOutside)
  },

  methods: {
    formatDate,

    async onFocus() {
      this.open = true
      if (this.loaded || this.loading) return
      this.loading = true
      try {
        // المجموعات أولًا (منها نشتقّ الطلاب والمشاريع)، والمهام والإعلانات بالتوازي
        const [groups, tasksRes, annRes] = await Promise.all([
          loadGroups(),
          api.get('/tasks').catch(() => null),
          api.get('/announcements/sent').catch(() => null)
        ])
        const supervisors = await loadSupervisors(groups)
        const seen = new Set()
        const students = []
        for (const g of groups) for (const m of g.members || []) if (!seen.has(m.id)) { seen.add(m.id); students.push({ ...m, groupName: g.name }) }
        this.data = { groups, supervisors, students, tasks: this.normalizeTasks(tasksRes), announcements: this.normalizeAnns(annRes) }
        this.loaded = true
      } catch {
        // تجاهل — تبقى الأوامر متاحة حتى لو فشل تحميل الكيانات
      } finally {
        this.loading = false
      }
    },

    /** GET /tasks → بشكل مختصر للبحث والتفاصيل (العنوان، الجهة، المكلّفون، الحالة، التسليم) */
    normalizeTasks(res) {
      const rows = res?.data?.data || res?.data || []
      return rows.map((t) => {
        const team = t.team || {}
        return {
          id: t.id, title: t.title, description: t.description || '', status: t.status, due: t.due_date || '',
          group: !t.team_id ? 'لجنة الإشراف / مشرف' : team.section ? `شعبة ${team.section}` : team.name || '—',
          assigneeNames: (t.assignees || []).map((a) => a.name).join('، ')
        }
      })
    },

    /** GET /announcements/sent → بشكل مختصر (المفتاح batch لعدم وجود id مفرد) */
    normalizeAnns(res) {
      const rows = res?.data?.data || res?.data || []
      return rows.map((a) => ({
        id: a.batch, title: a.title || '', body: a.body || '', type: a.type, audience: a.audience,
        created_at: a.created_at, attachments: a.attachments || [],
        recipientsText: (a.recipients || []).map((r) => r.name).filter(Boolean).slice(0, 8).join('، ')
      }))
    },

    onOutside(e) {
      if (this.open && this.$refs.root && !this.$refs.root.contains(e.target)) this.close()
    },

    close() {
      this.open = false
    },

    move(dir) {
      if (!this.flat.length) return
      this.open = true
      const i = this.flat.findIndex((it) => it._id === this.activeId)
      const next = (i + dir + this.flat.length) % this.flat.length
      this.activeId = this.flat[next]._id
    },

    runActive() {
      const it = this.flat.find((x) => x._id === this.activeId) || this.flat[0]
      if (it) this.run(it)
    },

    run(it) {
      this.close()
      if (it.kind === 'command') {
        this.q = ''
        this.$router.push(it.to).catch(() => {})
      } else if (it.kind === 'group') {
        this.q = ''
        this.$router.push({ name: 'committee-teams', query: { focus: it.id } }).catch(() => {})
      } else if (it.kind === 'student' || it.kind === 'supervisor') {
        // طالب/مشرف: يفتح البروفايل فورًا
        this.profileKind = it.kind
        this.profileId = it.id
        this.profileName = it.name || it.label
        this.profileOpen = true
      } else {
        // مشروع/مهمة/إعلان: نافذة تفاصيل، مع وجهة «فتح الصفحة» حين تتوفّر صفحة
        this.detail = { ...it, to: this.pageFor(it) }
        this.detailOpen = true
      }
    },

    /** وجهة صفحة العنصر إن وُجدت: المشروع → مجموعته، المهمة → التكليفات؛ الإعلان بلا صفحة مخصّصة */
    pageFor(it) {
      if (it.kind === 'project') {
        return this.isCommittee
          ? { name: 'committee-teams', query: { focus: it.groupId } }
          : { name: 'super-admin-evaluation-sheet', params: { teamId: it.groupId } }
      }
      if (it.kind === 'task') return { name: `${this.portalPrefix}-assignments` }
      return null
    },

    goToDetail() {
      const to = this.detail?.to
      this.detailOpen = false
      this.q = ''
      if (to) this.$router.push(to).catch(() => {})
    }
  }
}
</script>
