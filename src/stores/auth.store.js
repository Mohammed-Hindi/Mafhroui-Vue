import { ref, computed } from 'vue'
import { defineStore } from 'pinia'
import api from '@/services/api'

/** حسابات تجريبية محلية بانتظار مستخدمين حقيقيين من الباك إند — تتجاوز /login فقط لهذه الأزواج بالذات (إيميل نفسه، كلمة سر مختلفة تحدد الدور) */
const DEMO_ACCOUNTS = [
  {
    email: 'admin@mashroui.local',
    password: 'Password123$',
    token: 'demo-token-committee',
    user: { id: 0, name: 'لجنة الإشراف', email: 'admin@mashroui.local', role: 'committee', must_change_password: false }
  },
  {
    email: 'admin@mashroui.local',
    password: 'anas1',
    token: 'demo-token-supervisor',
    user: { id: -1, name: 'د. محمد العتيبي', email: 'admin@mashroui.local', role: 'supervisor', must_change_password: false }
  },
  {
    email: 'admin@mashroui.local',
    password: 'anas2',
    token: 'demo-token-team-leader',
    user: { id: -2, name: 'admin anas', email: 'admin@mashroui.local', role: 'team_leader', must_change_password: false }
  }
]

export const useAuthStore = defineStore('auth', () => {
  const user = ref(JSON.parse(localStorage.getItem('user') || 'null'))
  const token = ref(localStorage.getItem('token') || null)
  const isLoading = ref(false)
  const error = ref('')

  const isAuthenticated = computed(() => !!token.value)
  const userRole = computed(() => user.value?.role || null)
  const userName = computed(() => user.value?.name || '')
  const userEmail = computed(() => user.value?.email || '')

  const hasRole = (roles) => {
    if (!roles || !roles.length) return true
    return roles.includes(user.value?.role)
  }

  const homeRoute = computed(() => {
    const role = user.value?.role
    switch (role) {
      case 'committee':
        return { name: 'committee-dashboard' }
      case 'supervisor':
        return { name: 'supervisor-dashboard' }
      case 'team_leader':
        return { name: 'team-leader-dashboard' }
      case 'student':
        return { name: 'student-dashboard' }
      default:
        return { name: 'login' }
    }
  })

  function persistSession(userData, userToken) {
    user.value = userData
    token.value = userToken
    if (userData) localStorage.setItem('user', JSON.stringify(userData))
    if (userToken) localStorage.setItem('token', userToken)
  }

  // POST /login | Response: { user, token }
  const login = async (credentials) => {
    isLoading.value = true
    error.value = ''
    const demo = DEMO_ACCOUNTS.find((d) => d.email === credentials.email && d.password === credentials.password)
    if (demo) {
      persistSession(demo.user, demo.token)
      isLoading.value = false
      return { user: demo.user, token: demo.token }
    }
    try {
      const response = await api.post('/login', credentials)
      persistSession(response.data.user, response.data.token)
      return response.data
    } catch (err) {
      error.value = err.normalized?.message || 'حدث خطأ أثناء تسجيل الدخول.'
      throw err
    } finally {
      isLoading.value = false
    }
  }

  // POST /invite/{token}/accept | Response: { user, token }
  const acceptInvite = async (inviteToken, credentials) => {
    isLoading.value = true
    error.value = ''
    try {
      const response = await api.post(`/invite/${inviteToken}/accept`, credentials)
      persistSession(response.data.user, response.data.token)
      return response.data
    } catch (err) {
      error.value = err.normalized?.message || 'تعذر تعيين كلمة المرور.'
      throw err
    } finally {
      isLoading.value = false
    }
  }
  // POST /me/change-password | يتطلب توكن صالح مسبقاً
  const changePassword = async (credentials) => {
    isLoading.value = true
    error.value = ''
    try {
      const response = await api.post('/me/change-password', credentials)
      if (user.value) {
        user.value = { ...user.value, must_change_password: false }
        localStorage.setItem('user', JSON.stringify(user.value))
      }
      return response.data
    } catch (err) {
      error.value = err.normalized?.message || 'تعذر تحديث كلمة المرور.'
      throw err
    } finally {
      isLoading.value = false
    }
}

  // GET /me | Response: user object مباشرة (بدون تغليف data)
  const fetchCurrentUser = async () => {
    if (!token.value) return null
    if (DEMO_ACCOUNTS.some((d) => d.token === token.value)) return user.value
    try {
      const response = await api.get('/me')
      user.value = response.data
      localStorage.setItem('user', JSON.stringify(response.data))
      return response.data
    } catch (err) {
      logout()
      return null
    }
  }

  // POST /logout
  const logout = async () => {
    try {
      if (token.value) await api.post('/logout')
    } catch (err) {
      // نتجاهل فشل الاتصال ونكمل تنظيف الجلسة محلياً بأي حال
    } finally {
      user.value = null
      token.value = null
      error.value = ''
      localStorage.removeItem('user')
      localStorage.removeItem('token')
      window.location.href = '/login'
    }
  }

  return {
    user,
    token,
    isLoading,
    error,
    isAuthenticated,
    userRole,
    userName,
    userEmail,
    homeRoute,
    login,
    logout,
    acceptInvite,
    changePassword,
    fetchCurrentUser,
    hasRole,
  }
})