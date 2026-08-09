/** v-magnetic — رفعة بسيطة وثابتة عند الهفر، وانضغاطة بصرية عند الضغط (بدون تتبّع لموضع الفأرة) */
function applyTransform(el) {
  const { hovered, pressed } = el._magnetic
  const lift = hovered && !pressed ? -2 : 0
  const scale = pressed ? 0.96 : 1
  el.style.transform = `translate3d(0, ${lift}px, 0) scale(${scale})`
}

function onEnter(el) {
  el._magnetic.hovered = true
  el.style.transition = 'transform 200ms cubic-bezier(.22,.9,.32,1)'
  applyTransform(el)
}

function onLeave(el) {
  el._magnetic.hovered = false
  el._magnetic.pressed = false
  el.style.transition = 'transform 200ms cubic-bezier(.22,.9,.32,1)'
  applyTransform(el)
}

function onDown(el) {
  el._magnetic.pressed = true
  el.style.transition = 'transform 100ms cubic-bezier(.22,.9,.32,1)'
  applyTransform(el)
}

function onUp(el) {
  el._magnetic.pressed = false
  el.style.transition = 'transform 200ms cubic-bezier(.22,.9,.32,1)'
  applyTransform(el)
}

export default {
  mounted(el) {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    if (window.matchMedia('(pointer: coarse)').matches) return

    el._magnetic = { hovered: false, pressed: false }
    const enter = () => onEnter(el)
    const leave = () => onLeave(el)
    const down = () => onDown(el)
    const up = () => onUp(el)

    el.addEventListener('mouseenter', enter)
    el.addEventListener('mouseleave', leave)
    el.addEventListener('mousedown', down)
    el.addEventListener('mouseup', up)
    el._magneticHandlers = { enter, leave, down, up }
  },

  unmounted(el) {
    if (!el._magneticHandlers) return
    el.removeEventListener('mouseenter', el._magneticHandlers.enter)
    el.removeEventListener('mouseleave', el._magneticHandlers.leave)
    el.removeEventListener('mousedown', el._magneticHandlers.down)
    el.removeEventListener('mouseup', el._magneticHandlers.up)
    delete el._magneticHandlers
    delete el._magnetic
  }
}
