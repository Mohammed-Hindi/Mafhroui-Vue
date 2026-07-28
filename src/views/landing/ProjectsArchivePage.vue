<template>
  <div class="max-w-content mx-auto px-6 py-12">
    <!-- الترويسة -->
    <div class="mb-9">
      <router-link
        :to="{ name: 'landing' }"
        class="inline-flex items-center gap-1.5 mb-4 text-body-sm font-bold text-text-600 hover:text-primary-600 transition-colors duration-fast"
      >
        <AppIcon name="chevronEnd" :size="15" :stroke-width="2.2" />
        العودة إلى الرئيسية
      </router-link>

      <h1 class="font-cairo font-extrabold text-sec-title-sm sm:text-sec-title text-text-900">أرشيف مشاريع التخرج</h1>
      <p class="mt-2 text-[13.5px] text-text-600">
        جميع المشاريع المؤرشفة في المنصة
        <span v-if="projectsMeta?.total">— {{ formatNumber(projectsMeta.total) }} مشروع</span>
      </p>
    </div>

    <!-- الفلاتر -->
    <div class="flex flex-wrap items-end gap-3 mb-8 p-4 rounded-lg bg-surface border border-border shadow-card">
      <div class="relative flex-1 min-w-[220px]">
        <label for="archive-search" class="block mb-2 text-label font-semibold text-text-700">بحث</label>
        <AppIcon name="search" :size="16" class="pointer-events-none absolute top-[38px] start-3 text-text-400" />
        <input
          id="archive-search"
          v-model.trim="filters.search"
          type="search"
          maxlength="80"
          placeholder="اسم المشروع أو المشرف"
          class="w-full h-icon-btn ps-10 pe-3 rounded-sm border border-border bg-surface text-body text-text-900 focus:border-primary-600 transition-colors duration-fast"
          @input="onFilterChange"
        >
      </div>

      <div class="min-w-[200px]">
        <BaseSelect
          v-model="filters.department_id"
          label="القسم"
          placeholder="جميع الأقسام"
          include-placeholder-option
          :options="departmentOptions"
          @change="onFilterChange"
        />
      </div>

      <div class="min-w-[170px]">
        <BaseSelect
          v-model="filters.degree"
          label="الدرجة"
          placeholder="جميع الدرجات"
          include-placeholder-option
          :options="degreeOptions"
          @change="onFilterChange"
        />
      </div>

      <button
        v-if="hasActiveFilters"
        type="button"
        class="h-icon-btn px-4 rounded-sm border border-border bg-surface text-body-sm font-bold text-text-600 hover:text-error hover:border-error-border transition-colors duration-fast"
        @click="resetFilters"
      >
        مسح الفلاتر
      </button>
    </div>

    <!-- تحميل -->
    <div v-if="projectsLoading" class="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
      <div v-for="n in 6" :key="n" class="bg-surface border border-border rounded-lg overflow-hidden shadow-card">
        <div class="aspect-[16/10] bg-border-soft animate-pulse" />
        <div class="p-[22px] space-y-3">
          <div class="h-4 w-3/4 rounded-sm bg-border-soft animate-pulse" />
          <div class="h-3 w-1/2 rounded-sm bg-border-soft animate-pulse" />
          <div class="h-11 w-full rounded-pill bg-border-soft animate-pulse" />
        </div>
      </div>
    </div>

    <!-- خطأ -->
    <div v-else-if="projectsError" class="flex flex-col items-center text-center py-16 bg-surface border border-border rounded-lg">
      <span class="grid place-items-center w-16 h-16 rounded-pill bg-error-bg text-error mb-4">
        <AppIcon name="alertCircle" :size="28" />
      </span>
      <h2 class="font-cairo font-bold text-h3 text-text-900">تعذّر تحميل المشاريع</h2>
      <p class="mt-2 max-w-sm text-body-sm text-text-600">{{ projectsError }}</p>
      <button
        type="button"
        class="mt-6 inline-flex items-center gap-2 h-10 px-5 rounded-pill border border-border bg-surface text-body-sm font-bold text-text-700 hover:text-primary-700 transition-colors duration-fast"
        @click="loadProjects"
      >
        <AppIcon name="refresh" :size="15" />
        إعادة المحاولة
      </button>
    </div>

    <!-- فارغ -->
    <div v-else-if="!projects.length" class="flex flex-col items-center text-center py-16 bg-surface border border-border rounded-lg">
      <span class="grid place-items-center w-16 h-16 rounded-pill bg-primary-50 text-primary-600 mb-4">
        <AppIcon name="inbox" :size="28" />
      </span>
      <h2 class="font-cairo font-bold text-h3 text-text-900">لا توجد مشاريع مطابقة</h2>
      <p class="mt-2 max-w-sm text-body-sm text-text-600">
        {{ hasActiveFilters ? 'جرّبي تعديل الفلاتر أو مسحها لعرض كل المشاريع.' : 'ستظهر هنا المشاريع فور أرشفتها.' }}
      </p>
    </div>

    <!-- الشبكة -->
    <template v-else>
      <div class="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
        <ProjectCard v-for="project in projects" :key="project.id" :project="project" />
      </div>

      <div v-if="projectsMeta && projectsMeta.last_page > 1" class="mt-10">
        <Pagination
          :current-page="projectsMeta.current_page"
          :last-page="projectsMeta.last_page"
          :total="projectsMeta.total"
          @change="changePage"
        />
      </div>
    </template>
  </div>
</template>

<script>
import { mapState, mapActions } from 'pinia'
import { useLandingStore } from '@/stores/landing.store'
import { formatNumber } from '@/utils/formatters'
import ProjectCard from '@/components/landing/ProjectCard.vue'
import Pagination from '@/components/ui/Pagination.vue'
import AppIcon from '@/components/icons/AppIcon.vue'
import BaseSelect from '@/components/ui/BaseSelect.vue'

export default {
  name: 'ProjectsArchivePage',

  components: { ProjectCard, Pagination, AppIcon, BaseSelect },

  data() {
    return {
      filters: {
        search: '',
        department_id: '',
        degree: ''
      },
      page: 1,
      searchTimer: null
    }
  },

  computed: {
    ...mapState(useLandingStore, [
      'projects',
      'projectsMeta',
      'projectsLoading',
      'projectsError',
      'departments'
    ]),

    hasActiveFilters() {
      return Boolean(this.filters.search || this.filters.department_id || this.filters.degree)
    },

    departmentOptions() {
      return this.departments.map((department) => ({ value: department.id, label: department.name }))
    },

    degreeOptions() {
      return [
        { value: 'دبلوم', label: 'دبلوم' },
        { value: 'بكالوريوس', label: 'بكالوريوس' }
      ]
    }
  },

  created() {
    // استعادة الفلاتر من الرابط لتبقى المشاركة والرجوع عمليًا
    const { search = '', department_id: departmentId = '', degree = '', page = '1' } = this.$route.query
    this.filters.search = String(search).slice(0, 80)
    this.filters.department_id = departmentId
    this.filters.degree = ['دبلوم', 'بكالوريوس'].includes(degree) ? degree : ''
    this.page = Math.max(1, Number(page) || 1)

    this.fetchDepartments()
    this.loadProjects()
  },

  beforeUnmount() {
    clearTimeout(this.searchTimer)
  },

  methods: {
    ...mapActions(useLandingStore, ['fetchProjects', 'fetchDepartments']),
    formatNumber,

    // فجوة باك إند: لا يوجد GET /projects عام بترقيم صفحات/فلاتر — fetchProjects تضبط projectsError فورًا
    async loadProjects() {
      try {
        await this.fetchProjects({ page: this.page, ...this.cleanFilters() })
      } catch (_) {
        // الخطأ يُعرض بالواجهة عبر projectsError
      }
    },

    cleanFilters() {
      const params = {}
      if (this.filters.search) params.search = this.filters.search
      if (this.filters.department_id) params.department_id = this.filters.department_id
      if (this.filters.degree) params.degree = this.filters.degree
      return params
    },

    /** تأخير البحث لتفادي طلب مع كل حرف */
    onFilterChange() {
      clearTimeout(this.searchTimer)
      this.searchTimer = setTimeout(() => {
        this.page = 1
        this.syncQuery()
        this.loadProjects()
      }, 350)
    },

    changePage(page) {
      this.page = page
      this.syncQuery()
      this.loadProjects()
      window.scrollTo({ top: 0, behavior: 'smooth' })
    },

    resetFilters() {
      this.filters = { search: '', department_id: '', degree: '' }
      this.page = 1
      this.syncQuery()
      this.loadProjects()
    },

    syncQuery() {
      const query = { ...this.cleanFilters() }
      if (this.page > 1) query.page = this.page
      this.$router.replace({ query })
    }
  }
}
</script>
