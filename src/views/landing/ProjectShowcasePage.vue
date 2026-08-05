<template>
  <div class="max-w-content mx-auto px-6 py-12">
    <router-link
      :to="{ name: 'projects-archive' }"
      class="inline-flex items-center gap-1.5 mb-6 text-body-sm font-bold text-text-600 hover:text-primary-600 transition-colors duration-fast"
    >
      <AppIcon name="chevronEnd" :size="15" :stroke-width="2.2" />
      رجوع
    </router-link>

    <EmptyState v-if="!project" title="لم يتم العثور على المشروع" description="ربما تم حذف هذا المشروع أو الرابط غير صحيح." />

    <template v-else>
      <span class="reveal inline-block px-4 py-1.5 rounded-pill bg-warning-bg text-warning-text text-label font-bold mb-4">
        {{ project.spec }}
      </span>
      <h1 class="reveal font-cairo font-extrabold text-sec-title-sm sm:text-sec-title text-text-900 mb-2">
        {{ project.title }}
      </h1>
      <p class="reveal text-body text-text-600 max-w-2xl mb-8">{{ project.description }}</p>

      <!-- بطاقة الفيديو — واجهة فيديو احترافية على هويتنا البصرية، بلا تضمين خارجي -->
      <div class="reveal bg-surface rounded-lg border border-border shadow-card overflow-hidden mb-8">
        <div class="flex items-center gap-2 px-4 py-3 bg-bg border-b border-border-soft">
          <span class="w-[10px] h-[10px] rounded-pill bg-error" />
          <span class="w-[10px] h-[10px] rounded-pill bg-warning" />
          <span class="w-[10px] h-[10px] rounded-pill bg-success" />
          <span class="ms-3 mono text-[11px] text-text-400">مسار / معاينة المشروع</span>
        </div>

        <button
          type="button"
          class="relative w-full aspect-video grid place-items-center overflow-hidden group bg-gradient-to-bl from-primary-900 via-primary-600 to-accent-500"
          :aria-label="`تشغيل فيديو عرض مشروع ${project.title}`"
          @click="openPlaceholderVideo"
        >
          <span class="absolute inset-0 opacity-[0.12] pointer-events-none" style="background-image:radial-gradient(#fff 1px, transparent 1px); background-size:22px 22px;" />
          <span class="absolute inset-0 bg-gradient-to-b from-[rgba(11,18,32,.1)] via-transparent to-[rgba(11,18,32,.65)] pointer-events-none" />

          <span class="absolute top-5 end-5 z-[2] grid place-items-center w-10 h-10 rounded-pill bg-white/15 text-white backdrop-blur-sm">
            <AppIcon name="graduation" :size="18" />
          </span>

          <span class="relative z-[1] grid place-items-center w-20 h-20 rounded-pill bg-white text-primary-600 shadow-[0_12px_30px_rgba(0,0,0,.35)] transition-transform duration-fast group-hover:scale-110">
            <AppIcon name="play" :size="30" class="ms-1" />
          </span>

          <div class="absolute bottom-5 start-5 z-[2] text-white text-start">
            <p class="text-body font-bold">{{ project.title }}</p>
            <p class="text-caption opacity-80 mt-0.5">فيديو العرض النهائي للمشروع</p>
          </div>
        </button>
      </div>

      <!-- شبكة معلومات المشروع -->
      <div class="grid sm:grid-cols-2 gap-4">
        <div
          v-for="info in infoRows" :key="info.label"
          class="reveal group flex items-center justify-between gap-3 p-4 rounded-lg bg-surface border border-border shadow-card transition-all duration-base hover:-translate-y-0.5 hover:shadow-card-hover hover:border-primary-200"
        >
          <div class="min-w-0">
            <div class="text-label text-text-400 mb-1">{{ info.label }}</div>
            <div class="text-body-sm font-bold text-text-900 break-words">{{ info.value }}</div>
          </div>
          <span class="grid place-items-center w-10 h-10 rounded-pill shrink-0 text-white transition-transform duration-base group-hover:scale-110" style="background: linear-gradient(135deg, var(--color-primary-600), var(--color-accent-500))">
            <AppIcon :name="info.icon" :size="17" />
          </span>
        </div>
      </div>
    </template>
  </div>
</template>

<script>
import { mapState } from 'pinia'
import { useLandingStore } from '@/stores/landing.store'
import AppIcon from '@/components/icons/AppIcon.vue'
import EmptyState from '@/components/ui/EmptyState.vue'
import { openPlaceholderVideo } from '@/utils/filePreview'

export default {
  name: 'ProjectShowcasePage',

  components: { AppIcon, EmptyState },

  props: {
    id: { type: [String, Number], required: true }
  },

  computed: {
    ...mapState(useLandingStore, ['featured']),

    project() {
      return this.featured.find((p) => String(p.id) === String(this.id)) || null
    },

    infoRows() {
      if (!this.project) return []
      const p = this.project
      return [
        { label: 'التخصص', value: p.program_name + (p.degree ? ` "${p.degree}"` : ''), icon: 'book' },
        { label: 'القسم', value: p.dept_name, icon: 'monitor' },
        { label: 'أعضاء الفريق', value: p.members, icon: 'users' },
        { label: 'المشرف', value: p.supervisor_name, icon: 'user' },
        { label: 'تاريخ الإنجاز', value: p.date, icon: 'calendar' },
        { label: 'الفصل الدراسي', value: p.semester, icon: 'clock' }
      ]
    }
  },

  methods: {
    openPlaceholderVideo
  }
}
</script>

<style scoped>
.mono { direction: ltr; }
</style>
