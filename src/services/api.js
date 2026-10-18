import axios from 'axios'
import { STORAGE_KEYS } from '@/utils/constants'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000/api',
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
})

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }

  const termId = localStorage.getItem(STORAGE_KEYS.SEMESTER)
  if (termId) {
    config.params = { ...config.params, term_id: termId }
  }

  return config
})

function normalizeError(error) {
  const data = error.response?.data

  return {
    status: error.response?.status ?? null,
    message: data?.message || 'حدث خطأ غير متوقع، حاول مرة أخرى.',
    errors: data?.errors || {},
  }
}

api.interceptors.response.use(
  (response) => response,
  (error) => {
    error.normalized = normalizeError(error)

    if (error.response) {
      if (error.response.status === 423) {
        window.location.href = '/change-password'
      } else if (
        error.response.status === 401 &&
        !error.config?.url?.includes('/login') &&
        !error.config?.url?.includes('/invite')
      ) {
        localStorage.removeItem('token')
        localStorage.removeItem('user')
        localStorage.removeItem(STORAGE_KEYS.SEMESTER)
        if (!error.config?.url?.includes('/logout')) {
          window.location.href = '/login'
        }
      }
    }

    return Promise.reject(error)
  },
)

export const sendEmail = ({ to, subject, message }) => api.post('/email/send', { to, subject, message })

// تطبيع رقم الواتساب لصيغة الـ API (970/972 + رقم المحمول). يُرجِع '' إن تعذّر.
export const normalizeWhats = (raw) => {
  const digits = String(raw || '').replace(/\D/g, '')
  if (!digits) return ''
  const full = digits.startsWith('970') || digits.startsWith('972') ? digits : `970${digits.replace(/^0+/, '')}`
  return /^(970|972)5\d{8}$/.test(full) ? full : ''
}

// إرسال رسالة واتساب عبر الويب هوك (القناة التلقائية) — مستلم واحد أو قائمة.
// يتجاهل الأرقام غير الصالحة ويرسل الباقي؛ يُرجِع عدد الرسائل المُدرَجة بالطابور.
export const sendWhatsapp = async (recipients, message, context = 'reminder') => {
  const list = (Array.isArray(recipients) ? recipients : [recipients])
    .map((r) => ({ phone: normalizeWhats(r.phone ?? r.whats ?? r.whatsapp), name: r.name || undefined, user_id: r.user_id ?? r.id ?? undefined }))
    .filter((r) => r.phone)
  if (!list.length) return { queued: 0, delivery_ids: [] }
  const { data } = await api.post('/whatsapp/send', { recipients: list, message, context })
  return data
}

export default api