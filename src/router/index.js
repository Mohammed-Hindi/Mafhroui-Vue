import { createRouter, createWebHistory } from 'vue-router'
import { authGuard, titleGuard } from './guards'

import landingRoutes from './routes/landing.routes'
import authRoutes from './routes/auth.routes'
import superAdminRoutes from './routes/super-admin.routes'
import committeeRoutes from './routes/committee.routes'
import supervisorRoutes from './routes/supervisor.routes'
import teamLeaderRoutes from './routes/team-leader.routes'
import studentRoutes from './routes/student.routes'

const routes = [
  ...landingRoutes,
  ...authRoutes,
  ...superAdminRoutes,
  ...committeeRoutes,
  ...supervisorRoutes,
  ...teamLeaderRoutes,
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
    if (savedPosition) return savedPosition
    if (to.hash) return { el: to.hash, behavior: 'smooth' }
    return { top: 0 }
  }
})

router.beforeEach(authGuard)
router.afterEach(titleGuard)

export default router
