<template>
  <div>
    <div class="flex flex-wrap items-center justify-between gap-4 mb-6">
      <BaseButton :icon="Plus" @click="openAddModal">تسجيل موعد مناقشة جديد</BaseButton>
      <div class="flex flex-wrap gap-2">
        <BaseButton variant="outline" :icon="Upload" @click="importPlaceholder">استيراد من Excel</BaseButton>
        <BaseButton variant="outline" :icon="Download" :loading="exportingExcel" @click="exportExcel">تصدير Excel</BaseButton>
        <BaseButton variant="outline" :icon="FileDown" :loading="exportingPdf" @click="exportPdf">تصدير PDF</BaseButton>
      </div>
    </div>

    <div class="flex flex-wrap items-center gap-3 mb-6 p-4 rounded-lg bg-surface border border-border shadow-card">
      <div class="relative flex-1 min-w-[220px]">
        <Search :size="16" class="pointer-events-none absolute top-1/2 -translate-y-1/2 start-3 text-text-400" />
        <input v-model.trim="search" type="search" placeholder="ابحثي عن مشروع، مشرف أو طالب..." class="w-full h-icon-btn ps-10 pe-3 rounded-sm border border-border bg-bg text-body text-text-900 focus:border-primary-600 transition-colors duration-fast">
      </div>
      <BaseSelect v-model="deptFilter" class="min-w-[170px]" placeholder="جميع الأقسام" include-placeholder-option :options="deptOptions" />
      <BaseSelect v-model="specFilter" class="min-w-[170px]" placeholder="جميع التخصصات" include-placeholder-option :options="specOptions" />
    </div>

    <div class="flex flex-wrap gap-3 mb-6">
      <button type="button" class="flex items-center gap-2 h-10 px-4 rounded-sm bg-success-bg text-success text-caption font-bold hover:brightness-95 transition-all duration-fast" @click="sendWhatsAll">
        <MessageCircle :size="15" /> واتساب للجميع ({{ totalStudents }})
      </button>
      <button type="button" class="flex items-center gap-2 h-10 px-4 rounded-sm bg-primary-50 text-primary-700 text-caption font-bold hover:bg-primary-100 transition-colors duration-fast" @click="sendMailAll">
        <Mail :size="15" /> بريد للجميع (Gmail)
      </button>
    </div>

    <div class="flex items-center justify-between gap-4 mb-4">
      <h3 class="font-cairo font-bold text-h4 text-text-900">مواعيد المناقشات المسجلة</h3>
      <span class="text-caption text-text-600">{{ filteredGroups.length }} مجموعة — {{ filteredStudentsCount }} طالبًا</span>
    </div>

    <EmptyState v-if="!filteredGroups.length" title="لا توجد مواعيد مطابقة" description="جرّبي تعديل البحث أو الفلاتر." />

    <div v-else class="flex flex-col gap-4">
      <div v-for="group in pageGroups" :key="group.id" class="bg-surface border border-border rounded-lg shadow-card overflow-hidden">
        <div class="flex items-center gap-4 p-4 flex-wrap">
          <button
            type="button" class="grid place-items-center w-9 h-9 rounded-sm bg-border-soft text-text-600 transition-all duration-base shrink-0"
            :class="{ '!bg-primary-600 !text-white rotate-90': isGroupOpen(group.id) }"
            @click="toggleGroup(group.id)"
          >
            <ChevronLeft :size="16" />
          </button>

          <div class="w-10 h-10 rounded-md shrink-0 grid place-items-center font-cairo font-extrabold text-body-sm text-white" style="background: linear-gradient(135deg, var(--color-primary-600), var(--color-accent-500))">
            {{ group.grp }}
          </div>

          <div class="flex-1 min-w-0 flex items-center gap-3 sm:gap-6 flex-wrap">
            <div>
              <div class="text-body-sm font-extrabold text-text-900">{{ group.proj }}</div>
              <div class="text-label text-text-400">رقم المجموعة {{ group.grp }}</div>
            </div>
            <div class="text-caption"><span class="text-text-400">المشرف </span><span class="font-bold text-text-900">{{ group.sup }}</span></div>
            <BaseBadge variant="info">{{ formatDate(group.date) }}</BaseBadge>
            <BaseBadge>{{ group.students.length }} {{ group.students.length === 1 ? 'طالب' : 'طلاب' }}</BaseBadge>
          </div>

          <div class="flex gap-1.5 shrink-0">
            <button type="button" class="grid place-items-center w-8 h-8 rounded-sm border border-border text-text-600 hover:bg-border-soft hover:text-primary-700" title="تعديل" @click="openEditGroup(group)"><Pencil :size="14" /></button>
            <button type="button" class="grid place-items-center w-8 h-8 rounded-sm border border-error-bg text-error hover:bg-error-bg" title="حذف" @click="openDeleteGroup(group)"><Trash2 :size="14" /></button>
          </div>
        </div>

        <div v-show="isGroupOpen(group.id)" class="border-t border-border-soft">
          <div class="flex flex-wrap gap-x-8 gap-y-2 px-5 py-3.5 bg-bg border-b border-border-soft text-caption">
            <div class="flex items-center gap-2 text-text-700"><MapPin :size="14" class="text-text-400 shrink-0" /><span class="text-text-400">المكان:</span> {{ group.place }}</div>
            <div class="flex items-center gap-2 text-text-700"><Clock :size="14" class="text-text-400 shrink-0" /><span class="text-text-400">الوقت:</span> {{ group.time }}</div>
            <div class="flex items-center gap-2 text-text-700"><Users :size="14" class="text-text-400 shrink-0" /><span class="text-text-400">لجنة المناقشة:</span> {{ group.committee }}</div>
          </div>

          <div class="hidden md:block overflow-x-auto scrollbar-thin">
            <table class="w-full border-collapse min-w-[600px]">
              <thead>
                <tr class="bg-bg border-b-2 border-border divide-x divide-border-soft">
                  <th class="px-5 py-3 text-start text-label font-extrabold text-text-700">اسم الطالب</th>
                  <th class="px-5 py-3 text-start text-label font-extrabold text-text-700">الواتس</th>
                  <th class="px-5 py-3 text-start text-label font-extrabold text-text-700">البريد</th>
                  <th class="px-5 py-3 text-start text-label font-extrabold text-text-700">إجراءات</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-border-soft">
                <tr v-for="(student, idx) in group.students" :key="idx" class="row-interactive divide-x divide-border-soft">
                  <td class="px-5 py-3 font-bold text-text-900">{{ student.name }}</td>
                  <td class="px-5 py-3 mono">{{ student.whats }}</td>
                  <td class="px-5 py-3 mono whitespace-nowrap">{{ student.mail }}</td>
                  <td class="px-5 py-3">
                    <div class="flex gap-2">
                      <button type="button" class="grid place-items-center w-8 h-8 rounded-sm border border-whatsapp-bg text-whatsapp hover:bg-whatsapp-bg" title="واتساب" @click="sendWhats(student.whats)"><MessageCircle :size="14" /></button>
                      <button type="button" class="grid place-items-center w-8 h-8 rounded-sm border border-primary-100 text-primary-600 hover:bg-primary-50" title="بريد" @click="sendMail(student.mail)"><Mail :size="14" /></button>
                      <button type="button" class="grid place-items-center w-8 h-8 rounded-sm border border-border text-text-600 hover:bg-border-soft hover:text-primary-700" title="تعديل" @click="openEditStudent(group, idx)"><Pencil :size="14" /></button>
                      <button type="button" class="grid place-items-center w-8 h-8 rounded-sm border border-error-bg text-error hover:bg-error-bg" title="حذف" @click="openDeleteStudent(group, idx)"><Trash2 :size="14" /></button>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <div class="md:hidden divide-y divide-border-soft">
            <div v-for="(student, idx) in group.students" :key="idx" class="p-4 space-y-2">
              <div class="flex items-center justify-between gap-3">
                <span class="font-bold text-text-900">{{ student.name }}</span>
              </div>
              <button
                type="button"
                class="w-full flex items-center justify-center gap-1.5 text-caption font-bold text-primary-600 py-1.5 rounded-sm hover:bg-primary-50 transition-colors duration-fast"
                @click="toggleStudentDetails(group.id, idx)"
              >
                {{ isStudentOpen(group.id, idx) ? 'إخفاء التفاصيل' : 'عرض التفاصيل' }}
                <ChevronDown :size="14" :class="['transition-transform duration-fast', isStudentOpen(group.id, idx) && 'rotate-180']" />
              </button>
              <div v-if="isStudentOpen(group.id, idx)" class="space-y-2 pt-2 border-t border-dashed border-border">
                <div class="flex items-start justify-between gap-3"><span class="text-label font-semibold text-text-400 shrink-0">رقم الواتس</span><span class="mono text-body-sm text-text-700">{{ student.whats }}</span></div>
                <div class="flex items-start justify-between gap-3"><span class="text-label font-semibold text-text-400 shrink-0">البريد الإلكتروني</span><span class="mono text-body-sm text-text-700 whitespace-nowrap">{{ student.mail }}</span></div>
                <div class="flex items-start justify-between gap-3">
                  <span class="text-label font-semibold text-text-400 shrink-0">إجراءات</span>
                  <div class="flex gap-1.5">
                    <button type="button" class="grid place-items-center w-8 h-8 rounded-sm border border-whatsapp-bg text-whatsapp hover:bg-whatsapp-bg" title="واتساب" @click="sendWhats(student.whats)"><MessageCircle :size="14" /></button>
                    <button type="button" class="grid place-items-center w-8 h-8 rounded-sm border border-primary-100 text-primary-600 hover:bg-primary-50" title="بريد" @click="sendMail(student.mail)"><Mail :size="14" /></button>
                    <button type="button" class="grid place-items-center w-8 h-8 rounded-sm border border-border text-text-600 hover:bg-border-soft hover:text-primary-700" title="تعديل" @click="openEditStudent(group, idx)"><Pencil :size="14" /></button>
                    <button type="button" class="grid place-items-center w-8 h-8 rounded-sm border border-error-bg text-error hover:bg-error-bg" title="حذف" @click="openDeleteStudent(group, idx)"><Trash2 :size="14" /></button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div class="px-5 py-3 border-t border-border-soft">
            <button type="button" class="inline-flex items-center gap-1.5 text-caption font-bold text-primary-600 hover:underline" @click="openAddStudent(group)">
              <Plus :size="14" /> إضافة طالب لهذه المجموعة
            </button>
          </div>
        </div>
      </div>
    </div>

    <div v-if="totalPages > 1" class="flex flex-wrap items-center justify-between gap-4 mt-6">
      <BaseSelect v-model="pageDropdown" class="min-w-[160px]" :options="pageOptions" />
      <Pagination :current-page="page" :last-page="totalPages" :total="filteredGroups.length" @change="page = $event" />
    </div>

    <!-- تسجيل / تعديل موعد مناقشة -->
    <BaseModal v-model="apptModal" :title="isEditing ? `تعديل موعد مجموعة ${apptForm.grp}` : 'تسجيل موعد مناقشة جديد'" description="سيُرسل إشعار للطالب عبر واتساب والبريد فور الحفظ" size="lg">
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <BaseInput v-model="apptForm.grp" label="رقم المجموعة" placeholder="مثال: 31" />
        <BaseInput v-model="apptForm.proj" label="اسم المشروع" placeholder="اسم مشروع التخرج" />
        <BaseInput v-model="apptForm.sup" label="اسم المشرف" placeholder="مثال: د. أحمد الشريف" />
        <BaseSelect v-model="apptForm.dept" label="القسم" placeholder="اختاري القسم" :options="deptOptions" />
        <BaseSelect v-model="apptForm.spec" label="التخصص" placeholder="اختاري التخصص" :options="specOptions" />
        <BaseInput v-model="apptForm.place" label="مكان المناقشة" placeholder="مثال: قاعة المناقشات 1" />
        <BaseInput v-model="apptForm.date" type="date" label="تاريخ المناقشة" />
        <BaseInput v-model="apptForm.time" type="time" label="موعد المناقشة" />
        <BaseInput v-model="apptForm.committee" label="لجنة المناقشة" placeholder="مثال: د. سارة الحربي، د. يوسف المحطاني" class="sm:col-span-2" />
        <template v-if="!isEditing">
          <BaseInput v-model="apptForm.studentName" label="اسم الطالب (الأول)" placeholder="اسم أول طالب في المجموعة" />
          <BaseInput v-model="apptForm.studentWhats" label="رقم واتس الطالب" placeholder="مثال: 966501234567" />
        </template>
      </div>
      <template #footer>
        <BaseButton variant="ghost" @click="apptModal = false">إلغاء</BaseButton>
        <BaseButton :icon="Check" @click="saveAppointment">{{ isEditing ? 'حفظ التعديلات' : 'حفظ وإرسال البيانات' }}</BaseButton>
      </template>
    </BaseModal>

    <!-- إضافة طالب لمجموعة -->
    <BaseModal v-model="studentModal" title="إضافة طالب">
      <div class="grid grid-cols-1 gap-4">
        <BaseInput v-model="studentForm.name" label="اسم الطالب" placeholder="الاسم الكامل" />
        <BaseInput v-model="studentForm.whats" label="رقم الواتس" placeholder="مثال: 966501234567" />
        <BaseInput v-model="studentForm.mail" type="email" label="البريد الإلكتروني" placeholder="student@academy.edu.sa" />
      </div>
      <template #footer>
        <BaseButton variant="ghost" @click="studentModal = false">إلغاء</BaseButton>
        <BaseButton :icon="Check" @click="submitStudent">إضافة الطالب</BaseButton>
      </template>
    </BaseModal>

    <!-- تعديل بيانات طالب -->
    <BaseModal v-model="editStudentModal" title="تعديل بيانات الطالب">
      <div class="grid grid-cols-1 gap-4">
        <BaseInput v-model="editStudentForm.name" label="اسم الطالب" />
        <BaseInput v-model="editStudentForm.whats" label="رقم الواتس" />
        <BaseInput v-model="editStudentForm.mail" type="email" label="البريد الإلكتروني" />
      </div>
      <template #footer>
        <BaseButton variant="ghost" @click="editStudentModal = false">إلغاء</BaseButton>
        <BaseButton :icon="Check" @click="saveEditStudent">حفظ التعديلات</BaseButton>
      </template>
    </BaseModal>

    <!-- سبب الحذف -->
    <BaseModal v-model="deleteModal" title="سبب الحذف" :description="deleteLabel" size="sm">
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
import { Plus, Upload, Download, FileDown, Search, ChevronLeft, ChevronDown, MessageCircle, Mail, Pencil, Trash2, Check, MapPin, Clock, Users } from 'lucide-vue-next'
import BaseButton from '@/components/ui/BaseButton.vue'
import BaseSelect from '@/components/ui/BaseSelect.vue'
import BaseInput from '@/components/ui/BaseInput.vue'
import BaseBadge from '@/components/ui/BaseBadge.vue'
import BaseModal from '@/components/ui/BaseModal.vue'
import EmptyState from '@/components/ui/EmptyState.vue'
import Pagination from '@/components/ui/Pagination.vue'
import { formatDate } from '@/utils/formatters'
import { exportStyledExcel, exportGroupsPdf } from '@/utils/exportReport'
import { SPECIALIZATIONS, DEPARTMENTS } from '@/utils/specializations'

const DEPTS = DEPARTMENTS
const SPECS = SPECIALIZATIONS
const APPTS_PAGE_SIZE = 4

function digitsOnly(value) {
  return String(value || '').replace(/\D/g, '').replace(/^0/, '')
}

const emptyApptForm = () => ({ grp: '', proj: '', sup: '', dept: '', spec: '', place: '', date: '', time: '', committee: '', studentName: '', studentWhats: '' })
const emptyStudentForm = () => ({ name: '', whats: '', mail: '' })

export default {
  name: 'CommitteeAppointmentsPage',

  components: { Search, ChevronLeft, ChevronDown, MessageCircle, Mail, Pencil, Trash2, MapPin, Clock, Users, BaseButton, BaseSelect, BaseInput, BaseBadge, BaseModal, EmptyState, Pagination },

  data() {
    return {
      Plus, Upload, Download, FileDown, Check, Trash2,
      exportingExcel: false,
      exportingPdf: false,
      search: '',
      deptFilter: '',
      specFilter: '',
      openGroupIds: [],
      openStudentKeys: [],

      apptModal: false,
      isEditing: false,
      editTargetId: null,
      apptForm: emptyApptForm(),

      studentModal: false,
      studentTargetId: null,
      studentForm: emptyStudentForm(),

      editStudentModal: false,
      editStudentTarget: { groupId: null, idx: null },
      editStudentForm: {},

      deleteModal: false,
      deleteKind: 'group',
      deleteTarget: { groupId: null, idx: null },
      deleteLabel: '',
      deleteReason: '',

      /* بيانات ثابتة — بانتظار GET /committee/appointments */
      groups: [
        {
          id: 'A1', grp: '31', proj: 'منصة إدارة مشاريع التخرج', sup: 'د. محمد العتيبي', dept: DEPTS[0], spec: SPECS[0],
          place: 'قاعة المناقشات 1', date: '2027-06-15', time: '10:00', committee: 'د. سارة الحربي، د. يوسف المحطاني، د. فهد العتيبي',
          students: [
            { name: 'أحمد السلمي', whats: '962790000000', mail: 'ahmed.salmi@academy.edu.sa' },
            { name: 'يوسف الدوسري', whats: '962790000010', mail: 'yousef.dosari@academy.edu.sa' },
            { name: 'علي الحربي', whats: '962790000011', mail: 'ali.harbi@academy.edu.sa' }
          ]
        },
        {
          id: 'A2', grp: '52', proj: 'تطبيق تحليل الصور الطبية', sup: 'د. علي الشمري', dept: DEPTS[0], spec: SPECS[1],
          place: 'قاعة المناقشات 2', date: '2027-06-17', time: '12:30', committee: 'د. خالد الغامدي، د. رنا الدوسري',
          students: [
            { name: 'نورة الزهراني', whats: '962790000001', mail: 'noura.zahrani@academy.edu.sa' },
            { name: 'سلطان الدوسري', whats: '962790000012', mail: 'sultan.dosari@academy.edu.sa' },
            { name: 'فيصل الحربي', whats: '962790000013', mail: 'faisal.harbi@academy.edu.sa' },
            { name: 'سعد الحربي', whats: '962790000014', mail: 'saad.harbi@academy.edu.sa' }
          ]
        },
        {
          id: 'A3', grp: '54', proj: 'متجر إلكتروني بتقنيات AR', sup: 'د. نوال الحربي', dept: DEPTS[1], spec: SPECS[3],
          place: 'قاعة المناقشات 1', date: '2027-06-20', time: '09:30', committee: 'د. هدى الجهني، د. رامي الحربي، د. جود الدوسري',
          students: [
            { name: 'مروان الجهني', whats: '962790000002', mail: 'marwan.jahni@academy.edu.sa' },
            { name: 'نواف الحربي', whats: '962790000015', mail: 'nawaf.harbi@academy.edu.sa' }
          ]
        }
      ],
      page: 1
    }
  },

  computed: {
    deptOptions() {
      return DEPTS.map((d) => ({ value: d, label: d }))
    },
    specOptions() {
      return SPECS.map((s) => ({ value: s, label: s }))
    },
    totalStudents() {
      return this.groups.reduce((sum, g) => sum + g.students.length, 0)
    },
    filteredStudentsCount() {
      return this.filteredGroups.reduce((sum, g) => sum + g.students.length, 0)
    },

    filteredGroups() {
      const q = this.search.trim()
      return this.groups.filter((g) => {
        const studentNames = g.students.map((s) => s.name).join(' ')
        const matchQ = !q || `${g.proj}${g.sup}${g.grp}${studentNames}`.includes(q)
        const matchDept = !this.deptFilter || g.dept === this.deptFilter
        const matchSpec = !this.specFilter || g.spec === this.specFilter
        return matchQ && matchDept && matchSpec
      })
    },

    totalPages() {
      return Math.max(1, Math.ceil(this.filteredGroups.length / APPTS_PAGE_SIZE))
    },
    pageOptions() {
      return Array.from({ length: this.totalPages }, (_, i) => ({ value: i + 1, label: `الصفحة ${i + 1} من ${this.totalPages}` }))
    },
    pageDropdown: {
      get() { return this.page },
      set(value) { this.page = value }
    },
    pageGroups() {
      const start = (this.page - 1) * APPTS_PAGE_SIZE
      return this.filteredGroups.slice(start, start + APPTS_PAGE_SIZE)
    }
  },

  watch: {
    filteredGroups() {
      this.page = 1
    }
  },

  methods: {
    formatDate,

    isGroupOpen(id) {
      return this.openGroupIds.includes(id)
    },
    toggleGroup(id) {
      this.openGroupIds = this.isGroupOpen(id) ? this.openGroupIds.filter((x) => x !== id) : [...this.openGroupIds, id]
    },

    isStudentOpen(groupId, idx) {
      return this.openStudentKeys.includes(`${groupId}-${idx}`)
    },
    toggleStudentDetails(groupId, idx) {
      const key = `${groupId}-${idx}`
      this.openStudentKeys = this.isStudentOpen(groupId, idx) ? this.openStudentKeys.filter((k) => k !== key) : [...this.openStudentKeys, key]
    },

    openAddModal() {
      this.isEditing = false
      this.editTargetId = null
      this.apptForm = emptyApptForm()
      this.apptModal = true
    },
    openEditGroup(group) {
      this.isEditing = true
      this.editTargetId = group.id
      this.apptForm = { grp: group.grp, proj: group.proj, sup: group.sup, dept: group.dept, spec: group.spec, place: group.place, date: group.date, time: group.time, committee: group.committee, studentName: '', studentWhats: '' }
      this.apptModal = true
    },
    saveAppointment() {
      const f = this.apptForm
      if (!f.grp || !f.proj || !f.sup || !f.place || !f.date || !f.time || !f.committee) {
        this.$toast?.error('يرجى تعبئة جميع الحقول قبل الحفظ')
        return
      }

      if (this.isEditing) {
        const group = this.groups.find((g) => g.id === this.editTargetId)
        if (group) Object.assign(group, { grp: f.grp, proj: f.proj, sup: f.sup, dept: f.dept, spec: f.spec, place: f.place, date: f.date, time: f.time, committee: f.committee })
        this.apptModal = false
        this.$toast?.success('تم حفظ التعديلات')
        return
      }

      if (!f.studentName || !f.studentWhats) {
        this.$toast?.error('يرجى تعبئة بيانات الطالب الأول')
        return
      }
      const mail = `${f.studentName.split(' ')[0].toLowerCase()}@academy.edu.sa`
      this.groups.push({
        id: `A${this.groups.length + 1}`, grp: f.grp, proj: f.proj, sup: f.sup, dept: f.dept, spec: f.spec,
        place: f.place, date: f.date, time: f.time, committee: f.committee,
        students: [{ name: f.studentName, whats: f.studentWhats, mail }]
      })
      this.apptModal = false
      this.$toast?.success('تم تسجيل موعد المناقشة وإرسال البيانات')
    },

    openAddStudent(group) {
      this.studentTargetId = group.id
      this.studentForm = emptyStudentForm()
      this.studentModal = true
    },
    submitStudent() {
      const f = this.studentForm
      if (!f.name || !f.whats) {
        this.$toast?.error('يرجى تعبئة اسم الطالب ورقم الواتس على الأقل')
        return
      }
      const group = this.groups.find((g) => g.id === this.studentTargetId)
      if (group) group.students.push({ name: f.name, whats: f.whats, mail: f.mail || `${f.name.split(' ')[0].toLowerCase()}@academy.edu.sa` })
      this.studentModal = false
      this.$toast?.success('تم إضافة الطالب')
    },

    openEditStudent(group, idx) {
      this.editStudentTarget = { groupId: group.id, idx }
      const s = group.students[idx]
      this.editStudentForm = { name: s.name, whats: s.whats, mail: s.mail }
      this.editStudentModal = true
    },
    saveEditStudent() {
      const group = this.groups.find((g) => g.id === this.editStudentTarget.groupId)
      if (group) Object.assign(group.students[this.editStudentTarget.idx], this.editStudentForm)
      this.editStudentModal = false
      this.$toast?.success('تم حفظ التعديلات')
    },

    openDeleteGroup(group) {
      this.deleteKind = 'group'
      this.deleteTarget = { groupId: group.id, idx: null }
      this.deleteLabel = `حذف موعد مناقشة مجموعة "${group.grp}" بالكامل`
      this.deleteReason = ''
      this.deleteModal = true
    },
    openDeleteStudent(group, idx) {
      this.deleteKind = 'student'
      this.deleteTarget = { groupId: group.id, idx }
      this.deleteLabel = `حذف "${group.students[idx].name}"`
      this.deleteReason = ''
      this.deleteModal = true
    },
    confirmDelete() {
      if (!this.deleteReason) {
        this.$toast?.error('يرجى كتابة سبب الحذف')
        return
      }
      if (this.deleteKind === 'group') {
        this.groups = this.groups.filter((g) => g.id !== this.deleteTarget.groupId)
      } else {
        const group = this.groups.find((g) => g.id === this.deleteTarget.groupId)
        if (group) group.students.splice(this.deleteTarget.idx, 1)
      }
      this.deleteModal = false
      this.$toast?.success('تم الحذف')
    },

    sendWhats(whats) {
      const num = digitsOnly(whats)
      const full = num.startsWith('966') || num.startsWith('962') ? num : `966${num}`
      window.open(`https://wa.me/${full}`, '_blank')
    },
    sendMail(mail) {
      window.location.href = `mailto:${mail}`
    },
    sendWhatsAll() {
      const contacts = this.groups.flatMap((g) => g.students)
      if (!window.confirm(`سيتم فتح ${contacts.length} محادثة واتساب في تبويبات منفصلة. متابعة؟`)) return
      contacts.forEach((c, i) => setTimeout(() => this.sendWhats(c.whats), i * 300))
    },
    sendMailAll() {
      const emails = this.groups.flatMap((g) => g.students.map((s) => s.mail))
      const url = `https://mail.google.com/mail/?view=cm&fs=1&bcc=${encodeURIComponent(emails.join(','))}&su=${encodeURIComponent('تم حجز موعد مناقشتك')}`
      window.open(url, '_blank')
    },

    importPlaceholder() {
      this.$toast?.info('استيراد من Excel — قريبًا')
    },

    async exportExcel() {
      this.exportingExcel = true
      try {
        const rowGroups = this.groups.map((g) => g.students.map((s) => ({
          grp: g.grp, proj: g.proj, sup: g.sup, dept: g.dept, spec: g.spec, place: g.place, date: g.date, time: g.time, committee: g.committee, name: s.name, whats: s.whats, mail: s.mail
        })))
        await exportStyledExcel({
          fileName: 'مواعيد-المناقشات.xlsx',
          sheetTitle: 'مواعيد المناقشات',
          columns: [
            { key: 'grp', label: 'رقم المجموعة', width: 14 },
            { key: 'proj', label: 'اسم المشروع', width: 30 },
            { key: 'sup', label: 'المشرف', width: 20 },
            { key: 'dept', label: 'القسم', width: 16 },
            { key: 'spec', label: 'التخصص', width: 16 },
            { key: 'place', label: 'المكان', width: 18 },
            { key: 'date', label: 'التاريخ', width: 14 },
            { key: 'time', label: 'الوقت', width: 12 },
            { key: 'committee', label: 'لجنة المناقشة', width: 32 },
            { key: 'name', label: 'اسم الطالب', width: 22 },
            { key: 'whats', label: 'الواتس', width: 16 },
            { key: 'mail', label: 'البريد', width: 28 }
          ],
          rowGroups,
          mergeKeys: ['grp', 'proj', 'sup', 'dept', 'spec', 'place', 'date', 'time', 'committee']
        })
      } finally {
        this.exportingExcel = false
      }
    },

    async exportPdf() {
      this.exportingPdf = true
      try {
        await exportGroupsPdf({
          fileName: 'مواعيد-المناقشات.pdf',
          title: 'تقرير مواعيد المناقشات',
          subtitle: `${this.groups.length} مجموعة — ${this.totalStudents} طالبًا`,
          sections: this.groups.map((g) => ({
            heading: `${g.proj} — مجموعة ${g.grp}`,
            meta: [
              { label: 'المشرف', value: g.sup },
              { label: 'القسم', value: g.dept },
              { label: 'التخصص', value: g.spec },
              { label: 'المكان', value: g.place },
              { label: 'التاريخ', value: `${g.date} — ${g.time}` },
              { label: 'لجنة المناقشة', value: g.committee }
            ],
            tableColumns: [
              { key: 'name', label: 'اسم الطالب' },
              { key: 'whats', label: 'الواتس' },
              { key: 'mail', label: 'البريد' }
            ],
            tableRows: g.students
          }))
        })
      } finally {
        this.exportingPdf = false
      }
    }
  }
}
</script>

<style scoped>
.mono { direction: ltr; text-align: start; display: inline-block; }
</style>
