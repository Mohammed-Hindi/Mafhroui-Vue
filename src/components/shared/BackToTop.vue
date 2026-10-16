<template>
  <!-- زر العودة للأعلى بهوية مسار: دائرة بالتدرّج داخل حلقة تمتلئ بالأخضر حسب نسبة التمرير -->
  <transition name="btt">
    <button v-if="show" type="button" class="btt" :style="{ '--p': pct }" aria-label="العودة للأعلى" title="العودة للأعلى" @click="toTop">
      <span class="btt-in"><ArrowUp :size="20" /></span>
    </button>
  </transition>
</template>

<script setup>
import { onMounted, onUnmounted, ref } from 'vue'
import { ArrowUp } from 'lucide-vue-next'

const show = ref(false)
const pct = ref(0)

const onScroll = () => {
  const max = document.documentElement.scrollHeight - window.innerHeight
  show.value = window.scrollY > 300
  pct.value = max > 0 ? Math.min(100, Math.round((window.scrollY / max) * 100)) : 0
}
const toTop = () => window.scrollTo({ top: 0, behavior: 'smooth' })

onMounted(() => window.addEventListener('scroll', onScroll, { passive: true }))
onUnmounted(() => window.removeEventListener('scroll', onScroll))
</script>

<style scoped>
.btt { position: fixed; bottom: 24px; inset-inline-end: 24px; z-index: 50; display: grid; place-items: center; width: 54px; height: 54px; padding: 0; border: 0; border-radius: 50%; background: conic-gradient(#62BB46 calc(var(--p) * 1%), rgba(0, 91, 170, .15) 0); box-shadow: 0 10px 26px rgba(4, 40, 80, .2); cursor: pointer; }
.btt-in { display: grid; place-items: center; width: 46px; height: 46px; border-radius: 50%; background: linear-gradient(270deg, #62BB46, #0E699C 55%, #025DA9); color: #FFFFFF; box-shadow: 0 0 0 2px #FFFFFF; transition: filter .3s ease; }
.btt:hover .btt-in { filter: brightness(1.1); }
.btt:focus-visible { outline: 3px solid rgba(0, 91, 170, .35); outline-offset: 3px; }
.btt-enter-active, .btt-leave-active { transition: opacity .4s ease, transform .4s ease; }
.btt-enter-from, .btt-leave-to { opacity: 0; transform: translateY(6px); }
@media (max-width: 639.98px) { .btt { bottom: 16px; inset-inline-end: 16px; width: 48px; height: 48px; } .btt-in { width: 40px; height: 40px; } }
@media (prefers-reduced-motion: reduce) { .btt-enter-active, .btt-leave-active { transition: none; } }
</style>
