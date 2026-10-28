<template>
  <!-- بحث شامل عميق في التوب بار (الإدارة العامة + لجنة الإشراف): أوامر مباشرة + مجموعات + طلاب + مشرفون.
       الأمر يُنفَّذ مباشرة (يفتح نموذج/صفحة)، والشخص يفتح بروفايله فورًا، والمجموعة تفتح في صفحة المجموعات. -->
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

    <ProfileModal v-model="profileOpen" :kind="profileKind" :person-id="profileId" :name="profileName" />
  </div>
</template>

<script>
import { Search, Users, GraduationCap, UserCheck, UserPlus, KeyRound, Building2, Megaphone, CalendarClock, ClipboardCheck, ClipboardList, LifeBuoy, TrendingUp } from 'lucide-vue-next'
import { mapState } from 'pinia'
import { useAuthStore } from '@/stores/auth.store'
import { ROLES } from '@/utils/constants'
import { loadGroups, loadSupervisors } from '@/services/adminData'
import { DEGREES } from '@/utils/progressData'
import ProfileModal from '@/components/shared/ProfileModal.vue'

export default {
  name: 'GlobalSearch',

  components: { Search, ProfileModal },

  data() {
    return {
      q: '',
      open: false,
      loading: false,
      loaded: false,
      data: { groups: [], supervisors: [], students: [] },
      activeId: 0,
      profileOpen: false,
      profileKind: 'student',
      profileId: null,
      profileName: ''
    }
  },

  computed: {
    ...mapState(useAuthStore, ['userRole']),

    placeholder() {
      return 'بحث عن طالب، مشرف، مجموعة، أمر…'
    },

    isCommittee() {
      return this.userRole === ROLES.COMMITTEE
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
      // المجموعات تظهر للجنة فقط (الإدارة العامة لا تملك صفحة مجموعات)
      const groups = this.isCommittee
        ? this.data.groups
          .filter((g) => hit(g.name, g.project, g.section, g.spec))
          .slice(0, 6)
          .map((g) => ({ id: g.id, label: g.name, sub: [g.project, g.spec, DEGREES[g.degree]].filter(Boolean).join(' · '), icon: Users, kind: 'group' }))
        : []
      const students = this.data.students
        .filter((s) => hit(s.name, s.uni, s.groupName))
        .slice(0, 6)
        .map((s) => ({ id: s.id, label: s.name, sub: [s.uni, s.groupName].filter(Boolean).join(' · '), icon: GraduationCap, kind: 'student', name: s.name }))
      const sups = this.data.supervisors
        .filter((s) => hit(s.name, s.spec))
        .slice(0, 5)
        .map((s) => ({ id: s.id, label: s.name, sub: s.spec || 'مشرف', icon: UserCheck, kind: 'supervisor', name: s.name }))
      const secs = []
      if (cmds.length) secs.push({ key: 'cmd', title: 'أوامر', tag: 'أمر', items: cmds })
      if (groups.length) secs.push({ key: 'grp', title: 'المجموعات', tag: 'مجموعة', items: groups })
      if (students.length) secs.push({ key: 'std', title: 'الطلاب', tag: 'طالب', items: students })
      if (sups.length) secs.push({ key: 'sup', title: 'المشرفون', tag: 'مشرف', items: sups })
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
    async onFocus() {
      this.open = true
      if (this.loaded || this.loading) return
      this.loading = true
      try {
        const groups = await loadGroups()
        const supervisors = await loadSupervisors(groups)
        const seen = new Set()
        const students = []
        for (const g of groups) for (const m of g.members || []) if (!seen.has(m.id)) { seen.add(m.id); students.push({ ...m, groupName: g.name }) }
        this.data = { groups, supervisors, students }
        this.loaded = true
      } catch {
        // تجاهل — تبقى الأوامر متاحة حتى لو فشل تحميل الكيانات
      } finally {
        this.loading = false
      }
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
      } else {
        // طالب/مشرف: يفتح البروفايل فورًا
        this.profileKind = it.kind
        this.profileId = it.id
        this.profileName = it.name || it.label
        this.profileOpen = true
      }
    }
  }
}
</script>
