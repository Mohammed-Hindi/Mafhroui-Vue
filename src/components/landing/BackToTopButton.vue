<template>
  <Transition
    enter-active-class="transition duration-fast ease-standard"
    enter-from-class="opacity-0 translate-y-2"
    leave-active-class="transition duration-fast ease-standard"
    leave-to-class="opacity-0 translate-y-2"
  >
    <button
      v-if="visible"
      type="button"
      class="fixed bottom-6 start-6 z-50 grid place-items-center w-12 h-12 rounded-pill bg-ucas-orange text-white shadow-[0_10px_24px_-8px_rgba(242,140,40,.6)] hover:-translate-y-0.5 transition-transform duration-fast"
      aria-label="العودة إلى أعلى الصفحة"
      @click="scrollToTop"
    >
      <AppIcon name="chevronUp" :size="20" :stroke-width="2.4" />
    </button>
  </Transition>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import AppIcon from '@/components/icons/AppIcon.vue'

const visible = ref(false)

const handleScroll = () => {
  visible.value = window.scrollY > 400
}

const scrollToTop = () => {
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

onMounted(() => {
  window.addEventListener('scroll', handleScroll, { passive: true })
})

onUnmounted(() => {
  window.removeEventListener('scroll', handleScroll)
})
</script>
