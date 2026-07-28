<template>
  <article class="reveal bg-surface border border-border rounded-lg overflow-hidden shadow-card hover:-translate-y-1 hover:shadow-card-hover transition-all duration-base">
    <!-- المعاينة -->
    <div class="relative aspect-[16/10] bg-[#0B1220] overflow-hidden group">
      <!-- تشغيل يوتيوب — يُحمَّل فقط بعد الضغط (لا iframe مسبق) -->
      <iframe
        v-if="isPlaying"
        :src="embedUrl"
        title="فيديو عرض المشروع"
        class="absolute inset-0 w-full h-full border-0"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        referrerpolicy="strict-origin-when-cross-origin"
        allowfullscreen
      />

      <template v-else>
        <img
          v-if="thumbnailUrl"
          :src="thumbnailUrl"
          :alt="`معاينة فيديو مشروع ${project.title}`"
          loading="lazy"
          class="absolute inset-0 w-full h-full object-cover transition-transform duration-slow group-hover:scale-105"
          @error="onThumbError"
        >
        <div v-else class="absolute inset-0 grid place-items-center bg-gradient-to-bl from-primary-900 to-accent-600 text-white/40">
          <AppIcon name="briefcase" :size="40" />
        </div>

        <span class="absolute inset-0 bg-gradient-to-b from-[rgba(11,18,32,.15)] via-[rgba(11,18,32,.05)] to-[rgba(11,18,32,.75)] pointer-events-none" />

        <span v-if="badgeText" class="absolute top-3.5 start-3.5 z-[2] px-3 py-1 rounded-pill bg-surface text-primary-700 text-[11px] font-bold shadow-[0_4px_10px_rgba(0,0,0,.15)]">
          {{ badgeText }}
        </span>

        <!-- زر التشغيل -->
        <button
          v-if="hasVideo"
          type="button"
          class="absolute inset-0 z-[1] grid place-items-center"
          :aria-label="`تشغيل فيديو مشروع ${project.title}`"
          @click="playVideo"
        >
          <span class="grid place-items-center w-[58px] h-[58px] rounded-pill bg-[#FF0000] text-white shadow-[0_10px_24px_rgba(0,0,0,.35)] transition-transform duration-fast group-hover:scale-110">
            <AppIcon name="play" :size="22" class="ms-[3px]" />
          </span>
        </button>

        <div class="absolute bottom-3 inset-x-3 z-[2] flex items-center justify-between pointer-events-none">
          <span v-if="hasVideo" class="flex items-center gap-1.5 px-2.5 py-1 rounded-[8px] bg-[rgba(11,18,32,.65)] backdrop-blur-sm text-white text-[10.5px] font-bold">
            <AppIcon name="youtube" :size="13" class="text-[#FF0000]" />
            مشاهدة على YouTube
          </span>
          <span v-else />

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
      </template>
    </div>

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

export default {
  name: 'ProjectCard',

  components: { AppIcon },

  props: {
    project: {
      type: Object,
      required: true
    }
  },

  data() {
    return {
      isPlaying: false,
      thumbFailed: false
    }
  },

  computed: {
    /** معرّف يوتيوب صالح فقط: 11 حرفًا من [A-Za-z0-9_-] — يمنع حقن قيمة عشوائية بالـ iframe */
    safeYoutubeId() {
      const id = this.project.youtube_id
      return typeof id === 'string' && /^[A-Za-z0-9_-]{11}$/.test(id) ? id : null
    },

    hasVideo() {
      return Boolean(this.safeYoutubeId)
    },

    embedUrl() {
      return this.safeYoutubeId
        ? `https://www.youtube-nocookie.com/embed/${this.safeYoutubeId}?autoplay=1&rel=0`
        : ''
    },

    thumbnailUrl() {
      if (this.thumbFailed) return null
      if (this.safeYoutubeId) return `https://img.youtube.com/vi/${this.safeYoutubeId}/hqdefault.jpg`
      return this.project.thumbnail_url || null
    },

    badgeText() {
      const parts = [this.project.program_name, this.project.degree].filter(Boolean)
      return parts.join(' ')
    }
  },

  methods: {
    playVideo() {
      if (this.hasVideo) this.isPlaying = true
    },

    onThumbError() {
      this.thumbFailed = true
    },

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
