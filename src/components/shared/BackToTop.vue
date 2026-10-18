<template>
  <transition name="btt">
    <button v-if="show" type="button" class="btt" aria-label="العودة للأعلى" title="العودة للأعلى" @click="toTop">
      <ArrowUp :size="20" />
    </button>
  </transition>
</template>

<script setup>
import { onMounted, onUnmounted, ref } from 'vue'
import { ArrowUp } from 'lucide-vue-next'

const show = ref(false)

const onScroll = () => {
  show.value = window.scrollY > 300
}
const toTop = () => window.scrollTo({ top: 0, behavior: 'smooth' })

onMounted(() => window.addEventListener('scroll', onScroll, { passive: true }))
onUnmounted(() => window.removeEventListener('scroll', onScroll))
</script>

<style scoped>
.btt { position: fixed; bottom: 24px; inset-inline-end: 24px; z-index: 50; display: grid; place-items: center; width: 46px; height: 46px; padding: 0; border: 0; border-radius: 4px; background: #005BAA; color: #FFFFFF; box-shadow: 0 8px 20px rgba(4, 40, 80, .22); cursor: pointer; transition: background .2s ease; }
.btt:hover { background: #004C8E; }
.btt:focus-visible { outline: 3px solid rgba(0, 91, 170, .35); outline-offset: 3px; }
.btt-enter-active, .btt-leave-active { transition: opacity .3s ease, transform .3s ease; }
.btt-enter-from, .btt-leave-to { opacity: 0; transform: translateY(6px); }
@media (max-width: 639.98px) { .btt { bottom: 16px; inset-inline-end: 16px; width: 42px; height: 42px; } }
@media (prefers-reduced-motion: reduce) { .btt-enter-active, .btt-leave-active { transition: none; } }
</style>
