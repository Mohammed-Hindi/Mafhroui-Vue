import { ref } from 'vue'
import { defineStore } from 'pinia'

function today() {
  return new Date().toLocaleDateString('en-CA')
}

/** بيانات ثابتة — بانتظار GET /committee/deleted-members */
const SEED_STUDENTS = [
  { id: 901, grp: '31', name: 'خالد الغامدي', uid: '3175030', whats: '0551110021', mail: 'student21@academy.edu.sa', pw: 'Kg#4mPz1', deleteReason: 'انسحب الطالب من الفصل الدراسي.', deletedAt: '2026-06-02' },
  { id: 902, grp: '52', name: 'نايف الشهري', uid: '3175031', whats: '0551110022', mail: 'student22@academy.edu.sa', pw: 'Nf#8kRt3', deleteReason: 'تكرار حساب — تم إنشاؤه مرتين بالخطأ.', deletedAt: '2026-06-10' },
  { id: 903, grp: '54', name: 'وليد العتيبي', uid: '3175032', whats: '0551110023', mail: 'student23@academy.edu.sa', pw: 'Wa#2nQx7', deleteReason: 'نقل إلى فريق آخر خارج القسم.', deletedAt: '2026-06-15' },
  { id: 904, grp: '31', name: 'فهد الزهراني', uid: '3175033', whats: '0551110024', mail: 'student24@academy.edu.sa', pw: 'Fh#9jLm5', deleteReason: 'إيقاف قيد أكاديمي.', deletedAt: '2026-07-01' },
  { id: 905, grp: '52', name: 'تركي الحارثي', uid: '3175034', whats: '0551110025', mail: 'student25@academy.edu.sa', pw: 'Tr#6wDs2', deleteReason: 'طلب حذف شخصي من الطالب.', deletedAt: '2026-07-08' }
]
const SEED_SUPERVISORS = [
  { id: 991, name: 'د. بندر القرني', empId: 'EMP1010', whats: '966501110021', mail: 'b.alqarni@academy.edu.sa', pw: 'Bq#3rTy8', deleteReason: 'انتهاء التعاقد مع الأكاديمية.', deletedAt: '2026-05-20' },
  { id: 992, name: 'د. منى الدوسري', empId: 'EMP1011', whats: '966501110022', mail: 'm.aldosari2@academy.edu.sa', pw: 'Md#7uIo4', deleteReason: 'نقل إلى قسم آخر.', deletedAt: '2026-06-05' },
  { id: 993, name: 'د. سامي الجهني', empId: 'EMP1012', whats: '966501110023', mail: 's.aljohani@academy.edu.sa', pw: 'Sj#1eRw9', deleteReason: 'حساب مكرر — تم دمجه مع حساب آخر.', deletedAt: '2026-06-22' },
  { id: 994, name: 'د. عبير الحربي', empId: 'EMP1013', whats: '966501110024', mail: 'a.alharbi2@academy.edu.sa', pw: 'Ah#5tYp6', deleteReason: 'إجازة طويلة بدون بديل مؤقت.', deletedAt: '2026-07-03' },
  { id: 995, name: 'د. راشد الغامدي', empId: 'EMP1014', whats: '966501110025', mail: 'r.alghamdi@academy.edu.sa', pw: 'Rg#0vBn3', deleteReason: 'طلب استقالة من المشرف.', deletedAt: '2026-07-12' }
]
const SEED_COMMITTEE = [
  { id: 981, name: 'د. يوسف المطيري', empId: 'COM2010', whats: '', mail: 'committee10@academy.edu.jo', pw: 'Ym#4sCx1', deleteReason: 'انتهاء فترة عضوية اللجنة لهذا الفصل.', deletedAt: '2026-04-18' },
  { id: 982, name: 'د. ليلى العنزي', empId: 'COM2011', whats: '', mail: 'committee11@academy.edu.jo', pw: 'Le#8zGh6', deleteReason: 'استبدال العضوية بعضو جديد.', deletedAt: '2026-05-09' },
  { id: 983, name: 'د. عادل السبيعي', empId: 'COM2012', whats: '', mail: 'committee12@academy.edu.jo', pw: 'As#2dFk9', deleteReason: 'تعارض مصالح مع أحد الفرق المشرَف عليها.', deletedAt: '2026-06-01' },
  { id: 984, name: 'د. هيفاء القحطاني', empId: 'COM2013', whats: '', mail: 'committee13@academy.edu.jo', pw: 'Hq#6pLw2', deleteReason: 'طلب إعفاء شخصي من العضوية.', deletedAt: '2026-06-27' },
  { id: 985, name: 'د. ماجد الرشيدي', empId: 'COM2014', whats: '', mail: 'committee14@academy.edu.jo', pw: 'Mr#3xVn7', deleteReason: 'انتقال إلى أكاديمية أخرى.', deletedAt: '2026-07-14' }
]

/** سجلّ الأعضاء المحذوفين (طلاب / مشرفون / لجنة إشراف) — يبقى بالذاكرة عبر التنقّل بين الصفحات بانتظار مصدر حقيقي من الباك إند */
export const useDeletedMembersStore = defineStore('deletedMembers', () => {
  const students = ref([...SEED_STUDENTS])
  const supervisors = ref([...SEED_SUPERVISORS])
  const committee = ref([...SEED_COMMITTEE])

  function deleteStudent(row, reason) {
    students.value.unshift({ ...row, deleteReason: reason, deletedAt: today() })
  }
  function deleteSupervisor(row, reason) {
    supervisors.value.unshift({ ...row, deleteReason: reason, deletedAt: today() })
  }
  function deleteCommitteeMember(row, reason) {
    committee.value.unshift({ ...row, deleteReason: reason, deletedAt: today() })
  }

  return { students, supervisors, committee, deleteStudent, deleteSupervisor, deleteCommitteeMember }
})
