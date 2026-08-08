<template>
  <div v-if="enabled" ref="glow" class="pointer-events-none fixed inset-0 opacity-0 transition-opacity duration-500" aria-hidden="true">
    <div
      ref="light"
      class="absolute w-[420px] h-[420px] rounded-pill blur-[90px]"
      style="transform: translate3d(-50%,-50%,0); background: radial-gradient(circle, rgba(var(--glow-rgb), var(--glow-alpha)), rgba(6,182,212,.06) 55%, transparent 75%);"
    />
  </div>
</template>

<script>
/** إضاءة خفيفة تتبع الفأرة — سطح المكتب فقط، تُعطَّل تلقائيًا عند تفضيل تقليل الحركة أو اللمس */
export default {
  name: 'CursorSpotlight',

  data() {
    return { enabled: false }
  },

  mounted() {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    if (window.matchMedia('(pointer: coarse)').matches) return
    this.enabled = true

    this.$nextTick(() => {
      window.addEventListener('mousemove', this.onMove, { passive: true })
      window.addEventListener('mouseleave', this.hide, { passive: true })
    })
  },

  beforeUnmount() {
    window.removeEventListener('mousemove', this.onMove)
    window.removeEventListener('mouseleave', this.hide)
  },

  methods: {
    onMove(event) {
      if (!this.$refs.light) return
      this.$refs.glow.style.opacity = '1'
      this.$refs.light.style.left = `${event.clientX}px`
      this.$refs.light.style.top = `${event.clientY}px`
    },
    hide() {
      if (this.$refs.glow) this.$refs.glow.style.opacity = '0'
    }
  }
}
</script>
