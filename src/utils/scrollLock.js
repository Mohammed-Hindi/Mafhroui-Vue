/** يمنع تمرير الصفحة خلف نافذة/درج مفتوح دون إحداث قفزة بالتخطيط عند اختفاء شريط التمرير */
let lockCount = 0

export function lockScroll() {
  lockCount += 1
  if (lockCount > 1) return

  const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth
  if (scrollbarWidth > 0) {
    const side = getComputedStyle(document.documentElement).direction === 'rtl' ? 'paddingLeft' : 'paddingRight'
    document.body.style[side] = `${scrollbarWidth}px`
  }
  document.body.style.overflow = 'hidden'
}

export function unlockScroll() {
  lockCount = Math.max(0, lockCount - 1)
  if (lockCount > 0) return

  document.body.style.overflow = ''
  document.body.style.paddingRight = ''
  document.body.style.paddingLeft = ''
}
