/** دوال تحقق نقية — تُعيد رسالة خطأ عربية أو '' عند الصلاحية */

export const required = (value, label = 'هذا الحقل') => {
  const empty =
    value === null ||
    value === undefined ||
    (typeof value === 'string' && value.trim() === '') ||
    (Array.isArray(value) && value.length === 0)
  return empty ? `${label} مطلوب` : ''
}

export const email = (value) => {
  if (!value) return ''
  const pattern = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/
  return pattern.test(value) ? '' : 'صيغة البريد الإلكتروني غير صحيحة'
}

export const minLength = (value, min, label = 'هذا الحقل') =>
  !value || value.length >= min ? '' : `${label} يجب ألا يقل عن ${min} أحرف`

export const maxLength = (value, max, label = 'هذا الحقل') =>
  !value || value.length <= max ? '' : `${label} يجب ألا يزيد عن ${max} حرفًا`

export const matches = (value, other, message = 'القيمتان غير متطابقتين') =>
  value === other ? '' : message

/** رقم جوال فلسطيني: 059/056 أو بصيغة دولية +970/+972 */
export const phone = (value) => {
  if (!value) return ''
  const cleaned = String(value).replace(/[\s-]/g, '')
  const pattern = /^(?:\+?97[02])?0?5[0-9]{8}$/
  return pattern.test(cleaned) ? '' : 'رقم الجوال غير صحيح'
}

/** الرقم الجامعي: أرقام فقط */
export const studentNumber = (value) => {
  if (!value) return ''
  return /^[0-9]{6,12}$/.test(String(value)) ? '' : 'الرقم الجامعي يجب أن يتكوّن من أرقام فقط'
}

/** قوة كلمة المرور — تُعيد { score: 0..4, label, checks } */
export function passwordStrength(value = '') {
  const checks = {
    length: value.length >= 8,
    lower: /[a-z]/.test(value),
    upper: /[A-Z]/.test(value),
    number: /[0-9]/.test(value),
    symbol: /[^A-Za-z0-9]/.test(value)
  }
  const passed = Object.values(checks).filter(Boolean).length
  const score = Math.min(4, Math.max(0, passed - 1))
  const labels = ['ضعيفة جدًا', 'ضعيفة', 'متوسطة', 'قوية', 'قوية جدًا']
  return { score, label: labels[score], checks }
}

export const strongPassword = (value) => {
  if (!value) return ''
  const { checks } = passwordStrength(value)
  if (!checks.length) return 'كلمة المرور يجب ألا تقل عن 8 أحرف'
  if (!checks.lower || !checks.upper) return 'كلمة المرور يجب أن تحتوي حرفًا كبيرًا وصغيرًا'
  if (!checks.number) return 'كلمة المرور يجب أن تحتوي رقمًا واحدًا على الأقل'
  return ''
}
