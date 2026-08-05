<template>
  <div>
    <div class="flex items-center gap-3 mb-6">
      <span class="grid place-items-center w-9 h-9 rounded-md shrink-0 text-white" style="background: linear-gradient(135deg, var(--color-primary-600), var(--color-accent-500))">
        <TrendingUp :size="18" />
      </span>
      <div>
        <h3 class="text-h3 font-bold text-text-900">نسبة تقدّم المشاريع</h3>
        <p class="text-caption text-text-600">متابعة تقدّم الفرق وتصفية النتائج حسب الحالة والفريق</p>
      </div>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-[1.2fr_1fr] gap-6 mb-6">
      <div class="bg-surface rounded-lg border border-border shadow-card p-6 flex flex-col justify-center gap-5">
        <p class="text-body-sm font-bold text-text-700">توزيع حالات المشاريع</p>
        <div v-for="row in statusDistribution" :key="row.status" class="flex flex-col gap-2">
          <div class="flex items-center justify-between text-body-sm">
            <span class="text-text-600">{{ row.label }}</span>
            <span class="font-bold text-text-900">{{ row.count }} مشروع</span>
          </div>
          <div class="h-2.5 rounded-pill bg-border-soft overflow-hidden">
            <div class="h-full rounded-pill" :class="row.barClass" :style="{ width: row.percent + '%' }" />
          </div>
        </div>
      </div>

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
      </div>
    </div>

    <div class="flex flex-wrap items-center gap-3 mb-6 p-4 rounded-lg bg-surface border border-border shadow-card">
      <BaseSelect v-model="statusFilter" class="min-w-[160px]" placeholder="كل الحالات" include-placeholder-option :options="statusOptions" />
      <BaseSelect v-model="teamFilter" class="min-w-[170px]" placeholder="جميع الفرق" include-placeholder-option :options="teamOptions" />
      <div class="relative flex-1 min-w-[220px]">
        <Search :size="16" class="pointer-events-none absolute top-1/2 -translate-y-1/2 start-3 text-text-400" />
        <input v-model.trim="search" type="search" placeholder="ابحث عن مشروع أو فريق..." class="w-full h-icon-btn ps-10 pe-3 rounded-sm border border-border bg-bg text-body text-text-900 focus:border-primary-600 transition-colors duration-fast">
      </div>
    </div>

    <DataTable
      :columns="columns" :rows="pageRows" row-key="id" :primary-keys="['team', 'pct']"
      :meta="{ current_page: page, last_page: totalPages, total: filteredRows.length }"
      empty-title="لا توجد نتائج مطابقة"
      @page-change="page = $event"
    >
      <template #cell-spec="{ value }"><span class="text-text-700">{{ value }}</span></template>
      <template #cell-sup="{ value }"><span class="text-text-700 font-semibold">{{ value }}</span></template>
      <template #cell-team="{ row }">
        <router-link :to="{ name: 'committee-teams', query: { group: row.grp } }" class="inline-flex items-center gap-1.5 font-bold text-primary-700 hover:text-primary-800 hover:underline transition-colors duration-fast">
          {{ row.team }} <ExternalLink :size="11" class="opacity-65" />
        </router-link>
        <div class="text-label text-text-400 mt-0.5">{{ row.project }}</div>
      </template>
      <template #cell-members="{ value }">
        <div class="flex flex-wrap gap-1">
          <span v-for="member in value" :key="member" class="name-pill px-2 py-0.5 rounded-pill bg-border-soft text-caption text-text-700 font-semibold">{{ member }}</span>
        </div>
      </template>
      <template #cell-status="{ row }"><BaseBadge :variant="row.statusVariant" dot>{{ row.statusLabel }}</BaseBadge></template>
      <template #cell-pct="{ value }">
        <div class="flex items-center gap-2 min-w-[120px]">
          <div class="flex-1 h-1.5 rounded-pill bg-border-soft overflow-hidden"><div class="h-full rounded-pill bg-primary-600" :style="{ width: value + '%' }" /></div>
          <span class="text-caption font-bold w-9 text-start">{{ value }}%</span>
        </div>
      </template>
    </DataTable>
  </div>
</template>

<script>
import { TrendingUp, Search, ExternalLink } from 'lucide-vue-next'
import BaseSelect from '@/components/ui/BaseSelect.vue'
import BaseBadge from '@/components/ui/BaseBadge.vue'
import DataTable from '@/components/ui/DataTable.vue'
import { SPECIALIZATIONS } from '@/utils/specializations'

const [SPEC_WEB, SPEC_MOBILE, SPEC_DB, SPEC_MEDIA_D, SPEC_MEDIA_B] = SPECIALIZATIONS

const STATUS_LABELS = {
  completed: { label: 'مكتمل', variant: 'success' },
  in_progress: { label: 'قيد التنفيذ', variant: 'info' },
  proposed: { label: 'مقترح', variant: 'warning' }
}
const PAGE_SIZE = 4

export default {
  name: 'CommitteeProgressPage',

  components: { TrendingUp, Search, ExternalLink, BaseSelect, BaseBadge, DataTable },

  data() {
    return {
      search: '',
      statusFilter: '',
      teamFilter: '',
      columns: [
        { key: 'spec', label: 'التخصص' },
        { key: 'sup', label: 'المشرف' },
        { key: 'team', label: 'الفريق' },
        { key: 'members', label: 'الأعضاء' },
        { key: 'status', label: 'الحالة' },
        { key: 'pct', label: 'نسبة الإنجاز' }
      ],
      statusDistribution: [
        { status: 'completed', label: 'مكتمل', count: 46, percent: 55, barClass: 'bg-success' },
        { status: 'in_progress', label: 'قيد التنفيذ', count: 31, percent: 37, barClass: 'bg-primary-600' },
        { status: 'proposed', label: 'مقترح', count: 7, percent: 8, barClass: 'bg-warning' }
      ],
      averagePercent: 68,
      page: 1,
      rows: [
        { id: 1, project: 'رقيب - نظام مراقبة بالذكاء الاصطناعي', team: 'فريق نوفا', grp: '31', spec: SPEC_WEB, sup: 'د. أحمد الشريف', members: ['سلطان', 'علي', 'يوسف'], status: 'completed', pct: 100 },
        { id: 2, project: 'منصة توصيل جامعية ذكية', team: 'فريق كوانتم', grp: '52', spec: SPEC_MOBILE, sup: 'د. سلمى نصار', members: ['سعد', 'فيصل', 'إبراهيم'], status: 'in_progress', pct: 72 },
        { id: 3, project: 'منصة إدارة مشاريع التخرج', team: 'فريق الابتكار', grp: '54', spec: SPEC_DB, sup: 'د. أحمد النبريص', members: ['رانا', 'سارة', 'ماجد'], status: 'in_progress', pct: 18 },
        { id: 4, project: 'نظام تحليل بيانات جامعي', team: 'فريق نوفا', grp: '31', spec: SPEC_WEB, sup: 'د. أحمد الشريف', members: ['عبدالله', 'أحمد'], status: 'proposed', pct: 0 },
        { id: 5, project: 'متجر إلكتروني بتقنيات AR', team: 'فريق كوانتم', grp: '52', spec: SPEC_MOBILE, sup: 'د. سلمى نصار', members: ['مروان', 'نواف'], status: 'in_progress', pct: 45 },
        { id: 6, project: 'أداة كشف الثغرات الأمنية', team: 'فريق الابتكار', grp: '54', spec: SPEC_DB, sup: 'د. أحمد النبريص', members: ['حسين', 'ماجد'], status: 'completed', pct: 100 },
        { id: 7, project: 'منصة تسجيل حضور بالوجه', team: 'فريق نوفا', grp: '31', spec: SPEC_WEB, sup: 'د. أحمد الشريف', members: ['هدى', 'رامي'], status: 'in_progress', pct: 60 },
        { id: 8, project: 'تطبيق تحليل الصور الطبية', team: 'فريق كوانتم', grp: '52', spec: SPEC_MOBILE, sup: 'د. سلمى نصار', members: ['مني', 'ريم'], status: 'proposed', pct: 0 }
      ]
    }
  },

  computed: {
    circumference() {
      return 2 * Math.PI * 63
    },
    ringOffset() {
      return this.circumference * (1 - this.averagePercent / 100)
    },

    statusOptions() {
      return Object.entries(STATUS_LABELS).map(([value, { label }]) => ({ value, label }))
    },
    teamOptions() {
      return [...new Set(this.rows.map((r) => r.team))].map((team) => ({ value: team, label: team }))
    },

    decoratedRows() {
      return this.rows.map((row) => ({
        ...row,
        statusLabel: STATUS_LABELS[row.status]?.label || row.status,
        statusVariant: STATUS_LABELS[row.status]?.variant || 'neutral'
      }))
    },

    filteredRows() {
      const q = this.search.trim()
      return this.decoratedRows.filter((row) => {
        const matchQ = !q || `${row.project}${row.team}`.includes(q)
        const matchStatus = !this.statusFilter || row.status === this.statusFilter
        const matchTeam = !this.teamFilter || row.team === this.teamFilter
        return matchQ && matchStatus && matchTeam
      })
    },

    totalPages() {
      return Math.max(1, Math.ceil(this.filteredRows.length / PAGE_SIZE))
    },
    pageRows() {
      const start = (this.page - 1) * PAGE_SIZE
      return this.filteredRows.slice(start, start + PAGE_SIZE)
    }
  },

  watch: {
    filteredRows() {
      this.page = 1
    }
  }
}
</script>
