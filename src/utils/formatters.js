/** تنسيق التاريخ بالميلادي العربي: 15 مارس 2025 */
export function formatDate(value) {
  if (!value) return '—'
  const date = value instanceof Date ? value : new Date(value)
  if (Number.isNaN(date.getTime())) return '—'
  return new Intl.DateTimeFormat('ar-EG', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  }).format(date)
}

/** تاريخ + وقت */
export function formatDateTime(value) {
  if (!value) return '—'
  const date = value instanceof Date ? value : new Date(value)
  if (Number.isNaN(date.getTime())) return '—'
  return new Intl.DateTimeFormat('ar-EG', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }).format(date)
}

/** وقت نسبي: قبل 5 دقائق / قبل يومين — يُستخدم بالإشعارات */
export function formatRelativeTime(value) {
  if (!value) return '—'
  const date = value instanceof Date ? value : new Date(value)
  if (Number.isNaN(date.getTime())) return '—'

  const diffSeconds = Math.round((date.getTime() - Date.now()) / 1000)
  const units = [
    ['year', 60 * 60 * 24 * 365],
    ['month', 60 * 60 * 24 * 30],
    ['day', 60 * 60 * 24],
    ['hour', 60 * 60],
    ['minute', 60],
    ['second', 1]
  ]
  const rtf = new Intl.RelativeTimeFormat('ar', { numeric: 'auto' })
  for (const [unit, seconds] of units) {
    if (Math.abs(diffSeconds) >= seconds || unit === 'second') {
      return rtf.format(Math.round(diffSeconds / seconds), unit)
    }
  }
  return '—'
}

/** رقم بفواصل عربية */
export function formatNumber(value) {
  if (value === null || value === undefined || value === '') return '—'
  return new Intl.NumberFormat('ar-EG').format(value)
}

/** حجم ملف مقروء */
export function formatFileSize(bytes) {
  if (!bytes && bytes !== 0) return '—'
  const units = ['بايت', 'كيلوبايت', 'ميجابايت', 'جيجابايت']
  let size = Number(bytes)
  let index = 0
  while (size >= 1024 && index < units.length - 1) {
    size /= 1024
    index += 1
  }
  return `${size.toFixed(index === 0 ? 0 : 1)} ${units[index]}`
}

/** قص نص طويل مع نقاط */
export function truncate(text, length = 60) {
  if (!text) return ''
  return text.length > length ? `${text.slice(0, length).trimEnd()}…` : text
}

/** الأحرف الأولى للاسم — تُستخدم بالأفاتار */
export function initials(fullName) {
  if (!fullName) return '؟'
  return fullName
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part.charAt(0))
    .join('')
}
