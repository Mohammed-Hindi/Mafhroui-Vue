<template>
  <div class="fixed top-0 inset-x-0 z-toast h-[3px] pointer-events-none" aria-hidden="true">
    <div ref="bar" class="h-full bg-gradient-to-l from-primary-600 to-accent-500" style="transform-origin: right; transform: scaleX(0); transition: transform 120ms linear;" />
  </div>
</template>

<script>
/** شريط تقدّم رفيع أعلى الصفحة — يعكس نسبة التمرير الحالية */
export default {
  name: 'ScrollProgressBar',

  mounted() {
    window.addEventListener('scroll', this.onScroll, { passive: true })
    this.onScroll()
  },

  beforeUnmount() {
    window.removeEventListener('scroll', this.onScroll)
  },

  methods: {
    onScroll() {
      const doc = document.documentElement
      const height = doc.scrollHeight - doc.clientHeight
      const progress = height > 0 ? doc.scrollTop / height : 0
      if (this.$refs.bar) this.$refs.bar.style.transform = `scaleX(${progress})`
    }
  }
}
</script>
