<template>
  <div class="flex flex-col gap-8">
    <!-- إرسال بيانات الدخول الجماعي -->
    <div class="bg-surface rounded-lg border border-border shadow-card p-5">
      <div class="flex flex-wrap items-start justify-between gap-4 mb-5">
        <div>
          <h3 class="font-cairo font-bold text-h4 text-text-900">إرسال بيانات الدخول جماعيًا</h3>
          <p class="text-caption text-text-600 mt-0.5">اختاري الدور، حدّدي الأعضاء، وأرسلي رابط الدعوة عبر البريد أو واتساب دفعة وحدة</p>
        </div>
        <BaseButton :icon="UserPlus" @click="openAddModal">إضافة عضو</BaseButton>
      </div>

      <div class="flex flex-wrap items-end gap-3 mb-4">
        <div class="min-w-[180px]">
          <BaseSelect v-model="roleFilter" label="الدور" :options="roleOptions" @update:model-value="loadUsers" />
        </div>
        <div class="min-w-[160px]">
          <BaseSelect v-model="channel" label="طريقة الإرسال" :options="channelOptions" />
        </div>
        <div class="min-w-[200px]">
          <BaseInput v-model="search" label="بحث بالاسم" placeholder="اكتبي اسم العضو..." :icon="Search" />
        </div>
        <BaseButton variant="outline" :disabled="!selectedIds.length" @click="preview">معاينة</BaseButton>
        <BaseButton :icon="Send" :loading="sending" :disabled="!previewResult || sending" @click="confirmSend">إرسال ({{ selectedIds.length }})</BaseButton>
      </div>

      <div v-if="usersLoading" class="py-8 text-center text-body-sm text-text-400">جارٍ التحميل...</div>
      <EmptyState v-else-if="!users.length" title="لا يوجد أعضاء" description="لا يوجد أعضاء بهذا الدور حاليًا." />
      <EmptyState v-else-if="!filteredUsers.length" title="لا نتائج" description="لا يوجد عضو مطابق للبحث." />
      <div v-else class="border border-border rounded-sm divide-y divide-border-soft max-h-72 overflow-y-auto">
        <label v-for="u in filteredUsers" :key="u.id" class="flex items-center gap-3 px-3 py-2.5 cursor-pointer hover:bg-border-soft">
          <input v-model="selectedIds" type="checkbox" :value="u.id" @change="previewResult = null">
          <span class="flex-1 min-w-0">
            <span class="text-body-sm font-bold text-text-900">{{ u.name }}</span>
            <span class="text-caption text-text-400 ms-2">{{ channel === 'email' ? (u.email || 'بلا بريد') : (u.whatsapp || 'بلا واتساب') }}</span>
          </span>
        </label>
      </div>

      <!-- نتيجة المعاينة -->
      <div v-if="previewResult" class="mt-5 p-4 rounded-md bg-bg border border-border-soft">
        <div class="flex flex-wrap gap-4 mb-3">
          <BaseBadge variant="success">جاهز للإرسال: {{ previewResult.valid_count }}</BaseBadge>
          <BaseBadge v-if="previewResult.invalid_count" variant="error">غير مؤهّل: {{ previewResult.invalid_count }}</BaseBadge>
        </div>
        <ul v-if="previewResult.invalid?.length" class="flex flex-col gap-1.5">
          <li v-for="item in previewResult.invalid" :key="item.user_id" class="text-caption text-text-600">
            <span class="font-bold text-text-800">{{ item.name }}</span> — {{ item.reason }}
          </li>
        </ul>
      </div>
    </div>

    <!-- سجلّ محاولات الإرسال -->
    <div class="bg-surface rounded-lg border border-border shadow-card overflow-hidden">
      <div class="flex flex-wrap items-center justify-between gap-4 p-5 pb-4">
        <h3 class="font-cairo font-bold text-h4 text-text-900">سجلّ الإرسال</h3>
        <div class="min-w-[160px]">
          <BaseSelect v-model="statusFilter" placeholder="جميع الحالات" include-placeholder-option :options="statusOptions" @update:model-value="loadDeliveries" />
        </div>
      </div>

      <DataTable
        :columns="columns" :rows="deliveryRows" row-key="id" :primary-keys="['name', 'status']"
        :loading="deliveriesLoading"
        empty-title="لا توجد محاولات إرسال بعد"
      >
        <template #cell-status="{ row }">
          <BaseBadge :variant="statusVariant(row.status)">{{ statusLabel(row.status) }}</BaseBadge>
        </template>
        <template #cell-channel="{ value }">{{ value === 'email' ? 'بريد' : 'واتساب' }}</template>
        <template #cell-actions="{ row }">
          <BaseButton v-if="row.status === 'failed'" size="sm" variant="outline" :loading="retryingId === row.id" @click="retry(row)">إعادة المحاولة</BaseButton>
        </template>
      </DataTable>
    </div>

    <!-- إضافة عضو -->
    <BaseModal v-model="addModalOpen" title="إضافة عضو جديد">
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <BaseSelect v-model="addForm.role" label="الدور" :options="roleOptions" class="sm:col-span-2" />
        <BaseInput v-model="addForm.name" label="الاسم" placeholder="مثال: د. نورة العتيبي" class="sm:col-span-2" />
        <BaseInput v-model="addForm.employee_number" label="الرقم الوظيفي" placeholder="اختياري" />
        <BaseInput v-model="addForm.email" type="email" label="البريد الإلكتروني" placeholder="name@mashroui.local" class="sm:col-span-2" />
        <BaseInput v-model="addForm.whatsapp" label="رقم الواتساب" placeholder="مثال: 970591234567" class="sm:col-span-2" />
      </div>
      <template #footer>
        <BaseButton variant="ghost" @click="addModalOpen = false">إلغاء</BaseButton>
        <BaseButton :icon="Send" :loading="adding" @click="submitAdd">إضافة وإرسال البيانات (واتس + بريد)</BaseButton>
      </template>
    </BaseModal>

    <!-- بيانات الحساب بعد الإنشاء -->
    <BaseModal v-model="inviteModalOpen" title="تم إنشاء الحساب" description="تم توليد كلمة سر مؤقتة وفتح واتساب/البريد لإرسالها للعضو تلقائيًا." size="sm">
      <label class="block mb-1.5 text-label font-semibold text-text-700">كلمة السر المؤقتة</label>
      <div class="flex items-center gap-2 mb-3">
        <input :value="inviteTarget?.password" readonly class="flex-1 min-w-0 h-icon-btn px-3 rounded-sm border border-border bg-bg text-body-sm mono">
        <BaseButton :icon="Copy" variant="outline" @click="copyInvitePassword">نسخ</BaseButton>
      </div>
      <label class="block mb-1.5 text-label font-semibold text-text-700">رابط الدعوة (بديل)</label>
      <div class="flex items-center gap-2">
        <input :value="inviteLink" readonly class="flex-1 min-w-0 h-icon-btn px-3 rounded-sm border border-border bg-bg text-body-sm mono">
        <BaseButton :icon="Copy" variant="outline" @click="copyInviteLink">نسخ</BaseButton>
      </div>
      <div class="flex items-center gap-2 mt-3">
        <BaseButton :icon="MessageCircle" variant="outline" class="flex-1" :disabled="!inviteTarget?.whats" @click="sendInviteWhats">إعادة الإرسال عبر واتساب</BaseButton>
        <BaseButton :icon="Mail" variant="outline" class="flex-1" :disabled="!inviteTarget?.mail" @click="sendInviteMail">إعادة الإرسال عبر البريد</BaseButton>
      </div>
      <template #footer>
        <BaseButton block @click="inviteModalOpen = false">تم</BaseButton>
      </template>
    </BaseModal>
  </div>
</template>

<script>
import { mapState, mapActions } from 'pinia'
import { Send, UserPlus, Search, Copy, MessageCircle, Mail } from 'lucide-vue-next'
import { useUsersStore } from '@/stores/users.store'
import { useNotifyStore } from '@/stores/notify.store'
import { formatDateTime } from '@/utils/formatters'
import { APP_NAME } from '@/utils/constants'
import BaseSelect from '@/components/ui/BaseSelect.vue'
import BaseInput from '@/components/ui/BaseInput.vue'
import BaseButton from '@/components/ui/BaseButton.vue'
import BaseBadge from '@/components/ui/BaseBadge.vue'
import BaseModal from '@/components/ui/BaseModal.vue'
import EmptyState from '@/components/ui/EmptyState.vue'
import DataTable from '@/components/ui/DataTable.vue'

const STATUS_LABELS = { pending: 'قيد الإرسال', sent: 'تم الإرسال', failed: 'فشل' }
const STATUS_VARIANTS = { pending: 'warning', sent: 'success', failed: 'error' }

function digitsOnly(value) {
  return String(value || '').replace(/\D/g, '').replace(/^0/, '')
}

const emptyAddForm = () => ({ role: 'supervisor', name: '', employee_number: '', email: '', whatsapp: '' })

export default {
  name: 'SuperAdminBulkNotifyPage',

  components: { BaseSelect, BaseInput, BaseButton, BaseBadge, BaseModal, EmptyState, DataTable },

  data() {
    return {
      Send, UserPlus, Search, Copy, MessageCircle, Mail,
      roleFilter: 'supervisor',
      channel: 'email',
      search: '',
      selectedIds: [],
      previewResult: null,
      sending: false,
      statusFilter: '',
      retryingId: null,

      addModalOpen: false,
      addForm: emptyAddForm(),
      adding: false,
      inviteModalOpen: false,
      inviteLink: '',
      inviteTarget: null,

      roleOptions: [
        { value: 'supervisor', label: 'المشرفون' },
        { value: 'committee', label: 'لجنة الإشراف' }
      ],
      channelOptions: [
        { value: 'email', label: 'البريد الإلكتروني' },
        { value: 'whatsapp', label: 'واتساب' }
      ],
      statusOptions: [
        { value: 'pending', label: 'قيد الإرسال' },
        { value: 'sent', label: 'تم الإرسال' },
        { value: 'failed', label: 'فشل' }
      ],

      columns: [
        { key: 'name', label: 'العضو' },
        { key: 'channel', label: 'الطريقة' },
        { key: 'status', label: 'الحالة' },
        { key: 'sentAt', label: 'وقت الإرسال' },
        { key: 'actions', label: '' }
      ]
    }
  },

  computed: {
    ...mapState(useUsersStore, ['users', 'usersLoading']),
    ...mapState(useNotifyStore, ['deliveries', 'deliveriesLoading']),

    deliveryRows() {
      return this.deliveries.map((d) => ({
        id: d.id,
        name: d.user?.name || '—',
        channel: d.channel,
        status: d.status,
        sentAt: d.sent_at ? formatDateTime(d.sent_at) : '—'
      }))
    },

    filteredUsers() {
      const q = this.search.trim()
      if (!q) return this.users
      return this.users.filter((u) => u.name.includes(q))
    }
  },

  created() {
    this.loadUsers()
    this.loadDeliveries()
  },

  methods: {
    ...mapActions(useUsersStore, ['fetchUsers', 'createUser', 'setUserPassword']),
    ...mapActions(useNotifyStore, ['previewBulkNotify', 'sendBulkNotify', 'fetchDeliveries', 'retryDelivery']),

    async loadUsers() {
      this.selectedIds = []
      this.previewResult = null
      try {
        await this.fetchUsers(this.roleFilter)
      } catch (_) {
        this.$toast?.error('تعذّر تحميل الأعضاء')
      }
    },

    async loadDeliveries() {
      try {
        await this.fetchDeliveries(this.statusFilter ? { status: this.statusFilter } : {})
      } catch (_) {
        // الخطأ متاح عبر deliveriesError عند الحاجة
      }
    },

    async preview() {
      try {
        this.previewResult = await this.previewBulkNotify(this.selectedIds, this.channel)
      } catch (err) {
        this.$toast?.error(err.normalized?.message || 'تعذّر تجهيز المعاينة')
      }
    },

    async confirmSend() {
      this.sending = true
      try {
        const result = await this.sendBulkNotify(this.selectedIds, this.channel)
        this.$toast?.success(`تم إرسال ${result.dispatched.length} رسالة${result.skipped.length ? ` (تخطّي ${result.skipped.length})` : ''}`)
        this.previewResult = null
        this.selectedIds = []
        await this.loadDeliveries()
      } catch (err) {
        this.$toast?.error(err.normalized?.message || 'تعذّر إرسال الرسائل')
      } finally {
        this.sending = false
      }
    },

    async retry(row) {
      this.retryingId = row.id
      try {
        await this.retryDelivery(row.id)
        this.$toast?.success('تمت إعادة المحاولة')
      } catch (err) {
        this.$toast?.error(err.normalized?.message || 'تعذّر إعادة المحاولة')
      } finally {
        this.retryingId = null
      }
    },

    statusLabel(status) {
      return STATUS_LABELS[status] || status
    },
    statusVariant(status) {
      return STATUS_VARIANTS[status] || 'neutral'
    },

    openAddModal() {
      this.addForm = { ...emptyAddForm(), role: this.roleFilter }
      this.addModalOpen = true
    },
    async submitAdd() {
      if (!this.addForm.name || !this.addForm.email) {
        this.$toast?.error('يرجى تعبئة الاسم والبريد الإلكتروني على الأقل')
        return
      }
      this.adding = true
      try {
        const result = await this.createUser(this.addForm)
        const password = await this.setUserPassword(result.user.id)
        this.addModalOpen = false
        this.inviteLink = `${window.location.origin}/reset-password?token=${result.invite_token}`
        this.inviteTarget = { name: this.addForm.name, mail: this.addForm.email, whats: this.addForm.whatsapp, password }
        this.inviteModalOpen = true
        this.sendInviteWhats()
        this.sendInviteMail()
        this.$toast?.success('تم إنشاء الحساب وإرسال بياناته')
        if (this.addForm.role === this.roleFilter) await this.loadUsers()
      } catch (err) {
        this.$toast?.error(err.normalized?.message || 'تعذّر إنشاء الحساب')
      } finally {
        this.adding = false
      }
    },

    inviteMessage() {
      return `مرحبًا ${this.inviteTarget?.name || ''}،\nتم إنشاء حسابك على منصة ${APP_NAME}.\nالبريد الإلكتروني: ${this.inviteTarget?.mail || ''}\nكلمة المرور: ${this.inviteTarget?.password || ''}\nرابط الدخول: ${window.location.origin}/login`
    },
    sendInviteWhats() {
      if (!this.inviteTarget?.whats) return
      const num = digitsOnly(this.inviteTarget.whats)
      const full = num.startsWith('970') || num.startsWith('972') ? num : `970${num}`
      window.open(`https://wa.me/${full}?text=${encodeURIComponent(this.inviteMessage())}`, '_blank')
    },
    sendInviteMail() {
      if (!this.inviteTarget?.mail) return
      const subject = encodeURIComponent(`تم إنشاء حسابك على منصة ${APP_NAME}`)
      window.location.href = `mailto:${this.inviteTarget.mail}?subject=${subject}&body=${encodeURIComponent(this.inviteMessage())}`
    },
    async copyInvitePassword() {
      try {
        await navigator.clipboard.writeText(this.inviteTarget?.password || '')
        this.$toast?.success('تم نسخ كلمة السر')
      } catch {
        this.$toast?.error('تعذّر نسخ كلمة السر')
      }
    },
    async copyInviteLink() {
      try {
        await navigator.clipboard.writeText(this.inviteLink)
        this.$toast?.success('تم نسخ الرابط')
      } catch {
        this.$toast?.error('تعذّر نسخ الرابط')
      }
    }
  }
}
</script>
