<template>
  <div>
    <div class="flex items-start gap-3 mb-6 p-4 rounded-lg bg-warning-bg border border-warning-border">
      <AlertTriangle :size="18" class="text-warning shrink-0 mt-0.5" />
      <p class="text-caption text-warning-text leading-relaxed">
        لا يوجد بالباك إند مفهوم "أرشيف" أو حالة "منتهي" تُفعَّل تلقائيًا، ولا endpoint لتمييز مشروع بنجمة أو لعرض ملفاته.
        هذه القائمة مُشتقّة من <code class="bg-surface px-1.5 py-0.5 rounded-sm">GET /teams</code> — كل المشاريع المرتبطة بفريق، بصرف النظر عن حالتها.
      </p>
    </div>

    <div class="flex flex-wrap items-center gap-3 mb-6 p-4 rounded-lg bg-surface border border-border shadow-card">
      <div class="relative flex-1 min-w-[220px]">
        <Search :size="16" class="pointer-events-none absolute top-1/2 -translate-y-1/2 start-3 text-text-400" />
        <input v-model.trim="search" type="search" placeholder="ابحث عن مشروع أو فريق..." class="w-full h-icon-btn ps-10 pe-3 rounded-sm border border-border bg-bg text-body text-text-900 focus:border-primary-600 transition-colors duration-fast">
      </div>
      <BaseSelect v-model="specFilter" class="min-w-[200px]" placeholder="جميع التخصصات" include-placeholder-option :options="specializationOptions" />
      <BaseSelect v-model="statusFilter" class="min-w-[170px]" placeholder="كل الحالات" include-placeholder-option :options="statusOptions" />
    </div>

    <SkeletonLoader v-if="teamsLoading" :rows="6" height="24px" />
    <ErrorState v-else-if="teamsError" :message="teamsError" @retry="loadTeams" />
    <DataTable v-else :columns="columns" :rows="filteredProjects" row-key="id" empty-title="لا توجد مشاريع مطابقة">
      <template #cell-proj="{ value }"><span class="font-bold text-text-900">{{ value }}</span></template>
      <template #cell-status="{ value }"><BaseBadge :variant="statusVariant(value)" dot>{{ statusLabel(value) }}</BaseBadge></template>
    </DataTable>
  </div>
</template>

<script>
import { mapState, mapActions } from 'pinia'
import { Search, AlertTriangle } from 'lucide-vue-next'
import { useCommitteeStore } from '@/stores/committee.store'
import BaseSelect from '@/components/ui/BaseSelect.vue'
import BaseBadge from '@/components/ui/BaseBadge.vue'
import DataTable from '@/components/ui/DataTable.vue'
import SkeletonLoader from '@/components/ui/SkeletonLoader.vue'
import ErrorState from '@/components/ui/ErrorState.vue'

const STATUS_LABELS = { in_progress: 'قيد التنفيذ', completed: 'مكتمل', proposed: 'مقترح', pending: 'قيد الإعداد' }

export default {
  name: 'ProjectArchivePage',

  components: { BaseSelect, BaseBadge, DataTable, SkeletonLoader, ErrorState, Search, AlertTriangle },

  data() {
    return {
      search: '',
      specFilter: '',
      statusFilter: '',
      columns: [
        { key: 'spec', label: 'التخصص' },
        { key: 'team', label: 'الفريق' },
        { key: 'proj', label: 'المشروع' },
        { key: 'members', label: 'عدد الأعضاء' },
        { key: 'status', label: 'الحالة' }
      ]
    }
  },

  computed: {
    ...mapState(useCommitteeStore, ['teams', 'teamsLoading', 'teamsError', 'specializations']),

    specializationOptions() {
      return this.specializations.map((s) => ({ value: s.id, label: s.name }))
    },
    statusOptions() {
      const values = new Set(this.teams.map((t) => t.project?.status).filter(Boolean))
      return [...values].map((v) => ({ value: v, label: STATUS_LABELS[v] || v }))
    },

    projectRows() {
      return this.teams
        .filter((t) => t.project)
        .map((t) => ({
          id: t.id,
          spec: this.specializations.find((s) => s.id === t.specialization_id)?.name || '—',
          specId: t.specialization_id,
          team: t.name,
          proj: t.project.name,
          members: (t.members || []).length,
          status: t.project.status
        }))
    },

    filteredProjects() {
      const q = this.search.trim()
      return this.projectRows.filter((row) => {
        const matchQ = !q || `${row.proj}${row.team}`.includes(q)
        const matchSpec = !this.specFilter || String(row.specId) === String(this.specFilter)
        const matchStatus = !this.statusFilter || row.status === this.statusFilter
        return matchQ && matchSpec && matchStatus
      })
    }
  },

  created() {
    this.fetchRefData()
    this.loadTeams()
  },

  methods: {
    ...mapActions(useCommitteeStore, ['fetchTeams', 'fetchRefData']),

    loadTeams() {
      return this.fetchTeams().catch(() => {})
    },

    statusLabel(status) {
      return STATUS_LABELS[status] || status
    },
    statusVariant(status) {
      return { completed: 'success', proposed: 'warning' }[status] || 'info'
    }
  }
}
</script>
