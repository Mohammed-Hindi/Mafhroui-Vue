<template>
  <div>
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
      <!-- بيانات المشرف -->
      <div class="reveal bg-surface rounded-lg border border-border shadow-card p-6 transition-all duration-base hover:shadow-card-hover">
        <div class="flex items-center gap-4 mb-6 flex-wrap">
          <span class="grid place-items-center w-16 h-16 rounded-pill shrink-0 text-white font-cairo font-black text-h2" style="background: linear-gradient(135deg, var(--color-primary-600), var(--color-accent-500))">
            {{ initials }}
          </span>
          <div class="min-w-0">
            <span class="inline-block text-label font-bold text-primary-700 bg-primary-50 px-3 py-1 rounded-pill mb-1.5">مشرف مشاريع تخرج</span>
            <div class="text-h3 font-bold text-text-900 truncate">{{ user?.name }}</div>
            <div class="text-caption text-text-400 truncate">{{ user?.specialization?.name }}</div>
          </div>
        </div>

        <div class="flex flex-col">
          <div v-for="row in infoRows" :key="row.k" class="flex items-center justify-between gap-4 py-3 border-b border-border-soft">
            <span class="text-caption text-text-400 shrink-0">{{ row.k }}</span>
            <span class="text-body-sm font-bold text-text-900 text-end break-words">{{ row.v }}</span>
          </div>
          <button
            type="button"
            class="group flex items-center justify-between gap-4 py-3 text-start transition-colors duration-fast hover:text-primary-700"
            @click="changePasswordOpen = true"
          >
            <span class="text-caption text-text-400 shrink-0 group-hover:text-primary-700">تغيير كلمة السر</span>
            <span class="flex items-center gap-1.5 text-body-sm font-bold text-primary-600">
              انقر للتغيير <ChevronLeft :size="15" />
            </span>
          </button>
        </div>
      </div>

      <!-- فريقي -->
      <div class="reveal reveal-delay-1 bg-surface rounded-lg border border-border shadow-card p-6 flex flex-col transition-all duration-base hover:shadow-card-hover">
        <div class="flex items-center justify-between mb-5">
          <h3 class="text-h3 font-bold text-text-900">فريقي</h3>
          <router-link v-if="myTeams.length" :to="{ name: 'supervisor-teams' }" class="text-caption font-bold text-primary-600 hover:underline shrink-0">عرض المزيد</router-link>
        </div>

        <div class="flex flex-col gap-3 max-h-[380px] overflow-y-auto pe-1 scrollbar-thin">
          <div
            v-for="team in myTeams" :key="team.id"
            class="group border border-border-soft rounded-md p-4 transition-all duration-fast hover:shadow-card hover:-translate-y-0.5 hover:border-primary-200"
          >
            <div class="flex items-center justify-between gap-3 mb-2 flex-wrap">
              <span class="font-bold text-body-sm text-text-900 transition-colors duration-fast group-hover:text-primary-700">{{ team.name }}</span>
              <BaseBadge :variant="team.projectStatus === 'completed' ? 'success' : team.projectStatus === 'proposed' ? 'warning' : 'info'" dot>{{ statusLabel(team.projectStatus) }}</BaseBadge>
            </div>
            <p class="text-caption text-text-600 mb-3">{{ team.projectName || 'بدون مشروع بعد' }}</p>
            <div class="flex flex-wrap gap-1.5">
              <span v-for="m in team.members" :key="m.name" class="inline-flex items-center text-label font-semibold text-text-700 bg-border-soft px-2.5 py-1 rounded-pill">{{ shortName(m.name) }}</span>
            </div>
          </div>

          <p v-if="!myTeams.length" class="text-caption text-text-400 text-center py-6">لا توجد فرق مُسندة إليك حالياً</p>
        </div>
      </div>
    </div>

    <!-- إحصائيات -->
    <div class="grid grid-cols-1 lg:grid-cols-[minmax(0,320px)_1fr] gap-6">
      <div class="bg-surface rounded-lg border border-border shadow-card p-6 flex flex-col items-center">
        <p class="text-body-sm font-bold text-text-700 mb-5">متوسط نسبة الإنجاز</p>
        <div class="relative w-[150px] h-[150px]">
          <svg width="150" height="150" viewBox="0 0 150 150" style="transform: rotate(-90deg)">
            <circle cx="75" cy="75" r="63" fill="none" stroke="var(--color-border-soft)" stroke-width="12" />
            <circle cx="75" cy="75" r="63" fill="none" stroke="var(--color-primary-600)" stroke-width="12" stroke-linecap="round" :stroke-dasharray="circumference" :stroke-dashoffset="ringOffset" />
          </svg>
          <div class="absolute inset-0 flex flex-col items-center justify-center">
            <span class="font-cairo font-black text-h1 text-text-900">{{ averagePercent }}%</span>
            <span class="text-label text-text-400">متوسط الإنجاز</span>
          </div>
        </div>
      </div>

      <div class="bg-surface rounded-lg border border-border shadow-card p-6 flex flex-col justify-center gap-5">
        <p class="text-body-sm font-bold text-text-700">توزيع حالات المشاريع</p>
        <div v-for="row in statusDistribution" :key="row.status" class="flex flex-col gap-2">
          <div class="flex items-center justify-between text-caption">
            <span class="font-bold text-text-900">{{ statusLabel(row.status) }}</span>
            <span class="text-text-600">{{ row.count }} {{ row.count === 1 ? 'فريق' : 'فرق' }}</span>
          </div>
          <div class="h-2 rounded-pill bg-border-soft overflow-hidden">
            <div class="h-full rounded-pill" :class="row.status === 'completed' ? 'bg-success' : row.status === 'proposed' ? 'bg-warning' : 'bg-primary-600'" :style="{ width: row.percent + '%' }" />
          </div>
        </div>
        <p v-if="!statusDistribution.length" class="text-caption text-text-400 text-center py-4">لا توجد بيانات بعد</p>
      </div>
    </div>

    <ChangePasswordModal v-model="changePasswordOpen" />
  </div>
</template>

<script>
import { mapState, mapActions } from 'pinia'
import { ChevronLeft } from 'lucide-vue-next'
import BaseBadge from '@/components/ui/BaseBadge.vue'
import { initials } from '@/utils/formatters'
import { useAuthStore } from '@/stores/auth.store'
import { useTeamsStore } from '@/stores/teams.store'
import ChangePasswordModal from '@/components/shared/ChangePasswordModal.vue'

const STATUS_LABELS = { in_progress: 'قيد التنفيذ', completed: 'مكتمل', proposed: 'مقترح' }

export default {
  name: 'SupervisorProfilePage',

  components: { BaseBadge, ChevronLeft, ChangePasswordModal },

  data() {
    return {
      changePasswordOpen: false,
      progressByTeam: {}
    }
  },

  computed: {
    ...mapState(useAuthStore, ['user']),
    ...mapState(useTeamsStore, ['teamsForDisplay']),

    initials() {
      return initials(this.user?.name || '')
    },

    myTeams() {
      return this.teamsForDisplay.filter((t) => t.supId === this.user?.id)
    },

    infoRows() {
      return [
        { k: 'الرقم الوظيفي', v: this.user?.employee_number || '—' },
        { k: 'البريد الإلكتروني', v: this.user?.email || '—' },
        { k: 'عدد الفرق المُشرَف عليها', v: `${this.myTeams.length} فرق` },
        { k: 'الفصل الدراسي', v: this.user?.academicTerm?.name || '—' }
      ]
    },

    averagePercent() {
      const values = this.myTeams.map((t) => this.progressByTeam[t.id]?.percentage).filter((v) => v !== undefined)
      if (!values.length) return 0
      return Math.round(values.reduce((sum, v) => sum + v, 0) / values.length)
    },

    circumference() {
      return 2 * Math.PI * 63
    },

    ringOffset() {
      return this.circumference * (1 - this.averagePercent / 100)
    },

    statusDistribution() {
      const counts = {}
      this.myTeams.forEach((t) => {
        const status = t.projectStatus || 'proposed'
        counts[status] = (counts[status] || 0) + 1
      })
      const total = this.myTeams.length || 1
      return Object.entries(counts).map(([status, count]) => ({ status, count, percent: Math.round((count / total) * 100) }))
    }
  },

  async created() {
    await Promise.all([this.fetchCurrentUser(), this.fetchTeams()])
    const results = await Promise.all(this.myTeams.map((t) => this.fetchTeamProgress(t.id).then((p) => [t.id, p])))
    this.progressByTeam = Object.fromEntries(results)
  },

  methods: {
    ...mapActions(useAuthStore, ['fetchCurrentUser']),
    ...mapActions(useTeamsStore, ['fetchTeams', 'fetchTeamProgress']),

    statusLabel(status) {
      return STATUS_LABELS[status] || status
    },

    // يعرض أول كلمة وآخر كلمة من الاسم الرباعي الكامل — مثلاً "أحمد سالم فهد الشريف" تصبح "أحمد الشريف"
    shortName(fullName) {
      const parts = String(fullName || '').trim().split(/\s+/)
      return parts.length > 1 ? `${parts[0]} ${parts[parts.length - 1]}` : fullName
    }
  }
}
</script>
