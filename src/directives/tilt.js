/** v-tilt — إمالة 3D خفيفة جدًا (حتى 6 درجات) تتبع موضع الفأرة داخل العنصر، مع رفعة بسيطة، وانضغاط بصري عند الضغط، ترتد عند الخروج */
const MAX_TILT = 6
const LIFT = -6

function applyTransform(el, rotateX, rotateY) {
  const scale = el._tilt.pressed ? 0.97 : 1
  el.style.transform = `perspective(900px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateY(${LIFT}px) translateZ(0) scale(${scale})`
}

function onMove(el, event) {
  const rect = el.getBoundingClientRect()
  const px = (event.clientX - rect.left) / rect.width
  const py = (event.clientY - rect.top) / rect.height
  el._tilt.rotateY = (px - 0.5) * MAX_TILT * 2
  el._tilt.rotateX = (0.5 - py) * MAX_TILT * 2
  el.style.transition = 'transform 90ms linear'
  applyTransform(el, el._tilt.rotateX, el._tilt.rotateY)
}

function onLeave(el) {
  el._tilt.pressed = false
  el.style.transition = 'transform 450ms cubic-bezier(.22,.9,.32,1)'
  el.style.transform = 'perspective(900px) rotateX(0) rotateY(0) translateY(0) translateZ(0) scale(1)'
}

function onDown(el) {
  el._tilt.pressed = true
  el.style.transition = 'transform 100ms cubic-bezier(.22,.9,.32,1)'
  applyTransform(el, el._tilt.rotateX, el._tilt.rotateY)
}

function onUp(el) {
  el._tilt.pressed = false
  el.style.transition = 'transform 250ms cubic-bezier(.22,.9,.32,1)'
  applyTransform(el, el._tilt.rotateX, el._tilt.rotateY)
}

export default {
  mounted(el) {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    if (window.matchMedia('(pointer: coarse)').matches) return

    el.style.willChange = 'transform'
    el._tilt = { rotateX: 0, rotateY: 0, pressed: false }
    const move = (event) => onMove(el, event)
    const leave = () => onLeave(el)
    const down = () => onDown(el)
    const up = () => onUp(el)

    el.addEventListener('mousemove', move)
    el.addEventListener('mouseleave', leave)
    el.addEventListener('mousedown', down)
    el.addEventListener('mouseup', up)
    el._tiltHandlers = { move, leave, down, up }
  },

  unmounted(el) {
    if (!el._tiltHandlers) return
    el.removeEventListener('mousemove', el._tiltHandlers.move)
    el.removeEventListener('mouseleave', el._tiltHandlers.leave)
    el.removeEventListener('mousedown', el._tiltHandlers.down)
    el.removeEventListener('mouseup', el._tiltHandlers.up)
    delete el._tiltHandlers
    delete el._tilt
  }
}
