<template>
  <!-- أرشيف المشاريع المكتملة بنمط موقع الكلية: شريط عنوان متدرّج بمسار التنقل، شريط فلاتر (بحث + قوائم منسدلة)،
       معرض بطاقات المشاريع، وترقيم الصفحات -->
  <div>
    <header class="us-pagehead">
      <div class="us-wrap">
        <h1>أرشيف المشاريع المكتملة</h1>
        <p>معرض مشاريع التخرج المعتمدة والمؤرشفة في الكلية<span v-if="projectsMeta?.total"> — {{ formatNumber(projectsMeta.total) }} مشروعًا</span></p>
        <nav class="us-crumbs" aria-label="مسار التنقل">
          <router-link :to="{ name: 'landing' }">الرئيسية</router-link>
        </nav>
      </div>
    </header>

    <section class="us-section">
      <div class="us-wrap">
        <div class="us-filterbar" aria-label="تصفية المشاريع">
          <label class="us-field is-search">
            <span>بحث</span>
            <span class="us-input"><Search :size="18" /><input v-model.trim="filters.search" type="search" maxlength="80" placeholder="اسم المشروع" @input="onFilterChange"></span>
          </label>
          <label class="us-field">
            <span>القسم</span>
            <select v-model="filters.department_id" class="us-select" @change="loadProjects(1)">
              <option value="">جميع الأقسام</option>
              <option v-for="d in departments" :key="d.id" :value="d.id">{{ d.name }}</option>
            </select>
          </label>
          <label class="us-field">
            <span>الدرجة</span>
            <select v-model="filters.degree" class="us-select" @change="loadProjects(1)">
              <option value="">دبلوم وبكالوريوس</option>
              <option v-for="o in degreeOptions" :key="o.value" :value="o.value">{{ o.label }}</option>
            </select>
          </label>
        </div>

        <SkeletonLoader v-if="projectsLoading" variant="cards" :rows="6" />
        <div v-else-if="projectsError" class="us-empty">
          <p>{{ projectsError }}</p>
          <button type="button" class="us-btn is-sm" @click="loadProjects()">إعادة المحاولة</button>
        </div>
        <p v-else-if="!projects.length" class="us-empty">{{ hasActiveFilters ? 'لا توجد مشاريع مطابقة — جرّب تعديل الفلاتر.' : 'ستظهر هنا المشاريع فور أرشفتها.' }}</p>
        <template v-else>
          <p class="us-pf-count"><b>{{ formatNumber(projectsMeta?.total || projects.length) }}</b> مشروعًا مؤرشفًا</p>
          <div class="us-portfolio">
            <ProjectCard v-for="project in projects" :key="project.id" :project="project" />
          </div>
          <div v-if="projectsMeta && projectsMeta.last_page > 1" class="us-more">
            <Pagination :current-page="projectsMeta.current_page" :last-page="projectsMeta.last_page" :total="projectsMeta.total" @change="changePage" />
          </div>
        </template>
      </div>
    </section>
  </div>
</template>

<script>
import { mapState, mapActions } from 'pinia'
import { Search } from 'lucide-vue-next'
import { useLandingStore, DEGREE_OPTIONS } from '@/stores/landing.store'
import { formatNumber } from '@/utils/formatters'
import ProjectCard from '@/components/landing/ProjectCard.vue'
import Pagination from '@/components/ui/Pagination.vue'

export default {
  name: 'ProjectsArchivePage',

  components: { ProjectCard, Pagination, Search },

  data() {
    return {
      filters: { search: '', department_id: '', degree: '' },
      degreeOptions: DEGREE_OPTIONS,
      searchDebounce: null
    }
  },

  computed: {
    ...mapState(useLandingStore, ['projects', 'projectsMeta', 'projectsLoading', 'projectsError', 'departments']),

    hasActiveFilters() {
      return Boolean(this.filters.search || this.filters.department_id || this.filters.degree)
    }
  },

  created() {
    if (!this.departments.length) this.fetchDepartments()
    this.loadProjects()
  },

  methods: {
    ...mapActions(useLandingStore, ['fetchArchive', 'fetchDepartments']),
    formatNumber,

    async loadProjects(page = 1) {
      try {
        await this.fetchArchive({ ...this.filters, page })
      } catch (_) {
        // الخطأ يُعرض عبر projectsError
      }
    },

    onFilterChange() {
      clearTimeout(this.searchDebounce)
      this.searchDebounce = setTimeout(() => this.loadProjects(1), 350)
    },

    changePage(page) {
      this.loadProjects(page)
      window.scrollTo({ top: 0, behavior: 'smooth' })
    },

    resetFilters() {
      this.filters = { search: '', department_id: '', degree: '' }
      this.loadProjects(1)
    }
  }
}
</script>
