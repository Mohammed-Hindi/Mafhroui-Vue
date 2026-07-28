<template>
  <div>
    <SkeletonLoader v-if="teamsLoading" :rows="4" height="24px" class="mb-8" />
    <ErrorState v-else-if="teamsError" :message="teamsError" @retry="loadTeams" />

    <template v-else>
      <div class="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-8">
        <StatCard label="إجمالي الفرق" :value="teams.length" hint="فريق مسجّل هذا الفصل" :icon="Users" tone="primary" />
        <StatCard label="إجمالي الطلاب" :value="studentsFromTeams.length" hint="طالب ضمن فرق مسجّلة" :icon="GraduationCap" tone="success" />
        <StatCard label="إجمالي المشرفين" :value="supervisorsFromTeams.length" hint="مشرف نشط هذا الفصل" :icon="UserCog" tone="accent" />
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-[1.2fr_1fr] gap-6">
        <StatusOverviewCard v-if="statusDistribution.length" :distribution="statusDistribution" />
        <EmptyState v-else title="لا توجد مشاريع بعد" description="بمجرد ربط فريق بمشروع ستظهر توزيعة الحالات هنا." />

        <div class="bg-surface rounded-lg border border-border shadow-card p-6 flex flex-col items-center justify-center text-center">
          <span class="grid place-items-center w-12 h-12 rounded-pill bg-warning-bg text-warning mb-3">
            <AlertTriangle :size="22" />
          </span>
          <h3 class="text-h3 font-bold text-text-900 mb-1.5">متوسط الإنجاز غير متاح هنا</h3>
          <p class="text-caption text-text-600 max-w-xs">
            الباك إند لا يوفّر نسبة إنجاز مجمّعة بطلب واحد — تتطلب استدعاءً منفصلًا لكل فريق. راجعي
            <router-link :to="{ name: 'committee-progress' }" class="text-primary-600 font-bold hover:underline">صفحة نسبة تقدّم المشاريع</router-link>
            لعرضها فريقًا فريقًا.
          </p>
        </div>
      </div>
    </template>
  </div>
</template>

<script>
import { mapState, mapActions } from 'pinia'
import { Users, GraduationCap, UserCog, AlertTriangle } from 'lucide-vue-next'
import { useCommitteeStore } from '@/stores/committee.store'
import StatCard from '@/components/shared/StatCard.vue'
import StatusOverviewCard from '@/components/committee/StatusOverviewCard.vue'
import SkeletonLoader from '@/components/ui/SkeletonLoader.vue'
import ErrorState from '@/components/ui/ErrorState.vue'
import EmptyState from '@/components/ui/EmptyState.vue'

const STATUS_LABELS = { in_progress: 'قيد التنفيذ', completed: 'مكتمل', proposed: 'مقترح', pending: 'قيد الإعداد' }
const STATUS_COLORS = { in_progress: 'primary', completed: 'success', proposed: 'warning', pending: 'warning' }

export default {
  name: 'DashboardPage',

  components: { StatCard, StatusOverviewCard, SkeletonLoader, ErrorState, EmptyState, AlertTriangle },

  data() {
    return { Users, GraduationCap, UserCog }
  },

  computed: {
    ...mapState(useCommitteeStore, ['teams', 'teamsLoading', 'teamsError', 'studentsFromTeams', 'supervisorsFromTeams']),

    statusDistribution() {
      const counts = {}
      let total = 0
      this.teams.forEach((team) => {
        const status = team.project?.status
        if (!status) return
        counts[status] = (counts[status] || 0) + 1
        total += 1
      })
      if (!total) return []
      return Object.entries(counts).map(([status, count]) => ({
        label: STATUS_LABELS[status] || status,
        count,
        percent: Math.round((count / total) * 100),
        color: STATUS_COLORS[status] || 'primary'
      }))
    }
  },

  created() {
    this.loadTeams()
  },

  methods: {
    ...mapActions(useCommitteeStore, ['fetchTeams']),

    loadTeams() {
      this.fetchTeams().catch(() => {})
    }
  }
}
</script>
