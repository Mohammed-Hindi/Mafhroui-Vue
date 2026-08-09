import AuthLayout from '@/layouts/AuthLayout.vue'

export default [
  {
    path: '/',
    component: AuthLayout,
    meta: { guestOnly: true },
    children: [
      {
        path: 'login',
        name: 'login',
        component: () => import('@/views/auth/LoginPage.vue'),
        meta: { title: 'تسجيل الدخول', guestOnly: true }
      },
      {
        path: 'forgot-password',
        name: 'forgot-password',
        component: () => import('@/views/auth/ForgotPasswordPage.vue'),
        meta: { title: 'استعادة كلمة المرور', guestOnly: true }
      },
      {
        path: 'reset-password',
        name: 'reset-password',
        component: () => import('@/views/auth/ResetPasswordPage.vue'),
        meta: { title: 'تعيين كلمة مرور جديدة', guestOnly: true }
      },
      {
        path: 'change-password',
        name: 'change-password',
        component: () => import('@/views/auth/ChangePasswordPage.vue'),
        meta: { title: 'تغيير كلمة المرور', guestOnly: false, requiresAuth: true }
      }
    ]
  }
]
