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

export default api