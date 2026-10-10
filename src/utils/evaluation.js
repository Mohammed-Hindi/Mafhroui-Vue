// نظام نماذج التقييم — ثوابت مشتركة بين صفحة التقييمات وورقة التقييم ومحرر النماذج

/** طريقة "مقياس تقديري": المستوى = نسبة من الدرجة القصوى للبند (تُحفظ كدرجة رقمية) */
export const SCALE = [
  { label: 'ممتاز', pct: 1 },
  { label: 'جيد جدًا', pct: 0.85 },
  { label: 'جيد', pct: 0.75 },
  { label: 'مقبول', pct: 0.65 },
  { label: 'ضعيف', pct: 0.5 }
]

export const METHODS = { points: 'درجات رقمية', scale: 'مقياس تقديري' }
export const SCOPES = { project: 'درجة مشتركة للمشروع', student: 'درجة لكل طالب' }
export const FORM_KINDS = { supervisor: 'المشرف', examiner: 'لجنة المناقشة' }

const GRADES = [[90, 'ممتاز'], [80, 'جيد جدًا'], [70, 'جيد'], [60, 'مقبول'], [0, 'راسب']]
export const grade = (score) => GRADES.find(([min]) => score >= min)[1]
export const gradeTone = (score) => (score >= 80 ? 'is-approved' : score >= 60 ? 'is-pending' : 'is-rejected')

/** الدرجة القصوى لطالب في نموذج = مجموع قصوى كل البنود */
export const formMax = (form) => form.sections.reduce((n, s) => n + s.items.reduce((m, i) => m + Number(i.max || 0), 0), 0)

/** مجموع طالب في تعبئة = بنود المشروع المشتركة + بنوده هو */
export function studentTotal(form, answers, studentId) {
  return form.sections.reduce((n, s) => n + s.items.reduce((m, i) => {
    const v = s.scope === 'project' ? answers.project?.[i.id]?.score : answers.students?.[studentId]?.[i.id]
    return m + (Number(v) || 0)
  }, 0), 0)
}

/** درجة رقمية ← أقرب مستوى في المقياس */
export const scaleOf = (score, max) => (score === '' || score == null ? '' : SCALE.reduce((best, l) => (Math.abs(l.pct * max - score) < Math.abs(best.pct * max - score) ? l : best)).pct)

export const newId = () => Math.random().toString(36).slice(2, 12)
