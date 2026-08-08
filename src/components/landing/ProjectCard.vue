<template>
  <article v-tilt class="reveal bg-surface border border-border rounded-lg overflow-hidden shadow-card hover:shadow-card-hover transition-shadow duration-base">
    <!-- معاينة الفيديو — واجهة على هويتنا البصرية، بدون تضمين خارجي -->
    <button
      type="button"
      class="relative aspect-[16/10] w-full grid place-items-center overflow-hidden group bg-gradient-to-bl from-primary-900 via-primary-600 to-accent-500"
      :aria-label="`تشغيل فيديو عرض مشروع ${project.title}`"
      @click="openPlaceholderVideo"
    >
      <span class="absolute inset-0 opacity-[0.12] pointer-events-none" style="background-image:radial-gradient(currentColor 1px, transparent 1px); background-size:20px 20px; color:#fff;" />
      <span class="absolute inset-0 bg-gradient-to-b from-[rgba(11,18,32,.1)] via-transparent to-[rgba(11,18,32,.7)] pointer-events-none" />

      <span v-if="badgeText" class="absolute top-3.5 start-3.5 z-[2] px-3 py-1 rounded-pill bg-surface text-primary-700 text-[11px] font-bold shadow-[0_4px_10px_rgba(0,0,0,.15)]">
        {{ badgeText }}
      </span>

      <span class="absolute top-3.5 end-3.5 z-[2] grid place-items-center w-9 h-9 rounded-pill bg-white/15 text-white backdrop-blur-sm">
        <AppIcon name="graduation" :size="16" />
      </span>

      <span class="relative z-[1] grid place-items-center w-[58px] h-[58px] rounded-pill bg-white text-primary-600 shadow-[0_10px_24px_rgba(0,0,0,.35)] transition-transform duration-fast group-hover:scale-110">
        <AppIcon name="play" :size="22" class="ms-[3px]" />
      </span>

      <div class="absolute bottom-3 inset-x-3 z-[2] flex items-center justify-between pointer-events-none">
        <span class="flex items-center gap-1.5 px-2.5 py-1 rounded-[8px] bg-[rgba(11,18,32,.5)] backdrop-blur-sm text-white text-[10.5px] font-bold">
          <AppIcon name="play" :size="11" />
          فيديو عرض المشروع
        </span>
        <span class="flex gap-1.5 pointer-events-auto">
          <button
            type="button"
            class="grid place-items-center w-[26px] h-[26px] rounded-pill bg-[rgba(11,18,32,.55)] backdrop-blur-sm border border-white/25 text-white hover:bg-white/20 transition-colors duration-fast"
            aria-label="مشاركة المشروع"
            @click.stop="shareProject"
          >
            <AppIcon name="share" :size="12" :stroke-width="2.2" />
          </button>
        </span>
      </div>
    </button>

    <!-- المحتوى -->
    <div class="px-[22px] pt-5 pb-[22px]">
      <h3 class="font-cairo font-extrabold text-[15.5px] text-text-900 mb-1.5 line-clamp-1" :title="project.title">
        {{ project.title }}
      </h3>
      <p class="text-caption text-text-400 mb-[18px]">
        المشرف: {{ project.supervisor_name || 'غير محدد' }}
      </p>

      <router-link
        :to="{ name: 'project-showcase', params: { id: project.id } }"
        class="flex items-center justify-center gap-2 w-full h-11 rounded-pill border border-border bg-surface text-body-sm font-bold text-primary-600 hover:bg-primary-50 hover:border-primary-200 hover:-translate-y-px transition-all duration-fast"
      >
        عرض المزيد
        <AppIcon name="chevronStart" :size="15" :stroke-width="2.2" />
      </router-link>
    </div>
  </article>
</template>

<script>
import AppIcon from '@/components/icons/AppIcon.vue'
import { openPlaceholderVideo } from '@/utils/filePreview'

export default {
  name: 'ProjectCard',

  components: { AppIcon },

  props: {
    project: {
      type: Object,
      required: true
    }
  },

  computed: {
    badgeText() {
      const parts = [this.project.program_name, this.project.degree].filter(Boolean)
      return parts.join(' ')
    }
  },

  methods: {
    openPlaceholderVideo,

    async shareProject() {
      const url = `${window.location.origin}/projects/${this.project.id}`
      const payload = { title: this.project.title, url }

      if (navigator.share) {
        try {
          await navigator.share(payload)
        } catch (_) {
          // المستخدم ألغى المشاركة — لا حاجة رسالة
        }
        return
      }

      try {
        await navigator.clipboard.writeText(url)
        this.$toast?.success('تم نسخ رابط المشروع')
      } catch (_) {
        this.$toast?.error('تعذّر نسخ الرابط')
      }
    }
  }
}
</script>
