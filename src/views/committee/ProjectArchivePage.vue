<template>
  <div>
    <div class="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
      <div class="reveal group bg-surface rounded-lg border border-border shadow-card p-5 flex items-center gap-4 transition-all duration-base hover:-translate-y-1 hover:shadow-card-hover hover:border-primary-200 active:scale-[0.98]">
        <span class="grid place-items-center w-11 h-11 rounded-md bg-primary-50 text-primary-600 shrink-0"><FileCheck :size="20" /></span>
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
          <h3 class="font-cairo font-bold text-h4 text-text-900">المشاريع المؤرشفة</h3>
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

      <div class="p-5">
        <SkeletonLoader v-if="projectArchiveLoading" :rows="3" height="90px" />
        <EmptyState v-else-if="!filteredArchive.length" title="لا توجد مشاريع مطابقة" />

        <div v-else class="flex items-stretch gap-2">
          <button
            type="button" class="hidden sm:grid place-items-center w-9 h-9 rounded-sm border border-border text-text-600 hover:bg-border-soft hover:text-primary-700 disabled:opacity-30 disabled:pointer-events-none shrink-0 self-center"
            :disabled="page <= 1" aria-label="الشريحة السابقة" @click="page -= 1"
          >
            <ChevronRightIcon :size="18" />
          </button>

          <div class="flex-1 min-w-0 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div v-for="row in pageRows" :key="row.id" class="border border-border rounded-lg p-4 flex flex-col gap-3 hover:border-primary-200 transition-colors duration-fast">
              <div class="flex items-start justify-between gap-2">
                <span class="font-bold text-text-900">{{ row.proj }}</span>
                <button type="button" class="grid place-items-center w-8 h-8 rounded-sm border shrink-0 transition-colors duration-fast" :class="row.featured ? 'bg-warning-bg border-warning text-warning' : 'border-border text-text-400 hover:text-warning-text hover:bg-warning-bg'" :title="row.featured ? 'إلغاء التمييز' : 'تمييز المشروع'" @click="toggleFeatured(row)">
                  <Star :size="15" :fill="row.featured ? 'currentColor' : 'none'" />
                </button>
              </div>
              <router-link :to="{ name: 'committee-teams' }" class="inline-flex items-center gap-1.5 text-caption text-primary-700 font-semibold hover:text-primary-800 hover:underline transition-colors duration-fast w-fit">
                {{ row.team }} <ExternalLink :size="11" class="opacity-65" />
              </router-link>
              <div class="flex flex-wrap items-center gap-1.5">
                <span class="inline-block px-2.5 py-1 rounded-pill bg-border-soft text-text-600 text-caption font-semibold">{{ row.dept }}</span>
                <span class="text-caption text-text-700">{{ row.spec }}</span>
              </div>
              <div class="mono text-caption text-text-600 font-semibold">{{ row.date }}</div>
              <router-link :to="{ name: 'committee-project-detail', params: { id: row.id } }" class="inline-flex items-center justify-center gap-2 h-9 px-4 rounded-pill bg-primary-50 text-primary-700 text-caption font-bold hover:bg-primary-100 transition-colors duration-fast w-fit">
                <FileText :size="14" /> عرض الملفات
              </router-link>
            </div>
          </div>

          <button
            type="button" class="hidden sm:grid place-items-center w-9 h-9 rounded-sm border border-border text-text-600 hover:bg-border-soft hover:text-primary-700 disabled:opacity-30 disabled:pointer-events-none shrink-0 self-center"
            :disabled="page >= totalPages" aria-label="الشريحة التالية" @click="page += 1"
          >
            <ChevronLeftIcon :size="18" />
          </button>
        </div>

        <div v-if="totalPages > 1" class="flex items-center justify-center gap-2 mt-5">
          <button
            v-for="p in totalPages" :key="p" type="button"
            class="rounded-pill transition-all duration-fast"
            :class="p === page ? 'w-6 h-2 bg-primary-600' : 'w-2 h-2 bg-border hover:bg-primary-200'"
            :aria-label="`الشريحة ${p}`"
            @click="page = p"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { CheckCircle2, Star, Search, FileText, FileCheck, ExternalLink, ChevronRight as ChevronRightIcon, ChevronLeft as ChevronLeftIcon } from 'lucide-vue-next'
import { mapState, mapActions } from 'pinia'
import { useTeamsStore } from '@/stores/teams.store'
import { formatDate } from '@/utils/formatters'
import BaseSelect from '@/components/ui/BaseSelect.vue'
import CountUp from '@/components/ui/CountUp.vue'
import SkeletonLoader from '@/components/ui/SkeletonLoader.vue'
import EmptyState from '@/components/ui/EmptyState.vue'

const PAGE_SIZE = 5

export default {
  name: 'CommitteeProjectArchivePage',

  components: { CheckCircle2, Star, Search, FileText, FileCheck, ExternalLink, ChevronRightIcon, ChevronLeftIcon, BaseSelect, CountUp, SkeletonLoader, EmptyState },

  data() {
    return {
      search: '',
      specFilter: '',
      page: 1
    }
  },

  computed: {
    ...mapState(useTeamsStore, ['projectArchive', 'projectArchiveLoading']),

    archive() {
      return this.projectArchive.map((p) => ({
        id: p.id,
        dept: p.department?.name || 'غير محدد',
        spec: p.specialization?.name || 'غير محدد',
        team: p.team?.name || '—',
        proj: p.name,
        date: formatDate(p.completed_at || p.updated_at),
        featured: !!p.is_featured
      }))
    },

    featuredCount() {
      return this.archive.filter((a) => a.featured).length
    },

    specOptions() {
      return [...new Set(this.archive.map((a) => a.spec))].map((s) => ({ value: s, label: s }))
    },

    filteredArchive() {
      const q = this.search.trim()
      return this.archive.filter((a) => {
        const matchQ = !q || `${a.proj}${a.team}${a.spec}${a.dept}`.includes(q)
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
  },

  async created() {
    await this.fetchProjectArchive()
  },

  methods: {
    ...mapActions(useTeamsStore, ['fetchProjectArchive', 'updateProject']),

    async toggleFeatured(row) {
      try {
        await this.updateProject(row.id, { is_featured: !row.featured })
        this.$toast?.success(row.featured ? 'تم إلغاء تمييز المشروع' : 'تم تمييز المشروع')
      } catch (err) {
        this.$toast?.error(err.normalized?.message || 'تعذّر تحديث المشروع')
      }
    }
  }
}
</script>
