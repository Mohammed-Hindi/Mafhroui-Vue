import { useAuthStore } from '@/stores/auth.store'
import { ROLE_HOME_ROUTE, APP_NAME, APP_DESCRIPTION, SITE_URL } from '@/utils/constants'

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
    return auth.homeRoute
  }

  if (to.meta.requiresAuth && !auth.isAuthenticated) {
    return { name: 'login', query: { redirect: to.fullPath } }
  }

  if (to.meta.roles?.length && !auth.hasRole(to.meta.roles)) {
    return { name: 'forbidden' }
  }

  return true
}

/** يضبط/ينشئ وسم meta ويحدّث محتواه (name أو property) */
function setMeta(key, content, attr = 'name') {
  if (typeof document === 'undefined') return
  let el = document.head.querySelector(`meta[${attr}="${key}"]`)
  if (!el) {
    el = document.createElement('meta')
    el.setAttribute(attr, key)
    document.head.appendChild(el)
  }
  el.setAttribute('content', content)
}

/** يضبط رابط canonical للصفحة الحالية */
function setCanonical(url) {
  if (typeof document === 'undefined') return
  let el = document.head.querySelector('link[rel="canonical"]')
  if (!el) {
    el = document.createElement('link')
    el.setAttribute('rel', 'canonical')
    document.head.appendChild(el)
  }
  el.setAttribute('href', url)
}

/**
 * SEO لكل صفحة: العنوان والوصف وcanonical ووسوم Open Graph، مع منع أرشفة
 * الصفحات الخاصة (لوحات التحكم وصفحات المصادقة) عبر robots=noindex.
 */
export function seoGuard(to) {
  const appName = import.meta.env.VITE_APP_NAME || APP_NAME
  const title = to.meta.title ? `${to.meta.title} · ${appName}` : `${appName} — ${APP_DESCRIPTION}`
  const description = to.meta.description || `${appName} — ${APP_DESCRIPTION} في الكلية الجامعية للعلوم التطبيقية.`
  const url = SITE_URL + (to.path === '/' ? '/' : to.path)
  const isPrivate = Boolean(to.meta.requiresAuth || to.meta.guestOnly || to.meta.noindex)

  document.title = title
  setMeta('description', description)
  setMeta('robots', isPrivate ? 'noindex, nofollow' : 'index, follow')
  setCanonical(url)
  setMeta('og:title', title, 'property')
  setMeta('og:description', description, 'property')
  setMeta('og:url', url, 'property')
  setMeta('twitter:title', title)
  setMeta('twitter:description', description)
}

export { ROLE_HOME_ROUTE }
