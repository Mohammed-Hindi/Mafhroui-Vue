<template>
  <!-- الملف التعريفي للإدارة العامة — بنمط الصفحة الرئيسية لموقع الكلية:
       هيرو بتدرج الهوية ← شريط إحصائيات ← عناوين أقسام بخطين ← شبكة أيقونات ملوّنة كالعمادات -->
  <div class="ucas-site flex flex-col gap-10">
    <!-- الهيرو -->
    <section class="ucas-profile-hero">
      <div class="flex flex-wrap items-center gap-6 min-w-0">
        <span class="ucas-profile-logo"><UcasLogo :size="92" /></span>
        <div class="min-w-0">
          <p class="ucas-profile-kicker">الكلية الجامعية للعلوم التطبيقية — منصة {{ appName }}</p>
          <h2 class="ucas-profile-name">{{ user?.name || '—' }}</h2>
          <div class="flex flex-wrap items-center gap-x-6 gap-y-2 mt-3 text-white/90">
            <span class="ucas-profile-role"><ShieldCheck :size="16" /> {{ roleLabel }}</span>
            <span v-if="user?.email" class="inline-flex items-center gap-2 mono"><Mail :size="16" /> {{ user.email }}</span>
            <span v-if="user?.whatsapp" class="inline-flex items-center gap-2 mono"><Phone :size="16" /> {{ user.whatsapp }}</span>
          </div>
        </div>
      </div>
      <router-link :to="{ name: 'super-admin-change-password' }" class="ucas-btn-outline-light">
        <Lock :size="17" /> تغيير كلمة المرور
      </router-link>
    </section>

    <!-- إحصائيات المنصة -->
    <UcasStatsBand :items="platformStats" />

    <!-- بيانات الحساب -->
    <section>
      <UcasSectionTitle title="بيانات الحساب" subtitle="معلومات حساب الإدارة العامة المسجّلة على المنصة" />
      <div class="ucas-icon-grid">
        <div v-for="info in accountInfo" :key="info.label" class="ucas-icon-item" :style="{ '--item-color': info.color }">
          <component :is="info.icon" :size="46" :stroke-width="1.4" class="ucas-icon-item-icon" />
          <h3>{{ info.label }}</h3>
          <p :class="info.mono && 'mono'">{{ info.value || '—' }}</p>
        </div>
      </div>
    </section>

    <!-- أدوات الإدارة -->
    <section>
      <UcasSectionTitle title="أدوات الإدارة العامة" subtitle="كل صلاحيات حسابك في مكان واحد" />
      <div class="ucas-icon-grid">
        <router-link
          v-for="tool in tools" :key="tool.to" :to="tool.to"
          class="ucas-icon-item is-link" :style="{ '--item-color': tool.color }"
        >
          <component :is="tool.icon" :size="52" :stroke-width="1.3" class="ucas-icon-item-icon" />
          <h3>{{ tool.label }}</h3>
          <p>{{ tool.hint }}</p>
        </router-link>
      </div>
    </section>
  </div>
</template>

<script>
import { mapState, mapActions } from 'pinia'
import { ShieldCheck, Mail, Phone, Lock, User, IdCard, CalendarDays, BadgeCheck, CalendarRange, AtSign } from 'lucide-vue-next'
import UcasLogo from '@/components/icons/UcasLogo.vue'
import UcasStatsBand from '@/components/shared/UcasStatsBand.vue'
import UcasSectionTitle from '@/components/shared/UcasSectionTitle.vue'
import { useAuthStore } from '@/stores/auth.store'
import { useUiStore } from '@/stores/ui.store'
import { useLandingStore } from '@/stores/landing.store'
import { NAV_ITEMS_BY_ROLE } from '@/utils/navConfig'
import { ROLES, ROLE_LABELS, APP_NAME } from '@/utils/constants'
import { formatDate } from '@/utils/formatters'

/** وصف قصير لكل أداة — يقابل السطر الرمادي تحت اسم العمادة في موقع الكلية ("ريادة وقيادة") */
const TOOL_HINTS = {
  '/super-admin/profile': 'بيانات حسابك',
  '/super-admin': 'الطلاب والمشرفون',
  '/super-admin/committee': 'حسابات اللجنة',
  '/super-admin/structure': 'الأقسام والفصول',
  '/committee': 'نظرة عامة',
  '/committee/teams': 'المجموعات والأعضاء',
  '/committee/proposals': 'المراجعة والاعتماد',
  '/committee/appointments': 'جدولة المناقشات',
  '/committee/project-archive': 'المشاريع المكتملة',
  '/committee/progress': 'متابعة الإنجاز',
  '/committee/assistant': 'مساعد ذكي'
}

export default {
  name: 'SuperAdminProfilePage',

  components: { ShieldCheck, Mail, Phone, Lock, UcasLogo, UcasStatsBand, UcasSectionTitle },

  data() {
    return { appName: APP_NAME }
  },

  computed: {
    ...mapState(useAuthStore, ['user']),
    ...mapState(useUiStore, ['semesters', 'activeSemesterId']),
    ...mapState(useLandingStore, ['stats']),

    roleLabel() {
      return ROLE_LABELS[ROLES.SUPER_ADMIN]
    },

    activeSemesterName() {
      return this.semesters.find((s) => String(s.id) === String(this.activeSemesterId))?.name || ''
    },

    platformStats() {
      const s = this.stats || {}
      return [
        { label: 'قسم أكاديمي', value: s.departments ?? null },
        { label: 'فريق مشروع', value: s.teams ?? null },
        { label: 'مشروع تخرج', value: s.projects ?? null },
        { label: 'مشرف', value: s.supervisors ?? null },
        { label: 'طالب و طالبة', value: s.students ?? null },
        { label: 'متوسط الإنجاز', value: s.avg_completion != null ? Math.round(s.avg_completion) : null, suffix: '%' }
      ]
    },

    accountInfo() {
      const u = this.user || {}
      return [
        { label: 'الاسم', value: u.name, icon: User, color: '#3A9B4C' },
        { label: 'البريد الإلكتروني', value: u.email, icon: AtSign, color: '#4C5EA8', mono: true },
        { label: 'رقم الواتساب', value: u.whatsapp, icon: Phone, color: '#229791', mono: true },
        { label: 'الرقم الوظيفي', value: u.employee_number, icon: IdCard, color: '#A9375C', mono: true },
        { label: 'الصلاحية', value: this.roleLabel, icon: BadgeCheck, color: '#005BAA' },
        { label: 'الفصل الدراسي الحالي', value: this.activeSemesterName, icon: CalendarRange, color: '#F89E32' },
        { label: 'تاريخ إنشاء الحساب', value: u.created_at ? formatDate(u.created_at) : '', icon: CalendarDays, color: '#805C55' }
      ]
    },

    tools() {
      return NAV_ITEMS_BY_ROLE[ROLES.SUPER_ADMIN]
        .flatMap((group) => group.items)
        .filter((item) => item.to !== this.$route.path)
        .map((item) => ({ ...item, hint: TOOL_HINTS[item.to] || '' }))
    }
  },

  created() {
    this.fetchCurrentUser().catch(() => {})
    this.fetchStats().catch(() => {})
  },

  methods: {
    ...mapActions(useAuthStore, ['fetchCurrentUser']),
    ...mapActions(useLandingStore, ['fetchStats'])
  }
}
</script>
