/** v-magnetic — الزر يتبع الفأرة بحركة صغيرة (حد أقصى ~10px)، يرتد بنعومة عند الخروج */
const MAX_OFFSET = 10

function onMove(el, event) {
  const rect = el.getBoundingClientRect()
  const relX = event.clientX - (rect.left + rect.width / 2)
  const relY = event.clientY - (rect.top + rect.height / 2)
  const x = Math.max(-MAX_OFFSET, Math.min(MAX_OFFSET, relX * 0.35))
  const y = Math.max(-MAX_OFFSET, Math.min(MAX_OFFSET, relY * 0.35))
  el.style.transition = 'transform 80ms linear'
  el.style.transform = `translate3d(${x}px, ${y}px, 0)`
}

function onLeave(el) {
  el.style.transition = 'transform 400ms cubic-bezier(.22,.9,.32,1)'
  el.style.transform = 'translate3d(0,0,0)'
}

export default {
  mounted(el) {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    if (window.matchMedia('(pointer: coarse)').matches) return

    const move = (event) => onMove(el, event)
    const leave = () => onLeave(el)

    el.addEventListener('mousemove', move)
    el.addEventListener('mouseleave', leave)
    el._magnetic = { move, leave }
  },

  unmounted(el) {
    if (!el._magnetic) return
    el.removeEventListener('mousemove', el._magnetic.move)
    el.removeEventListener('mouseleave', el._magnetic.leave)
    delete el._magnetic
  }
}
