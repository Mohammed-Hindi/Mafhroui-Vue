// مسار اعتماد التقرير النهائي قبل الأرشفة: المشرف يوافق ← لجنة الإشراف تعتمد ← يُؤرشف المشروع
import api from '@/services/api'

export const REVIEW = {
  pending_supervisor: { label: 'بانتظار موافقة المشرف', short: 'بانتظار المشرف', tone: 'is-pending' },
  pending_committee: { label: 'بانتظار اعتماد لجنة الإشراف', short: 'بانتظار اللجنة', tone: 'is-pending' },
  approved: { label: 'معتمد ومؤرشف', short: 'مؤرشف', tone: 'is-approved' },
  rejected: { label: 'مرفوض — يحتاج إعادة رفع', short: 'مرفوض', tone: 'is-rejected' },
  none: { label: 'لم يُرفع التقرير النهائي', short: 'لم يُرفع التقرير', tone: '' }
}

/** من رفض التقرير: مراجعة اللجنة مسجّلة ← لجنة الإشراف، وإلا المشرف (الرفض يسجّل مرحلته) */
export const rejectedBy = (r) => (r?.committee_reviewed_at ? 'لجنة الإشراف' : 'المشرف')

/** آخر تقرير نهائي للمشروع (الأحدث رقمًا) */
export const latestReport = (project) => [...(project?.final_reports || [])].sort((a, b) => b.id - a.id)[0] || null

// POST /final-reports/{id}/review — الخادم يحدد المرحلة والصلاحية (المشرف ثم اللجنة)
export async function reviewReport(id, approve, note = null) {
  const { data } = await api.post(`/final-reports/${id}/review`, { decision: approve ? 'approve' : 'reject', note })
  return data.data || data
}
