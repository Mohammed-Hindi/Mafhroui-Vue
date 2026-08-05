/** حركة خفيفة مرتبطة بالتمرير — أي عنصر فيه data-parallax="السرعة" يتحرك رأسيًا حسب موقعه من مركز الشاشة */
let elements = []
let ticking = false

function updateElement(el) {
  const rect = el.getBoundingClientRect()
  const speed = parseFloat(el.dataset.parallax) || 0.1
  const distance = rect.top + rect.height / 2 - window.innerHeight / 2
  el.style.transform = `translateY(${distance * speed}px)`
}

function onScroll() {
  if (ticking) return
  ticking = true
  requestAnimationFrame(() => {
    elements.forEach(updateElement)
    ticking = false
  })
}

export function initParallax() {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

  const collect = () => {
    elements = Array.from(document.querySelectorAll('[data-parallax]'))
    onScroll()
  }

  collect()
  window.addEventListener('scroll', onScroll, { passive: true })
  window.addEventListener('resize', collect, { passive: true })

  // تنقّل بين الصفحات (SPA) يضيف عناصر جديدة — إعادة جمعها تلقائيًا
  new MutationObserver(collect).observe(document.body, { childList: true, subtree: true })
}
