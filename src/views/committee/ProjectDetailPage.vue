<template>
  <div>
    <router-link :to="{ name: 'committee-project-archive' }" class="inline-flex items-center gap-2 text-body-sm font-semibold text-text-600 hover:text-primary-700 transition-colors duration-fast mb-6">
      <ArrowRight :size="16" /> رجوع إلى أرشيف المشاريع
    </router-link>

    <EmptyState v-if="!project" title="لم يتم العثور على المشروع" description="ربما تم حذف هذا المشروع أو الرابط غير صحيح." />

    <template v-else>
      <div class="rounded-lg p-8 sm:p-10 mb-8 text-white" style="background: linear-gradient(120deg, var(--color-primary-600), var(--color-accent-500))">
        <p class="text-caption text-white/80">{{ project.dept }} — {{ project.spec }}</p>
        <h2 class="font-cairo font-extrabold text-h1 mt-2">{{ project.proj }}</h2>
        <p class="text-body-sm text-white/85 mt-3 max-w-2xl">{{ project.desc }}</p>

        <div class="flex flex-wrap gap-10 mt-8">
          <div>
            <div class="text-label text-white/65">الفريق</div>
            <router-link :to="{ name: 'committee-teams', query: { group: project.grp } }" class="inline-flex items-center gap-1.5 text-body-sm font-bold mt-0.5 hover:underline">
              {{ project.team }} <ExternalLink :size="12" class="opacity-75" />
            </router-link>
          </div>
          <div>
            <div class="text-label text-white/65">تاريخ الإنجاز</div>
            <div class="mono text-body-sm font-bold mt-0.5">{{ project.date }}</div>
          </div>
        </div>
      </div>

      <div class="flex items-center gap-3 mb-5">
        <span class="grid place-items-center w-9 h-9 rounded-md shrink-0 text-white" style="background: linear-gradient(135deg, var(--color-primary-600), var(--color-accent-500))"><FileText :size="18" /></span>
        <div>
          <h3 class="text-h3 font-bold text-text-900">ملفات المشروع</h3>
          <p class="text-caption text-text-600">الفيديو، التقرير النهائي، والمخرج الرئيسي</p>
        </div>
      </div>

      <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <button type="button" class="flex items-center gap-3 bg-surface border border-border rounded-lg shadow-card p-4 text-start hover:-translate-y-0.5 hover:shadow-card-hover transition-all duration-fast" @click="openPlaceholderVideo">
          <span class="grid place-items-center w-11 h-11 rounded-md bg-primary-50 text-primary-600 shrink-0"><PlayCircle :size="20" /></span>
          <span>
            <span class="block text-body-sm font-bold text-text-900">الفيديو النهائي</span>
            <span class="block text-label text-text-400 mt-0.5">مشاهدة الفيديو</span>
          </span>
        </button>

        <button type="button" class="flex items-center gap-3 bg-surface border border-border rounded-lg shadow-card p-4 text-start hover:-translate-y-0.5 hover:shadow-card-hover transition-all duration-fast" @click="openPlaceholderPdf(reportFile, project.proj)">
          <span class="grid place-items-center w-11 h-11 rounded-md bg-primary-50 text-primary-600 shrink-0"><FileText :size="20" /></span>
          <span>
            <span class="block text-body-sm font-bold text-text-900">التقرير النهائي</span>
            <span class="block text-label text-text-400 mt-0.5">{{ reportFile }}</span>
          </span>
        </button>

        <button type="button" class="flex items-center gap-3 bg-surface border border-border rounded-lg shadow-card p-4 text-start hover:-translate-y-0.5 hover:shadow-card-hover transition-all duration-fast" @click="openPlaceholderPdf(proposalFile, project.proj)">
          <span class="grid place-items-center w-11 h-11 rounded-md bg-primary-50 text-primary-600 shrink-0"><FileText :size="20" /></span>
          <span>
            <span class="block text-body-sm font-bold text-text-900">البروبوزال</span>
            <span class="block text-label text-text-400 mt-0.5">{{ proposalFile }}</span>
          </span>
        </button>
      </div>
    </template>
  </div>
</template>

<script>
import { ArrowRight, FileText, PlayCircle, ExternalLink } from 'lucide-vue-next'
import { PROJECT_ARCHIVE } from '@/data/projectArchive'
import { openPlaceholderPdf, openPlaceholderVideo } from '@/utils/filePreview'
import EmptyState from '@/components/ui/EmptyState.vue'

export default {
  name: 'CommitteeProjectDetailPage',

  components: { ArrowRight, FileText, PlayCircle, ExternalLink, EmptyState },

  computed: {
    project() {
      return PROJECT_ARCHIVE.find((p) => String(p.id) === String(this.$route.params.id)) || null
    },
    reportFile() {
      return `final-report-${this.project?.id}.pdf`
    },
    proposalFile() {
      return `proposal-${this.project?.id}.pdf`
    }
  },

  methods: {
    openPlaceholderPdf,
    openPlaceholderVideo
  }
}
</script>
