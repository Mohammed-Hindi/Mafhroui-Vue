<template>
  <canvas ref="canvasEl" class="fixed inset-0 pointer-events-none" aria-hidden="true" />
</template>

<script setup>
/** خلفية اللاندنج بيج بالكامل — فقاعات ماء ناعمة صاعدة، تتأثر بحركة الفأرة بشكل خفيف */
import { ref, onMounted, onUnmounted } from 'vue'

const canvasEl = ref(null)
const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches

const COLORS = ['37,99,235', '6,182,212', '16,185,129']

let ctx, raf, width, height, droplets = []
let mouseX = 0
let mouseY = 0

function makeDroplet(initial = false) {
  const r = 8 + Math.random() * 26
  return {
    x: Math.random() * width,
    // عند فتح الصفحة تظهر الفقاعات موزّعة بكامل الشاشة فورًا؛ بعدها تُعاد ولادتها أسفل الشاشة لتصعد بشكل طبيعي
    y: initial ? Math.random() * height : height + Math.random() * height,
    r,
    speedY: 0.12 + Math.random() * 0.3,
    swayAmp: 12 + Math.random() * 28,
    swaySpeed: 0.2 + Math.random() * 0.35,
    swayOffset: Math.random() * Math.PI * 2,
    alpha: 0.05 + Math.random() * 0.08,
    color: COLORS[Math.floor(Math.random() * COLORS.length)]
  }
}

/** الوضع الداكن يبتلع الشفافية الخفيفة — نرفع الحدّة الظاهرة حتى تبقى الفقاعات بنفس الحضور البصري بالوضعين */
function isDarkTheme() {
  return document.documentElement.getAttribute('data-theme') === 'dark'
}

function paintDroplet(d, x, y) {
  const alpha = isDarkTheme() ? Math.min(0.32, d.alpha * 2.1) : d.alpha
  const gradient = ctx.createRadialGradient(x, y, 0, x, y, d.r)
  gradient.addColorStop(0, `rgba(${d.color},${alpha})`)
  gradient.addColorStop(1, `rgba(${d.color},0)`)
  ctx.fillStyle = gradient
  ctx.beginPath()
  ctx.arc(x, y, d.r, 0, Math.PI * 2)
  ctx.fill()
}

function resize() {
  const firstRun = !width
  width = canvasEl.value.width = window.innerWidth
  height = canvasEl.value.height = window.innerHeight
  // كثافة متوسطة: لا تُعاد الفقاعات الموجودة عند تغيير حجم الشاشة، تُنشأ فقط أول مرة
  if (firstRun) {
    const count = Math.min(26, Math.round((width * height) / 46000))
    droplets = Array.from({ length: count }, () => makeDroplet(true))
  }
}

let t = 0
function tick() {
  t += 0.016
  ctx.clearRect(0, 0, width, height)
  const parallaxX = (mouseX - width / 2) * 0.012
  const parallaxY = (mouseY - height / 2) * 0.012

  droplets.forEach((d) => {
    d.y -= d.speedY
    if (d.y < -d.r * 2) {
      d.y = height + d.r * 2
      d.x = Math.random() * width
    }
    const sway = Math.sin(t * d.swaySpeed + d.swayOffset) * d.swayAmp
    paintDroplet(d, d.x + sway + parallaxX, d.y + parallaxY)
  })

  raf = requestAnimationFrame(tick)
}

function onMouseMove(event) {
  mouseX = event.clientX
  mouseY = event.clientY
}

onMounted(() => {
  ctx = canvasEl.value.getContext('2d')
  resize()
  window.addEventListener('resize', resize, { passive: true })

  if (prefersReduced) {
    droplets.forEach((d) => paintDroplet(d, d.x, d.y))
    return
  }

  window.addEventListener('mousemove', onMouseMove, { passive: true })
  tick()
})

onUnmounted(() => {
  cancelAnimationFrame(raf)
  window.removeEventListener('resize', resize)
  window.removeEventListener('mousemove', onMouseMove)
})
</script>
