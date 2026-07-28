import { useAuthStore } from '@/stores/auth.store'
import { ROLE_HOME_ROUTE } from '@/utils/constants'

/**
 * حارس عام واحد يغطي:
 * - requiresAuth: منع الدخول بدون توكن
 * - roles: منع دور من دخول لوحة دور آخر
 * - guestOnly: منع مستخدم مسجّل من رؤية صفحات المصادقة
 */
export async function authGuard(to) {
  const auth = useAuthStore()

  // استعادة بيانات المستخدم بعد إعادة تحميل الصفحة
  if (auth.token && !auth.user) {
    await auth.fetchCurrentUser()
  }

  if (to.meta.guestOnly && auth.isAuthenticated) {
    return { path: auth.homeRoute }
  }

  if (to.meta.requiresAuth && !auth.isAuthenticated) {
    return { name: 'login', query: { redirect: to.fullPath } }
  }

  if (to.meta.roles?.length && !auth.hasRole(to.meta.roles)) {
    return { name: 'forbidden' }
  }

  return true
}

/** عنوان التبويب لكل صفحة */
export function titleGuard(to) {
  const appName = import.meta.env.VITE_APP_NAME || 'منصة إدارة مشاريع التخرج'
  document.title = to.meta.title ? `${to.meta.title} · ${appName}` : appName
}

export { ROLE_HOME_ROUTE }
