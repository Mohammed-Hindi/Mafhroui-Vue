// الجداول على الجوال والآيباد (≤ 1023px) في كل اللوحات: كل صف يصير بطاقة منسدلة —
// عنوانها th[data-rt-title] (وإلا أول خلية لها رأس)، وأعمدة th[data-rt-show] تظهر تحته دائمًا كملخّص،
// والضغط على العنوان يفتح باقي الخلايا كأسطر "اسم العمود: القيمة".
// يعمل تلقائيًا على أي جدول له <thead> داخل اللوحات (.ucas-portal) دون تعديل الصفحات.
const MOBILE = '(max-width: 1023.98px)'
const SKIP = 'button, a, input, select, textarea, label'

function label(table) {
  const ths = [...table.querySelectorAll(':scope > thead th')]
  if (!ths.length) return
  const heads = ths.map((th) => th.textContent.trim())
  const titleCol = ths.findIndex((th) => th.hasAttribute('data-rt-title'))
  table.dataset.rt = ''
  table.querySelectorAll(':scope > tbody > tr').forEach((tr) => {
    const tds = [...tr.children].filter((c) => c.tagName === 'TD')
    // صفوف الحالة الفارغة/التحميل/التفاصيل (خلية واحدة ممتدة) تبقى كتلة كاملة
    if (tr.classList.contains('sk-tr') || (tds.length === 1 && tds[0].colSpan > 1)) {
      tr.dataset.rtFull = ''
      return
    }
    delete tr.dataset.rtFull
    // صف له قائمة منسدلة خاصة (aria-expanded): البطاقة ملخّص فقط والضغط يفتح قائمته الأصلية
    tr.toggleAttribute('data-rt-native', tr.hasAttribute('aria-expanded'))
    let col = 0
    let titled = false
    tds.forEach((td) => {
      const i = col
      const name = heads[i] || ''
      col += td.colSpan || 1
      td.dataset.label = name
      const isTitle = titleCol >= 0 ? i === titleCol : !titled && !!name
      if (isTitle) titled = true
      td.toggleAttribute('data-rt-title', isTitle)
      td.toggleAttribute('data-rt-show', !isTitle && !!ths[i]?.hasAttribute('data-rt-show'))
      // data-rt-keep: عمود ملخّص رقمي يحتفظ بتسميته (مثل "المجموعات: 5")
      td.toggleAttribute('data-rt-keep', !!ths[i]?.hasAttribute('data-rt-keep'))
    })
  })
}

let queued = false
function scan() {
  queued = false
  document.querySelectorAll('.ucas-portal table').forEach(label)
}
const queue = () => {
  if (!queued) {
    queued = true
    requestAnimationFrame(scan)
  }
}

export function initResponsiveTables() {
  new MutationObserver(queue).observe(document.body, { childList: true, subtree: true })
  queue()
  // الضغط على عنوان البطاقة يفتحها/يغلقها (data-* لا يلمسه Vue عند إعادة الرسم)
  document.addEventListener('click', (e) => {
    if (!window.matchMedia(MOBILE).matches || e.target.closest(SKIP)) return
    const td = e.target.closest('table[data-rt] td[data-rt-title]')
    if (!td) return
    const tr = td.parentElement
    if (tr.hasAttribute('data-rt-native')) return
    tr.toggleAttribute('data-rt-open')
    e.stopPropagation()
  }, true)
}
