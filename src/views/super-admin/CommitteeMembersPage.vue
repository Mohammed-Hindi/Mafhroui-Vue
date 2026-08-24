<template>
  <div>
    <div class="flex flex-wrap items-center justify-between gap-4 mb-6">
      <div class="flex items-center gap-3">
        <span class="grid place-items-center w-9 h-9 rounded-md shrink-0 text-white" style="background: linear-gradient(135deg, var(--color-primary-600), var(--color-accent-500))"><ShieldCheck :size="18" /></span>
        <div>
          <h3 class="text-h3 font-bold text-text-900">إضافة وإدارة لجنة الإشراف</h3>
          <p class="text-caption text-text-600">إنشاء حسابات أعضاء لجنة الإشراف والتحكم في صلاحياتها</p>
        </div>
      </div>
    </div>

    <div class="flex flex-wrap items-center gap-2 mb-6">
      <BaseButton variant="outline" :icon="Archive" @click="openTrashed">أعضاء لجنة الإشراف المحذوفون</BaseButton>
      <BaseButton :icon="UserPlus" @click="openForm">إضافة عضو جديد</BaseButton>
    </div>

    <div class="bg-surface rounded-lg border border-border shadow-card overflow-hidden">
      <div class="flex items-center justify-between gap-3 p-5 pb-4">
        <h4 class="text-h4 font-bold text-text-900">أعضاء لجنة الإشراف</h4>
        <BaseBadge>{{ filteredUsers.length }} {{ filteredUsers.length === 1 ? 'عضو' : 'أعضاء' }}</BaseBadge>
      </div>

      <DataTable
        :columns="columns" :rows="pageRows" row-key="id" :primary-keys="['name', 'actions']"
        :loading="usersLoading" empty-title="لا يوجد أعضاء لجنة إشراف بعد"
        @retry="load"
      >
        <template #cell-name="{ row }">
          <span class="font-bold text-text-900">{{ row.name }}</span>
        </template>
        <template #cell-actions="{ row }">
          <div class="flex gap-1.5">
            <button type="button" class="grid place-items-center w-8 h-8 rounded-sm border border-border text-text-600 hover:bg-border-soft hover:text-primary-700" title="تعديل" @click="openEdit(row)"><Pencil :size="14" /></button>
            <button type="button" class="grid place-items-center w-8 h-8 rounded-sm border border-primary-100 text-primary-600 hover:bg-primary-50" title="بريد" @click="sendMail(row.mail)"><Mail :size="14" /></button>
            <button type="button" class="grid place-items-center w-8 h-8 rounded-sm border border-whatsapp-bg text-whatsapp hover:bg-whatsapp-bg disabled:opacity-40 disabled:pointer-events-none" :disabled="!row.whats" title="واتساب" @click="sendWhats(row.whats)"><MessageCircle :size="14" /></button>
            <button type="button" class="grid place-items-center w-8 h-8 rounded-sm border border-error-bg text-error hover:bg-error-bg" title="حذف" @click="openDelete(row)"><Trash2 :size="14" /></button>
          </div>
        </template>
        <template #cell-empId="{ value }"><span class="mono">{{ value || '—' }}</span></template>
        <template #cell-mail="{ value }"><span class="mono whitespace-nowrap">{{ value || '—' }}</span></template>
        <template #cell-whats="{ value }"><span class="mono">{{ value || '—' }}</span></template>
        <template #cell-password="{ row }">
          <div class="flex items-center gap-2">
            <span class="mono">{{ row.password || '—' }}</span>
            <button type="button" class="grid place-items-center w-7 h-7 rounded-sm border border-border text-text-600 hover:bg-border-soft hover:text-primary-700" title="تعيين/تجديد كلمة السر" @click="openSetPassword(row)"><RefreshCw :size="13" /></button>
          </div>
        </template>
        <template #cell-createdAt="{ value }"><span class="mono">{{ value ? value.slice(0, 10) : '—' }}</span></template>
        <template #cell-restrict="{ row }">
          <BaseSelect class="min-w-[150px]" :model-value="row.status" :options="statusOptions" @update:model-value="onRestrictChange(row, $event)" />
        </template>
      </DataTable>

      <div v-if="totalPages > 1" class="px-4 sm:px-6 py-3 border-t border-border-soft">
        <Pagination :current-page="page" :last-page="totalPages" :total="filteredUsers.length" @change="page = $event" />
      </div>
    </div>

    <!-- إضافة عضو -->
    <BaseModal v-model="formOpen" title="إضافة عضو لجنة إشراف">
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <BaseInput v-model="form.name" label="الاسم" placeholder="مثال: د. نورة العتيبي" class="sm:col-span-2" />
        <BaseInput v-model="form.employee_number" label="الرقم الوظيفي" placeholder="اختياري" />
        <BaseInput v-model="form.email" type="email" label="البريد الإلكتروني" placeholder="name@mashroui.local" class="sm:col-span-2" />
        <BaseInput v-model="form.whatsapp" label="رقم الواتساب" placeholder="مثال: 970591234567" class="sm:col-span-2" />
      </div>
      <template #footer>
        <BaseButton block :icon="Send" :loading="submitting" @click="submit">إضافة العضو</BaseButton>
      </template>
    </BaseModal>

    <!-- رابط الدعوة بعد الإنشاء -->
    <BaseModal v-model="inviteModalOpen" title="تم إنشاء الحساب" description="لا تُرسل المنصة كلمات مرور صريحة — شارك رابط الدعوة التالي مع العضو ليعيّن كلمة مروره بنفسه (صالح 3 أيام)." size="sm">
      <div class="flex items-center gap-2">
        <input :value="inviteLink" readonly class="flex-1 min-w-0 h-icon-btn px-3 rounded-sm border border-border bg-bg text-body-sm mono">
        <BaseButton :icon="Copy" variant="outline" @click="copyInviteLink">نسخ</BaseButton>
      </div>
      <template #footer>
        <BaseButton block @click="inviteModalOpen = false">تم</BaseButton>
      </template>
    </BaseModal>

    <!-- تعديل -->
    <BaseModal v-model="editModalOpen" title="تعديل بيانات العضو">
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <BaseInput v-model="editForm.name" label="الاسم" class="sm:col-span-2" />
        <BaseInput v-model="editForm.employee_number" label="الرقم الوظيفي" />
        <BaseInput v-model="editForm.whatsapp" label="رقم الواتساب" />
      </div>
      <template #footer>
        <BaseButton variant="ghost" @click="editModalOpen = false">إلغاء</BaseButton>
        <BaseButton :icon="Check" :loading="submitting" @click="saveEdit">حفظ التعديلات</BaseButton>
      </template>
    </BaseModal>

    <!-- سبب التقييد -->
    <BaseModal v-model="restrictReasonModalOpen" title="سبب التقييد" size="sm">
      <BaseInput v-model="restrictReason" label="سبب التقييد" placeholder="اكتبي سبب تقييد هذا العضو" required />
      <template #footer>
        <BaseButton variant="ghost" @click="cancelRestrict">إلغاء</BaseButton>
        <BaseButton variant="danger" :loading="submitting" @click="confirmRestrictChange">تأكيد</BaseButton>
      </template>
    </BaseModal>

    <!-- حذف مع سبب -->
    <BaseModal v-model="deleteModalOpen" title="حذف الحساب" :description="deleteTarget ? `سيُحذف حساب ${deleteTarget.name} ويمكن استرجاعه لاحقًا من 'أعضاء لجنة الإشراف المحذوفون'.` : ''" size="sm">
      <BaseInput v-model="deleteReason" label="سبب الحذف" placeholder="اكتبي سبب حذف هذا الحساب" required />
      <template #footer>
        <BaseButton variant="ghost" @click="deleteModalOpen = false">إلغاء</BaseButton>
        <BaseButton variant="danger" :icon="Trash2" :loading="submitting" @click="confirmDelete">تأكيد الحذف</BaseButton>
      </template>
    </BaseModal>

    <!-- المحذوفون -->
    <BaseModal v-model="trashedModalOpen" title="أعضاء لجنة الإشراف المحذوفون" description="استرجعي أي حساب حُذف بالخطأ" size="lg">
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
        <BaseButton variant="ghost" @click="trashedModalOpen = false">إغلاق</BaseButton>
      </template>
    </BaseModal>

    <!-- تعيين كلمة السر -->
    <BaseModal v-model="passwordModalOpen" title="تعيين كلمة سر جديدة" :description="passwordTarget ? `سيتم إنشاء كلمة سر جديدة لحساب ${passwordTarget.name} وسيُطلب منه/ها تغييرها عند أول تسجيل دخول.` : ''" size="sm">
      <template v-if="!generatedPassword">
        <p class="text-body-sm text-text-600">هل تريدين المتابعة؟</p>
      </template>
      <div v-else class="flex items-center gap-2">
        <input :value="generatedPassword" readonly class="flex-1 min-w-0 h-icon-btn px-3 rounded-sm border border-border bg-bg text-body-sm mono">
        <BaseButton :icon="Copy" variant="outline" @click="copyPassword">نسخ</BaseButton>
      </div>
      <template #footer>
        <BaseButton v-if="!generatedPassword" block :icon="KeyRound" :loading="submitting" @click="confirmSetPassword">إنشاء كلمة السر</BaseButton>
        <BaseButton v-else block @click="passwordModalOpen = false">تم</BaseButton>
      </template>
    </BaseModal>
  </div>
</template>

<script>
import { ShieldCheck, UserPlus, RefreshCw, Pencil, Send, Check, Copy, Trash2, Archive, RotateCcw, KeyRound, Mail, MessageCircle } from 'lucide-vue-next'
import BaseInput from '@/components/ui/BaseInput.vue'
import BaseSelect from '@/components/ui/BaseSelect.vue'
import BaseButton from '@/components/ui/BaseButton.vue'
import BaseBadge from '@/components/ui/BaseBadge.vue'
import BaseModal from '@/components/ui/BaseModal.vue'
import DataTable from '@/components/ui/DataTable.vue'
import Pagination from '@/components/ui/Pagination.vue'
import SkeletonLoader from '@/components/ui/SkeletonLoader.vue'
import EmptyState from '@/components/ui/EmptyState.vue'
import { mapState, mapActions } from 'pinia'
import { useUsersStore } from '@/stores/users.store'

const emptyForm = () => ({ name: '', role: 'committee', employee_number: '', email: '', whatsapp: '' })
const PAGE_SIZE = 5

function digitsOnly(value) {
  return String(value || '').replace(/\D/g, '').replace(/^0/, '')
}

export default {
  name: 'SuperAdminCommitteeMembersPage',

  components: { ShieldCheck, UserPlus, Pencil, Copy, Trash2, Archive, RotateCcw, KeyRound, Mail, MessageCircle, BaseInput, BaseSelect, BaseButton, BaseBadge, BaseModal, DataTable, Pagination, SkeletonLoader, EmptyState },

  data() {
    return {
      RefreshCw, Send, Check,
      page: 1,
      statusOptions: [
        { value: 'active', label: 'بدون تقييد' },
        { value: 'restricted', label: 'مقيّد' }
      ],
      columns: [
        { key: 'name', label: 'الاسم' },
        { key: 'actions', label: 'إجراءات' },
        { key: 'empId', label: 'الرقم الوظيفي' },
        { key: 'mail', label: 'البريد' },
        { key: 'whats', label: 'واتساب' },
        { key: 'password', label: 'كلمة السر' },
        { key: 'createdAt', label: 'تاريخ الإضافة' },
        { key: 'restrict', label: 'التقييد' }
      ],

      formOpen: false,
      form: emptyForm(),
      submitting: false,

      inviteModalOpen: false,
      inviteLink: '',

      editModalOpen: false,
      editTargetId: null,
      editForm: { name: '', employee_number: '', whatsapp: '' },

      restrictReasonModalOpen: false,
      restrictReason: '',
      restrictPendingRow: null,

      deleteModalOpen: false,
      deleteTarget: null,
      deleteReason: '',

      trashedModalOpen: false,
      restoringId: null,

      passwordModalOpen: false,
      passwordTarget: null,
      generatedPassword: '',
      lastPasswords: {}
    }
  },

  computed: {
    ...mapState(useUsersStore, ['usersLoading', 'trashedUsers', 'trashedUsersLoading']),

    filteredUsers() {
      const store = useUsersStore()
      return store.users.map((u) => ({
        id: u.id,
        name: u.name,
        empId: u.employee_number,
        mail: u.email,
        whats: u.whatsapp,
        status: u.status,
        createdAt: u.created_at,
        password: this.lastPasswords[u.id] || ''
      }))
    },

    totalPages() {
      return Math.max(1, Math.ceil(this.filteredUsers.length / PAGE_SIZE))
    },
    pageRows() {
      const start = (this.page - 1) * PAGE_SIZE
      return this.filteredUsers.slice(start, start + PAGE_SIZE)
    }
  },

  async created() {
    await this.load()
  },

  methods: {
    ...mapActions(useUsersStore, [
      'fetchUsers', 'createUser', 'updateUser', 'updateUserStatus',
      'deleteUser', 'fetchTrashedUsers', 'restoreUser', 'setUserPassword'
    ]),

    async load() {
      await this.fetchUsers('committee')
    },

    openForm() {
      this.form = emptyForm()
      this.formOpen = true
    },

    async submit() {
      if (!this.form.name || !this.form.email) {
        this.$toast?.error('يرجى تعبئة الاسم والبريد الإلكتروني على الأقل')
        return
      }
      this.submitting = true
      try {
        const result = await this.createUser(this.form)
        this.formOpen = false
        this.inviteLink = `${window.location.origin}/reset-password?token=${result.invite_token}`
        this.inviteModalOpen = true
        this.$toast?.success('تم إنشاء الحساب')
        await this.load()
      } catch (err) {
        this.$toast?.error(err.normalized?.message || 'تعذّر إنشاء الحساب')
      } finally {
        this.submitting = false
      }
    },

    async copyInviteLink() {
      try {
        await navigator.clipboard.writeText(this.inviteLink)
        this.$toast?.success('تم نسخ الرابط')
      } catch {
        this.$toast?.error('تعذّر نسخ الرابط')
      }
    },

    openEdit(row) {
      this.editTargetId = row.id
      this.editForm = { name: row.name, employee_number: row.empId || '', whatsapp: row.whats || '' }
      this.editModalOpen = true
    },
    async saveEdit() {
      if (!this.editForm.name) {
        this.$toast?.error('يرجى إدخال الاسم')
        return
      }
      this.submitting = true
      try {
        await this.updateUser(this.editTargetId, this.editForm)
        this.editModalOpen = false
        this.$toast?.success('تم حفظ التعديلات')
        await this.load()
      } catch (err) {
        this.$toast?.error(err.normalized?.message || 'تعذّر حفظ التعديلات')
      } finally {
        this.submitting = false
      }
    },

    sendMail(mail) {
      if (!mail) return
      window.location.href = `mailto:${mail}`
    },
    sendWhats(whats) {
      if (!whats) return
      const num = digitsOnly(whats)
      const full = num.startsWith('970') || num.startsWith('972') ? num : `970${num}`
      window.open(`https://wa.me/${full}`, '_blank')
    },

    onRestrictChange(row, status) {
      if (status === row.status) return
      if (status === 'active') {
        this.applyRestrictChange(row, 'active', null)
        return
      }
      this.restrictPendingRow = row
      this.restrictReason = ''
      this.restrictReasonModalOpen = true
    },
    cancelRestrict() {
      this.restrictReasonModalOpen = false
      this.restrictPendingRow = null
    },
    async confirmRestrictChange() {
      if (!this.restrictReason.trim()) {
        this.$toast?.error('يرجى إدخال سبب التقييد')
        return
      }
      await this.applyRestrictChange(this.restrictPendingRow, 'restricted', this.restrictReason.trim())
      this.restrictReasonModalOpen = false
      this.restrictPendingRow = null
    },
    async applyRestrictChange(row, status, reason) {
      this.submitting = true
      try {
        await this.updateUserStatus(row.id, status, reason)
        this.$toast?.success(status === 'restricted' ? `تم تقييد العضو — السبب: ${reason}` : 'تم إلغاء التقييد')
        await this.load()
      } catch (err) {
        this.$toast?.error(err.normalized?.message || 'تعذّر تحديث التقييد')
      } finally {
        this.submitting = false
      }
    },

    openDelete(row) {
      this.deleteTarget = row
      this.deleteReason = ''
      this.deleteModalOpen = true
    },
    async confirmDelete() {
      if (!this.deleteReason.trim()) {
        this.$toast?.error('يرجى إدخال سبب الحذف')
        return
      }
      this.submitting = true
      try {
        await this.deleteUser(this.deleteTarget.id, this.deleteReason.trim())
        this.deleteModalOpen = false
        this.$toast?.success(`تم حذف الحساب — السبب: ${this.deleteReason.trim()}`)
        await this.load()
      } catch (err) {
        this.$toast?.error(err.normalized?.message || 'تعذّر حذف الحساب')
      } finally {
        this.submitting = false
      }
    },

    async openTrashed() {
      this.trashedModalOpen = true
      try {
        await this.fetchTrashedUsers('committee')
      } catch (err) {
        this.$toast?.error(err.normalized?.message || 'تعذّر تحميل الحسابات المحذوفة')
      }
    },
    async confirmRestore(user) {
      this.restoringId = user.id
      try {
        await this.restoreUser(user.id)
        this.$toast?.success(`تم استرجاع حساب ${user.name}`)
        await this.load()
      } catch (err) {
        this.$toast?.error(err.normalized?.message || 'تعذّر استرجاع الحساب')
      } finally {
        this.restoringId = null
      }
    },

    openSetPassword(row) {
      this.passwordTarget = row
      this.generatedPassword = ''
      this.passwordModalOpen = true
    },
    async confirmSetPassword() {
      this.submitting = true
      try {
        const password = await this.setUserPassword(this.passwordTarget.id)
        this.generatedPassword = password
        this.lastPasswords = { ...this.lastPasswords, [this.passwordTarget.id]: password }
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
    }
  }
}
</script>

<style scoped>
.mono { direction: ltr; text-align: start; display: inline-block; }
</style>
