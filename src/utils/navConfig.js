import {
  LayoutDashboard,
  Users,
  UserPlus,
  ClipboardList,
  ListTodo,
  CalendarDays,
  CalendarClock,
  FileCheck,
  TrendingUp,
  Bot,
  Building2,
  Megaphone,
  KeyRound,
  ClipboardCheck,
  LifeBuoy
} from 'lucide-vue-next'
import { ROLES } from '@/utils/constants'

/** عناصر القائمة الجانبية لكل دور — مصدر واحد يستهلكه DashboardLayout */
export const NAV_ITEMS_BY_ROLE = {
  // color: لون الأيقونة الخطية — من ألوان أيقونات عمادات الكلية (هوية UCAS، راجعي docs/design/UCAS_DESIGN_SYSTEM.md)
  [ROLES.SUPER_ADMIN]: [
    {
      title: 'الإدارة العامة',
      items: [
        { label: 'إدارة الأعضاء', to: '/super-admin', icon: UserPlus, exact: true, color: '#3A9B4C' },
        { label: 'إرسال بيانات الدخول', to: '/super-admin/credentials', icon: KeyRound },
        { label: 'الأقسام والفصول الدراسية', to: '/super-admin/structure', icon: Building2, color: '#229791' }
      ]
    },
    {
      title: 'أدوات لجنة الإشراف',
      items: [
        { label: 'الرئيسية', to: '/committee', icon: LayoutDashboard, exact: true, color: '#005BAA' },
        { label: 'المجموعات', to: '/committee/teams', icon: Users, color: '#A9375C' },
        { label: 'المقترحات', to: '/committee/proposals', icon: ClipboardList, color: '#F89E32' },
        { label: 'التكليفات والإعلانات', to: '/super-admin/assignments', icon: Megaphone },
        { label: 'مواعيد المناقشات', to: '/committee/appointments', icon: CalendarClock, color: '#009ADC' },
        { label: 'التقييمات', to: '/super-admin/evaluations', icon: ClipboardCheck },
        { label: 'أرشيف المشاريع', to: '/committee/project-archive', icon: FileCheck, color: '#805C55' },
        { label: 'تقدّم المشاريع', to: '/committee/progress', icon: TrendingUp, color: '#62BB46' },
        { label: 'الشكاوى والملاحظات', to: '/super-admin/tickets', icon: LifeBuoy },
        { label: 'المساعد الآلي', to: '/committee/assistant', icon: Bot, color: '#233B77' }
      ]
    }
  ],

  // لجنة الإشراف: قائمة واحدة بلا عناوين — أدوات اللجنة (كالإدارة العامة) ثم ما يصل العضو من مهام وإعلانات
  [ROLES.COMMITTEE]: [
    { label: 'الرئيسية', to: '/committee', icon: LayoutDashboard, exact: true, color: '#005BAA' },
    { label: 'المجموعات', to: '/committee/teams', icon: Users, color: '#A9375C' },
    { label: 'المقترحات', to: '/committee/proposals', icon: ClipboardList, color: '#F89E32' },
    { label: 'التكليفات والإعلانات', to: '/committee/assignments', icon: Megaphone },
    { label: 'مواعيد المناقشات', to: '/committee/appointments', icon: CalendarClock, color: '#009ADC' },
    { label: 'التقييمات', to: '/committee/evaluations', icon: ClipboardCheck },
    { label: 'أرشيف المشاريع', to: '/committee/project-archive', icon: FileCheck, color: '#805C55' },
    { label: 'تقدّم المشاريع', to: '/committee/progress', icon: TrendingUp, color: '#62BB46' },
    { label: 'الشكاوى والملاحظات', to: '/committee/tickets', icon: LifeBuoy },
    { label: 'مهامي', to: '/committee/my-tasks', icon: ListTodo },
    { label: 'الإعلانات والملفات', to: '/committee/announcements', icon: Megaphone },
    { label: 'المساعد الآلي', to: '/committee/assistant', icon: Bot, color: '#233B77' }
  ],

  // أسماء الصفحات وترتيبها مطابقة للإدارة العامة (المرجع)، مع صفحات المشرف الخاصة (المهام، الاجتماعات)
  [ROLES.SUPERVISOR]: [
    { label: 'الرئيسية', to: '/supervisor', icon: LayoutDashboard, exact: true },
    { label: 'المجموعات', to: '/supervisor/teams', icon: Users },
    { label: 'المقترحات', to: '/supervisor/proposals', icon: ClipboardList },
    { label: 'التكليفات والإعلانات', to: '/supervisor/assignments', icon: Megaphone },
    { label: 'المهام', to: '/supervisor/tasks', icon: ListTodo },
    { label: 'مواعيد المناقشات', to: '/supervisor/appointments', icon: CalendarClock },
    { label: 'التقييمات', to: '/supervisor/evaluations', icon: ClipboardCheck },
    { label: 'أرشيف المشاريع', to: '/supervisor/project-archive', icon: FileCheck },
    { label: 'تقدّم المشاريع', to: '/supervisor/progress', icon: TrendingUp },
    { label: 'الاجتماعات', to: '/supervisor/meetings', icon: CalendarDays },
    { label: 'مهامي', to: '/supervisor/my-tasks', icon: ListTodo },
    { label: 'الإعلانات والملفات', to: '/supervisor/announcements', icon: Megaphone },
    { label: 'المساعد الآلي', to: '/supervisor/assistant', icon: Bot }
  ],

  // ترتيب عمل الطالب: المهام (الصفحة الأولى) ← المقترحات ← الاجتماعات ← الوارد ← الشكاوى ← المساعد. "بياناتي" في قائمة الاسم
  // الطالب: مجموعة "أدوات الطالب" (عمل المشروع)، وتحتها باقي الصفحات بلا عنوان
  [ROLES.STUDENT]: [
    {
      title: 'أدوات الطالب',
      items: [
        { label: 'المهام', to: '/student/tasks', icon: ListTodo },
        { label: 'المقترحات', to: '/student/proposal', icon: ClipboardList },
        { label: 'الاجتماعات', to: '/student/meetings', icon: CalendarDays },
        { label: 'الإعلانات والملفات', to: '/student/announcements', icon: Megaphone }
      ]
    },
    {
      items: [
        { label: 'الشكاوى والملاحظات', to: '/student/tickets', icon: LifeBuoy },
        { label: 'المساعد الآلي', to: '/student/assistant', icon: Bot }
      ]
    }
  ]
}
