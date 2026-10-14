<template>
  <!-- صفحات الهبوط بنمط موقع الكلية الرئيسي (195704 → 200241): هيدر أبيض بشريط تدرج، أقسام بعناوين الخطين، فوتر كحلي -->
  <div class="us-page">
    <LandingNavBar />
    <main class="flex-1">
      <router-view v-slot="{ Component }">
        <transition
          enter-active-class="transition duration-slow ease-standard"
          enter-from-class="opacity-0"
          leave-active-class="transition duration-fast ease-standard"
          leave-to-class="opacity-0"
          mode="out-in"
        >
          <component :is="Component" />
        </transition>
      </router-view>
    </main>
    <LandingFooter />
    <!-- زر العودة للأعلى البرتقالي (195704) -->
    <button v-show="showTop" type="button" class="us-top-btn" aria-label="العودة للأعلى" @click="toTop"><ChevronUp :size="26" /></button>
  </div>
</template>

<script setup>
import { onMounted, onUnmounted, ref } from 'vue'
import { ChevronUp } from 'lucide-vue-next'
import LandingNavBar from '@/components/landing/LandingNavBar.vue'
import LandingFooter from '@/components/landing/LandingFooter.vue'
import '@/styles/ucas-site.css'

const showTop = ref(false)
const onScroll = () => { showTop.value = window.scrollY > 400 }
const toTop = () => window.scrollTo({ top: 0, behavior: 'smooth' })

// التوكنز (الخط Cairo وألوان الهوية) تعمل تحت data-brand="ucas" كباقي صفحات المنصة
onMounted(() => {
  document.documentElement.setAttribute('data-brand', 'ucas')
  window.addEventListener('scroll', onScroll, { passive: true })
})
onUnmounted(() => {
  document.documentElement.removeAttribute('data-brand')
  window.removeEventListener('scroll', onScroll)
})
</script>
