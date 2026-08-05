<template>
  <section id="projects" class="py-14 sm:py-20 scroll-mt-20">
    <div class="max-w-content mx-auto px-6">
      <div class="reveal mb-9">
        <span class="inline-block px-4 py-1.5 rounded-pill bg-primary-50 text-primary-700 text-label font-bold">
          أفضل مشاريع التخرج
        </span>
        <h2 class="font-cairo font-extrabold text-sec-title-sm sm:text-sec-title text-text-900 mt-2">
          مشاريع مميزة من طلابنا
        </h2>
        <p class="text-[13.5px] text-text-600 mt-1.5">أعمال متميزة تمت أرشفتها في المنصة</p>
      </div>

      <!-- فارغ -->
      <div v-if="!projects.length" class="flex flex-col items-center text-center py-12 bg-surface border border-border rounded-lg">
        <span class="grid place-items-center w-16 h-16 rounded-pill bg-primary-50 text-primary-600 mb-4">
          <AppIcon name="inbox" :size="28" />
        </span>
        <h3 class="font-cairo font-bold text-h3 text-text-900">لا توجد مشاريع منشورة بعد</h3>
      </div>

      <!-- السلايدر — 3 مشاريع بكل سلايد -->
      <div v-else class="relative">
        <!-- dir=ltr مقصود هنا فقط: يجعل رياضيات الانزلاق (translateX) مباشرة وقابلة للتنبؤ، وكل سلايد بالداخل يعاد ضبطه RTL لعرض المحتوى بشكل صحيح -->
        <div class="overflow-hidden" dir="ltr">
          <div
            class="flex transition-transform duration-slow ease-standard"
            :style="{ transform: `translateX(-${activeSlide * 100}%)` }"
          >
            <div v-for="(slide, index) in slides" :key="index" dir="rtl" class="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 shrink-0 w-full">
              <ProjectCard v-for="project in slide" :key="project.id" :project="project" />
            </div>
          </div>
        </div>

        <div v-if="slides.length > 1" class="flex items-center justify-center gap-5 mt-9">
          <button
            v-magnetic
            type="button"
            class="grid place-items-center shrink-0 w-11 h-11 rounded-pill bg-surface border border-border shadow-dropdown text-text-700 hover:text-primary-700 hover:border-primary-200 disabled:opacity-30 disabled:pointer-events-none transition-colors duration-fast"
            :disabled="activeSlide === 0"
            aria-label="المجموعة السابقة"
            @click="activeSlide--"
          >
            <AppIcon name="chevronEnd" :size="18" />
          </button>

          <div class="flex flex-col items-center gap-2.5">
            <div class="flex items-center gap-2">
              <button
                v-for="(slide, index) in slides" :key="index"
                type="button"
                class="h-2 rounded-pill transition-all duration-fast"
                :class="index === activeSlide ? 'w-6 bg-primary-600' : 'w-2 bg-border hover:bg-primary-200'"
                :aria-label="`الانتقال إلى المجموعة ${index + 1}`"
                @click="activeSlide = index"
              />
            </div>
            <span class="text-label font-semibold text-text-400">
              المجموعة {{ activeSlide + 1 }} من {{ slides.length }} — {{ projects.length }} مشروعًا
            </span>
          </div>

          <button
            v-magnetic
            type="button"
            class="grid place-items-center shrink-0 w-11 h-11 rounded-pill bg-surface border border-border shadow-dropdown text-text-700 hover:text-primary-700 hover:border-primary-200 disabled:opacity-30 disabled:pointer-events-none transition-colors duration-fast"
            :disabled="activeSlide === slides.length - 1"
            aria-label="المجموعة التالية"
            @click="activeSlide++"
          >
            <AppIcon name="chevronStart" :size="18" />
          </button>
        </div>
      </div>
    </div>
  </section>
</template>

<script>
import ProjectCard from './ProjectCard.vue'
import AppIcon from '@/components/icons/AppIcon.vue'

const SLIDE_SIZE = 3

export default {
  name: 'FeaturedProjects',

  components: { ProjectCard, AppIcon },

  props: {
    projects: { type: Array, default: () => [] }
  },

  data() {
    return { activeSlide: 0 }
  },

  computed: {
    slides() {
      const chunks = []
      for (let i = 0; i < this.projects.length; i += SLIDE_SIZE) {
        chunks.push(this.projects.slice(i, i + SLIDE_SIZE))
      }
      return chunks.length ? chunks : [[]]
    }
  },

  watch: {
    slides(newSlides) {
      if (this.activeSlide > newSlides.length - 1) this.activeSlide = 0
    }
  }
}
</script>
