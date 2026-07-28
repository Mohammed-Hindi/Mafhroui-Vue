/** أدوار المستخدمين — المصدر الوحيد للحقيقة، تُستخدم بالراوتر والـ guards والـ stores */
export const ROLES = {
  SUPER_ADMIN: 'super_admin',
  COMMITTEE: 'committee',
  SUPERVISOR: 'supervisor',
  TEAM_LEADER: 'team_leader',
  STUDENT: 'student'
}

/** التسمية العربية المعروضة لكل دور */
export const ROLE_LABELS = {
  [ROLES.SUPER_ADMIN]: 'السوبر أدمن',
  [ROLES.COMMITTEE]: 'لجنة الإشراف',
  [ROLES.SUPERVISOR]: 'المشرف',
  [ROLES.TEAM_LEADER]: 'قائد الفريق',
  [ROLES.STUDENT]: 'الطالب'
}

/** الصفحة الرئيسية لكل دور — يُوجَّه إليها بعد تسجيل الدخول */
export const ROLE_HOME_ROUTE = {
  [ROLES.SUPER_ADMIN]: '/super-admin',
  [ROLES.COMMITTEE]: '/committee',
  [ROLES.SUPERVISOR]: '/supervisor',
  [ROLES.TEAM_LEADER]: '/team-leader',
  [ROLES.STUDENT]: '/student'
}

/** مفاتيح التخزين المحلي */
export const STORAGE_KEYS = {
  TOKEN: 'gp_token',
  USER: 'gp_user',
  SEMESTER: 'gp_active_semester',
  THEME: 'gp_theme'
}

/** نقطة تحوّل الشريط الجانبي من ثابت إلى Drawer */
export const SIDEBAR_BREAKPOINT = 1024

export const PAGE_SIZE_OPTIONS = [10, 25, 50, 100]
export const DEFAULT_PAGE_SIZE = 10

/** بيانات التواصل المعروضة باللاندنج والتذييل */
export const CONTACT = {
  EMAIL: 'academy@ucas.edu.ps',
  PHONE: '0597 302 452',
  PHONE_RAW: '+970597302452',
  ADDRESS: 'فلسطين - غزة'
}
