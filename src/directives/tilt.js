/** v-tilt — إمالة 3D خفيفة جدًا (حتى 6 درجات) تتبع موضع الفأرة داخل العنصر، مع رفعة بسيطة، ترتد عند الخروج */
const MAX_TILT = 6
const LIFT = -6

function onMove(el, event) {
  const rect = el.getBoundingClientRect()
  const px = (event.clientX - rect.left) / rect.width
  const py = (event.clientY - rect.top) / rect.height
  const rotateY = (px - 0.5) * MAX_TILT * 2
  const rotateX = (0.5 - py) * MAX_TILT * 2
  el.style.transition = 'transform 90ms linear'
  el.style.transform = `perspective(900px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateY(${LIFT}px) translateZ(0)`
}

function onLeave(el) {
  el.style.transition = 'transform 450ms cubic-bezier(.22,.9,.32,1)'
  el.style.transform = 'perspective(900px) rotateX(0) rotateY(0) translateY(0) translateZ(0)'
}

export default {
  mounted(el) {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    if (window.matchMedia('(pointer: coarse)').matches) return

    el.style.willChange = 'transform'
    const move = (event) => onMove(el, event)
    const leave = () => onLeave(el)

    el.addEventListener('mousemove', move)
    el.addEventListener('mouseleave', leave)
    el._tilt = { move, leave }
  },

  unmounted(el) {
    if (!el._tilt) return
    el.removeEventListener('mousemove', el._tilt.move)
    el.removeEventListener('mouseleave', el._tilt.leave)
    delete el._tilt
  }
}
