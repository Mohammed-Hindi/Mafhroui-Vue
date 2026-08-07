import DashboardLayout from '@/layouts/DashboardLayout.vue'
import { ROLES } from '@/utils/constants'

// استيراد مباشر (بدون lazy) — تنقّل فوري بين صفحات لوحة التحكم بلا أي تأخير تحميل
import ProfilePage from '@/views/team-leader/ProfilePage.vue'
import ProposalPage from '@/views/team-leader/ProposalPage.vue'
import TasksPage from '@/views/team-leader/TasksPage.vue'
import MeetingsPage from '@/views/team-leader/MeetingsPage.vue'
import AssistantPage from '@/views/team-leader/AssistantPage.vue'

/** مسارات لوحة قائد الفريق — تُضاف صفحة بصفحة حسب الوصف */
export default [
  {
    path: '/team-leader',
    component: DashboardLayout,
    meta: { requiresAuth: true, roles: [ROLES.TEAM_LEADER] },
    children: [
      {
        path: '',
        name: 'team-leader-dashboard',
        component: ProfilePage,
        meta: { title: 'الملف الشخصي' }
      },
      {
        path: 'proposal',
        name: 'team-leader-proposal',
        component: ProposalPage,
        meta: { title: 'المقترح / التقرير النهائي' }
      },
      {
        path: 'tasks',
        name: 'team-leader-tasks',
        component: TasksPage,
        meta: { title: 'المهام (Kanban)' }
      },
      {
        path: 'meetings',
        name: 'team-leader-meetings',
        component: MeetingsPage,
        meta: { title: 'الاجتماعات' }
      },
      {
        path: 'assistant',
        name: 'team-leader-assistant',
        component: AssistantPage,
        meta: { title: 'المساعد الآلي' }
      }
    ]
  }
]
