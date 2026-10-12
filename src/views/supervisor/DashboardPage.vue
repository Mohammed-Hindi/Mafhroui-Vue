<template>
  <div class="space-y-6">
    <section class="grid grid-cols-1 sm:grid-cols-3 gap-4" aria-label="ملخص الإشراف">
      <article v-for="card in cards" :key="card.label" class="bg-surface border border-border shadow-card p-5">
        <p class="text-caption text-text-600">{{ card.label }}</p>
        <p class="font-cairo font-extrabold text-h1 text-text-900 mt-2">{{ card.value }}</p>
        <p class="text-label text-text-400 mt-1">{{ card.note }}</p>
      </article>
    </section>

    <section class="bg-surface border border-border shadow-card">
      <header class="flex flex-wrap items-center justify-between gap-3 p-5 border-b border-border-soft">
        <div>
          <h2 class="text-h3 font-bold text-text-900">نشاط المجموعات</h2>
          <p class="text-caption text-text-600 mt-1">مؤشر التفاعل يجمع المهام وتفاعل الطلاب والملفات والاجتماعات.</p>
        </div>
        <router-link :to="{ name: 'supervisor-profile' }" class="text-caption font-bold text-primary-700 hover:underline">تفاصيل تفاعلي</router-link>
      </header>
      <p v-if="loading" class="p-6 text-caption text-text-400">جارٍ تحميل بيانات المجموعات…</p>
      <div v-else-if="teamActivity.length" class="divide-y divide-border-soft">
        <div v-for="row in teamActivity" :key="row.team.id" class="flex flex-wrap items-center gap-4 p-5">
          <div class="min-w-[180px] flex-1">
            <p class="font-bold text-body-sm text-text-900">{{ row.team.name }}<span v-if="row.team.section" class="text-text-400 font-normal"> · شعبة {{ row.team.section }}</span></p>
            <p class="text-caption text-text-600 mt-1">{{ row.project?.name || 'لم يُسجّل مشروع بعد' }} · {{ row.team.members_count }} طلاب</p>
          </div>
          <div class="w-full sm:w-56">
            <div class="flex justify-between text-label mb-1"><span>التفاعل</span><b>{{ row.interaction.activity_score }}%</b></div>
            <div class="h-2 rounded-pill bg-border-soft overflow-hidden"><div class="h-full bg-primary-600" :style="{ width: `${row.interaction.activity_score}%` }" /></div>
          </div>
          <div class="text-caption text-text-600">{{ row.interaction.tasks_done }}/{{ row.interaction.tasks_total }} مهمة مكتملة</div>
          <router-link :to="{ name: 'supervisor-teams', query: { team: row.team.id } }" class="text-caption font-bold text-primary-700 hover:underline">عرض المجموعة</router-link>
        </div>
      </div>
      <p v-else class="p-6 text-caption text-text-400">لا توجد مجموعات مسندة إليك حاليًا.</p>
    </section>

    <section class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3" aria-label="إجراءات سريعة">
      <router-link v-for="link in links" :key="link.name" :to="{ name: link.name }" class="bg-surface border border-border p-4 text-body-sm font-bold text-text-700 hover:border-primary-600 hover:text-primary-700 transition-colors">
        {{ link.label }} <span aria-hidden="true">←</span>
      </router-link>
    </section>
  </div>
</template>

<script>
import { mapActions, mapState } from 'pinia'
import api from '@/services/api'
import { useAuthStore } from '@/stores/auth.store'
import { useTeamsStore } from '@/stores/teams.store'

export default {
  name: 'SupervisorDashboardPage',
  data() { return { loading: true, interaction: null } },
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
