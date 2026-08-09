const io = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return
      entry.target.classList.add('is-visible')
      io.unobserve(entry.target)
    })
  },
  { threshold: 0.15, rootMargin: '0px 0px -40px 0px' },
)

function observeAll(root) {
  // لو الجذر نفسه فيه class reveal
  if (root.classList?.contains('reveal')) io.observe(root)
  // ولأي عنصر داخلي فيه class reveal
  root.querySelectorAll?.('.reveal').forEach((el) => io.observe(el))
}

export function initRevealObserver() {
  // مسح أولي لكل العناصر الموجودة حالياً بالصفحة
  observeAll(document.body)

  // مراقبة أي عناصر جديدة تنضاف لاحقاً (تنقّل بين الصفحات، v-if، إلخ)
  const mo = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      mutation.addedNodes.forEach((node) => {
        if (node.nodeType !== 1) return // تجاهل النصوص
        observeAll(node)
      })
    })
  })

  mo.observe(document.body, { childList: true, subtree: true })
}