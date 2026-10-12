<template>
  <div class="space-y-5">
    <section class="grid grid-cols-1 sm:grid-cols-3 gap-3">
      <article v-for="stat in stats" :key="stat.label" class="bg-surface border border-border shadow-card p-4"><p class="text-caption text-text-600">{{ stat.label }}</p><p class="text-h2 font-bold text-text-900 mt-1">{{ stat.value }}</p></article>
    </section>
    <section class="bg-surface border border-border shadow-card">
      <header class="p-5 border-b border-border-soft"><h2 class="text-h3 font-bold text-text-900">نتائج تقييم مجموعاتي</h2><p class="text-caption text-text-600 mt-1">أدخل درجة كل طالب من 100 وأضف ملاحظاتك عند الحاجة.</p></header>
      <p v-if="loading" class="p-5 text-caption text-text-400">جارٍ تحميل النتائج…</p>
      <div v-else-if="rows.length" class="divide-y divide-border-soft">
        <article v-for="row in visibleRows" :key="`${row.teamId}-${row.studentId}`" class="p-5">
          <div class="flex flex-wrap items-center justify-between gap-2 mb-4">
            <div><h3 class="font-bold text-body-sm text-text-900">{{ row.teamName }}<span v-if="row.section" class="font-normal text-text-600"> · شعبة {{ row.section }}</span></h3><p class="text-caption text-text-600 mt-1">{{ row.project || 'مشروع غير مسجّل' }} · {{ row.studentName }}</p></div>
            <span class="text-caption text-text-500">{{ row.saved ? `آخر درجة محفوظة: ${row.savedScore}` : 'لم تُدخل درجة بعد' }}</span>
          </div>
          <div class="grid grid-cols-1 sm:grid-cols-[150px_1fr_auto] gap-3 items-end">
            <label class="flex flex-col gap-1 text-label font-bold text-text-600">الدرجة من 100<input v-model.number="row.score" type="number" min="0" max="100" class="h-10 px-3 border border-border bg-bg text-body text-text-900" /></label>
            <label class="flex flex-col gap-1 text-label font-bold text-text-600">ملاحظات<textarea v-model.trim="row.notes" rows="1" maxlength="2000" class="min-h-10 px-3 py-2 border border-border bg-bg text-body text-text-900" /></label>
            <button type="button" class="h-10 px-4 bg-primary-600 text-white text-caption font-bold disabled:opacity-50" :disabled="row.saving || row.score === '' || row.score === null || Number(row.score) < 0 || Number(row.score) > 100" @click="save(row)">{{ row.saving ? 'جارٍ الحفظ…' : 'حفظ الدرجة' }}</button>
          </div>
        </article>
      </div>
      <p v-else class="p-6 text-caption text-text-400">لا توجد مجموعات أو طلاب ضمن إشرافك.</p>
    </section>
  </div>
</template>

<script>
import { mapActions, mapState } from 'pinia'
import api from '@/services/api'
import { useAuthStore } from '@/stores/auth.store'
import { useTeamsStore } from '@/stores/teams.store'

export default {
  name: 'SupervisorEvaluationsPage',
  data() { return { loading: true, rows: [] } },
  computed: {
    ...mapState(useAuthStore, ['user']),
    ...mapState(useTeamsStore, ['teamsForDisplay']),
    visibleRows() {
      const selected = this.$route.query.team
      return selected ? this.rows.filter((row) => String(row.teamId) === String(selected)) : this.rows
    },
    stats() {
      const saved = this.rows.filter((row) => row.saved).length
      const average = saved ? Math.round(this.rows.filter((row) => row.saved).reduce((sum, row) => sum + Number(row.savedScore), 0) / saved) : '—'
      return [{ label: 'الطلاب', value: this.rows.length }, { label: 'تم تقييمهم', value: saved }, { label: 'متوسط الدرجات', value: average }]
    }
  },
  async created() {
    try {
      await Promise.all([this.fetchCurrentUser(), this.fetchTeams()])
      const { data } = await api.get('/evaluations')
      const evaluations = data.data || data
      const savedByStudent = new Map(evaluations.map((item) => [`${item.team?.id}-${item.student?.id}`, item]))
      this.rows = this.teamsForDisplay.filter((team) => team.supId === this.user?.id).flatMap((team) => team.members.map((student) => {
        const saved = savedByStudent.get(`${team.id}-${student.id}`)
        return { teamId: team.id, teamName: team.name, section: team.section, project: team.projectName, studentId: student.id, studentName: student.name, score: saved?.score ?? '', notes: saved?.notes || '', savedScore: saved?.score ?? null, saved: !!saved, saving: false }
      }))
    } catch (err) {
      this.$toast?.error(err.normalized?.message || 'تعذّر تحميل نتائج التقييم')
    } finally { this.loading = false }
  },
  methods: {
    ...mapActions(useAuthStore, ['fetchCurrentUser']),
    ...mapActions(useTeamsStore, ['fetchTeams']),
    async save(row) {
      row.saving = true
      try {
        const { data } = await api.put(`/teams/${row.teamId}/students/${row.studentId}/evaluation`, { score: Number(row.score), notes: row.notes || null })
        row.saved = true
        row.savedScore = data.score ?? Number(row.score)
        this.$toast?.success(`تم حفظ تقييم ${row.studentName}`)
      } catch (err) {
        this.$toast?.error(err.normalized?.message || 'تعذّر حفظ الدرجة')
      } finally { row.saving = false }
    }
  }
}
</script>
