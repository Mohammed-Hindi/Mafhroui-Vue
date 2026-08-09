/** v-magnetic — الزر يتبع الفأرة بحركة صغيرة (حد أقصى ~10px)، يرتد بنعومة عند الخروج، وينضغط بصريًا عند الضغط عليه */
const MAX_OFFSET = 10

function applyTransform(el) {
  const { x, y, pressed } = el._magnetic
  const scale = pressed ? 0.94 : 1
  el.style.transform = `translate3d(${x}px, ${y}px, 0) scale(${scale})`
}

function onMove(el, event) {
  const rect = el.getBoundingClientRect()
  const relX = event.clientX - (rect.left + rect.width / 2)
  const relY = event.clientY - (rect.top + rect.height / 2)
  el._magnetic.x = Math.max(-MAX_OFFSET, Math.min(MAX_OFFSET, relX * 0.35))
  el._magnetic.y = Math.max(-MAX_OFFSET, Math.min(MAX_OFFSET, relY * 0.35))
  el.style.transition = 'transform 80ms linear'
  applyTransform(el)
}

function onLeave(el) {
  el._magnetic.x = 0
  el._magnetic.y = 0
  el._magnetic.pressed = false
  el.style.transition = 'transform 400ms cubic-bezier(.22,.9,.32,1)'
  applyTransform(el)
}

function onDown(el) {
  el._magnetic.pressed = true
  el.style.transition = 'transform 100ms cubic-bezier(.22,.9,.32,1)'
  applyTransform(el)
}

function onUp(el) {
  el._magnetic.pressed = false
  el.style.transition = 'transform 250ms cubic-bezier(.22,.9,.32,1)'
  applyTransform(el)
}

export default {
  mounted(el) {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    if (window.matchMedia('(pointer: coarse)').matches) return

    el._magnetic = { x: 0, y: 0, pressed: false }
    const move = (event) => onMove(el, event)
    const leave = () => onLeave(el)
    const down = () => onDown(el)
    const up = () => onUp(el)

    el.addEventListener('mousemove', move)
    el.addEventListener('mouseleave', leave)
    el.addEventListener('mousedown', down)
    el.addEventListener('mouseup', up)
    el._magneticHandlers = { move, leave, down, up }
  },

  unmounted(el) {
    if (!el._magneticHandlers) return
    el.removeEventListener('mousemove', el._magneticHandlers.move)
    el.removeEventListener('mouseleave', el._magneticHandlers.leave)
    el.removeEventListener('mousedown', el._magneticHandlers.down)
    el.removeEventListener('mouseup', el._magneticHandlers.up)
    delete el._magneticHandlers
    delete el._magnetic
  }
}
