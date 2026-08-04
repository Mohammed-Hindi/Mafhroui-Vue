import {
  LayoutDashboard,
  UserCircle,
  Users,
  User,
  UserPlus,
  ClipboardList,
  ListTodo,
  CalendarDays,
  CalendarClock,
  FileCheck,
  TrendingUp,
  Bot
} from 'lucide-vue-next'
import { ROLES } from '@/utils/constants'

/** عناصر القائمة الجانبية لكل دور — مصدر واحد يستهلكه DashboardLayout */
export const NAV_ITEMS_BY_ROLE = {
  [ROLES.COMMITTEE]: [
    { label: 'لوحة التحكم', to: '/committee', icon: LayoutDashboard, exact: true },
    { label: 'الفرق', to: '/committee/teams', icon: Users },
    { label: 'الأعضاء', to: '/committee/members', icon: User },
    { label: 'المقترحات', to: '/committee/proposals', icon: ClipboardList },
    { label: 'أرشيف المشاريع', to: '/committee/project-archive', icon: FileCheck },
    { label: 'نسبة تقدّم المشاريع', to: '/committee/progress', icon: TrendingUp },
    { label: 'إضافة لجنة الإشراف', to: '/committee/add-committee', icon: UserPlus },
    { label: 'المساعد الآلي', to: '/committee/assistant', icon: Bot }
  ],

  [ROLES.SUPERVISOR]: [
    { label: 'لوحة المعلومات', to: '/supervisor', icon: LayoutDashboard, exact: true },
    { label: 'الملف الشخصي', to: '/supervisor/profile', icon: UserCircle },
    { label: 'الفرق', to: '/supervisor/teams', icon: Users },
    { label: 'المقترح / التقرير النهائي', to: '/supervisor/proposals', icon: ClipboardList },
    { label: 'المهام (Kanban)', to: '/supervisor/tasks', icon: ListTodo },
    { label: 'الاجتماعات', to: '/supervisor/meetings', icon: CalendarDays },
    { label: 'مواعيد المناقشات', to: '/supervisor/appointments', icon: CalendarClock },
    { label: 'أرشيف المشاريع', to: '/supervisor/project-archive', icon: FileCheck },
    { label: 'نسبة تقدّم الفرق', to: '/supervisor/progress', icon: TrendingUp },
    { label: 'المساعد الآلي', to: '/supervisor/assistant', icon: Bot }
  ]
}
