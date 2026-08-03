import {
  LayoutDashboard,
  UserCircle,
  Users,
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
