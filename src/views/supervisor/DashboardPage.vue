<template>
  <div>
    <section class="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-8" aria-label="ملخص الإشراف">
      <article v-for="(card, index) in cards" :key="card.label" class="reveal group bg-surface rounded-lg border border-border shadow-card p-6 transition-all duration-base hover:-translate-y-1 hover:shadow-card-hover hover:border-primary-200">
        <span class="grid place-items-center w-11 h-11 rounded-md mb-4" :class="[statTheme[index].bg, statTheme[index].color]"><component :is="statTheme[index].icon" :size="20" /></span>
        <p class="text-body-sm text-text-600 font-medium">{{ card.label }}</p>
        <p class="font-cairo font-extrabold text-h1 text-text-900 mt-2 transition-colors duration-base group-hover:text-primary-600">{{ card.value }}</p>
        <p class="text-caption text-text-400 mt-1">{{ card.note }}</p>
      </article>
    </section>

    <section class="bg-surface rounded-lg border border-border shadow-card overflow-hidden">
      <header class="flex flex-wrap items-center justify-between gap-3 p-5 border-b border-border-soft">
        <div>
          <h2 class="text-h3 font-bold text-text-900">نشاط المجموعات</h2>
          <p class="text-caption text-text-600 mt-1">مؤشر التفاعل يجمع المهام وتفاعل الطلاب والملفات والاجتماعات.</p>
        </div>
        <router-link :to="{ name: 'supervisor-profile' }" class="text-caption font-bold text-primary-700 hover:underline">تفاصيل تفاعلي</router-link>
      </header>
      <p v-if="loading" class="p-6 text-caption text-text-400">جارٍ تحميل بيانات المجموعات…</p>
      <div v-else-if="teamActivity.length" class="divide-y divide-border-soft">
        <div v-for="row in teamActivity" :key="row.team.id" class="flex flex-wrap items-center gap-4 p-5 hover:bg-bg/60 transition-colors">
          <div class="min-w-[180px] flex-1">
            <p class="font-bold text-body-sm text-text-900">{{ row.team.name }}<span v-if="row.team.section" class="text-text-400 font-normal"> · شعبة {{ row.team.section }}</span></p>
            <p class="text-caption text-text-600 mt-1">{{ row.project?.name || 'لم يُسجّل مشروع بعد' }} · {{ row.team.members_count }} طلاب</p>
          </div>
          <div class="w-full sm:w-56">
            <div class="flex justify-between text-label mb-1"><span>التفاعل</span><b>{{ row.interaction.activity_score }}%</b></div>
            <div class="h-2 rounded-pill bg-border-soft overflow-hidden"><div class="h-full bg-primary-600" :style="{ width: `${row.interaction.activity_score}%` }" /></div>
          </div>
          <div class="flex flex-wrap gap-x-4 gap-y-1 text-caption text-text-600"><span>{{ row.interaction.tasks_done }}/{{ row.interaction.tasks_total }} مهمة</span><span>{{ row.interaction.files_count }} ملف</span><span>{{ row.interaction.meetings_count }} اجتماع</span></div>
          <router-link :to="{ name: 'supervisor-teams', query: { team: row.team.id } }" class="text-caption font-bold text-primary-700 hover:underline">عرض المجموعة ←</router-link>
        </div>
      </div>
      <p v-else class="p-6 text-caption text-text-400">لا توجد مجموعات مسندة إليك حاليًا.</p>
    </section>

    <section class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3" aria-label="إجراءات سريعة">
      <router-link v-for="link in links" :key="link.name" :to="{ name: link.name }" class="group bg-surface rounded-lg border border-border shadow-card p-5 text-body-sm font-bold text-text-700 hover:border-primary-600 hover:text-primary-700 hover:shadow-card-hover transition-all">
        {{ link.label }} <span class="text-primary-600" aria-hidden="true">←</span>
      </router-link>
    </section>
  </div>
</template>

<script>
import { mapActions, mapState } from 'pinia'
import { Activity, GraduationCap, Users } from 'lucide-vue-next'
import api from '@/services/api'
import { useAuthStore } from '@/stores/auth.store'
import { useTeamsStore } from '@/stores/teams.store'

export default {
  name: 'SupervisorDashboardPage',
  components: { Activity, GraduationCap, Users },
  data() { return { loading: true, interaction: null, statTheme: [
    { icon: Users, bg: 'bg-primary-50', color: 'text-primary-600' },
    { icon: GraduationCap, bg: 'bg-secondary-50', color: 'text-secondary-600' },
    { icon: Activity, bg: 'bg-accent-50', color: 'text-accent-600' }
  ] } },
  computed: {
    ...mapState(useAuthStore, ['user']),
    ...mapState(useTeamsStore, ['teamsForDisplay']),
    myTeams() { return this.teamsForDisplay.filter((team) => team.supId === this.user?.id) },
    teamActivity() { return this.interaction?.teams || [] },
    studentCount() { return this.interaction?.students_count ?? this.myTeams.reduce((n, t) => n + t.members.length, 0) },
    cards() {
      return [
        { label: 'المجموعات', value: this.interaction?.teams_count ?? this.myTeams.length, note: 'المجموعات المسندة إليك' },
        { label: 'الطلاب', value: this.studentCount, note: 'ضمن مجموعاتك الحالية' },
        { label: 'متوسط التفاعل', value: `${this.interaction?.average_activity ?? 0}%`, note: 'مهام وملفات واستجابة واجتماعات' }
      ]
    },
    links() {
      return [
        { name: 'supervisor-teams', label: 'مجموعاتي' },
        { name: 'supervisor-tasks', label: 'إضافة ومتابعة المهام' },
        { name: 'supervisor-assignments', label: 'إعلان أو ملف للمجموعات' },
        { name: 'supervisor-evaluations', label: 'إدخال نتائج التقييم' }
      ]
    }
  },
  async created() {
    try {
      await Promise.all([this.fetchCurrentUser(), this.fetchTeams()])
      if (this.user?.id) {
        const { data } = await api.get(`/supervisors/${this.user.id}/profile`)
        this.interaction = data.interaction || null
      }
    } catch (err) {
      this.$toast?.error(err.normalized?.message || 'تعذّر تحميل ملخص الإشراف')
    } finally {
      this.loading = false
    }
  },
  methods: { ...mapActions(useAuthStore, ['fetchCurrentUser']), ...mapActions(useTeamsStore, ['fetchTeams']) }
}
</script>
