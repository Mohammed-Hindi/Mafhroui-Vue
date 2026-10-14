// ponytail: بيانات تجريبية للوحة الطالب — تُعرض فقط حين لا توجد بيانات فعلية للصفحة (أرقام سالبة لتمييزها،
// وأي تفاعل معها محلي بلا طلبات). تُحذف عند توفر بيانات فعلية كافية للطلاب.

const at = (days, hour = 10) => {
  const d = new Date()
  d.setDate(d.getDate() + days)
  d.setHours(hour, 0, 0, 0)
  return d.toISOString()
}
const day = (days) => at(days).slice(0, 10)

export const isPlaceholder = (item) => Number(item?.id) < 0

/** مهام الفريق */
export const placeholderTasks = () => [
  { id: -1, title: 'كتابة الفصل الأول من التقرير', description: 'المقدمة، مشكلة البحث، الأهداف، وحدود المشروع.', status: 'done', due_date: day(-6), assignees: [] },
  { id: -2, title: 'تصميم قاعدة البيانات', description: 'مخطط ERD للجداول الأساسية والعلاقات بينها.', status: 'review', due_date: day(-1), assignees: [] },
  { id: -3, title: 'بناء واجهة تسجيل الدخول', description: 'صفحة الدخول واستعادة كلمة المرور مع التحقق من الحقول.', status: 'in_progress', due_date: day(3), assignees: [] },
  { id: -4, title: 'ربط الواجهة بالـ API', description: 'استدعاء خدمات المستخدمين والمهام وعرض النتائج.', status: 'in_progress', due_date: day(6), assignees: [] },
  { id: -5, title: 'تجهيز النظام للمناقشة', description: 'نسخة مستقرة من النظام ببيانات تجريبية جاهزة للمناقشة.', status: 'pending', due_date: day(14), assignees: [] }
]

/** مهام المشرف من الإدارة العامة أو لجنة الإشراف (صفحة "مهامي" حين لا توجد مهام بعد) */
export const placeholderStaffTasks = () => [
  { id: -101, title: 'رفع تقييمات المجموعات', description: 'إدخال درجات المشرف لكل طالب في نموذج التقييم قبل موعد المناقشات.', status: 'in_progress', due_date: day(5), created_by: { name: 'لجنة الإشراف', role: 'committee' } },
  { id: -102, title: 'اعتماد مقترحات المجموعات', description: 'مراجعة مقترحات المشاريع المعلّقة واعتمادها أو طلب تعديلها.', status: 'pending', due_date: day(3), created_by: { name: 'الإدارة العامة', role: 'super_admin' } },
  { id: -103, title: 'متابعة المجموعات المتأخرة', description: 'التواصل مع المجموعات ذات الإنجاز المنخفض ووضع خطة استدراك.', status: 'review', due_date: day(1), created_by: { name: 'لجنة الإشراف', role: 'committee' } },
  { id: -104, title: 'تحديث بيانات المشاريع', description: 'التأكد من أسماء المشاريع وأنواعها لكل مجموعة.', status: 'done', due_date: day(-4), created_by: { name: 'الإدارة العامة', role: 'super_admin' } }
]

/** اجتماعات الفريق مع المشرف */
export const placeholderMeetings = () => [
  { id: -11, title: 'متابعة تقدّم الفصل الثاني', scheduled_at: at(2, 11), google_meet_link: '', notes: 'تجهيز ما تم إنجازه من التصميم والأسئلة العالقة.' },
  { id: -12, title: 'مراجعة تصميم قاعدة البيانات', scheduled_at: at(9, 12), google_meet_link: '', notes: '' },
  { id: -13, title: 'اجتماع الانطلاق وتوزيع المهام', scheduled_at: at(-12, 10), google_meet_link: '', notes: 'تم الاتفاق على خطة العمل ومواعيد التسليم.' },
  { id: -14, title: 'مناقشة ملاحظات المقترح', scheduled_at: at(-5, 13), google_meet_link: '', notes: 'تعديل نطاق المشروع حسب ملاحظات المشرف.' }
]

const ADMIN = { id: -100, name: 'الإدارة العامة', role: 'super_admin' }
const SUP = { id: -101, name: 'مشرف المجموعة', role: 'supervisor' }

/** إعلانات وملفات واردة للطالب */
export const placeholderAnnouncements = () => [
  { id: -21, type: 'announcement', title: 'موعد تسليم المقترح', body: 'آخر موعد لتسليم ملف المقترح على المنصة نهاية الأسبوع الحالي.', author: ADMIN, created_at: at(-1, 9) },
  { id: -22, type: 'announcement', title: 'اجتماع الفريق الأسبوعي', body: 'نلتقي يوم الأحد الساعة 11:00 لمراجعة ما تم إنجازه.', author: SUP, created_at: at(-2, 14) },
  { id: -23, type: 'file', title: 'دليل كتابة التقرير النهائي', body: 'النموذج المعتمد لتنسيق التقرير النهائي وفصوله.', author: ADMIN, created_at: at(-4, 10), attachments: [{ id: -231, name: 'دليل-التقرير-النهائي.pdf', size: 512000 }] }
]

/** تذاكر الشكاوى والملاحظات */
export const placeholderTickets = () => [
  {
    id: -31, subject: 'استفسار عن موعد المناقشة', status: 'closed', user_id: -1, replies_count: 2, created_at: at(-3, 9), last_reply_at: at(-2, 12),
    replies: [
      { id: -311, body: 'متى يتم الإعلان عن جدول المناقشات؟', user: { id: -1, name: 'أنت' }, created_at: at(-3, 9) },
      { id: -312, body: 'يُعلن الجدول بعد اعتماد التقارير النهائية، وسيصلك إشعار على المنصة.', user: { id: -100, name: 'الإدارة العامة' }, created_at: at(-2, 12) }
    ]
  }
]

/** بيانات مجموعة تجريبية للملف التعريفي */
export const placeholderGroup = () => ({
  section: '101',
  name: 'فريق تجريبي',
  members: [{ id: -41 }, { id: -42 }, { id: -43 }],
  supervisor: { id: -101, name: 'مشرف المجموعة', whatsapp: '' },
  teammates: [{ id: -42, name: 'زميل أول', region: 'gaza' }, { id: -43, name: 'زميل ثانٍ', region: 'south' }]
})
