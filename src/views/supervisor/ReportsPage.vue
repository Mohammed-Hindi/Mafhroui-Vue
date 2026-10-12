<template>
  <div class="space-y-5">
    <section class="flex flex-wrap items-center justify-between gap-3 print:hidden">
      <div>
        <h2 class="text-h3 font-bold text-text-900">تقرير مجموعاتي</h2>
        <p class="text-caption text-text-600 mt-1">أسماء الطلاب ومناطقهم والمشاريع والشعب المسندة إليك.</p>
      </div>
      <button type="button" class="h-10 px-4 bg-success text-white text-caption font-bold inline-flex items-center gap-2" @click="printReport"><Printer :size="16" /> طباعة التقرير</button>
    </section>
    <p v-if="loading" class="p-5 text-caption text-text-400 print:hidden">جارٍ تحميل التقرير…</p>
    <section class="report-sheet bg-surface border border-border shadow-card p-5 sm:p-7">
      <header class="mb-5 pb-4 border-b border-border-soft">
        <h1 class="text-h2 font-bold text-text-900">تقرير إشراف المجموعات</h1>
        <p class="text-body-sm text-text-600 mt-1">المشرف: {{ user?.name || '—' }} · {{ user?.academicTerm?.name || 'الفصل الحالي' }}</p>
      </header>
      <div v-for="team in myTeams" :key="team.id" class="mb-6 break-inside-avoid">
        <div class="flex flex-wrap justify-between gap-2 mb-2">
          <h2 class="font-bold text-body-sm text-text-900">{{ team.name }}<span v-if="team.section" class="font-normal text-text-600"> · الشعبة {{ team.section }}</span></h2>
          <span class="text-caption text-text-600">المشروع: {{ team.projectName || 'غير مسجّل' }}</span>
        </div>
        <table class="w-full border-collapse text-caption">
          <thead><tr><th>اسم الطالب</th><th>الرقم الجامعي</th><th>مكان التواجد</th><th>البريد الإلكتروني</th></tr></thead>
          <tbody><tr v-for="member in team.members" :key="member.id"><td>{{ member.name || '—' }}</td><td>{{ member.uid || '—' }}</td><td>{{ REGIONS[member.region] || '—' }}</td><td dir="ltr" class="text-start">{{ member.mail || '—' }}</td></tr></tbody>
        </table>
      </div>
      <p v-if="!loading && !myTeams.length" class="text-caption text-text-400 py-5">لا توجد مجموعات لعرضها.</p>
    </section>
  </div>
</template>

<script>
import { mapActions, mapState } from 'pinia'
import { Printer } from 'lucide-vue-next'
import { useAuthStore } from '@/stores/auth.store'
import { useTeamsStore } from '@/stores/teams.store'
import { REGIONS } from '@/utils/progressData'

export default {
  name: 'SupervisorReportsPage',
  components: { Printer },
  data() { return { REGIONS, loading: true } },
  computed: {
    ...mapState(useAuthStore, ['user']),
    ...mapState(useTeamsStore, ['teamsForDisplay']),
    myTeams() { return this.teamsForDisplay.filter((team) => team.supId === this.user?.id) }
  },
  async created() {
    try { await Promise.all([this.fetchCurrentUser(), this.fetchTeams()]) }
    catch (err) { this.$toast?.error(err.normalized?.message || 'تعذّر تحميل التقرير') }
    finally { this.loading = false }
  },
  methods: {
    ...mapActions(useAuthStore, ['fetchCurrentUser']),
    ...mapActions(useTeamsStore, ['fetchTeams']),
    printReport() { window.print() }
  }
}
</script>

<style scoped>
table { break-inside: avoid; }
th, td { border: 1px solid var(--color-border); padding: 8px 10px; text-align: start; }
th { background: var(--color-primary-600); color: white; font-weight: 700; }
@media print {
  :global(body) { background: white !important; }
  :global(#app-sidebar), :global(header.sticky), :global(footer), :global(.portal-burger) { display: none !important; }
  :global(main) { padding: 0 !important; }
  .report-sheet { border: 0 !important; box-shadow: none !important; padding: 0 !important; }
  .break-inside-avoid { break-inside: avoid; }
  th { print-color-adjust: exact; -webkit-print-color-adjust: exact; }
}
</style>
