<template>
  <div>
    <div class="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-8">
      <div v-for="stat in stats" :key="stat.label" class="reveal group bg-surface rounded-lg border border-border shadow-card p-6 transition-all duration-base hover:-translate-y-1 hover:shadow-card-hover hover:border-primary-200 active:scale-[0.98]">
        <span class="grid place-items-center w-11 h-11 rounded-md mb-4" :class="stat.bg + ' ' + stat.color">
          <component :is="stat.icon" :size="20" />
        </span>
        <div class="text-body-sm text-text-600 font-medium">{{ stat.label }}</div>
        <div class="font-cairo font-extrabold text-h1 text-text-900 mt-2 transition-colors duration-base group-hover:text-primary-600"><CountUp :value="stat.value" /></div>
        <div class="text-caption text-text-400 mt-0.5">{{ stat.hint }}</div>
      </div>
    </div>

    <div class="flex items-center gap-3 mb-5">
      <span class="grid place-items-center w-9 h-9 rounded-md shrink-0 text-white" style="background: linear-gradient(135deg, var(--color-primary-600), var(--color-accent-500))">
        <LayoutGrid :size="18" />
      </span>
      <div>
        <h3 class="text-h3 font-bold text-text-900">توزيع الحالات ومتوسط الإنجاز</h3>
        <p class="text-caption text-text-600">نظرة عامة على جميع مشاريع الفصل الدراسي</p>
      </div>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-[1fr_1.2fr] gap-6">
      <div class="bg-surface rounded-lg border border-border shadow-card p-6 flex flex-col items-center">
        <p class="text-body-sm font-bold text-text-700 mb-5">متوسط نسبة الإنجاز</p>
        <div class="relative w-[150px] h-[150px]">
          <svg width="150" height="150" viewBox="0 0 150 150" style="transform: rotate(-90deg)">
            <circle cx="75" cy="75" r="63" fill="none" stroke="var(--color-border-soft)" stroke-width="16" />
            <circle cx="75" cy="75" r="63" fill="none" stroke="var(--color-primary-600)" stroke-width="16" stroke-linecap="round" :stroke-dasharray="circumference" :stroke-dashoffset="ringOffset" />
          </svg>
          <div class="absolute inset-0 flex flex-col items-center justify-center">
            <span class="font-cairo font-black text-h1 text-text-900">{{ averagePercent }}%</span>
            <span class="text-label text-text-600">متوسط الإنجاز</span>
          </div>
        </div>
        <div class="flex items-center gap-6 mt-4">
          <span class="flex items-center gap-2 text-caption text-text-600"><span class="w-2 h-2 rounded-pill bg-primary-600" /> منجز</span>
          <span class="flex items-center gap-2 text-caption text-text-600"><span class="w-2 h-2 rounded-pill bg-border-soft border border-border" /> متبقي</span>
        </div>
      </div>

      <div class="bg-surface rounded-lg border border-border shadow-card p-6 flex flex-col justify-center gap-5">
        <p class="text-body-sm font-bold text-text-700">توزيع حالات المشاريع</p>
        <div v-for="row in statusDistribution" :key="row.status" class="flex flex-col gap-2">
          <div class="flex items-center justify-between text-body-sm">
            <span class="font-bold text-text-900">{{ row.count }} مشروع</span>
            <span class="text-text-600">{{ row.label }}</span>
          </div>
          <div class="h-2.5 rounded-pill bg-border-soft overflow-hidden">
            <div class="h-full rounded-pill" :class="row.barClass" :style="{ width: row.percent + '%' }" />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { Users, GraduationCap, UserCog, LayoutGrid } from 'lucide-vue-next'
import CountUp from '@/components/ui/CountUp.vue'

export default {
  name: 'CommitteeDashboardPage',

  components: { LayoutGrid, CountUp },

  data() {
    return {
      stats: [
        { label: 'المشاريع المكتملة', value: 84, hint: 'مشروع من إجمالي الفصل', icon: Users, bg: 'bg-primary-50', color: 'text-primary-600' },
        { label: 'عدد الشعب', value: 4, hint: 'شعبة دراسية', icon: GraduationCap, bg: 'bg-secondary-50', color: 'text-secondary-600' },
        { label: 'إجمالي الطلاب', value: 102, hint: 'طالب مسجل', icon: UserCog, bg: 'bg-accent-50', color: 'text-accent-600' }
      ],
      averagePercent: 68,
      statusDistribution: [
        { status: 'completed', label: 'مكتمل', count: 46, percent: 55, barClass: 'bg-success' },
        { status: 'in_progress', label: 'قيد التنفيذ', count: 31, percent: 37, barClass: 'bg-primary-600' },
        { status: 'proposed', label: 'مقترح', count: 7, percent: 8, barClass: 'bg-warning' }
      ]
    }
  },

  computed: {
    circumference() {
      return 2 * Math.PI * 63
    },
    ringOffset() {
      return this.circumference * (1 - this.averagePercent / 100)
    }
  }
}
</script>
