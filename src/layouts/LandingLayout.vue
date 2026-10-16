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
    <BackToTop />
  </div>
</template>

<script setup>
import { onMounted, onUnmounted } from 'vue'
import BackToTop from '@/components/shared/BackToTop.vue'
import LandingNavBar from '@/components/landing/LandingNavBar.vue'
import LandingFooter from '@/components/landing/LandingFooter.vue'
import '@/styles/ucas-site.css'


// التوكنز (الخط Cairo وألوان الهوية) تعمل تحت data-brand="ucas" كباقي صفحات المنصة
onMounted(() => {
  document.documentElement.setAttribute('data-brand', 'ucas')
})
onUnmounted(() => {
  document.documentElement.removeAttribute('data-brand')
})
</script>
