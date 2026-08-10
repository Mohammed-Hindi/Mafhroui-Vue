<template>
  <div>
    <div class="flex flex-wrap items-center justify-between gap-4 mb-6">
      <div class="flex items-center gap-3">
        <span class="grid place-items-center w-9 h-9 rounded-md shrink-0 text-white" style="background: linear-gradient(135deg, var(--color-primary-600), var(--color-accent-500))"><ShieldCheck :size="18" /></span>
        <div>
          <h3 class="text-h3 font-bold text-text-900">إدارة حسابات المشرفين ولجنة الإشراف</h3>
          <p class="text-caption text-text-600">إضافة حسابات جديدة، تعديل بياناتها، وتقييد صلاحيات المشرفين</p>
        </div>
      </div>
      <BaseButton :icon="UserPlus" @click="openForm">إضافة عضو جديد</BaseButton>
    </div>

    <div class="flex items-center gap-1 bg-bg border border-border rounded-md p-1 mb-5 w-fit">
      <button
        v-for="tab in tabs" :key="tab.value" type="button"
        class="h-9 px-4 rounded-sm text-caption font-bold transition-colors duration-fast"
        :class="activeTab === tab.value ? 'bg-primary-600 text-white shadow-card' : 'text-text-600 hover:text-primary-700'"
        @click="switchTab(tab.value)"
      >
        {{ tab.label }}
      </button>
    </div>

    <div class="bg-surface rounded-lg border border-border shadow-card overflow-hidden">
      <div class="flex items-center justify-between gap-3 p-5 pb-4">
        <h4 class="text-h4 font-bold text-text-900">{{ activeTabLabel }}</h4>
        <BaseBadge>{{ users.length }} {{ users.length === 1 ? 'عضو' : 'أعضاء' }}</BaseBadge>
      </div>

      <DataTable
        :columns="columns" :rows="users" row-key="id" :primary-keys="['name', 'actions']"
        :loading="usersLoading" empty-title="لا يوجد أعضاء بعد"
        @retry="load"
      >
        <template #cell-name="{ row }">
          <span class="font-bold text-text-900">{{ row.name }}</span>
        </template>
        <template #cell-mail="{ value }"><span class="mono whitespace-nowrap">{{ value || '—' }}</span></template>
        <template #cell-whats="{ value }"><span class="mono">{{ value || '—' }}</span></template>
        <template #cell-empId="{ value }"><span class="mono">{{ value || '—' }}</span></template>
        <template #cell-status="{ row }">
          <BaseBadge :variant="row.status === 'active' ? 'success' : 'error'" dot>{{ row.status === 'active' ? 'نشط' : 'موقوف' }}</BaseBadge>
        </template>
        <template #cell-actions="{ row }">
          <div class="flex gap-1.5">
            <button v-if="activeTab === 'supervisor'" type="button" class="grid place-items-center w-8 h-8 rounded-sm border border-border text-text-600 hover:bg-border-soft hover:text-primary-700" title="القيود" @click="openRestrict(row)"><Lock :size="14" /></button>
            <button type="button" class="grid place-items-center w-8 h-8 rounded-sm border border-border text-text-600 hover:bg-border-soft hover:text-primary-700" title="تعديل" @click="openEdit(row)"><Pencil :size="14" /></button>
            <button type="button" class="grid place-items-center w-8 h-8 rounded-sm border border-border text-text-600 hover:bg-border-soft hover:text-primary-700" title="رابط دعوة جديد" @click="reinvite(row)"><RefreshCw :size="14" /></button>
            <button
              type="button"
              class="grid place-items-center w-8 h-8 rounded-sm border"
              :class="row.status === 'active' ? 'border-error-bg text-error hover:bg-error-bg' : 'border-success-bg text-success hover:bg-success-bg'"
              :title="row.status === 'active' ? 'إيقاف الحساب' : 'تفعيل الحساب'"
              @click="toggleStatus(row)"
            >
              <component :is="row.status === 'active' ? Ban : Check" :size="14" />
            </button>
          </div>
        </template>
      </DataTable>
    </div>

    <!-- إضافة عضو -->
    <BaseModal v-model="formOpen" title="إضافة عضو جديد">
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <BaseInput v-model="form.name" label="الاسم" placeholder="مثال: د. نورة العتيبي" class="sm:col-span-2" />
        <BaseSelect v-model="form.role" label="الدور" :options="roleOptions" />
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
        <input :value="inviteLink" readonly class="flex-1 min-w-0 h-icon-btn px-3 rounded-sm border border-border bg-bg text-body-sm mono" />
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

    <!-- القيود (مشرفين فقط) -->
    <BaseModal v-model="restrictModalOpen" title="قيود الصلاحيات" :description="restrictTarget ? `صلاحيات ${restrictTarget.name} على وحدات النظام` : ''">
      <div class="flex flex-col gap-4">
        <div v-for="mod in modules" :key="mod.value" class="flex items-center justify-between gap-4">
          <span class="text-body-sm font-bold text-text-900">{{ mod.label }}</span>
          <BaseSelect
            class="min-w-[170px]"
            :model-value="restrictLevels[mod.value]"
            :options="levelOptions"
            @update:model-value="setLevel(mod.value, $event)"
          />
        </div>
      </div>
      <template #footer>
        <BaseButton block @click="restrictModalOpen = false">تم</BaseButton>
      </template>
    </BaseModal>
  </div>
</template>

<script>
import { ShieldCheck, UserPlus, RefreshCw, Pencil, Send, Check, Lock, Copy, Ban } from 'lucide-vue-next'
import BaseInput from '@/components/ui/BaseInput.vue'
import BaseSelect from '@/components/ui/BaseSelect.vue'
import BaseButton from '@/components/ui/BaseButton.vue'
import BaseBadge from '@/components/ui/BaseBadge.vue'
import BaseModal from '@/components/ui/BaseModal.vue'
import DataTable from '@/components/ui/DataTable.vue'
import { mapState, mapActions } from 'pinia'
import { useUsersStore } from '@/stores/users.store'

const emptyForm = () => ({ name: '', role: 'supervisor', employee_number: '', email: '', whatsapp: '' })

const MODULES = [
  { value: 'projects', label: 'المشاريع' },
  { value: 'proposals', label: 'المقترحات' },
  { value: 'tasks', label: 'المهام' },
  { value: 'meetings', label: 'الاجتماعات' }
]

const LEVEL_OPTIONS = [
  { value: 'full', label: 'كامل' },
  { value: 'view_only', label: 'عرض فقط' },
  { value: 'blocked', label: 'محظور' }
]

export default {
  name: 'SuperAdminMembersPage',

  components: { ShieldCheck, UserPlus, RefreshCw, Pencil, Lock, Copy, BaseInput, BaseSelect, BaseButton, BaseBadge, BaseModal, DataTable },

  data() {
    return {
      Send, Check, Ban,
      modules: MODULES,
      levelOptions: LEVEL_OPTIONS,
      roleOptions: [
        { value: 'supervisor', label: 'مشرف' },
        { value: 'committee', label: 'لجنة الإشراف' }
      ],
      activeTab: 'supervisor',
      tabs: [
        { value: 'supervisor', label: 'المشرفون' },
        { value: 'committee', label: 'لجنة الإشراف' }
      ],
      columns: [
        { key: 'name', label: 'الاسم' },
        { key: 'empId', label: 'الرقم الوظيفي' },
        { key: 'mail', label: 'البريد' },
        { key: 'whats', label: 'واتساب' },
        { key: 'status', label: 'الحالة' },
        { key: 'actions', label: 'إجراءات' }
      ],

      formOpen: false,
      form: emptyForm(),
      submitting: false,

      inviteModalOpen: false,
      inviteLink: '',

      editModalOpen: false,
      editTargetId: null,
      editForm: { name: '', employee_number: '', whatsapp: '' },

      restrictModalOpen: false,
      restrictTarget: null,
      restrictLevels: {}
    }
  },

  computed: {
    ...mapState(useUsersStore, ['usersLoading']),

    users() {
      const store = useUsersStore()
      return store.users.map((u) => ({
        id: u.id,
        name: u.name,
        empId: u.employee_number,
        mail: u.email,
        whats: u.whatsapp,
        status: u.status
      }))
    },

    activeTabLabel() {
      return this.tabs.find((t) => t.value === this.activeTab)?.label || ''
    }
  },

  async created() {
    await this.load()
  },

  methods: {
    ...mapActions(useUsersStore, ['fetchUsers', 'createUser', 'updateUser', 'updateUserStatus', 'reinviteUser', 'fetchRestrictions', 'setRestriction', 'removeRestriction']),

    async load() {
      await this.fetchUsers(this.activeTab)
    },

    async switchTab(value) {
      this.activeTab = value
      await this.load()
    },

    openForm() {
      this.form = emptyForm()
      this.form.role = this.activeTab
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
        if (this.form.role === this.activeTab) await this.load()
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

    async reinvite(row) {
      try {
        const result = await this.reinviteUser(row.id)
        this.inviteLink = `${window.location.origin}/reset-password?token=${result.token}`
        this.inviteModalOpen = true
        this.$toast?.success('تم إنشاء رابط دعوة جديد')
      } catch (err) {
        this.$toast?.error(err.normalized?.message || 'تعذّر إنشاء رابط الدعوة')
      }
    },

    async toggleStatus(row) {
      const next = row.status === 'active' ? 'restricted' : 'active'
      try {
        await this.updateUserStatus(row.id, next)
        this.$toast?.success(next === 'active' ? 'تم تفعيل الحساب' : 'تم إيقاف الحساب')
        await this.load()
      } catch (err) {
        this.$toast?.error(err.normalized?.message || 'تعذّر تحديث حالة الحساب')
      }
    },

    async openRestrict(row) {
      this.restrictTarget = row
      this.restrictLevels = Object.fromEntries(MODULES.map((m) => [m.value, 'full']))
      this.restrictModalOpen = true
      try {
        const restrictions = await this.fetchRestrictions(row.id)
        restrictions.forEach((r) => { this.restrictLevels[r.module] = r.level })
        this.restrictionIds = Object.fromEntries(restrictions.map((r) => [r.module, r.id]))
      } catch {
        this.$toast?.error('تعذّر تحميل القيود الحالية')
      }
    },

    async setLevel(module, level) {
      this.restrictLevels[module] = level
      try {
        if (level === 'full') {
          const id = this.restrictionIds?.[module]
          if (id) await this.removeRestriction(id)
        } else {
          await this.setRestriction(this.restrictTarget.id, module, level)
        }
        this.$toast?.success('تم تحديث القيد')
      } catch (err) {
        this.$toast?.error(err.normalized?.message || 'تعذّر تحديث القيد')
      }
    }
  }
}
</script>

<style scoped>
.mono { direction: ltr; text-align: start; display: inline-block; }
</style>
