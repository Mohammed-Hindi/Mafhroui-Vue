<template>
  <div>
    <div class="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
      <div class="reveal group bg-surface rounded-lg border border-border shadow-card p-5 flex items-center gap-4 transition-all duration-base hover:-translate-y-1 hover:shadow-card-hover hover:border-primary-200 active:scale-[0.98]">
        <span class="grid place-items-center w-11 h-11 rounded-md bg-primary-50 text-primary-600 shrink-0"><Archive :size="20" /></span>
        <div><div class="font-cairo font-extrabold text-h1 text-text-900 transition-colors duration-base group-hover:text-primary-600"><CountUp :value="archive.length" /></div><div class="text-body-sm font-bold text-text-600 mt-0.5">إجمالي المشاريع</div></div>
      </div>
      <div class="reveal group bg-surface rounded-lg border border-border shadow-card p-5 flex items-center gap-4 transition-all duration-base hover:-translate-y-1 hover:shadow-card-hover hover:border-primary-200 active:scale-[0.98]">
        <span class="grid place-items-center w-11 h-11 rounded-md bg-success-bg text-success shrink-0"><CheckCircle2 :size="20" /></span>
        <div><div class="font-cairo font-extrabold text-h1 text-text-900 transition-colors duration-base group-hover:text-primary-600"><CountUp :value="archive.length" /></div><div class="text-body-sm font-bold text-text-600 mt-0.5">مشاريع مكتملة</div></div>
      </div>
      <div class="reveal group bg-surface rounded-lg border border-border shadow-card p-5 flex items-center gap-4 transition-all duration-base hover:-translate-y-1 hover:shadow-card-hover hover:border-primary-200 active:scale-[0.98]">
        <span class="grid place-items-center w-11 h-11 rounded-md bg-warning-bg text-warning-text shrink-0"><Star :size="20" /></span>
        <div><div class="font-cairo font-extrabold text-h1 text-text-900 transition-colors duration-base group-hover:text-primary-600"><CountUp :value="featuredCount" /></div><div class="text-body-sm font-bold text-text-600 mt-0.5">مشاريع مميزة</div></div>
      </div>
    </div>

    <div class="bg-surface rounded-lg border border-border shadow-card overflow-hidden">
      <div class="flex flex-wrap items-center justify-between gap-4 p-5 pb-4">
        <div>
          <h3 class="font-cairo font-bold text-h4 text-text-900">المشاريع المؤرشفة مؤخرًا</h3>
          <p class="text-caption text-text-600 mt-0.5">سجلّ المشاريع المكتملة عبر جميع الفصول الدراسية</p>
        </div>
        <div class="flex flex-wrap items-center gap-3">
          <div class="relative flex-1 min-w-[200px] max-w-[320px]">
            <Search :size="16" class="pointer-events-none absolute top-1/2 -translate-y-1/2 start-3 text-text-400" />
            <input v-model.trim="search" type="search" placeholder="بحث في المشاريع..." class="w-full h-icon-btn ps-10 pe-3 rounded-pill border border-border bg-bg text-body text-text-900 focus:border-primary-600 transition-colors duration-fast">
          </div>
          <BaseSelect v-model="specFilter" class="min-w-[220px]" placeholder="جميع التخصصات" include-placeholder-option :options="specOptions" />
        </div>
      </div>

      <DataTable
        :columns="columns" :rows="pageRows" row-key="id" :primary-keys="['proj', 'files']"
        :meta="{ current_page: page, last_page: totalPages, total: filteredArchive.length }"
        empty-title="لا توجد مشاريع مطابقة"
        @page-change="page = $event"
      >
        <template #cell-dept="{ value }"><span class="chip gray inline-block px-2.5 py-1 rounded-pill bg-border-soft text-text-600 text-caption font-semibold">{{ value }}</span></template>
        <template #cell-spec="{ value }"><span class="text-body-sm text-text-700">{{ value }}</span></template>
        <template #cell-team="{ row }">
          <router-link :to="{ name: 'supervisor-teams', query: { group: row.grp } }" class="inline-flex items-center gap-1.5 text-body-sm text-primary-700 font-semibold hover:text-primary-800 hover:underline transition-colors duration-fast">
            {{ row.team }} <ExternalLink :size="11" class="opacity-65" />
          </router-link>
        </template>
        <template #cell-proj="{ value }"><span class="font-bold text-text-900">{{ value }}</span></template>
        <template #cell-date="{ value }"><span class="mono text-caption text-text-600 font-semibold">{{ value }}</span></template>
        <template #cell-files="{ row }">
          <router-link :to="{ name: 'supervisor-project-detail', params: { id: row.id } }" class="inline-flex items-center gap-2 h-9 px-4 rounded-pill bg-primary-50 text-primary-700 text-caption font-bold hover:bg-primary-100 transition-colors duration-fast">
            <FileText :size="14" /> عرض الملفات
          </router-link>
        </template>
      </DataTable>
    </div>
  </div>
</template>

<script>
import { Archive, CheckCircle2, Star, Search, FileText, ExternalLink } from 'lucide-vue-next'
import { PROJECT_ARCHIVE } from '@/data/projectArchive'
import DataTable from '@/components/ui/DataTable.vue'
import BaseSelect from '@/components/ui/BaseSelect.vue'
import CountUp from '@/components/ui/CountUp.vue'

const PAGE_SIZE = 5

export default {
  name: 'SupervisorProjectArchivePage',

  components: { Archive, CheckCircle2, Star, Search, FileText, ExternalLink, DataTable, BaseSelect, CountUp },

  data() {
    return {
      search: '',
      specFilter: '',
      page: 1,

      columns: [
        { key: 'dept', label: 'القسم' },
        { key: 'spec', label: 'التخصص' },
        { key: 'team', label: 'الفريق' },
        { key: 'proj', label: 'المشروع' },
        { key: 'date', label: 'تاريخ الإنجاز' },
        { key: 'files', label: 'الملفات' }
      ],

      archive: PROJECT_ARCHIVE
    }
  },

  computed: {
    featuredCount() {
      return this.archive.filter((a) => a.featured).length
    },

    specOptions() {
      return [...new Set(this.archive.map((a) => a.spec))].map((s) => ({ value: s, label: s }))
    },

    filteredArchive() {
      const q = this.search.trim()
      return this.archive.filter((a) => {
        const matchQ = !q || `${a.proj}${a.team}${a.members}${a.spec}${a.dept}`.includes(q)
        const matchSpec = !this.specFilter || a.spec === this.specFilter
        return matchQ && matchSpec
      })
    },

    totalPages() {
      return Math.max(1, Math.ceil(this.filteredArchive.length / PAGE_SIZE))
    },

    pageRows() {
      const start = (this.page - 1) * PAGE_SIZE
      return this.filteredArchive.slice(start, start + PAGE_SIZE)
    }
  },

  watch: {
    filteredArchive() {
      this.page = 1
    }
  }
}
</script>
