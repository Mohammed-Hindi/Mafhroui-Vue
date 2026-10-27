import { defineStore } from 'pinia'
import api from '@/services/api'

/**
 * المناقشون الخارجيون الدائمون ومجمَّع الاختيار لجدول المناقشة.
 * لجنة المناقشة تُخزَّن نصًّا في discussion.committee؛ هذا المتجر مصدر الأسماء الجاهزة فقط.
 */
export const useExaminersStore = defineStore('examiners', () => {
  // GET /examiners/pool — كل المشرفين واللجان + المناقشين الخارجيين، مع استثناء مشرف المشروع
  const fetchExaminerPool = async (excludeSupervisorId = null) => {
    const params = excludeSupervisorId ? { exclude_supervisor_id: excludeSupervisorId } : {}
    const { data } = await api.get('/examiners/pool', { params })
    return data
  }

  // POST /examiners — إضافة مناقش خارجي جديد (يبقى متاحًا بالقائمة لاحقًا)
  const createExaminer = async (payload) => {
    const { data } = await api.post('/examiners', payload)
    return data
  }

  return { fetchExaminerPool, createExaminer }
})
