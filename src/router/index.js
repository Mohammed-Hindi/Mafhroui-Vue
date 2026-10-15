import { createRouter, createWebHistory, START_LOCATION } from 'vue-router'
import { authGuard, titleGuard } from './guards'

import landingRoutes from './routes/landing.routes'
import authRoutes from './routes/auth.routes'
import superAdminRoutes from './routes/super-admin.routes'
import committeeRoutes from './routes/committee.routes'
import supervisorRoutes from './routes/supervisor.routes'
import studentRoutes from './routes/student.routes'

const routes = [
  ...landingRoutes,
  ...authRoutes,
  ...superAdminRoutes,
  ...committeeRoutes,
  ...supervisorRoutes,
  ...studentRoutes,
  {
    path: '/403',
    name: 'forbidden',
    component: () => import('@/views/ForbiddenPage.vue'),
    meta: { title: 'صلاحية غير كافية' }
  },
  {
    path: '/:pathMatch(.*)*',
    name: 'not-found',
    component: () => import('@/views/NotFoundPage.vue'),
    meta: { title: 'الصفحة غير موجودة' }
  }
]

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
  scrollBehavior(to, from, savedPosition) {
    // تحديث الصفحة يعيد دائمًا لأعلاها (الهيرو) حتى لو بقي #projects في الرابط أو موضع تمرير محفوظ
    if (from === START_LOCATION && performance.getEntriesByType('navigation')[0]?.type === 'reload') return { top: 0 }
    if (savedPosition) return savedPosition
    if (to.hash) return { el: to.hash, behavior: 'smooth' }
    return { top: 0 }
  }
})

router.beforeEach(authGuard)
router.afterEach(titleGuard)

// الصفحات تُحمَّل كسولًا؛ بعد أول دخول للوحة تُجلب صفحات نفس القسم وقت فراغ المتصفح فيبقى التنقّل بينها فوريًا
const prefetched = new Set()
router.afterEach((to) => {
  const section = to.matched[0]
  if (!section?.children?.length || prefetched.has(section.path)) return
  prefetched.add(section.path)
  const idle = window.requestIdleCallback || ((cb) => setTimeout(cb, 1500))
  idle(() => section.children.forEach((r) => typeof r.component === 'function' && r.component().catch(() => {})))
})

export default router
