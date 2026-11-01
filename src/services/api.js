import axios from 'axios'
import { STORAGE_KEYS } from '@/utils/constants'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000/api',
  // مهلة لكل طلب حتى لا يتعلّق الاتصال إلى ما لا نهاية عند تعثّر الخادم
  timeout: 20000,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
})

// إعادة المحاولة على الأعطال المؤقتة: بوّابة/خدمة غير متاحة/مهلة، أو انقطاع شبكة.
// تقتصر على GET (آمنة التكرار) مع تراجع أُسّي وقليل من العشوائية، واحترام Retry-After.
const RETRY_STATUSES = [408, 425, 429, 502, 503, 504]
const MAX_RETRIES = 2

function shouldRetry(error) {
  const config = error.config
  if (!config || config.__noRetry) return false
  if ((config.method || 'get').toLowerCase() !== 'get') return false
  if ((config.__retryCount || 0) >= MAX_RETRIES) return false
  // انقطاع شبكة/مهلة (بلا استجابة) أو حالة مؤقتة معروفة
  if (!error.response) return error.code !== 'ERR_CANCELED'
  return RETRY_STATUSES.includes(error.response.status)
}

function retryDelay(attempt, error) {
  const retryAfter = Number(error.response?.headers?.['retry-after'])
  if (retryAfter > 0) return Math.min(retryAfter * 1000, 5000)
  return 400 * 2 ** attempt + Math.random() * 200 // ‎400‎→‎800‎ms تقريبًا + عشوائية
}

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
  async (error) => {
    // عطل مؤقت على طلب GET: انتظر ثم أعد المحاولة قبل اعتباره فشلًا
    if (shouldRetry(error)) {
      const config = error.config
      config.__retryCount = (config.__retryCount || 0) + 1
      await new Promise((resolve) => setTimeout(resolve, retryDelay(config.__retryCount - 1, error)))
      return api(config)
    }

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