<template>
  <div>
    <!-- ===================== الطلاب ===================== -->
    <div class="flex items-center justify-between gap-3 mb-5 flex-wrap">
      <div class="flex items-center gap-3">
        <span class="grid place-items-center w-9 h-9 rounded-md shrink-0 text-white" style="background: linear-gradient(135deg, var(--color-primary-600), var(--color-accent-500))"><GraduationCap :size="18" /></span>
        <div><h3 class="text-h3 font-bold text-text-900">أعضاء الطلاب</h3><p class="text-caption text-text-600">{{ filteredStudents.length }} من أصل {{ students.length }} طالبًا</p></div>
      </div>
    </div>

    <div class="flex flex-wrap gap-3 mb-4">
      <button type="button" class="flex items-center gap-2 h-10 px-4 rounded-sm bg-success-bg text-success text-caption font-bold hover:brightness-95 transition-all duration-fast" @click="sendWhatsAll(students)">
        <MessageCircle :size="15" /> إرسال واتساب للجميع
      </button>
      <button type="button" class="flex items-center gap-2 h-10 px-4 rounded-sm bg-primary-50 text-primary-700 text-caption font-bold hover:bg-primary-100 transition-colors duration-fast" @click="sendMailAll(studentEmails)">
        <Mail :size="15" /> إرسال بريد للجميع (Gmail)
      </button>
    </div>

    <div class="flex flex-wrap items-center gap-3 mb-6 p-4 rounded-lg bg-surface border border-border shadow-card">
      <div class="relative flex-1 min-w-[220px]">
        <Search :size="16" class="pointer-events-none absolute top-1/2 -translate-y-1/2 start-3 text-text-400" />
        <input v-model.trim="studentSearch" type="search" placeholder="ابحث عن طالب، مشرف أو رقم جامعي..." class="w-full h-icon-btn ps-10 pe-3 rounded-sm border border-border bg-bg text-body text-text-900 focus:border-primary-600 transition-colors duration-fast">
      </div>
      <BaseSelect v-model="specFilter" class="min-w-[170px]" placeholder="جميع التخصصات" include-placeholder-option :options="specializationOptions" />
      <BaseSelect v-model="studentSupFilter" class="min-w-[180px]" placeholder="جميع المشرفين" include-placeholder-option :options="supervisorOptions" />
    </div>

    <div class="mb-12">
    <DataTable :columns="studentColumns" :rows="studentPageRows" row-key="id" :primary-keys="['grp', 'name']" empty-title="لا توجد نتائج مطابقة">
      <template #cell-grp="{ row }">
        <router-link :to="{ name: 'committee-teams', query: { group: row.grp } }" class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-pill bg-border-soft text-text-600 text-caption font-semibold hover:bg-primary-100 hover:text-primary-700 transition-colors duration-fast">
          {{ row.grp }} <ExternalLink :size="11" class="opacity-65" />
        </router-link>
      </template>
      <template #cell-name="{ row }">
        <span class="font-bold text-text-900">{{ row.name }}</span>
        <span v-if="row.restricted" class="ms-1.5 text-label font-bold text-error bg-error-bg px-2 py-0.5 rounded-pill">مقيَّد</span>
      </template>
      <template #cell-uid="{ value }"><span class="mono">{{ value }}</span></template>
      <template #cell-whats="{ value }"><span class="mono">{{ value }}</span></template>
      <template #cell-mail="{ value }"><span class="mono whitespace-nowrap">{{ value }}</span></template>
      <template #cell-pw="{ row }">
        <div class="flex items-center gap-2">
          <button type="button" class="grid place-items-center w-7 h-7 rounded-sm border border-border text-text-400 hover:text-primary-600 hover:bg-primary-50 transition-colors duration-fast shrink-0" title="توليد كلمة سر" @click="generatePw(row)">
            <RefreshCw :size="13" />
          </button>
          <span class="mono text-caption tracking-wider min-w-[70px] inline-block">{{ row.pw ? (visiblePw.includes(row.id) ? row.pw : maskPw(row.pw)) : '—' }}</span>
          <button v-if="row.pw" type="button" class="grid place-items-center w-7 h-7 rounded-sm border border-border text-text-400 hover:text-primary-600 hover:bg-primary-50 transition-colors duration-fast shrink-0" title="إظهار/إخفاء كلمة السر" @click="togglePw(row.id)">
            <Eye :size="13" />
          </button>
        </div>
      </template>
      <template #cell-actions="{ row }">
        <div class="flex gap-1.5">
          <button type="button" class="grid place-items-center w-8 h-8 rounded-sm border border-whatsapp-bg text-whatsapp hover:bg-whatsapp-bg" title="واتساب" @click="sendWhats(row.whats)"><MessageCircle :size="14" /></button>
          <button type="button" class="grid place-items-center w-8 h-8 rounded-sm border border-primary-100 text-primary-600 hover:bg-primary-50" title="بريد" @click="sendMail(row.mail)"><Mail :size="14" /></button>
          <button type="button" class="grid place-items-center w-8 h-8 rounded-sm border border-border text-text-600 hover:bg-border-soft hover:text-primary-700" title="تعديل" @click="openEdit(row, 'student')"><Pencil :size="14" /></button>
          <button
            type="button"
            class="grid place-items-center w-8 h-8 rounded-sm border transition-colors duration-fast"
            :class="row.restricted ? 'bg-error text-white border-error hover:brightness-95' : 'border-border text-text-600 hover:bg-error-bg hover:text-error'"
            :title="row.restricted ? 'إلغاء التقييد' : 'تقييد دخول المنصة'"
            @click="toggleRestrict(row)"
          >
            <Lock :size="14" />
          </button>
          <button type="button" class="grid place-items-center w-8 h-8 rounded-sm border border-error-bg text-error hover:bg-error-bg" title="حذف" @click="openDelete(row, 'student')"><Trash2 :size="14" /></button>
        </div>
      </template>
      <template #row-extra="{ row }">
        <div v-if="row.restricted && row.restrictReason" class="flex items-start gap-2 px-5 py-3 bg-error-bg border-t border-error-border/50">
          <AlertTriangle :size="14" class="text-error shrink-0 mt-0.5" />
          <p class="text-caption text-error leading-relaxed"><span class="font-bold">سبب التقييد: </span>{{ row.restrictReason }}</p>
        </div>
      </template>
    </DataTable>
    <Pagination class="mt-4" :current-page="studentPage" :last-page="studentTotalPages" :total="filteredStudents.length" @change="studentPage = $event" />
    </div>

    <!-- ===================== المشرفون ===================== -->
    <div class="flex items-center gap-3 mb-5">
      <span class="grid place-items-center w-9 h-9 rounded-md shrink-0 text-white" style="background: linear-gradient(135deg, var(--color-primary-600), var(--color-accent-500))"><Users :size="18" /></span>
      <div><h3 class="text-h3 font-bold text-text-900">المشرفون</h3><p class="text-caption text-text-600">{{ filteredSupervisors.length }} من أصل {{ supervisors.length }} مشرفًا</p></div>
    </div>

    <div class="flex flex-wrap gap-3 mb-4">
      <button type="button" class="flex items-center gap-2 h-10 px-4 rounded-sm bg-success-bg text-success text-caption font-bold hover:brightness-95 transition-all duration-fast" @click="sendWhatsAll(supervisors)">
        <MessageCircle :size="15" /> إرسال واتساب للجميع
      </button>
      <button type="button" class="flex items-center gap-2 h-10 px-4 rounded-sm bg-primary-50 text-primary-700 text-caption font-bold hover:bg-primary-100 transition-colors duration-fast" @click="sendMailAll(supervisorEmails)">
        <Mail :size="15" /> إرسال بريد للجميع (Gmail)
      </button>
    </div>

    <div class="flex flex-wrap items-center gap-3 mb-6 p-4 rounded-lg bg-surface border border-border shadow-card">
      <div class="relative flex-1 min-w-[220px]">
        <Search :size="16" class="pointer-events-none absolute top-1/2 -translate-y-1/2 start-3 text-text-400" />
        <input v-model.trim="supervisorSearch" type="search" placeholder="ابحث عن مشرف بالاسم أو الرقم الوظيفي..." class="w-full h-icon-btn ps-10 pe-3 rounded-sm border border-border bg-bg text-body text-text-900 focus:border-primary-600 transition-colors duration-fast">
      </div>
    </div>

    <DataTable :columns="supervisorColumns" :rows="supervisorPageRows" row-key="id" :primary-keys="['name', 'empId']" empty-title="لا توجد نتائج مطابقة">
      <template #cell-name="{ row }">
        <span class="font-bold text-text-900">{{ row.name }}</span>
        <span v-if="row.restricted" class="ms-1.5 text-label font-bold text-error bg-error-bg px-2 py-0.5 rounded-pill">مقيَّد</span>
      </template>
      <template #cell-empId="{ value }"><span class="mono">{{ value }}</span></template>
      <template #cell-mail="{ value }"><span class="mono whitespace-nowrap">{{ value }}</span></template>
      <template #cell-whats="{ value }"><span class="mono">{{ value }}</span></template>
      <template #cell-pw="{ row }">
        <div class="flex items-center gap-2">
          <button type="button" class="grid place-items-center w-7 h-7 rounded-sm border border-border text-text-400 hover:text-primary-600 hover:bg-primary-50 transition-colors duration-fast shrink-0" title="توليد كلمة سر" @click="generatePw(row)">
            <RefreshCw :size="13" />
          </button>
          <span class="mono text-caption tracking-wider min-w-[70px] inline-block">{{ row.pw ? (visiblePw.includes(row.id) ? row.pw : maskPw(row.pw)) : '—' }}</span>
          <button v-if="row.pw" type="button" class="grid place-items-center w-7 h-7 rounded-sm border border-border text-text-400 hover:text-primary-600 hover:bg-primary-50 transition-colors duration-fast shrink-0" title="إظهار/إخفاء كلمة السر" @click="togglePw(row.id)">
            <Eye :size="13" />
          </button>
        </div>
      </template>
      <template #cell-actions="{ row }">
        <div class="flex gap-1.5">
          <button type="button" class="grid place-items-center w-8 h-8 rounded-sm border border-whatsapp-bg text-whatsapp hover:bg-whatsapp-bg" title="واتساب" @click="sendWhats(row.whats)"><MessageCircle :size="14" /></button>
          <button type="button" class="grid place-items-center w-8 h-8 rounded-sm border border-primary-100 text-primary-600 hover:bg-primary-50" title="بريد" @click="sendMail(row.mail)"><Mail :size="14" /></button>
          <button type="button" class="grid place-items-center w-8 h-8 rounded-sm border border-border text-text-600 hover:bg-border-soft hover:text-primary-700" title="تعديل" @click="openEdit(row, 'supervisor')"><Pencil :size="14" /></button>
          <button
            type="button"
            class="grid place-items-center w-8 h-8 rounded-sm border transition-colors duration-fast"
            :class="row.restricted ? 'bg-error text-white border-error hover:brightness-95' : 'border-border text-text-600 hover:bg-error-bg hover:text-error'"
            :title="row.restricted ? 'إلغاء التقييد' : 'تقييد دخول المنصة'"
            @click="toggleRestrict(row)"
          >
            <Lock :size="14" />
          </button>
          <button type="button" class="grid place-items-center w-8 h-8 rounded-sm border border-error-bg text-error hover:bg-error-bg" title="حذف" @click="openDelete(row, 'supervisor')"><Trash2 :size="14" /></button>
        </div>
      </template>
      <template #row-extra="{ row }">
        <div v-if="row.restricted && row.restrictReason" class="flex items-start gap-2 px-5 py-3 bg-error-bg border-t border-error-border/50">
          <AlertTriangle :size="14" class="text-error shrink-0 mt-0.5" />
          <p class="text-caption text-error leading-relaxed"><span class="font-bold">سبب التقييد: </span>{{ row.restrictReason }}</p>
        </div>
      </template>
    </DataTable>
    <Pagination class="mt-4" :current-page="supervisorPage" :last-page="supervisorTotalPages" :total="filteredSupervisors.length" @change="supervisorPage = $event" />

    <BaseModal v-model="editModalOpen" :title="editKind === 'student' ? 'تعديل بيانات الطالب' : 'تعديل بيانات المشرف'">
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <template v-if="editKind === 'student'">
          <BaseInput v-model="editForm.grp" label="رقم المجموعة" />
          <BaseSelect v-model="editForm.spec" label="التخصص" :options="specializationOptions" />
          <BaseInput v-model="editForm.name" label="اسم العضو" class="sm:col-span-2" />
          <BaseInput v-model="editForm.uid" label="الرقم الجامعي" />
          <BaseInput v-model="editForm.whats" label="رقم الواتس" />
          <BaseInput v-model="editForm.mail" type="email" label="البريد الإلكتروني" class="sm:col-span-2" />
          <BaseSelect v-model="editForm.sup" label="اسم المشرف" :options="supervisorOptions" class="sm:col-span-2" />
        </template>
        <template v-else>
          <BaseInput v-model="editForm.name" label="اسم الموظف" class="sm:col-span-2" />
          <BaseInput v-model="editForm.empId" label="الرقم الوظيفي" />
          <BaseInput v-model="editForm.whats" label="رقم الواتس" />
          <BaseInput v-model="editForm.mail" type="email" label="البريد الإلكتروني" class="sm:col-span-2" />
        </template>
      </div>
      <template #footer>
        <BaseButton variant="ghost" @click="editModalOpen = false">إلغاء</BaseButton>
        <BaseButton :icon="Check" @click="saveEdit">حفظ التعديلات</BaseButton>
      </template>
    </BaseModal>

    <BaseModal v-model="restrictModal" title="سبب التقييد" :description="restrictTarget ? `سبب تقييد ‏${restrictTarget.name}` : ''" size="sm">
      <div class="flex flex-col gap-2">
        <label class="text-label font-semibold text-text-600">السبب</label>
        <textarea v-model.trim="restrictReason" rows="4" placeholder="اكتبي سبب التقييد..." class="w-full rounded-sm border border-border bg-bg text-body text-text-900 px-3 py-2.5 focus:border-primary-600 transition-colors duration-fast resize-y" />
      </div>
      <template #footer>
        <BaseButton variant="ghost" @click="restrictModal = false">إلغاء</BaseButton>
        <BaseButton variant="danger" :icon="Lock" @click="confirmRestrict">تأكيد التقييد</BaseButton>
      </template>
    </BaseModal>

    <BaseModal v-model="deleteModal" title="سبب الحذف" :description="deleteTarget ? `حذف ‏${deleteTarget.name}` : ''" size="sm">
      <div class="flex flex-col gap-2">
        <label class="text-label font-semibold text-text-600">السبب</label>
        <textarea v-model.trim="deleteReason" rows="4" placeholder="اكتبي سبب الحذف..." class="w-full rounded-sm border border-border bg-bg text-body text-text-900 px-3 py-2.5 focus:border-primary-600 transition-colors duration-fast resize-y" />
      </div>
      <template #footer>
        <BaseButton variant="ghost" @click="deleteModal = false">إلغاء</BaseButton>
        <BaseButton variant="danger" :icon="Trash2" @click="confirmDelete">تأكيد الحذف</BaseButton>
      </template>
    </BaseModal>
  </div>
</template>

<script>
import { GraduationCap, Users, Search, MessageCircle, Mail, ExternalLink, Eye, Pencil, Lock, RefreshCw, Check, Trash2, AlertTriangle } from 'lucide-vue-next'
import { mapActions } from 'pinia'
import { genPass } from '@/utils/password'
import { useDeletedMembersStore } from '@/stores/deletedMembers.store'
import BaseInput from '@/components/ui/BaseInput.vue'
import BaseSelect from '@/components/ui/BaseSelect.vue'
import BaseButton from '@/components/ui/BaseButton.vue'
import BaseModal from '@/components/ui/BaseModal.vue'
import DataTable from '@/components/ui/DataTable.vue'
import Pagination from '@/components/ui/Pagination.vue'
import { SPECIALIZATIONS } from '@/utils/specializations'

function digitsOnly(value) {
  return String(value || '').replace(/\D/g, '').replace(/^0/, '')
}
const PAGE_SIZE = 4

export default {
  name: 'CommitteeMembersPage',

  components: { GraduationCap, Users, Search, MessageCircle, Mail, ExternalLink, Eye, Pencil, Lock, RefreshCw, Check, Trash2, AlertTriangle, BaseInput, BaseSelect, BaseButton, BaseModal, DataTable, Pagination },

  data() {
    return {
      Check, Lock, Trash2,
      studentSearch: '',
      specFilter: '',
      studentSupFilter: '',
      supervisorSearch: '',
      visiblePw: [],
      studentPage: 1,
      supervisorPage: 1,
      editModalOpen: false,
      editKind: 'student',
      editTargetId: null,
      editForm: {},
      restrictModal: false,
      restrictTarget: null,
      restrictReason: '',
      deleteModal: false,
      deleteKind: 'student',
      deleteTarget: null,
      deleteReason: '',

      studentColumns: [
        { key: 'grp', label: 'رقم المجموعة' },
        { key: 'name', label: 'اسم العضو' },
        { key: 'uid', label: 'الرقم الجامعي' },
        { key: 'whats', label: 'رقم الواتس' },
        { key: 'mail', label: 'البريد الإلكتروني' },
        { key: 'pw', label: 'كلمة السر' },
        { key: 'actions', label: 'إجراءات' }
      ],
      supervisorColumns: [
        { key: 'name', label: 'اسم الموظف' },
        { key: 'empId', label: 'الرقم الوظيفي' },
        { key: 'mail', label: 'البريد الإلكتروني' },
        { key: 'whats', label: 'رقم الواتس' },
        { key: 'pw', label: 'كلمة السر' },
        { key: 'actions', label: 'إجراءات' }
      ],

      /* بيانات ثابتة — بانتظار GET /committee/students و GET /committee/supervisors */
      students: [
        { id: 1, grp: '31', spec: SPECIALIZATIONS[0], name: 'يوسف الدوسري', uid: '3175000', whats: '0551110001', mail: 'student1@academy.edu.sa', pw: '', sup: 'د. أحمد الشريف', restricted: false },
        { id: 2, grp: '31', spec: SPECIALIZATIONS[0], name: 'علي الحربي', uid: '3175001', whats: '0551110002', mail: 'student2@academy.edu.sa', pw: '', sup: 'د. أحمد الشريف', restricted: false },
        { id: 3, grp: '31', spec: SPECIALIZATIONS[0], name: 'سلطان الدوسري', uid: '3175006', whats: '0551110003', mail: 'student3@academy.edu.sa', pw: '', sup: 'د. أحمد الشريف', restricted: true },
        { id: 4, grp: '52', spec: SPECIALIZATIONS[1], name: 'فيصل الحربي', uid: '3175018', whats: '0551110004', mail: 'student4@academy.edu.sa', pw: '', sup: 'د. سلمى نصار', restricted: false },
        { id: 5, grp: '52', spec: SPECIALIZATIONS[1], name: 'إبراهيم الدوسري', uid: '3175019', whats: '0551110005', mail: 'student5@academy.edu.sa', pw: '', sup: 'د. سلمى نصار', restricted: false },
        { id: 6, grp: '52', spec: SPECIALIZATIONS[1], name: 'سعد الحربي', uid: '3175020', whats: '0551110006', mail: 'student6@academy.edu.sa', pw: '', sup: 'د. سلمى نصار', restricted: false },
        { id: 7, grp: '54', spec: SPECIALIZATIONS[2], name: 'حسين الحربي', uid: '3175022', whats: '0551110007', mail: 'student7@academy.edu.sa', pw: '', sup: 'د. أحمد النبريص', restricted: false },
        { id: 8, grp: '54', spec: SPECIALIZATIONS[2], name: 'ماجد الحربي', uid: '3175023', whats: '0551110008', mail: 'student8@academy.edu.sa', pw: '', sup: 'د. أحمد النبريص', restricted: false },
        { id: 9, grp: '54', spec: SPECIALIZATIONS[2], name: 'سارة الحربي', uid: '3175024', whats: '0551110009', mail: 'student9@academy.edu.sa', pw: '', sup: 'د. أحمد النبريص', restricted: false },
        { id: 10, grp: '54', spec: SPECIALIZATIONS[2], name: 'رانا الحربي', uid: '3175025', whats: '0551110010', mail: 'student10@academy.edu.sa', pw: '', sup: 'د. أحمد النبريص', restricted: false }
      ],
      supervisors: [
        { id: 101, name: 'د. أحمد الشريف', empId: 'EMP1001', mail: 'a.alsharif@academy.edu.sa', whats: '966501110011', pw: '', restricted: false },
        { id: 102, name: 'د. سلمى نصار', empId: 'EMP1002', mail: 's.nassar@academy.edu.sa', whats: '966501110012', pw: '', restricted: false },
        { id: 103, name: 'د. أحمد النبريص', empId: 'EMP1003', mail: 'a.alnabris@academy.edu.sa', whats: '966501110013', pw: '', restricted: false },
        { id: 104, name: 'د. سلطان الدوسري', empId: 'EMP1004', mail: 's.aldosari@academy.edu.sa', whats: '966501110014', pw: '', restricted: false },
        { id: 105, name: 'د. نورة القحطاني', empId: 'EMP1005', mail: 'n.alqahtani@academy.edu.sa', whats: '966501110015', pw: '', restricted: false },
        { id: 106, name: 'د. ماجد الحربي', empId: 'EMP1006', mail: 'm.alharbi@academy.edu.sa', whats: '966501110016', pw: '', restricted: false },
        { id: 107, name: 'د. هند الجهني', empId: 'EMP1007', mail: 'h.aljohani@academy.edu.sa', whats: '966501110017', pw: '', restricted: false },
        { id: 108, name: 'د. عمر الدوسري', empId: 'EMP1008', mail: 'o.aldosari@academy.edu.sa', whats: '966501110018', pw: '', restricted: false },
        { id: 109, name: 'د. ريم الحربي', empId: 'EMP1009', mail: 'r.alharbi@academy.edu.sa', whats: '966501110019', pw: '', restricted: false }
      ]
    }
  },

  computed: {
    specializationOptions() {
      return SPECIALIZATIONS.map((s) => ({ value: s, label: s }))
    },
    supervisorOptions() {
      return this.supervisors.map((s) => ({ value: s.name, label: s.name }))
    },
    studentEmails() {
      return this.students.map((s) => s.mail)
    },
    supervisorEmails() {
      return this.supervisors.map((s) => s.mail)
    },

    filteredStudents() {
      const q = this.studentSearch.trim()
      return this.students.filter((s) => {
        const matchQ = !q || `${s.name}${s.uid}${s.sup}`.includes(q)
        const matchSpec = !this.specFilter || s.spec === this.specFilter
        const matchSup = !this.studentSupFilter || s.sup === this.studentSupFilter
        return matchQ && matchSpec && matchSup
      })
    },
    filteredSupervisors() {
      const q = this.supervisorSearch.trim()
      return this.supervisors.filter((s) => !q || `${s.name}${s.empId}`.includes(q))
    },

    studentTotalPages() {
      return Math.max(1, Math.ceil(this.filteredStudents.length / PAGE_SIZE))
    },
    studentPageRows() {
      const start = (this.studentPage - 1) * PAGE_SIZE
      return this.filteredStudents.slice(start, start + PAGE_SIZE)
    },
    supervisorTotalPages() {
      return Math.max(1, Math.ceil(this.filteredSupervisors.length / PAGE_SIZE))
    },
    supervisorPageRows() {
      const start = (this.supervisorPage - 1) * PAGE_SIZE
      return this.filteredSupervisors.slice(start, start + PAGE_SIZE)
    }
  },

  watch: {
    filteredStudents() {
      this.studentPage = 1
    },
    filteredSupervisors() {
      this.supervisorPage = 1
    }
  },

  methods: {
    ...mapActions(useDeletedMembersStore, ['deleteStudent', 'deleteSupervisor']),

    maskPw(pw) {
      return '•'.repeat(pw.length)
    },
    togglePw(id) {
      this.visiblePw = this.visiblePw.includes(id) ? this.visiblePw.filter((x) => x !== id) : [...this.visiblePw, id]
    },
    generatePw(row) {
      row.pw = genPass()
      if (!this.visiblePw.includes(row.id)) this.visiblePw.push(row.id)
    },

    toggleRestrict(row) {
      if (row.restricted) {
        row.restricted = false
        row.restrictReason = ''
        return
      }
      this.restrictTarget = row
      this.restrictReason = ''
      this.restrictModal = true
    },
    confirmRestrict() {
      if (!this.restrictReason) {
        this.$toast?.error('يرجى كتابة سبب التقييد')
        return
      }
      this.restrictTarget.restricted = true
      this.restrictTarget.restrictReason = this.restrictReason
      this.restrictModal = false
      this.$toast?.success('تم تقييد دخول العضو')
    },

    openEdit(row, kind) {
      this.editKind = kind
      this.editTargetId = row.id
      this.editForm = kind === 'student'
        ? { grp: row.grp, spec: row.spec, name: row.name, uid: row.uid, whats: row.whats, mail: row.mail, sup: row.sup }
        : { name: row.name, empId: row.empId, whats: row.whats, mail: row.mail }
      this.editModalOpen = true
    },
    saveEdit() {
      const arr = this.editKind === 'student' ? this.students : this.supervisors
      const target = arr.find((m) => m.id === this.editTargetId)
      if (target) Object.assign(target, this.editForm)
      this.editModalOpen = false
      this.$toast?.success('تم حفظ التعديلات')
    },

    openDelete(row, kind) {
      this.deleteKind = kind
      this.deleteTarget = row
      this.deleteReason = ''
      this.deleteModal = true
    },
    confirmDelete() {
      if (!this.deleteReason) {
        this.$toast?.error('يرجى كتابة سبب الحذف')
        return
      }
      if (this.deleteKind === 'student') {
        this.deleteStudent(this.deleteTarget, this.deleteReason)
        this.students = this.students.filter((s) => s.id !== this.deleteTarget.id)
      } else {
        this.deleteSupervisor(this.deleteTarget, this.deleteReason)
        this.supervisors = this.supervisors.filter((s) => s.id !== this.deleteTarget.id)
      }
      this.deleteModal = false
      this.$toast?.success('تم حذف العضو')
    },

    sendWhats(whats) {
      const num = digitsOnly(whats)
      const full = num.startsWith('970') || num.startsWith('972') ? num : `970${num}`
      window.open(`https://wa.me/${full}`, '_blank')
    },
    sendMail(mail) {
      window.location.href = `mailto:${mail}`
    },

    sendWhatsAll(list) {
      if (!window.confirm(`سيتم فتح ${list.length} محادثة واتساب في تبويبات منفصلة. متابعة؟`)) return
      list.forEach((r, i) => setTimeout(() => this.sendWhats(r.whats), i * 300))
    },
    sendMailAll(emails) {
      const url = `https://mail.google.com/mail/?view=cm&fs=1&bcc=${encodeURIComponent(emails.join(','))}&su=${encodeURIComponent('تعميم من لجنة الإشراف')}`
      window.open(url, '_blank')
    }
  }
}
</script>

<style scoped>
.mono { direction: ltr; text-align: start; display: inline-block; }
</style>
