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
            <span class="inline-block text-label font-bold text-primary-700 bg-primary-50 px-3 py-1 rounded-pill mb-1.5">{{ profile.roleLabel }}</span>
            <div class="text-h3 font-bold text-text-900 truncate">{{ profile.name }}</div>
            <div class="text-caption text-text-400 truncate">{{ profile.subRole }}</div>
          </div>
        </div>

        <div class="flex flex-col">
          <div v-for="row in infoRows" :key="row.k" class="flex items-center justify-between gap-4 py-3 border-b border-border-soft last:border-b-0 last:pb-0">
            <span class="text-caption text-text-400 shrink-0">{{ row.k }}</span>
            <span class="text-body-sm font-bold text-text-900 text-end break-words">{{ row.v }}</span>
          </div>
        </div>
      </div>

      <!-- الفرق المُشرَف عليها -->
      <div class="reveal reveal-delay-1 bg-surface rounded-lg border border-border shadow-card p-6 flex flex-col transition-all duration-base hover:shadow-card-hover">
        <div class="flex items-center justify-between mb-5">
          <h3 class="text-h3 font-bold text-text-900">فرقي الإشرافية</h3>
          <router-link :to="{ name: 'supervisor-tasks' }" class="text-caption font-bold text-primary-600 hover:underline">عرض المهام</router-link>
        </div>

        <div class="flex flex-col gap-3">
          <div
            v-for="team in visibleTeams" :key="team.id"
            class="group border border-border-soft rounded-md p-4 transition-all duration-fast hover:shadow-card hover:-translate-y-0.5 hover:border-primary-200"
          >
            <div class="flex items-center justify-between gap-3 mb-2 flex-wrap">
              <span class="font-bold text-body-sm text-text-900 transition-colors duration-fast group-hover:text-primary-700">{{ team.name }}</span>
              <BaseBadge :variant="team.status === 'completed' ? 'success' : team.status === 'proposed' ? 'warning' : 'info'" dot>{{ statusLabel(team.status) }}</BaseBadge>
            </div>
            <p class="text-caption text-text-600 mb-3">{{ team.project }}</p>
            <div class="flex flex-wrap gap-1.5">
              <span v-for="m in team.members" :key="m" class="inline-flex items-center text-label font-semibold text-text-700 bg-border-soft px-2.5 py-1 rounded-pill">{{ shortName(m) }}</span>
            </div>
          </div>
        </div>

        <button
          v-if="teams.length > 2" type="button"
          class="mt-4 flex items-center justify-center gap-2 h-11 rounded-sm border border-border bg-bg text-primary-700 text-body-sm font-bold hover:bg-primary-50 transition-colors duration-fast"
          @click="showAllTeams = !showAllTeams"
        >
          {{ showAllTeams ? 'عرض أقل' : 'عرض المزيد' }}
          <ChevronDown :size="14" :class="{ 'rotate-180': showAllTeams }" class="transition-transform duration-fast" />
        </button>
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
      </div>
    </div>
  </div>
</template>

<script>
import { ChevronDown } from 'lucide-vue-next'
import BaseBadge from '@/components/ui/BaseBadge.vue'
import { initials } from '@/utils/formatters'

const STATUS_LABELS = { in_progress: 'قيد التنفيذ', completed: 'مكتمل', proposed: 'مقترح' }

export default {
  name: 'SupervisorProfilePage',

  components: { BaseBadge, ChevronDown },

  data() {
    return {
      showAllTeams: false,
      profile: {
        name: 'د. محمد العتيبي',
        roleLabel: 'مشرف مشاريع تخرج',
        subRole: 'قسم هندسة الحاسوب ونظم المعلومات'
      },
      teams: [
        { id: 1, name: 'فريق الابتكار', project: 'منصة إدارة مشاريع التخرج', status: 'in_progress', percent: 70, members: ['أحمد سالم فهد الشريف', 'حسان عمر يوسف النجار', 'ياسر نبيل حسين الدوسري'] },
        { id: 2, name: 'فريق البيانات', project: 'نظام تحليل بيانات الطلاب', status: 'proposed', percent: 15, members: ['فهد داود سلمان الزهراني', 'نواف زياد كامل الغامدي'] },
        { id: 3, name: 'فريق الأمن السيبراني', project: 'أداة كشف الثغرات الأمنية', status: 'completed', percent: 100, members: ['خالد غسان مروان الدوسري', 'رامي درويش سالم الحربي', 'ماجد حمزة نبيل الشمري'] }
      ]
    }
  },

  computed: {
    initials() {
      return initials(this.profile.name)
    },

    infoRows() {
      return [
        { k: 'الرقم الوظيفي', v: 'SUP2049' },
        { k: 'البريد الإلكتروني', v: 'm.alotaibi@academy.edu.sa' },
        { k: 'التخصص', v: 'هندسة البرمجيات' },
        { k: 'عدد الفرق المُشرَف عليها', v: `${this.teams.length} فرق` },
        { k: 'الفصل الدراسي', v: '2026/2027 - الأول' }
      ]
    },

    visibleTeams() {
      return this.showAllTeams ? this.teams : this.teams.slice(0, 2)
    },

    averagePercent() {
      if (!this.teams.length) return 0
      return Math.round(this.teams.reduce((sum, t) => sum + t.percent, 0) / this.teams.length)
    },

    circumference() {
      return 2 * Math.PI * 63
    },

    ringOffset() {
      return this.circumference * (1 - this.averagePercent / 100)
    },

    statusDistribution() {
      const counts = {}
      this.teams.forEach((t) => { counts[t.status] = (counts[t.status] || 0) + 1 })
      const total = this.teams.length || 1
      return Object.entries(counts).map(([status, count]) => ({ status, count, percent: Math.round((count / total) * 100) }))
    }
  },

  methods: {
    statusLabel(status) {
      return STATUS_LABELS[status] || status
    },

    // يعرض أول كلمة وآخر كلمة من الاسم الرباعي الكامل — مثلاً "أحمد سالم فهد الشريف" تصبح "أحمد الشريف"
    shortName(fullName) {
      const parts = fullName.trim().split(/\s+/)
      return parts.length > 1 ? `${parts[0]} ${parts[parts.length - 1]}` : fullName
    }
  }
}
</script>
