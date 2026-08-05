<template>
  <span ref="el">{{ display }}</span>
</template>

<script>
/** عدّاد يتحرك من 0 إلى القيمة النهائية مرة واحدة فقط عند دخوله الشاشة */
export default {
  name: 'CountUp',

  props: {
    value: { type: Number, required: true },
    duration: { type: Number, default: 1100 },
    /** دالة تنسيق اختيارية — تُستقبل الرقم المقرَّب وتُعيد نصًا (مثال: formatNumber) */
    formatter: { type: Function, default: null }
  },

  data() {
    return { display: '0', started: false }
  },

  computed: {
    reducedMotion() {
      return window.matchMedia('(prefers-reduced-motion: reduce)').matches
    }
  },

  mounted() {
    this.display = this.formatted(this.reducedMotion ? this.value : 0)
    if (this.reducedMotion) return

    this.observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting || this.started) return
          this.started = true
          this.animate()
          this.observer.disconnect()
        })
      },
      { threshold: 0.3 }
    )
    this.observer.observe(this.$refs.el)
  },

  beforeUnmount() {
    this.observer?.disconnect()
  },

  methods: {
    formatted(n) {
      const rounded = Math.round(n)
      return this.formatter ? this.formatter(rounded) : rounded.toLocaleString('en-US')
    },

    animate() {
      const start = performance.now()
      const to = this.value
      const step = (now) => {
        const progress = Math.min((now - start) / this.duration, 1)
        const eased = 1 - Math.pow(1 - progress, 3)
        this.display = this.formatted(to * eased)
        if (progress < 1) requestAnimationFrame(step)
      }
      requestAnimationFrame(step)
    }
  }
}
</script>
