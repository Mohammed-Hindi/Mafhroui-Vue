// مراسلات الإدارة (إعلانات وملفات) — مشتركة بين لوحة الإدارة وصندوق الإعلانات لكل الأدوار
import api, { sendEmail } from '@/services/api'

/** GET /announcements/attachments/{id}/download — تنزيل مرفق بالتوكن ثم حفظه باسمه الأصلي */
export async function downloadAttachment(att) {
  const { data } = await api.get(`/announcements/attachments/${att.id}/download`, { responseType: 'blob' })
  const url = URL.createObjectURL(data)
  const a = Object.assign(document.createElement('a'), { href: url, download: att.name })
  a.click()
  URL.revokeObjectURL(url)
}

export const CHANNELS = { platform: 'المنصة', whatsapp: 'واتساب', email: 'البريد' }

/**
 * قناتا واتساب والبريد (للأشخاص: أعضاء اللجنة والمشرفون): يرسل لكل من لديه رقم/بريد ويرجع ملاحظات بما تعذّر.
 * people: [{ id, name, whatsapp, email }]
 */
export async function notifyExternal(people, channels, subject, message) {
  const warnings = []
  if (channels.includes('whatsapp')) {
    const recipients = people.filter((p) => p.whatsapp).map((p) => ({ phone: p.whatsapp, name: p.name, user_id: p.id }))
    if (recipients.length) {
      await api.post('/whatsapp/send', { recipients, message, context: 'announcement' }).catch(() => warnings.push('تعذّر الإرسال عبر واتساب'))
    }
    if (recipients.length < people.length) warnings.push(`${people.length - recipients.length} بلا رقم واتساب`)
  }
  if (channels.includes('email')) {
    const withMail = people.filter((p) => p.email)
    const results = await Promise.allSettled(withMail.map((p) => sendEmail({ to: p.email, subject, message })))
    const failed = results.filter((r) => r.status === 'rejected').length
    if (failed) warnings.push(`تعذّر البريد لـ ${failed}`)
    if (withMail.length < people.length) warnings.push(`${people.length - withMail.length} بلا بريد`)
  }
  return warnings
}
