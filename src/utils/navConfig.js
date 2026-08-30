import {
  LayoutDashboard,
  UserCircle,
  Users,
  User,
  UserPlus,
  ShieldCheck,
  ClipboardList,
  ListTodo,
  CalendarDays,
  CalendarClock,
  FileCheck,
  TrendingUp,
  Bot,
  Building2
} from 'lucide-vue-next'
import { ROLES } from '@/utils/constants'

/** عناصر القائمة الجانبية لكل دور — مصدر واحد يستهلكه DashboardLayout */
export const NAV_ITEMS_BY_ROLE = {
  [ROLES.SUPER_ADMIN]: [
    {
      title: 'الإدارة العامة',
      items: [
        { label: 'الأعضاء وبيانات الدخول', to: '/super-admin', icon: UserPlus, exact: true },
        { label: 'لجنة الإشراف', to: '/super-admin/committee', icon: ShieldCheck },
        { label: 'الأقسام والفصول الدراسية', to: '/super-admin/structure', icon: Building2 }
      ]
    },
    {
      title: 'أدوات لجنة الإشراف',
      items: [
        { label: 'لوحة التحكم', to: '/committee', icon: LayoutDashboard, exact: true },
        { label: 'الفرق', to: '/committee/teams', icon: Users },
        { label: 'الطلاب والمشرفين', to: '/committee/members', icon: User },
        { label: 'المقترحات', to: '/committee/proposals', icon: ClipboardList },
        { label: 'مواعيد المناقشات', to: '/committee/appointments', icon: CalendarClock },
        { label: 'أرشيف المشاريع', to: '/committee/project-archive', icon: FileCheck },
        { label: 'تقدّم المشاريع', to: '/committee/progress', icon: TrendingUp },
        { label: 'المساعد الآلي', to: '/committee/assistant', icon: Bot }
      ]
    }
  ],

  [ROLES.COMMITTEE]: [
    { label: 'لوحة التحكم', to: '/committee', icon: LayoutDashboard, exact: true },
    { label: 'الفرق', to: '/committee/teams', icon: Users },
    { label: 'الأعضاء', to: '/committee/members', icon: User },
    { label: 'المقترحات', to: '/committee/proposals', icon: ClipboardList },
    { label: 'مواعيد المناقشات', to: '/committee/appointments', icon: CalendarClock },
    { label: 'أرشيف المشاريع', to: '/committee/project-archive', icon: FileCheck },
    { label: 'نسبة تقدّم المشاريع', to: '/committee/progress', icon: TrendingUp },
    { label: 'المساعد الآلي', to: '/committee/assistant', icon: Bot }
  ],

  [ROLES.SUPERVISOR]: [
    { label: 'الملف الشخصي', to: '/supervisor', icon: UserCircle, exact: true },
    { label: 'الفرق', to: '/supervisor/teams', icon: Users },
    { label: 'المقترح / التقرير النهائي', to: '/supervisor/proposals', icon: ClipboardList },
    { label: 'المهام (Kanban)', to: '/supervisor/tasks', icon: ListTodo },
    { label: 'الاجتماعات', to: '/supervisor/meetings', icon: CalendarDays },
    { label: 'مواعيد المناقشات', to: '/supervisor/appointments', icon: CalendarClock },
    { label: 'أرشيف المشاريع', to: '/supervisor/project-archive', icon: FileCheck },
    { label: 'نسبة تقدّم الفرق', to: '/supervisor/progress', icon: TrendingUp },
    { label: 'المساعد الآلي', to: '/supervisor/assistant', icon: Bot }
  ],

  [ROLES.TEAM_LEADER]: [
    { label: 'الملف الشخصي', to: '/team-leader', icon: UserCircle, exact: true },
    { label: 'المقترح / التقرير النهائي', to: '/team-leader/proposal', icon: ClipboardList },
    { label: 'المساعد الآلي', to: '/team-leader/assistant', icon: Bot },
    { label: 'المهام (Kanban)', to: '/team-leader/tasks', icon: ListTodo },
    { label: 'الاجتماعات', to: '/team-leader/meetings', icon: CalendarDays }
  ],

  [ROLES.STUDENT]: [
    { label: 'الملف الشخصي', to: '/student', icon: UserCircle, exact: true },
    { label: 'المقترح / التقرير النهائي', to: '/student/proposal', icon: ClipboardList },
    { label: 'المساعد الآلي', to: '/student/assistant', icon: Bot },
    { label: 'المهام (Kanban)', to: '/student/tasks', icon: ListTodo },
    { label: 'الاجتماعات', to: '/student/meetings', icon: CalendarDays }
  ]
}
