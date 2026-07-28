import StudentLayout from '@/layouts/StudentLayout.vue'
import { ROLES } from '@/utils/constants'

/** مسارات لوحة الطالب — تُضاف صفحة بصفحة حسب الوصف */
export default [
  {
    path: '/student',
    component: StudentLayout,
    meta: { requiresAuth: true, roles: [ROLES.STUDENT] },
    children: [
      {
        path: '',
        name: 'student-dashboard',
        component: () => import('@/views/student/DashboardPage.vue'),
        meta: { title: 'لوحة الطالب' }
      }
      // تُضاف بقية الصفحات هنا وقت وصفها
    ]
  }
]
