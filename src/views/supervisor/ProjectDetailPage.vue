<template>
  <div>
    <router-link :to="{ name: 'supervisor-project-archive' }" class="inline-flex items-center gap-2 text-body-sm font-semibold text-text-600 hover:text-primary-700 transition-colors duration-fast mb-6">
      <ArrowRight :size="16" /> رجوع إلى أرشيف المشاريع
    </router-link>

    <EmptyState v-if="!loading && !project" title="لم يتم العثور على المشروع" description="ربما تم حذف هذا المشروع أو الرابط غير صحيح." />

    <template v-else-if="project">
      <div class="rounded-lg p-8 sm:p-10 mb-8 text-white" style="background: linear-gradient(120deg, var(--color-primary-600), var(--color-accent-500))">
        <p class="text-caption text-white/80">{{ project.department?.name || 'غير محدد' }} — {{ project.specialization?.name || 'غير محدد' }}</p>
        <h2 class="font-cairo font-extrabold text-h1 mt-2">{{ project.name }}</h2>
        <p class="text-body-sm text-white/85 mt-3 max-w-2xl">{{ project.description }}</p>

        <div class="flex flex-wrap gap-10 mt-8">
          <div>
            <div class="text-label text-white/65">الفريق</div>
            <router-link :to="{ name: 'supervisor-teams' }" class="inline-flex items-center gap-1.5 text-body-sm font-bold mt-0.5 hover:underline">
              {{ project.team?.name || '—' }} <ExternalLink :size="12" class="opacity-75" />
            </router-link>
          </div>
          <div>
            <div class="text-label text-white/65">تاريخ الإنجاز</div>
            <div class="mono text-body-sm font-bold mt-0.5">{{ formatDate(project.completed_at || project.updated_at) }}</div>
          </div>
        </div>
      </div>

      <div class="flex items-center gap-3 mb-5">
        <span class="grid place-items-center w-9 h-9 rounded-md shrink-0 text-white" style="background: linear-gradient(135deg, var(--color-primary-600), var(--color-accent-500))"><FileText :size="18" /></span>
        <div>
          <h3 class="text-h3 font-bold text-text-900">ملفات المشروع</h3>
          <p class="text-caption text-text-600">الفيديو، التقرير النهائي، والمقترح</p>
        </div>
      </div>

      <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <button
          type="button"
          class="flex items-center gap-3 bg-surface border border-border rounded-lg shadow-card p-4 text-start transition-all duration-fast"
          :class="latestReport?.video_url ? 'hover:-translate-y-0.5 hover:shadow-card-hover' : 'opacity-50 cursor-not-allowed'"
          :disabled="!latestReport?.video_url"
          @click="openVideo"
        >
          <span class="grid place-items-center w-11 h-11 rounded-md bg-primary-50 text-primary-600 shrink-0"><PlayCircle :size="20" /></span>
          <span>
            <span class="block text-body-sm font-bold text-text-900">الفيديو النهائي</span>
            <span class="block text-label text-text-400 mt-0.5">{{ latestReport?.video_url ? 'مشاهدة الفيديو' : 'لا يوجد فيديو' }}</span>
          </span>
        </button>

        <button
          type="button"
          class="flex items-center gap-3 bg-surface border border-border rounded-lg shadow-card p-4 text-start transition-all duration-fast"
          :class="latestReport ? 'hover:-translate-y-0.5 hover:shadow-card-hover' : 'opacity-50 cursor-not-allowed'"
          :disabled="!latestReport"
          @click="latestReport && openProtectedFile(`/final-reports/${latestReport.id}/download`, `تقرير-${project.name}.pdf`)"
        >
          <span class="grid place-items-center w-11 h-11 rounded-md bg-primary-50 text-primary-600 shrink-0"><FileText :size="20" /></span>
          <span>
            <span class="block text-body-sm font-bold text-text-900">التقرير النهائي</span>
            <span class="block text-label text-text-400 mt-0.5">{{ latestReport ? 'تحميل الملف' : 'لم يُرفع بعد' }}</span>
          </span>
        </button>

        <button
          type="button"
          class="flex items-center gap-3 bg-surface border border-border rounded-lg shadow-card p-4 text-start transition-all duration-fast"
          :class="project.proposal ? 'hover:-translate-y-0.5 hover:shadow-card-hover' : 'opacity-50 cursor-not-allowed'"
          :disabled="!project.proposal"
          @click="project.proposal && openProtectedFile(`/proposals/${project.proposal.id}/download`, `مقترح-${project.name}.pdf`)"
        >
          <span class="grid place-items-center w-11 h-11 rounded-md bg-primary-50 text-primary-600 shrink-0"><FileText :size="20" /></span>
          <span>
            <span class="block text-body-sm font-bold text-text-900">المقترح</span>
            <span class="block text-label text-text-400 mt-0.5">{{ project.proposal ? 'تحميل الملف' : 'غير متوفر' }}</span>
          </span>
        </button>
      </div>
    </template>
  </div>
</template>

<script>
import { ArrowRight, FileText, PlayCircle, ExternalLink } from 'lucide-vue-next'
import { mapActions } from 'pinia'
import { useTeamsStore } from '@/stores/teams.store'
import { formatDate } from '@/utils/formatters'
import EmptyState from '@/components/ui/EmptyState.vue'

export default {
  name: 'SupervisorProjectDetailPage',

  components: { ArrowRight, FileText, PlayCircle, ExternalLink, EmptyState },

  data() {
    return {
      project: null,
      loading: true
    }
  },

  computed: {
    latestReport() {
      const reports = this.project?.final_reports || []
      return reports[reports.length - 1] || null
    }
  },

  async created() {
    try {
      this.project = await this.fetchProject(this.$route.params.id)
    } catch {
      this.project = null
    } finally {
      this.loading = false
    }
  },

  methods: {
    formatDate,
    ...mapActions(useTeamsStore, ['fetchProject', 'openProtectedFile']),

    openVideo() {
      if (this.latestReport?.video_url) window.open(this.latestReport.video_url, '_blank', 'noopener')
    }
  }
}
</script>
