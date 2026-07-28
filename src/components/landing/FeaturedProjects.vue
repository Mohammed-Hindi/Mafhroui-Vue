<template>
  <section id="projects" class="py-14 sm:py-20 scroll-mt-20">
    <div class="max-w-content mx-auto px-6">
      <div class="flex flex-wrap items-end justify-between gap-5 mb-9">
        <div class="reveal">
          <span class="inline-block px-4 py-1.5 rounded-pill bg-primary-50 text-primary-700 text-label font-bold">
            أفضل مشاريع التخرج
          </span>
          <h2 class="font-cairo font-extrabold text-sec-title-sm sm:text-sec-title text-text-900 mt-2">
            مشاريع مميزة من طلابنا
          </h2>
          <p class="text-[13.5px] text-text-600 mt-1.5">أعمال متميزة تمت أرشفتها في المنصة</p>
        </div>

        <router-link
          :to="{ name: 'projects-archive' }"
          class="reveal reveal-delay-1 inline-flex items-center gap-2 h-[38px] px-[18px] rounded-pill border border-border bg-surface shadow-card text-[12.5px] font-bold text-text-700 hover:text-primary-700 transition-colors duration-fast"
        >
          عرض الكل<span v-if="featuredTotal"> ({{ featuredTotal }})</span>
        </router-link>
      </div>

      <!-- تحميل -->
      <div v-if="featuredLoading" class="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
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
      <div v-else-if="featuredError" class="flex flex-col items-center text-center py-12 bg-surface border border-border rounded-lg">
        <span class="grid place-items-center w-16 h-16 rounded-pill bg-error-bg text-error mb-4">
          <AppIcon name="alertCircle" :size="28" />
        </span>
        <h3 class="font-cairo font-bold text-h3 text-text-900">تعذّر تحميل المشاريع</h3>
        <p class="mt-2 max-w-sm text-body-sm text-text-600">{{ featuredError }}</p>
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
      <div v-else-if="!featured.length" class="flex flex-col items-center text-center py-12 bg-surface border border-border rounded-lg">
        <span class="grid place-items-center w-16 h-16 rounded-pill bg-primary-50 text-primary-600 mb-4">
          <AppIcon name="inbox" :size="28" />
        </span>
        <h3 class="font-cairo font-bold text-h3 text-text-900">لا توجد مشاريع منشورة بعد</h3>
        <p class="mt-2 max-w-sm text-body-sm text-text-600">
          ستظهر هنا المشاريع المميزة فور أرشفتها من قبل لجنة الإشراف.
        </p>
      </div>

      <!-- الشبكة -->
      <div v-else class="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
        <ProjectCard v-for="project in featured" :key="project.id" :project="project" />
      </div>
    </div>
  </section>
</template>

<script setup>
import { computed } from 'vue'
import ProjectCard from './ProjectCard.vue'
import AppIcon from '@/components/icons/AppIcon.vue'

const props = defineProps({
  projects: { type: Array, default: () => [] },
  isLoading: { type: Boolean, default: false },
  errorMessage: { type: String, default: '' }
})

const emit = defineEmits(['retry'])

// استخدام computed لقراءة الـ Props بشكل آمن وتفاعلي بدون Infinite Loops
const featured = computed(() => props.projects || [])
const featuredTotal = computed(() => props.projects?.length || 0)
const featuredLoading = computed(() => props.isLoading)
const featuredError = computed(() => props.errorMessage)

const loadProjects = () => {
  emit('retry')
}
</script>
