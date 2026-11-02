import LandingLayout from '@/layouts/LandingLayout.vue'

export default [
  {
    path: '/',
    component: LandingLayout,
    children: [
      {
        path: '',
        name: 'landing',
        component: () => import('@/views/landing/LandingPage.vue'),
        meta: {
          title: 'الرئيسية',
          description: 'مسار منصة إلكترونية موحّدة لإدارة مشاريع التخرج في الكلية الجامعية للعلوم التطبيقية: من الفكرة والمقترح وإدارة المهام حتى المناقشة وأرشيف المشاريع المميّزة.'
        }
      },
      {
        path: 'projects',
        name: 'projects-archive',
        component: () => import('@/views/landing/ProjectsArchivePage.vue'),
        meta: {
          title: 'المشاريع المميّزة',
          description: 'تصفّح أرشيف مشاريع التخرج المميّزة في الكلية الجامعية للعلوم التطبيقية مصنّفةً حسب الأقسام والتخصصات.'
        }
      },
      {
        path: 'about',
        name: 'about',
        component: () => import('@/views/landing/AboutPage.vue'),
        meta: {
          title: 'من نحن',
          description: 'تعرّف على منصة مسار: الرؤية والرسالة، قصة النشأة، التحديات التي تعالجها، وكيف تخدم العمادة ولجنة الإشراف والمشرفين والطلاب.'
        }
      },
      {
        path: 'team',
        name: 'team',
        component: () => import('@/views/landing/TeamPage.vue'),
        meta: {
          title: 'فريق التطوير',
          description: 'فريق تطوير منصة مسار من طلاب دبلوم تصميم وتطوير مواقع الويب في الكلية الجامعية للعلوم التطبيقية.'
        }
      },
      {
        path: 'projects/:id(\\d+)',
        name: 'project-showcase',
        component: () => import('@/views/landing/ProjectShowcasePage.vue'),
        props: true,
        meta: {
          title: 'عرض المشروع',
          description: 'تفاصيل مشروع تخرّج مميّز من أرشيف منصة مسار في الكلية الجامعية للعلوم التطبيقية.'
        }
      }
    ]
  }
]
