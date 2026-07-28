<template>
  <div>
    <div class="flex items-start gap-3 mb-6 p-4 rounded-lg bg-warning-bg border border-warning-border">
      <AlertTriangle :size="18" class="text-warning shrink-0 mt-0.5" />
      <p class="text-caption text-warning-text leading-relaxed">
        لا يوجد استدعاء جماعي لنسبة تقدّم كل الفرق — هذه الصفحة تستدعي
        <code class="bg-surface px-1.5 py-0.5 rounded-sm">GET /teams/{id}/progress</code> لكل فريق على حدة، فقد تستغرق ثوانٍ إضافية مع كثرة الفرق.
      </p>
    </div>

    <div class="flex items-center justify-between gap-4 mb-6">
      <div v-if="!progressLoading && averagePercent !== null" class="bg-surface rounded-lg border border-border shadow-card px-6 py-4 flex items-center gap-4">
        <span class="grid place-items-center w-11 h-11 rounded-pill bg-primary-50 text-primary-600"><TrendingUp :size="20" /></span>
        <div><div class="text-caption text-text-600">متوسط الإنجاز عبر {{ Object.keys(teamProgress).length }} فريق</div><div class="font-cairo font-black text-h1 text-text-900">{{ averagePercent }}%</div></div>
      </div>
      <BaseButton variant="outline" :icon="Download" :loading="exporting" @click="exportFile">تصدير Excel (كل الفرق)</BaseButton>
    </div>

    <div class="flex flex-wrap items-center gap-3 mb-6 p-4 rounded-lg bg-surface border border-border shadow-card">
      <div class="relative flex-1 min-w-[200px]">
        <Search :size="16" class="pointer-events-none absolute top-1/2 -translate-y-1/2 start-3 text-text-400" />
        <input v-model.trim="search" type="search" placeholder="ابحث عن مشروع أو فريق..." class="w-full h-icon-btn ps-10 pe-3 rounded-sm border border-border bg-bg text-body text-text-900 focus:border-primary-600 transition-colors duration-fast">
      </div>
      <BaseSelect v-model="specFilter" class="min-w-[170px]" placeholder="جميع التخصصات" include-placeholder-option :options="specializationOptions" />
    </div>

    <SkeletonLoader v-if="teamsLoading || progressLoading" :rows="6" height="30px" />
    <ErrorState v-else-if="teamsError || progressError" :message="teamsError || progressError" @retry="loadAll" />
    <DataTable v-else :columns="columns" :rows="filteredRows" row-key="id" empty-title="لا توجد نتائج مطابقة">
      <template #cell-proj="{ value }"><span class="font-bold text-text-900">{{ value }}</span></template>
      <template #cell-pct="{ row }">
        <div v-if="row.pct !== null" class="flex items-center gap-2 min-w-[120px]">
          <div class="flex-1 h-1.5 rounded-pill bg-border-soft overflow-hidden"><div class="h-full rounded-pill bg-primary-600" :style="{ width: row.pct + '%' }" /></div>
          <span class="text-caption font-bold w-9 text-start">{{ row.pct }}%</span>
        </div>
        <span v-else class="text-caption text-text-400">—</span>
      </template>
    </DataTable>
  </div>
</template>

<script>
import { mapState, mapActions } from 'pinia'
import { Search, AlertTriangle, TrendingUp, Download } from 'lucide-vue-next'
import { useCommitteeStore } from '@/stores/committee.store'
import BaseSelect from '@/components/ui/BaseSelect.vue'
import BaseButton from '@/components/ui/BaseButton.vue'
import DataTable from '@/components/ui/DataTable.vue'
import SkeletonLoader from '@/components/ui/SkeletonLoader.vue'
import ErrorState from '@/components/ui/ErrorState.vue'

export default {
  name: 'ProgressPage',

  components: { BaseSelect, BaseButton, DataTable, SkeletonLoader, ErrorState, Search, AlertTriangle, TrendingUp },

  data() {
    return {
      Download,
      search: '',
      specFilter: '',
      exporting: false,
      columns: [
        { key: 'proj', label: 'المشروع' },
        { key: 'team', label: 'الفريق' },
        { key: 'sup', label: 'المشرف' },
        { key: 'spec', label: 'التخصص' },
        { key: 'pct', label: 'نسبة الإنجاز' }
      ]
    }
  },

  computed: {
    ...mapState(useCommitteeStore, ['teams', 'teamsLoading', 'teamsError', 'teamProgress', 'progressLoading', 'progressError', 'specializations']),

    specializationOptions() {
      return this.specializations.map((s) => ({ value: s.id, label: s.name }))
    },

    averagePercent() {
      const values = Object.values(this.teamProgress).map((p) => p.percentage).filter((v) => typeof v === 'number')
      if (!values.length) return null
      return Math.round(values.reduce((sum, v) => sum + v, 0) / values.length)
    },

    rows() {
      return this.teams.map((t) => ({
        id: t.id,
        proj: t.project?.name || '—',
        team: t.name,
        sup: t.supervisor?.name || '—',
        spec: this.specializations.find((s) => s.id === t.specialization_id)?.name || '—',
        specId: t.specialization_id,
        pct: this.teamProgress[t.id]?.percentage ?? null
      }))
    },

    filteredRows() {
      const q = this.search.trim()
      return this.rows.filter((row) => {
        const matchQ = !q || `${row.proj}${row.team}`.includes(q)
        const matchSpec = !this.specFilter || String(row.specId) === String(this.specFilter)
        return matchQ && matchSpec
      })
    }
  },

  created() {
    this.fetchRefData()
    this.loadAll()
  },

  methods: {
    ...mapActions(useCommitteeStore, ['fetchTeams', 'fetchRefData', 'fetchAllTeamsProgress', 'exportProgress']),

    loadAll() {
      this.fetchAllTeamsProgress().catch(() => {})
    },

    async exportFile() {
      this.exporting = true
      try {
        const blob = await this.exportProgress()
        const url = URL.createObjectURL(blob)
        const link = document.createElement('a')
        link.href = url
        link.download = 'progress.xlsx'
        link.click()
        URL.revokeObjectURL(url)
      } catch (_) {
        this.$toast.error('تعذّر تصدير الملف')
      } finally {
        this.exporting = false
      }
    }
  }
}
</script>
