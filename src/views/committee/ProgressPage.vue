<template>
  <div>
    <div class="flex flex-wrap items-center justify-between gap-4 mb-6">
      <div class="flex items-center gap-3">
        <span class="grid place-items-center w-9 h-9 rounded-md shrink-0 text-white" style="background: linear-gradient(135deg, var(--color-primary-600), var(--color-accent-500))">
          <TrendingUp :size="18" />
        </span>
        <div>
          <h3 class="text-h3 font-bold text-text-900">نسبة تقدّم المشاريع</h3>
          <p class="text-caption text-text-600">متابعة تقدّم الفرق وتصفية النتائج حسب الحالة والفريق</p>
        </div>
      </div>
      <BaseButton variant="outline" :icon="Download" :loading="exporting" @click="exportExcel">تصدير Excel</BaseButton>
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
      :loading="overviewLoading"
      :meta="{ current_page: page, last_page: totalPages, total: filteredRows.length }"
      empty-title="لا توجد نتائج مطابقة"
      @page-change="page = $event"
    >
      <template #cell-spec="{ value }"><span class="text-text-700">{{ value }}</span></template>
      <template #cell-sup="{ value }"><span class="text-text-700 font-semibold">{{ value }}</span></template>
      <template #cell-team="{ row }">
        <router-link :to="{ name: 'committee-teams' }" class="inline-flex items-center gap-1.5 font-bold text-primary-700 hover:text-primary-800 hover:underline transition-colors duration-fast">
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
import { TrendingUp, Search, ExternalLink, Download } from 'lucide-vue-next'
import { mapState, mapActions } from 'pinia'
import BaseButton from '@/components/ui/BaseButton.vue'
import BaseSelect from '@/components/ui/BaseSelect.vue'
import BaseBadge from '@/components/ui/BaseBadge.vue'
import DataTable from '@/components/ui/DataTable.vue'
import { useProgressStore } from '@/stores/progress.store'

const STATUS_LABELS = {
  completed: { label: 'مكتمل', variant: 'success' },
  in_progress: { label: 'قيد التنفيذ', variant: 'info' },
  proposed: { label: 'مقترح', variant: 'warning' }
}
const PAGE_SIZE = 4

export default {
  name: 'CommitteeProgressPage',

  components: { TrendingUp, Search, ExternalLink, BaseButton, BaseSelect, BaseBadge, DataTable },

  data() {
    return {
      Download,
      exporting: false,
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
      page: 1
    }
  },

  computed: {
    ...mapState(useProgressStore, ['overview', 'overviewLoading']),

    rows() {
      return this.overview.map((entry) => {
        const team = entry.team
        return {
          id: team.id,
          project: team.project?.name || '—',
          team: team.name,
          spec: team.specialization?.name || 'غير محدد',
          sup: team.supervisor?.name || 'غير محدد',
          members: (team.members || []).map((m) => m.student?.name).filter(Boolean),
          status: team.project?.status || 'proposed',
          pct: entry.progress.percentage
        }
      })
    },

    statusDistribution() {
      const counts = { completed: 0, in_progress: 0, proposed: 0 }
      this.rows.forEach((r) => { counts[r.status] = (counts[r.status] || 0) + 1 })
      const total = this.rows.length || 1
      return Object.entries(STATUS_LABELS).map(([status, { label }]) => ({
        status,
        label,
        count: counts[status] || 0,
        percent: Math.round(((counts[status] || 0) / total) * 100),
        barClass: status === 'completed' ? 'bg-success' : status === 'in_progress' ? 'bg-primary-600' : 'bg-warning'
      }))
    },

    averagePercent() {
      if (!this.rows.length) return 0
      return Math.round(this.rows.reduce((sum, r) => sum + r.pct, 0) / this.rows.length)
    },

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
  },

  async created() {
    await this.fetchProgress()
  },

  methods: {
    ...mapActions(useProgressStore, ['fetchProgress', 'exportProgressExcel']),

    async exportExcel() {
      this.exporting = true
      try {
        await this.exportProgressExcel()
      } catch {
        this.$toast?.error('تعذّر تصدير الملف')
      } finally {
        this.exporting = false
      }
    }
  }
}
</script>
