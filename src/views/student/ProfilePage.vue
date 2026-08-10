<template>
  <div>
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
      <!-- بيانات الطالب -->
      <div class="reveal bg-surface rounded-lg border border-border shadow-card p-6 flex flex-col transition-all duration-base hover:shadow-card-hover">
        <div class="flex items-center gap-3 mb-6">
          <span class="grid place-items-center w-9 h-9 rounded-md shrink-0 text-white" style="background: linear-gradient(135deg, var(--color-primary-600), var(--color-accent-500))"><User :size="18" /></span>
          <h3 class="text-h3 font-bold text-text-900">بيانات الطالب</h3>
        </div>

        <div class="flex items-center gap-4 mb-6 flex-wrap">
          <span class="grid place-items-center w-16 h-16 rounded-pill shrink-0 text-white font-cairo font-black text-h2" style="background: linear-gradient(135deg, var(--color-primary-600), var(--color-accent-500))">
            {{ initials }}
          </span>
          <div class="min-w-0">
            <div class="flex items-center gap-2 flex-wrap">
              <span class="text-h3 font-bold text-text-900 truncate">{{ user?.name }}</span>
              <span class="shrink-0 text-label font-bold px-2.5 py-1 rounded-pill text-text-600 bg-border-soft">عضو</span>
            </div>
            <div class="text-caption text-text-400 mt-0.5">طالب</div>
          </div>
        </div>

        <div class="flex flex-col">
          <div v-for="row in infoRows" :key="row.k" class="flex items-center justify-between gap-4 py-3 border-b border-border-soft last:border-b-0 last:pb-0">
            <span class="text-caption text-text-400 shrink-0">{{ row.k }}</span>
            <span class="text-body-sm font-bold text-text-900 text-end break-words">{{ row.v }}</span>
          </div>
        </div>
      </div>

      <!-- فريقي -->
      <div class="reveal reveal-delay-1 bg-surface rounded-lg border border-border shadow-card p-6 flex flex-col transition-all duration-base hover:shadow-card-hover">
        <div class="flex items-center gap-3 mb-6">
          <span class="grid place-items-center w-9 h-9 rounded-md shrink-0 text-white" style="background: linear-gradient(135deg, var(--color-primary-600), var(--color-accent-500))"><Users :size="18" /></span>
          <h3 class="text-h3 font-bold text-text-900">فريقي</h3>
        </div>

        <EmptyState v-if="!myTeam" title="لسا ما إلك فريق" />
        <template v-else>
          <div class="flex flex-col">
            <div class="flex items-center justify-between gap-4 py-3 border-b border-border-soft">
              <span class="text-caption text-text-400 shrink-0">اسم الفريق</span>
              <span class="text-body-sm font-bold text-text-900 text-end">{{ myTeam.name }}</span>
            </div>
            <div class="flex items-center justify-between gap-4 py-3 border-b border-border-soft">
              <span class="text-caption text-text-400 shrink-0">المشرف</span>
              <span class="text-body-sm font-bold text-text-900 text-end">{{ myTeam.supervisor?.name || 'غير محدد' }}</span>
            </div>
            <template v-if="myTeam.project">
              <div class="flex items-center justify-between gap-4 py-3 border-b border-border-soft">
                <span class="text-caption text-text-400 shrink-0">اسم المشروع</span>
                <span class="text-body-sm font-bold text-text-900 text-end">{{ myTeam.project.name || '—' }}</span>
              </div>
              <div v-if="myTeam.project.description" class="py-3 border-b border-border-soft">
                <div class="text-caption text-text-400 mb-1.5">وصف المشروع</div>
                <p class="text-body-sm text-text-700 leading-relaxed">{{ myTeam.project.description }}</p>
              </div>
            </template>
          </div>

          <div class="mt-4 flex-1">
            <div class="text-caption text-text-400 mb-2.5">أعضاء الفريق</div>
            <div class="flex flex-wrap gap-2">
              <span
                v-for="m in myTeam.members" :key="m.id"
                class="inline-flex items-center gap-1.5 text-caption font-semibold px-3 py-1.5 rounded-pill"
                :class="m.is_leader ? 'bg-warning-bg text-warning-text' : 'bg-border-soft text-text-700'"
              >
                <Crown v-if="m.is_leader" :size="12" />
                {{ m.is_leader ? `قائد ${m.student?.name}` : m.student?.name }}
              </span>
            </div>
          </div>
        </template>
      </div>
    </div>

    <!-- مخطط تقدم المشروع -->
    <div v-if="myTeam" class="bg-surface rounded-lg border border-border shadow-card p-6">
      <div class="flex items-center justify-between gap-4 mb-5 flex-wrap">
        <div class="flex items-center gap-3">
          <span class="grid place-items-center w-9 h-9 rounded-md shrink-0 text-white" style="background: linear-gradient(135deg, var(--color-primary-600), var(--color-accent-500))"><BarChart3 :size="18" /></span>
          <h3 class="text-h3 font-bold text-text-900">مخطط تقدم المشروع</h3>
        </div>
        <router-link :to="{ name: 'student-tasks' }" class="inline-flex items-center gap-1.5 text-caption font-bold text-text-600 bg-border-soft px-3 py-1.5 rounded-pill hover:text-primary-700 transition-colors duration-fast">
          <Kanban :size="13" /> انتقل إلى لوحة Kanban
        </router-link>
      </div>

      <div class="flex items-center justify-between text-caption text-text-600 mb-1.5 flex-wrap gap-1">
        <span>{{ kanban.done }} / {{ kanban.total }} مهمة منجزة</span>
        <span class="font-cairo font-extrabold text-h4 text-text-900">{{ kanbanPercent }}%</span>
      </div>
      <div class="h-2.5 rounded-pill bg-border-soft overflow-hidden mb-6">
        <div class="h-full rounded-pill bg-primary-600" :style="{ width: kanbanPercent + '%' }" />
      </div>

      <div class="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div v-for="stat in kanbanStats" :key="stat.key" class="group bg-bg rounded-md border border-border-soft p-4 text-center transition-all duration-fast hover:-translate-y-0.5 hover:bg-surface hover:shadow-card hover:border-primary-200">
          <div class="font-cairo font-extrabold text-h3 transition-transform duration-fast group-hover:scale-110" :class="stat.colorClass">{{ stat.value }}</div>
          <div class="text-label text-text-600 mt-1">{{ stat.label }}</div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { mapState, mapActions } from 'pinia'
import { User, Users, Crown, BarChart3, Kanban } from 'lucide-vue-next'
import EmptyState from '@/components/ui/EmptyState.vue'
import { initials } from '@/utils/formatters'
import { useTeamsStore } from '@/stores/teams.store'
import { useAuthStore } from '@/stores/auth.store'

export default {
  name: 'StudentProfilePage',

  components: { User, Users, Crown, BarChart3, Kanban, EmptyState },

  computed: {
    ...mapState(useTeamsStore, ['teams', 'tasks']),
    ...mapState(useAuthStore, ['user']),

    initials() {
      return initials(this.user?.name || '')
    },

    myTeam() {
      return this.teams.find((t) => t.members?.some((m) => m.student?.id === this.user?.id))
    },

    infoRows() {
      return [
        { k: 'البريد الإلكتروني', v: this.user?.email || '—' },
        { k: 'الرقم الجامعي', v: this.user?.university_number || '—' },
        { k: 'التخصص', v: this.user?.specialization?.name || '—' },
        { k: 'الفصل الدراسي', v: this.user?.academicTerm?.name || '—' }
      ]
    },

    kanban() {
      return {
        total: this.tasks.length,
        done: this.tasks.filter((t) => t.status === 'done').length,
        review: this.tasks.filter((t) => t.status === 'review').length,
        progress: this.tasks.filter((t) => t.status === 'in_progress').length,
        pending: this.tasks.filter((t) => t.status === 'pending').length
      }
    },

    kanbanPercent() {
      if (!this.kanban.total) return 0
      return Math.round((this.kanban.done / this.kanban.total) * 100)
    },

    kanbanStats() {
      return [
        { key: 'done', label: 'منجزة', value: this.kanban.done, colorClass: 'text-success' },
        { key: 'review', label: 'مراجعة', value: this.kanban.review, colorClass: 'text-warning-text' },
        { key: 'progress', label: 'قيد التنفيذ', value: this.kanban.progress, colorClass: 'text-primary-600' },
        { key: 'pending', label: 'قيد الانتظار', value: this.kanban.pending, colorClass: 'text-secondary-600' }
      ]
    }
  },

  async created() {
    await this.fetchCurrentUser()
    await this.fetchTeams()
    if (this.myTeam) await this.fetchTasks(this.myTeam.id)
  },

  methods: {
    ...mapActions(useTeamsStore, ['fetchTeams', 'fetchTasks']),
    ...mapActions(useAuthStore, ['fetchCurrentUser'])
  }
}
</script>
