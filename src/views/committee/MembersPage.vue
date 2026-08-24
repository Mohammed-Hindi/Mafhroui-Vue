<template>
  <div>
    <div class="flex justify-end mb-5">
      <BaseButton variant="outline" :icon="Archive" @click="openTrashed">الأعضاء المحذوفون</BaseButton>
    </div>

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
      <DataTable :columns="studentColumns" :rows="studentPageRows" row-key="id" :primary-keys="['name', 'actions']" :loading="teamsLoading" empty-title="لا توجد نتائج مطابقة">
        <template #cell-grp="{ row }">
          <router-link :to="{ name: 'committee-teams' }" class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-pill bg-border-soft text-text-600 text-caption font-semibold hover:bg-primary-100 hover:text-primary-700 transition-colors duration-fast">
            {{ row.grp }} <ExternalLink :size="11" class="opacity-65" />
          </router-link>
        </template>
        <template #cell-name="{ row }">
          <div>
            <span class="font-bold text-text-900">{{ row.name }}</span>
            <span v-if="row.isLeader" class="ms-1.5 text-label font-bold text-primary-700 bg-primary-50 px-2 py-0.5 rounded-pill">قائد</span>
            <span v-if="row.restricted" class="ms-1.5 text-label font-bold text-error bg-error-bg px-2 py-0.5 rounded-pill">موقوف</span>
          </div>
          <div v-if="row.restricted && row.restrictedReason" class="text-label text-error mt-0.5">السبب: {{ row.restrictedReason }}</div>
        </template>
        <template #cell-uid="{ value }"><span class="mono">{{ value || '—' }}</span></template>
        <template #cell-whats="{ value }"><span class="mono">{{ value || '—' }}</span></template>
        <template #cell-mail="{ value }"><span class="mono whitespace-nowrap">{{ value || '—' }}</span></template>
        <template #cell-actions="{ row }">
          <div class="flex gap-1.5">
            <button type="button" class="grid place-items-center w-8 h-8 rounded-sm border border-whatsapp-bg text-whatsapp hover:bg-whatsapp-bg disabled:opacity-40 disabled:pointer-events-none" :disabled="!row.whats" title="واتساب" @click="sendWhats(row.whats)"><MessageCircle :size="14" /></button>
            <button type="button" class="grid place-items-center w-8 h-8 rounded-sm border border-primary-100 text-primary-600 hover:bg-primary-50" title="بريد" @click="sendMail(row.mail)"><Mail :size="14" /></button>
            <button type="button" class="grid place-items-center w-8 h-8 rounded-sm border border-border text-text-600 hover:bg-border-soft hover:text-primary-700" title="تعديل" @click="openEdit(row, 'student')"><Pencil :size="14" /></button>
            <button type="button" class="grid place-items-center w-8 h-8 rounded-sm border border-border text-text-600 hover:bg-border-soft hover:text-primary-700" title="تعيين كلمة السر" @click="openSetPassword(row)"><KeyRound :size="14" /></button>
            <button
              type="button"
              class="grid place-items-center w-8 h-8 rounded-sm border transition-colors duration-fast"
              :class="row.restricted ? 'bg-error text-white border-error hover:brightness-95' : 'border-border text-text-600 hover:bg-error-bg hover:text-error'"
              :title="row.restricted ? 'إلغاء الإيقاف' : 'إيقاف دخول الطالب'"
              @click="toggleRestrict(row)"
            >
              <Lock :size="14" />
            </button>
            <button type="button" class="grid place-items-center w-8 h-8 rounded-sm border border-error-bg text-error hover:bg-error-bg" title="حذف" @click="openDelete(row, 'student')"><Trash2 :size="14" /></button>
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

    <DataTable :columns="supervisorColumns" :rows="supervisorPageRows" row-key="id" :primary-keys="['name', 'actions']" :loading="teamsLoading" empty-title="لا توجد نتائج مطابقة">
      <template #cell-name="{ row }">
        <div>
          <span class="font-bold text-text-900">{{ row.name }}</span>
          <span v-if="row.restricted" class="ms-1.5 text-label font-bold text-error bg-error-bg px-2 py-0.5 rounded-pill">موقوف</span>
        </div>
        <div v-if="row.restricted && row.restrictedReason" class="text-label text-error mt-0.5">السبب: {{ row.restrictedReason }}</div>
      </template>
      <template #cell-empId="{ value }"><span class="mono">{{ value || '—' }}</span></template>
      <template #cell-mail="{ value }"><span class="mono whitespace-nowrap">{{ value || '—' }}</span></template>
      <template #cell-whats="{ value }"><span class="mono">{{ value || '—' }}</span></template>
      <template #cell-actions="{ row }">
        <div class="flex gap-1.5">
          <button type="button" class="grid place-items-center w-8 h-8 rounded-sm border border-whatsapp-bg text-whatsapp hover:bg-whatsapp-bg disabled:opacity-40 disabled:pointer-events-none" :disabled="!row.whats" title="واتساب" @click="sendWhats(row.whats)"><MessageCircle :size="14" /></button>
          <button type="button" class="grid place-items-center w-8 h-8 rounded-sm border border-primary-100 text-primary-600 hover:bg-primary-50" title="بريد" @click="sendMail(row.mail)"><Mail :size="14" /></button>
          <button type="button" class="grid place-items-center w-8 h-8 rounded-sm border border-border text-text-600 hover:bg-border-soft hover:text-primary-700" title="تعديل" @click="openEdit(row, 'supervisor')"><Pencil :size="14" /></button>
          <button type="button" class="grid place-items-center w-8 h-8 rounded-sm border border-border text-text-600 hover:bg-border-soft hover:text-primary-700" title="تعيين كلمة السر" @click="openSetPassword(row)"><KeyRound :size="14" /></button>
          <button
            type="button"
            class="grid place-items-center w-8 h-8 rounded-sm border transition-colors duration-fast"
            :class="row.restricted ? 'bg-error text-white border-error hover:brightness-95' : 'border-border text-text-600 hover:bg-error-bg hover:text-error'"
            :title="row.restricted ? 'إلغاء الإيقاف' : 'إيقاف دخول المشرف'"
            @click="toggleRestrict(row)"
          >
            <Lock :size="14" />
          </button>
          <button type="button" class="grid place-items-center w-8 h-8 rounded-sm border border-error-bg text-error hover:bg-error-bg" title="حذف" @click="openDelete(row, 'supervisor')"><Trash2 :size="14" /></button>
        </div>
      </template>
    </DataTable>
    <Pagination class="mt-4" :current-page="supervisorPage" :last-page="supervisorTotalPages" :total="filteredSupervisors.length" @change="supervisorPage = $event" />

    <BaseModal v-model="editModalOpen" :title="editKind === 'student' ? 'تعديل بيانات الطالب' : 'تعديل بيانات المشرف'">
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <template v-if="editKind === 'student'">
          <BaseInput v-model="editForm.name" label="اسم الطالب" class="sm:col-span-2" />
          <BaseInput v-model="editForm.uid" label="الرقم الجامعي" />
          <BaseInput v-model="editForm.whats" label="رقم الواتس" />
        </template>
        <template v-else>
          <BaseInput v-model="editForm.name" label="اسم الموظف" class="sm:col-span-2" />
          <BaseInput v-model="editForm.empId" label="الرقم الوظيفي" />
          <BaseInput v-model="editForm.whats" label="رقم الواتس" />
        </template>
      </div>
      <template #footer>
        <BaseButton variant="ghost" @click="editModalOpen = false">إلغاء</BaseButton>
        <BaseButton :icon="Check" :loading="submitting" @click="saveEdit">حفظ التعديلات</BaseButton>
      </template>
    </BaseModal>

    <BaseModal v-model="restrictModal" title="إيقاف دخول العضو" :description="restrictTarget ? `سيتعذّر على ‏${restrictTarget.name} تسجيل الدخول حتى تُلغى الإيقاف` : ''" size="sm">
      <BaseInput v-model="restrictReason" label="سبب الإيقاف" placeholder="اكتبي سبب إيقاف هذا العضو" required />
      <template #footer>
        <BaseButton variant="ghost" @click="restrictModal = false">إلغاء</BaseButton>
        <BaseButton variant="danger" :icon="Lock" :loading="submitting" @click="confirmRestrict">تأكيد الإيقاف</BaseButton>
      </template>
    </BaseModal>

    <!-- حذف مع سبب -->
    <BaseModal v-model="deleteModal" title="حذف العضو" :description="deleteTarget ? `سيُحذف حساب ${deleteTarget.name} ويمكن استرجاعه لاحقًا من 'الأعضاء المحذوفون'.` : ''" size="sm">
      <BaseInput v-model="deleteReason" label="سبب الحذف" placeholder="اكتبي سبب حذف هذا العضو" required />
      <template #footer>
        <BaseButton variant="ghost" @click="deleteModal = false">إلغاء</BaseButton>
        <BaseButton variant="danger" :icon="Trash2" :loading="submitting" @click="confirmDelete">تأكيد الحذف</BaseButton>
      </template>
    </BaseModal>

    <!-- الأعضاء المحذوفون -->
    <BaseModal v-model="trashedModal" title="الأعضاء المحذوفون" description="استرجعي أي عضو حُذف بالخطأ" size="lg">
      <div class="flex items-center gap-1 bg-bg border border-border rounded-md p-1 mb-4 w-fit">
        <button
          v-for="tab in trashedTabs" :key="tab.value" type="button"
          class="h-9 px-4 rounded-sm text-caption font-bold transition-colors duration-fast"
          :class="trashedTab === tab.value ? 'bg-primary-600 text-white shadow-card' : 'text-text-600 hover:text-primary-700'"
          @click="switchTrashedTab(tab.value)"
        >
          {{ tab.label }}
        </button>
      </div>
      <SkeletonLoader v-if="trashedUsersLoading" :rows="3" height="60px" />
      <EmptyState v-else-if="!trashedUsers.length" title="لا يوجد أعضاء محذوفون" description="كل الحسابات المحذوفة ستظهر هنا وبإمكانك استرجاعها." />
      <div v-else class="flex flex-col gap-2 max-h-96 overflow-y-auto scrollbar-thin">
        <div v-for="u in trashedUsers" :key="u.id" class="flex items-center justify-between gap-3 p-3 rounded-sm border border-border bg-bg">
          <div class="min-w-0">
            <div class="font-bold text-text-900 truncate">{{ u.name }}</div>
            <div class="text-caption text-text-400 truncate">{{ u.deleted_reason || 'بدون سبب مسجّل' }}</div>
          </div>
          <BaseButton variant="outline" size="sm" :icon="RotateCcw" :loading="restoringId === u.id" @click="confirmRestore(u)">استرجاع</BaseButton>
        </div>
      </div>
      <template #footer>
        <BaseButton variant="ghost" @click="trashedModal = false">إغلاق</BaseButton>
      </template>
    </BaseModal>

    <!-- تعيين كلمة السر -->
    <BaseModal v-model="passwordModal" title="تعيين كلمة سر جديدة" :description="passwordTarget ? `سيتم إنشاء كلمة سر جديدة لحساب ${passwordTarget.name} وسيُطلب منه/ها تغييرها عند أول تسجيل دخول.` : ''" size="sm">
      <template v-if="!generatedPassword">
        <p class="text-body-sm text-text-600">هل تريدين المتابعة؟</p>
      </template>
      <div v-else class="flex items-center gap-2">
        <input :value="generatedPassword" readonly class="flex-1 min-w-0 h-icon-btn px-3 rounded-sm border border-border bg-bg text-body-sm mono">
        <BaseButton :icon="Copy" variant="outline" @click="copyPassword">نسخ</BaseButton>
      </div>
      <template #footer>
        <BaseButton v-if="!generatedPassword" block :icon="KeyRound" :loading="submitting" @click="confirmSetPassword">إنشاء كلمة السر</BaseButton>
        <BaseButton v-else block @click="passwordModal = false">تم</BaseButton>
      </template>
    </BaseModal>
  </div>
</template>

<script>
import { GraduationCap, Users, Search, MessageCircle, Mail, ExternalLink, Pencil, Lock, Check, Trash2, Archive, RotateCcw, KeyRound, Copy } from 'lucide-vue-next'
import { mapState, mapActions } from 'pinia'
import BaseInput from '@/components/ui/BaseInput.vue'
import BaseSelect from '@/components/ui/BaseSelect.vue'
import BaseButton from '@/components/ui/BaseButton.vue'
import BaseModal from '@/components/ui/BaseModal.vue'
import DataTable from '@/components/ui/DataTable.vue'
import Pagination from '@/components/ui/Pagination.vue'
import SkeletonLoader from '@/components/ui/SkeletonLoader.vue'
import EmptyState from '@/components/ui/EmptyState.vue'
import { useTeamsStore } from '@/stores/teams.store'
import { useUsersStore } from '@/stores/users.store'

function digitsOnly(value) {
  return String(value || '').replace(/\D/g, '').replace(/^0/, '')
}
const PAGE_SIZE = 4

export default {
  name: 'CommitteeMembersPage',

  components: { GraduationCap, Users, Search, MessageCircle, Mail, ExternalLink, Pencil, Lock, Archive, KeyRound, Trash2, BaseInput, BaseSelect, BaseButton, BaseModal, DataTable, Pagination, SkeletonLoader, EmptyState },

  data() {
    return {
      Check, Lock, Trash2, RotateCcw, KeyRound, Copy, Archive,
      studentSearch: '',
      specFilter: '',
      studentSupFilter: '',
      supervisorSearch: '',
      studentPage: 1,
      supervisorPage: 1,
      submitting: false,

      editModalOpen: false,
      editKind: 'student',
      editTargetId: null,
      editForm: {},

      restrictModal: false,
      restrictTarget: null,
      restrictReason: '',

      deleteModal: false,
      deleteTarget: null,
      deleteKind: 'student',
      deleteReason: '',

      trashedModal: false,
      trashedTab: 'student',
      trashedTabs: [
        { value: 'student', label: 'الطلاب' },
        { value: 'supervisor', label: 'المشرفون' }
      ],
      restoringId: null,

      passwordModal: false,
      passwordTarget: null,
      generatedPassword: '',

      studentColumns: [
        { key: 'grp', label: 'الفريق' },
        { key: 'name', label: 'اسم العضو' },
        { key: 'uid', label: 'الرقم الجامعي' },
        { key: 'whats', label: 'رقم الواتس' },
        { key: 'mail', label: 'البريد الإلكتروني' },
        { key: 'actions', label: 'إجراءات' }
      ],
      supervisorColumns: [
        { key: 'name', label: 'اسم الموظف' },
        { key: 'empId', label: 'الرقم الوظيفي' },
        { key: 'mail', label: 'البريد الإلكتروني' },
        { key: 'whats', label: 'رقم الواتس' },
        { key: 'actions', label: 'إجراءات' }
      ]
    }
  },

  computed: {
    ...mapState(useTeamsStore, ['teams', 'teamsLoading']),
    ...mapState(useUsersStore, ['trashedUsers', 'trashedUsersLoading']),

    students() {
      const seen = new Set()
      const rows = []
      this.teams.forEach((team) => {
        (team.members || []).forEach((m) => {
          if (!m.student || seen.has(m.student.id)) return
          seen.add(m.student.id)
          rows.push({
            id: m.student.id,
            grp: team.name,
            spec: team.specialization_id,
            sup: team.supervisor?.name || 'غير محدد',
            name: m.student.name,
            uid: m.student.university_number,
            whats: m.student.whatsapp,
            mail: m.student.email,
            isLeader: !!m.is_leader,
            restricted: m.student.status === 'restricted',
            restrictedReason: m.student.restricted_reason
          })
        })
      })
      return rows
    },

    supervisors() {
      const seen = new Set()
      const rows = []
      this.teams.forEach((team) => {
        const sup = team.supervisor
        if (!sup || seen.has(sup.id)) return
        seen.add(sup.id)
        rows.push({
          id: sup.id,
          name: sup.name,
          empId: sup.employee_number,
          mail: sup.email,
          whats: sup.whatsapp,
          restricted: sup.status === 'restricted',
          restrictedReason: sup.restricted_reason
        })
      })
      return rows
    },

    specializationOptions() {
      return [...new Set(this.teams.map((t) => this.specializationName(t.specialization_id)))].map((s) => ({ value: s, label: s }))
    },
    supervisorOptions() {
      return [...new Set(this.supervisors.map((s) => s.name))].map((name) => ({ value: name, label: name }))
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
        const specName = this.specializationName(s.spec)
        const matchQ = !q || `${s.name}${s.uid}${s.sup}`.includes(q)
        const matchSpec = !this.specFilter || specName === this.specFilter
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

  async created() {
    await this.fetchTeams()
  },

  methods: {
    ...mapActions(useTeamsStore, ['fetchTeams', 'specializationName']),
    ...mapActions(useUsersStore, ['updateUser', 'updateUserStatus', 'deleteUser', 'fetchTrashedUsers', 'restoreUser', 'setUserPassword']),

    openEdit(row, kind) {
      this.editKind = kind
      this.editTargetId = row.id
      this.editForm = this.editKind === 'student'
        ? { name: row.name, uid: row.uid || '', whats: row.whats || '' }
        : { name: row.name, empId: row.empId || '', whats: row.whats || '' }
      this.editModalOpen = true
    },
    async saveEdit() {
      if (!this.editForm.name) {
        this.$toast?.error('يرجى إدخال الاسم')
        return
      }
      this.submitting = true
      try {
        const payload = this.editKind === 'student'
          ? { name: this.editForm.name, university_number: this.editForm.uid, whatsapp: this.editForm.whats }
          : { name: this.editForm.name, employee_number: this.editForm.empId, whatsapp: this.editForm.whats }
        await this.updateUser(this.editTargetId, payload)
        this.editModalOpen = false
        this.$toast?.success('تم حفظ التعديلات')
        await this.fetchTeams()
      } catch (err) {
        this.$toast?.error(err.normalized?.message || 'تعذّر حفظ التعديلات')
      } finally {
        this.submitting = false
      }
    },

    toggleRestrict(row) {
      if (row.restricted) {
        this.reactivate(row)
        return
      }
      this.restrictTarget = row
      this.restrictReason = ''
      this.restrictModal = true
    },
    async reactivate(row) {
      try {
        await this.updateUserStatus(row.id, 'active')
        this.$toast?.success('تم إلغاء الإيقاف')
        await this.fetchTeams()
      } catch (err) {
        this.$toast?.error(err.normalized?.message || 'تعذّر إلغاء الإيقاف')
      }
    },
    async confirmRestrict() {
      if (!this.restrictReason.trim()) {
        this.$toast?.error('يرجى إدخال سبب الإيقاف')
        return
      }
      this.submitting = true
      try {
        await this.updateUserStatus(this.restrictTarget.id, 'restricted', this.restrictReason.trim())
        this.restrictModal = false
        this.$toast?.success(`تم إيقاف دخول العضو — السبب: ${this.restrictReason.trim()}`)
        await this.fetchTeams()
      } catch (err) {
        this.$toast?.error(err.normalized?.message || 'تعذّر إيقاف العضو')
      } finally {
        this.submitting = false
      }
    },

    openDelete(row, kind) {
      this.deleteTarget = row
      this.deleteKind = kind
      this.deleteReason = ''
      this.deleteModal = true
    },
    async confirmDelete() {
      if (!this.deleteReason.trim()) {
        this.$toast?.error('يرجى إدخال سبب الحذف')
        return
      }
      this.submitting = true
      try {
        await this.deleteUser(this.deleteTarget.id, this.deleteReason.trim())
        this.deleteModal = false
        this.$toast?.success(`تم حذف العضو — السبب: ${this.deleteReason.trim()}`)
        await this.fetchTeams()
      } catch (err) {
        this.$toast?.error(err.normalized?.message || 'تعذّر حذف العضو')
      } finally {
        this.submitting = false
      }
    },

    async openTrashed() {
      this.trashedModal = true
      await this.loadTrashed()
    },
    async switchTrashedTab(value) {
      this.trashedTab = value
      await this.loadTrashed()
    },
    async loadTrashed() {
      try {
        await this.fetchTrashedUsers(this.trashedTab)
      } catch (err) {
        this.$toast?.error(err.normalized?.message || 'تعذّر تحميل الأعضاء المحذوفين')
      }
    },
    async confirmRestore(user) {
      this.restoringId = user.id
      try {
        await this.restoreUser(user.id)
        this.$toast?.success(`تم استرجاع عضو ${user.name}`)
        await this.fetchTeams()
      } catch (err) {
        this.$toast?.error(err.normalized?.message || 'تعذّر استرجاع العضو')
      } finally {
        this.restoringId = null
      }
    },

    openSetPassword(row) {
      this.passwordTarget = row
      this.generatedPassword = ''
      this.passwordModal = true
    },
    async confirmSetPassword() {
      this.submitting = true
      try {
        this.generatedPassword = await this.setUserPassword(this.passwordTarget.id)
        this.$toast?.success('تم إنشاء كلمة سر جديدة')
      } catch (err) {
        this.$toast?.error(err.normalized?.message || 'تعذّر تعيين كلمة السر')
      } finally {
        this.submitting = false
      }
    },
    async copyPassword() {
      try {
        await navigator.clipboard.writeText(this.generatedPassword)
        this.$toast?.success('تم نسخ كلمة السر')
      } catch {
        this.$toast?.error('تعذّر نسخ كلمة السر')
      }
    },

    sendWhats(whats) {
      if (!whats) return
      const num = digitsOnly(whats)
      const full = num.startsWith('970') || num.startsWith('972') ? num : `970${num}`
      window.open(`https://wa.me/${full}`, '_blank')
    },
    sendMail(mail) {
      window.location.href = `mailto:${mail}`
    },

    sendWhatsAll(list) {
      const contacts = list.filter((c) => c.whats)
      if (!contacts.length) return
      if (!window.confirm(`سيتم فتح ${contacts.length} محادثة واتساب في تبويبات منفصلة. متابعة؟`)) return
      contacts.forEach((c, i) => setTimeout(() => this.sendWhats(c.whats), i * 300))
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
