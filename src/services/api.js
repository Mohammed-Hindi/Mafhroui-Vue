import axios from 'axios'

const api = axios.create({
  baseURL: 'http://23.95.13.99/api',
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
        if (!error.config?.url?.includes('/logout')) {
          window.location.href = '/login'
        }
      }
    }

    return Promise.reject(error)
  },
)

export default api