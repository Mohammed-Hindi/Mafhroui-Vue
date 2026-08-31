<template>
  <div>
    <div class="flex flex-wrap items-center justify-between gap-4 mb-6">
      <div class="flex items-center gap-3">
        <span class="grid place-items-center w-9 h-9 rounded-md shrink-0 text-white" style="background: linear-gradient(135deg, var(--color-primary-600), var(--color-accent-500))">
          <component :is="memberKind === 'student' ? GraduationCap : Users" :size="18" />
        </span>
        <div>
          <h3 class="text-h3 font-bold text-text-900">إدارة الأعضاء</h3>
          <p class="text-caption text-text-600">{{ activeFiltered.length }} من أصل {{ activeList.length }} {{ memberKind === 'student' ? 'طالبًا' : 'مشرفًا' }}</p>
        </div>
      </div>
      <div class="flex flex-wrap items-center gap-2">
        <BaseSelect v-model="memberKind" class="min-w-[150px]" :options="memberKindOptions" />
        <BaseButton variant="outline" :icon="Archive" @click="openTrashed">الأعضاء المحذوفون</BaseButton>
        <BaseButton :icon="UserPlus" @click="openAddModal">إضافة عضو</BaseButton>
      </div>
    </div>

    <div class="flex flex-wrap gap-3 mb-4">
      <button type="button" class="flex items-center gap-2 h-10 px-4 rounded-sm bg-success-bg text-success text-caption font-bold hover:brightness-95 transition-all duration-fast" @click="sendWhatsAll(activeList)">
        <MessageCircle :size="15" /> إرسال واتساب للجميع
      </button>
      <button type="button" class="flex items-center gap-2 h-10 px-4 rounded-sm bg-primary-50 text-primary-700 text-caption font-bold hover:bg-primary-100 transition-colors duration-fast" @click="sendMailAll(activeEmails)">
        <Mail :size="15" /> إرسال بريد للجميع (Gmail)
      </button>
    </div>

    <div class="flex flex-wrap items-center gap-3 mb-6 p-4 rounded-lg bg-surface border border-border shadow-card">
      <div class="relative flex-1 min-w-[220px]">
        <Search :size="16" class="pointer-events-none absolute top-1/2 -translate-y-1/2 start-3 text-text-400" />
        <input v-model.trim="memberSearch" type="search" :placeholder="memberKind === 'student' ? 'ابحث عن طالب، مشرف أو رقم جامعي...' : 'ابحث عن مشرف بالاسم أو الرقم الوظيفي...'" class="w-full h-icon-btn ps-10 pe-3 rounded-sm border border-border bg-bg text-body text-text-900 focus:border-primary-600 transition-colors duration-fast">
      </div>
      <template v-if="memberKind === 'student'">
        <BaseSelect v-model="specFilter" class="min-w-[170px]" placeholder="جميع التخصصات" include-placeholder-option :options="specializationOptions" />
        <BaseSelect v-model="studentSupFilter" class="min-w-[180px]" placeholder="جميع المشرفين" include-placeholder-option :options="supervisorOptions" />
      </template>
    </div>

    <div class="mb-12">
      <DataTable :columns="activeColumns" :rows="memberPageRows" row-key="id" :primary-keys="['name', 'actions']" :loading="activeLoading" empty-title="لا توجد نتائج مطابقة">
        <template #cell-grp="{ row }">
          <router-link v-if="row.grp" :to="{ name: 'committee-teams' }" class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-pill bg-border-soft text-text-600 text-caption font-semibold hover:bg-primary-100 hover:text-primary-700 transition-colors duration-fast">
            {{ row.grp }} <ExternalLink :size="11" class="opacity-65" />
          </router-link>
          <span v-else class="text-caption text-text-400">غير منضم لفريق</span>
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
        <template #cell-empId="{ value }"><span class="mono">{{ value || '—' }}</span></template>
        <template #cell-whats="{ value }"><span class="mono">{{ value || '—' }}</span></template>
        <template #cell-mail="{ value }"><span class="mono whitespace-nowrap">{{ value || '—' }}</span></template>
        <template #cell-pw="{ row }">
          <div class="flex items-center gap-2">
            <button type="button" class="grid place-items-center w-7 h-7 rounded-sm border border-border text-text-400 hover:text-primary-600 hover:bg-primary-50 transition-colors duration-fast shrink-0" title="توليد كلمة سر" :disabled="generatingPwFor === row.id" @click="generatePw(row)">
              <RefreshCw :size="13" />
            </button>
            <span class="mono text-caption tracking-wider min-w-[70px] inline-block">{{ passwords[row.id] ? (visiblePw.includes(row.id) ? passwords[row.id] : maskPw(passwords[row.id])) : '—' }}</span>
            <button v-if="passwords[row.id]" type="button" class="grid place-items-center w-7 h-7 rounded-sm border border-border text-text-400 hover:text-primary-600 hover:bg-primary-50 transition-colors duration-fast shrink-0" title="إظهار/إخفاء كلمة السر" @click="togglePw(row.id)">
              <Eye :size="13" />
            </button>
          </div>
        </template>
        <template #cell-actions="{ row }">
          <div class="flex gap-1.5">
            <button type="button" class="grid place-items-center w-8 h-8 rounded-sm border border-whatsapp-bg text-whatsapp hover:bg-whatsapp-bg disabled:opacity-40 disabled:pointer-events-none" :disabled="!row.whats" title="واتساب" @click="sendWhats(row.whats)"><MessageCircle :size="14" /></button>
            <button type="button" class="grid place-items-center w-8 h-8 rounded-sm border border-primary-100 text-primary-600 hover:bg-primary-50" title="بريد" @click="sendMail(row.mail)"><Mail :size="14" /></button>
            <button type="button" class="grid place-items-center w-8 h-8 rounded-sm border border-border text-text-600 hover:bg-border-soft hover:text-primary-700" title="تعديل" @click="openEdit(row, memberKind)"><Pencil :size="14" /></button>
            <button v-if="isSuperAdmin && memberKind === 'supervisor'" type="button" class="grid place-items-center w-8 h-8 rounded-sm border border-border text-text-600 hover:bg-border-soft hover:text-primary-700" title="القيود على وحدات النظام" @click="openModuleRestrict(row)"><SlidersHorizontal :size="14" /></button>
            <button v-if="isSuperAdmin" type="button" class="grid place-items-center w-8 h-8 rounded-sm border border-border text-text-600 hover:bg-border-soft hover:text-primary-700" :disabled="reinvitingId === row.id" title="نسخ رابط دعوة جديد" @click="quickReinvite(row)"><Link2 :size="14" /></button>
            <button
              type="button"
              class="grid place-items-center w-8 h-8 rounded-sm border transition-colors duration-fast"
              :class="row.restricted ? 'bg-error text-white border-error hover:brightness-95' : 'border-border text-text-600 hover:bg-error-bg hover:text-error'"
              :title="row.restricted ? 'إلغاء الإيقاف' : (memberKind === 'student' ? 'إيقاف دخول الطالب' : 'إيقاف دخول المشرف')"
              @click="toggleRestrict(row, memberKind)"
            >
              <Lock :size="14" />
            </button>
            <button type="button" class="grid place-items-center w-8 h-8 rounded-sm border border-error-bg text-error hover:bg-error-bg" title="حذف" @click="openDelete(row, memberKind)"><Trash2 :size="14" /></button>
          </div>
        </template>
      </DataTable>
      <Pagination class="mt-4" :current-page="memberPage" :last-page="memberTotalPages" :total="activeFiltered.length" @change="memberPage = $event" />
    </div>

    <!-- ===================== إرسال بيانات الدخول الجماعي (سوبر أدمن فقط) ===================== -->
    <template v-if="isSuperAdmin">
      <div class="bg-surface rounded-lg border border-border shadow-card p-5 mt-12">
        <div class="flex flex-wrap items-start justify-between gap-4 mb-5">
          <div>
            <h3 class="font-cairo font-bold text-h4 text-text-900">إرسال بيانات الدخول جماعيًا</h3>
            <p class="text-caption text-text-600 mt-0.5">اختاري الدور، حدّدي الأعضاء، وأرسلي رابط الدعوة عبر البريد أو واتساب دفعة وحدة</p>
          </div>
        </div>

        <div class="flex flex-wrap items-end gap-3 mb-4">
          <div class="min-w-[180px]">
            <BaseSelect v-model="notifyRoleFilter" label="الدور" :options="notifyRoleOptions" @update:model-value="loadNotifyDirectory" />
          </div>
          <div class="min-w-[160px]">
            <BaseSelect v-model="notifyChannel" label="طريقة الإرسال" :options="channelOptions" />
          </div>
          <div class="min-w-[170px]">
            <BaseSelect v-model="notifySpecFilter" label="التخصص" placeholder="جميع التخصصات" include-placeholder-option :options="specializationOptions" />
          </div>
          <div class="min-w-[200px]">
            <BaseInput v-model="notifySearch" label="بحث بالاسم" placeholder="اكتبي اسم العضو..." :icon="Search" />
          </div>
          <BaseButton variant="outline" :disabled="!notifySelectedIds.length" @click="previewNotify">معاينة</BaseButton>
          <BaseButton :icon="Send" :loading="notifySending" :disabled="!notifyPreviewResult || notifySending" @click="confirmSendNotify">إرسال ({{ notifySelectedIds.length }})</BaseButton>
        </div>

        <div v-if="notifyDirectoryLoading" class="py-8 text-center text-body-sm text-text-400">جارٍ التحميل...</div>
        <EmptyState v-else-if="!notifyDirectory.length" title="لا يوجد أعضاء" description="لا يوجد أعضاء بهذا الدور حاليًا." />
        <EmptyState v-else-if="!filteredNotifyDirectory.length" title="لا نتائج" description="لا يوجد عضو مطابق للبحث." />
        <template v-else>
          <label class="flex items-center gap-3 px-3 py-2 mb-1.5 cursor-pointer text-caption font-bold text-text-700">
            <input type="checkbox" :checked="allNotifyFilteredSelected" @change="toggleNotifySelectAll">
            تحديد الكل ({{ filteredNotifyDirectory.length }})
          </label>
          <div class="border border-border rounded-sm divide-y divide-border-soft max-h-72 overflow-y-auto">
            <label v-for="u in filteredNotifyDirectory" :key="u.id" class="flex items-center gap-3 px-3 py-2.5 cursor-pointer hover:bg-border-soft">
              <input v-model="notifySelectedIds" type="checkbox" :value="u.id" @change="notifyPreviewResult = null">
              <span class="flex-1 min-w-0">
                <span class="text-body-sm font-bold text-text-900">{{ u.name }}</span>
                <span class="text-caption text-text-400 ms-2">{{ notifyChannel === 'email' ? (u.email || 'بلا بريد') : (u.whatsapp || 'بلا واتساب') }}</span>
              </span>
            </label>
          </div>
        </template>

        <div v-if="notifyPreviewResult" class="mt-5 p-4 rounded-md bg-bg border border-border-soft">
          <div class="flex flex-wrap gap-4 mb-3">
            <BaseBadge variant="success">جاهز للإرسال: {{ notifyPreviewResult.valid_count }}</BaseBadge>
            <BaseBadge v-if="notifyPreviewResult.invalid_count" variant="error">غير مؤهّل: {{ notifyPreviewResult.invalid_count }}</BaseBadge>
          </div>
          <ul v-if="notifyPreviewResult.invalid?.length" class="flex flex-col gap-1.5">
            <li v-for="item in notifyPreviewResult.invalid" :key="item.user_id" class="text-caption text-text-600">
              <span class="font-bold text-text-800">{{ item.name }}</span> — {{ item.reason }}
            </li>
          </ul>
        </div>
      </div>

      <div class="bg-surface rounded-lg border border-border shadow-card overflow-hidden mt-8">
        <div class="flex flex-wrap items-center justify-between gap-4 p-5 pb-4">
          <h3 class="font-cairo font-bold text-h4 text-text-900">سجلّ الإرسال</h3>
          <div class="min-w-[160px]">
            <BaseSelect v-model="deliveryStatusFilter" placeholder="جميع الحالات" include-placeholder-option :options="statusOptions" @update:model-value="loadDeliveries" />
          </div>
        </div>

        <DataTable
          :columns="deliveryColumns" :rows="deliveryRows" row-key="id" :primary-keys="['name', 'status']"
          :loading="deliveriesLoading"
          empty-title="لا توجد محاولات إرسال بعد"
        >
          <template #cell-status="{ row }">
            <BaseBadge :variant="statusVariant(row.status)">{{ statusLabel(row.status) }}</BaseBadge>
          </template>
          <template #cell-channel="{ value }">{{ value === 'email' ? 'بريد' : 'واتساب' }}</template>
          <template #cell-actions="{ row }">
            <BaseButton v-if="row.status === 'failed'" size="sm" variant="outline" :loading="retryingDeliveryId === row.id" @click="retryDeliveryRow(row)">إعادة المحاولة</BaseButton>
          </template>
        </DataTable>
      </div>
    </template>

    <!-- إضافة عضو -->
    <BaseModal v-model="addModalOpen" title="إضافة عضو جديد">
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <BaseSelect v-model="addForm.role" label="الدور" :options="addRoleOptions" class="sm:col-span-2" />
        <BaseInput v-model="addForm.name" label="الاسم" placeholder="مثال: د. نورة العتيبي" class="sm:col-span-2" />
        <BaseInput v-if="addForm.role === 'student'" v-model="addForm.university_number" label="الرقم الجامعي" placeholder="اختياري" />
        <BaseInput v-else v-model="addForm.employee_number" label="الرقم الوظيفي" placeholder="اختياري" />
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

    <!-- القيود على وحدات النظام (سوبر أدمن — للمشرفين فقط) -->
    <BaseModal v-model="moduleRestrictModalOpen" title="قيود الصلاحيات" :description="moduleRestrictTarget ? `صلاحيات ${moduleRestrictTarget.name} على وحدات النظام` : ''">
      <div class="flex flex-col gap-4">
        <div v-for="mod in modules" :key="mod.value" class="flex items-center justify-between gap-4">
          <span class="text-body-sm font-bold text-text-900">{{ mod.label }}</span>
          <BaseSelect
            class="min-w-[170px]"
            :model-value="moduleRestrictLevels[mod.value]"
            :options="levelOptions"
            @update:model-value="setModuleLevel(mod.value, $event)"
          />
        </div>
        <BaseInput v-model="moduleRestrictReason" label="سبب التقييد" placeholder="سبب تقييد هذا المشرف — مطلوب عند اختيار مستوى غير 'كامل'" />
      </div>
      <template #footer>
        <BaseButton block @click="moduleRestrictModalOpen = false">تم</BaseButton>
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
      <div v-if="trashedTabs.length > 1" class="flex items-center gap-1 bg-bg border border-border rounded-md p-1 mb-4 w-fit">
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

    <EmailComposeModal v-model="emailComposeOpen" :to="emailComposeTarget" />
  </div>
</template>

<script>
import { GraduationCap, Users, Search, MessageCircle, Mail, ExternalLink, Pencil, Lock, Check, Trash2, Archive, RotateCcw, RefreshCw, Eye, UserPlus, Send, Copy, SlidersHorizontal, Link2 } from 'lucide-vue-next'
import { mapState, mapActions } from 'pinia'
import BaseInput from '@/components/ui/BaseInput.vue'
import BaseSelect from '@/components/ui/BaseSelect.vue'
import BaseButton from '@/components/ui/BaseButton.vue'
import BaseBadge from '@/components/ui/BaseBadge.vue'
import BaseModal from '@/components/ui/BaseModal.vue'
import DataTable from '@/components/ui/DataTable.vue'
import Pagination from '@/components/ui/Pagination.vue'
import SkeletonLoader from '@/components/ui/SkeletonLoader.vue'
import EmptyState from '@/components/ui/EmptyState.vue'
import { useTeamsStore } from '@/stores/teams.store'
import { useUsersStore } from '@/stores/users.store'
import { useNotifyStore } from '@/stores/notify.store'
import { useAuthStore } from '@/stores/auth.store'
import { ROLES, APP_NAME } from '@/utils/constants'
import { formatDateTime } from '@/utils/formatters'
import { sendEmail } from '@/services/api'
import EmailComposeModal from '@/components/shared/EmailComposeModal.vue'

function digitsOnly(value) {
  return String(value || '').replace(/\D/g, '').replace(/^0/, '')
}
const PAGE_SIZE = 4

const emptyAddForm = () => ({ role: 'student', name: '', employee_number: '', university_number: '', email: '', whatsapp: '' })

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

const STATUS_LABELS = { pending: 'قيد الإرسال', sent: 'تم الإرسال', failed: 'فشل' }
const STATUS_VARIANTS = { pending: 'warning', sent: 'success', failed: 'error' }

export default {
  name: 'CommitteeMembersPage',

  components: { GraduationCap, Users, Search, MessageCircle, Mail, ExternalLink, Pencil, Lock, Archive, RefreshCw, Eye, Trash2, SlidersHorizontal, Link2, BaseInput, BaseSelect, BaseButton, BaseBadge, BaseModal, DataTable, Pagination, SkeletonLoader, EmptyState, EmailComposeModal },

  data() {
    return {
      Check, Lock, Trash2, RotateCcw, Archive, UserPlus, Send, Copy, GraduationCap, Users,
      emailComposeOpen: false,
      emailComposeTarget: '',
      passwords: {},
      visiblePw: [],
      generatingPwFor: null,
      reinvitingId: null,
      memberKind: 'student',
      memberKindOptions: [
        { value: 'student', label: 'الطلاب' },
        { value: 'supervisor', label: 'المشرفون' }
      ],
      memberSearch: '',
      specFilter: '',
      studentSupFilter: '',
      memberPage: 1,
      submitting: false,

      studentUsers: [],
      studentsLoading: false,
      supervisorUsers: [],
      supervisorsLoading: false,

      addModalOpen: false,
      addForm: emptyAddForm(),
      adding: false,

      inviteModalOpen: false,
      inviteLink: '',
      inviteTarget: null,

      editModalOpen: false,
      editKind: 'student',
      editTargetId: null,
      editForm: {},

      restrictModal: false,
      restrictTarget: null,
      restrictKind: 'student',
      restrictReason: '',

      moduleRestrictModalOpen: false,
      moduleRestrictTarget: null,
      moduleRestrictLevels: {},
      moduleRestrictReason: '',
      modules: MODULES,
      levelOptions: LEVEL_OPTIONS,

      deleteModal: false,
      deleteTarget: null,
      deleteKind: 'student',
      deleteReason: '',

      trashedModal: false,
      trashedTab: 'student',
      restoringId: null,

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

      /** إرسال بيانات الدخول الجماعي — سوبر أدمن فقط */
      notifyRoleFilter: 'supervisor',
      notifyChannel: 'email',
      notifySpecFilter: '',
      notifySearch: '',
      notifySelectedIds: [],
      notifyPreviewResult: null,
      notifySending: false,
      notifyDirectory: [],
      notifyDirectoryLoading: false,
      deliveryStatusFilter: '',
      retryingDeliveryId: null,
      notifyRoleOptions: [
        { value: 'supervisor', label: 'المشرفون' },
        { value: 'committee', label: 'لجنة الإشراف' },
        { value: 'student', label: 'الطلاب' }
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
      deliveryColumns: [
        { key: 'name', label: 'العضو' },
        { key: 'channel', label: 'الطريقة' },
        { key: 'status', label: 'الحالة' },
        { key: 'sentAt', label: 'وقت الإرسال' },
        { key: 'actions', label: '' }
      ]
    }
  },

  computed: {
    ...mapState(useTeamsStore, ['teams', 'specializations']),
    ...mapState(useUsersStore, ['trashedUsers', 'trashedUsersLoading']),
    ...mapState(useNotifyStore, ['deliveries', 'deliveriesLoading']),
    ...mapState(useAuthStore, ['userRole']),

    isSuperAdmin() {
      return this.userRole === ROLES.SUPER_ADMIN
    },

    addRoleOptions() {
      return [
        { value: 'student', label: 'الطلاب' },
        { value: 'supervisor', label: 'المشرفون' }
      ]
    },

    /** خريطة طالب → فريقه (لعمود رقم المجموعة والمشرف) — الفرق تُجلب لهذا الغرض فقط الآن */
    studentTeamMap() {
      const map = {}
      this.teams.forEach((team) => {
        (team.members || []).forEach((m) => {
          if (m.student?.id) map[m.student.id] = { team, isLeader: !!m.is_leader }
        })
      })
      return map
    },

    students() {
      return this.studentUsers.map((u) => {
        const entry = this.studentTeamMap[u.id]
        return {
          id: u.id,
          grp: entry?.team.id ?? null,
          spec: u.specialization_id,
          sup: entry?.team.supervisor?.name || null,
          name: u.name,
          uid: u.university_number,
          whats: u.whatsapp,
          mail: u.email,
          isLeader: !!entry?.isLeader,
          restricted: u.status === 'restricted',
          restrictedReason: u.restricted_reason
        }
      })
    },

    supervisors() {
      return this.supervisorUsers.map((u) => ({
        id: u.id,
        name: u.name,
        empId: u.employee_number,
        mail: u.email,
        whats: u.whatsapp,
        restricted: u.status === 'restricted',
        restrictedReason: u.restricted_reason
      }))
    },

    specializationOptions() {
      return this.specializations.map((s) => ({ value: s.id, label: s.name }))
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
      const q = this.memberSearch.trim()
      return this.students.filter((s) => {
        const specName = this.specializationName(s.spec)
        const matchQ = !q || `${s.name}${s.uid}${s.sup}`.includes(q)
        const matchSpec = !this.specFilter || specName === this.specFilter
        const matchSup = !this.studentSupFilter || s.sup === this.studentSupFilter
        return matchQ && matchSpec && matchSup
      })
    },
    filteredSupervisors() {
      const q = this.memberSearch.trim()
      return this.supervisors.filter((s) => !q || `${s.name}${s.empId}`.includes(q))
    },

    /** القسم الموحّد (طلاب/مشرفون) — يبدّل حسب memberKind */
    activeColumns() {
      return this.memberKind === 'student' ? this.studentColumns : this.supervisorColumns
    },
    activeList() {
      return this.memberKind === 'student' ? this.students : this.supervisors
    },
    activeFiltered() {
      return this.memberKind === 'student' ? this.filteredStudents : this.filteredSupervisors
    },
    activeLoading() {
      return this.memberKind === 'student' ? this.studentsLoading : this.supervisorsLoading
    },
    activeEmails() {
      return this.memberKind === 'student' ? this.studentEmails : this.supervisorEmails
    },
    memberTotalPages() {
      return Math.max(1, Math.ceil(this.activeFiltered.length / PAGE_SIZE))
    },
    memberPageRows() {
      const start = (this.memberPage - 1) * PAGE_SIZE
      return this.activeFiltered.slice(start, start + PAGE_SIZE)
    },

    trashedTabs() {
      return this.isSuperAdmin
        ? [{ value: 'supervisor', label: 'المشرفون' }]
        : [{ value: 'student', label: 'الطلاب' }, { value: 'supervisor', label: 'المشرفون' }]
    },

    /** إرسال بيانات الدخول الجماعي */
    deliveryRows() {
      return this.deliveries.map((d) => ({
        id: d.id,
        name: d.user?.name || '—',
        channel: d.channel,
        status: d.status,
        sentAt: d.sent_at ? formatDateTime(d.sent_at) : '—'
      }))
    },
    filteredNotifyDirectory() {
      const q = this.notifySearch.trim()
      return this.notifyDirectory.filter((u) => {
        const matchQ = !q || u.name.includes(q)
        const matchSpec = !this.notifySpecFilter || u.specialization_id === this.notifySpecFilter
        return matchQ && matchSpec
      })
    },
    allNotifyFilteredSelected() {
      return this.filteredNotifyDirectory.length > 0 && this.filteredNotifyDirectory.every((u) => this.notifySelectedIds.includes(u.id))
    }
  },

  watch: {
    memberKind() {
      this.memberSearch = ''
      this.memberPage = 1
    },
    activeFiltered() {
      this.memberPage = 1
    }
  },

  async created() {
    await Promise.all([this.loadStudents(), this.loadSupervisors(), this.fetchTeams()])
    this.fetchSpecializations()
    if (this.isSuperAdmin) {
      this.loadNotifyDirectory()
      this.loadDeliveries()
    }
  },

  methods: {
    ...mapActions(useTeamsStore, ['fetchTeams', 'fetchSpecializations', 'specializationName']),
    ...mapActions(useUsersStore, [
      'fetchUsers', 'createUser', 'updateUser', 'updateUserStatus', 'reinviteUser',
      'fetchRestrictions', 'setRestriction', 'removeRestriction',
      'deleteUser', 'fetchTrashedUsers', 'restoreUser', 'setUserPassword'
    ]),
    ...mapActions(useNotifyStore, ['previewBulkNotify', 'sendBulkNotify', 'fetchDeliveries', 'retryDelivery']),

    async loadStudents() {
      this.studentsLoading = true
      try {
        this.studentUsers = await this.fetchUsers('student')
      } finally {
        this.studentsLoading = false
      }
    },
    async loadSupervisors() {
      this.supervisorsLoading = true
      try {
        this.supervisorUsers = await this.fetchUsers('supervisor')
      } finally {
        this.supervisorsLoading = false
      }
    },
    async reloadKind(kind) {
      await (kind === 'student' ? this.loadStudents() : this.loadSupervisors())
    },

    openAddModal() {
      this.addForm = emptyAddForm()
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
        await this.reloadKind(this.addForm.role)
      } catch (err) {
        this.$toast?.error(err.normalized?.message || 'تعذّر إنشاء الحساب')
      } finally {
        this.adding = false
      }
    },

    inviteMessage() {
      return `مرحبًا ${this.inviteTarget?.name || ''}،\nتم إنشاء حسابك على منصة ${APP_NAME}.\nالبريد الإلكتروني: ${this.inviteTarget?.mail || ''}\nكلمة المرور: ${this.inviteTarget?.password || ''}\nرابط الدخول: ${window.location.origin}/login`
    },
    async copyInvitePassword() {
      try {
        await navigator.clipboard.writeText(this.inviteTarget?.password || '')
        this.$toast?.success('تم نسخ كلمة السر')
      } catch {
        this.$toast?.error('تعذّر نسخ كلمة السر')
      }
    },
    sendInviteWhats() {
      if (!this.inviteTarget?.whats) return
      const num = digitsOnly(this.inviteTarget.whats)
      const full = num.startsWith('970') || num.startsWith('972') ? num : `970${num}`
      window.open(`https://wa.me/${full}?text=${encodeURIComponent(this.inviteMessage())}`, '_blank')
    },
    async sendInviteMail() {
      if (!this.inviteTarget?.mail) return
      try {
        await sendEmail({
          to: this.inviteTarget.mail,
          subject: `تم إنشاء حسابك على منصة ${APP_NAME}`,
          message: this.inviteMessage()
        })
        this.$toast?.success('تم إرسال البريد')
      } catch (err) {
        this.$toast?.error(err.normalized?.message || 'تعذّر إرسال البريد')
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

    /** سوبر أدمن فقط — رابط دعوة جديد لعضو موجود، يُنسخ للحافظة مباشرة */
    async quickReinvite(row) {
      this.reinvitingId = row.id
      try {
        const result = await this.reinviteUser(row.id)
        const link = `${window.location.origin}/reset-password?token=${result.token}`
        await navigator.clipboard.writeText(link)
        this.$toast?.success('تم نسخ رابط الدعوة الجديد')
      } catch (err) {
        this.$toast?.error(err.normalized?.message || 'تعذّر إنشاء رابط الدعوة')
      } finally {
        this.reinvitingId = null
      }
    },

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
        await this.reloadKind(this.editKind)
      } catch (err) {
        this.$toast?.error(err.normalized?.message || 'تعذّر حفظ التعديلات')
      } finally {
        this.submitting = false
      }
    },

    toggleRestrict(row, kind) {
      this.restrictKind = kind
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
        await this.reloadKind(this.restrictKind)
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
        await this.reloadKind(this.restrictKind)
      } catch (err) {
        this.$toast?.error(err.normalized?.message || 'تعذّر إيقاف العضو')
      } finally {
        this.submitting = false
      }
    },

    /** القيود على وحدات النظام — سوبر أدمن، للمشرفين فقط */
    async openModuleRestrict(row) {
      this.moduleRestrictTarget = row
      this.moduleRestrictReason = ''
      this.moduleRestrictLevels = Object.fromEntries(MODULES.map((m) => [m.value, 'full']))
      this.moduleRestrictModalOpen = true
      try {
        const restrictions = await this.fetchRestrictions(row.id)
        restrictions.forEach((r) => { this.moduleRestrictLevels[r.module] = r.level })
        this.moduleRestrictionIds = Object.fromEntries(restrictions.map((r) => [r.module, r.id]))
        this.moduleRestrictReason = restrictions[0]?.reason || ''
      } catch {
        this.$toast?.error('تعذّر تحميل القيود الحالية')
      }
    },
    async setModuleLevel(module, level) {
      if (level !== 'full' && !this.moduleRestrictReason.trim()) {
        this.$toast?.error('يرجى إدخال سبب التقييد أولًا')
        return
      }
      this.moduleRestrictLevels[module] = level
      try {
        if (level === 'full') {
          const id = this.moduleRestrictionIds?.[module]
          if (id) await this.removeRestriction(id)
        } else {
          await this.setRestriction(this.moduleRestrictTarget.id, module, level, this.moduleRestrictReason.trim())
        }
        this.$toast?.success(level === 'full' ? 'تم إلغاء القيد' : `تم تحديث القيد — السبب: ${this.moduleRestrictReason.trim()}`)
      } catch (err) {
        this.$toast?.error(err.normalized?.message || 'تعذّر تحديث القيد')
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
        await this.reloadKind(this.deleteKind)
      } catch (err) {
        this.$toast?.error(err.normalized?.message || 'تعذّر حذف العضو')
      } finally {
        this.submitting = false
      }
    },

    async openTrashed() {
      this.trashedTab = this.isSuperAdmin ? 'supervisor' : 'student'
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
        await this.reloadKind(this.trashedTab)
      } catch (err) {
        this.$toast?.error(err.normalized?.message || 'تعذّر استرجاع العضو')
      } finally {
        this.restoringId = null
      }
    },

    maskPw(pw) {
      return '•'.repeat(pw.length)
    },
    togglePw(id) {
      this.visiblePw = this.visiblePw.includes(id) ? this.visiblePw.filter((x) => x !== id) : [...this.visiblePw, id]
    },
    async generatePw(row) {
      this.generatingPwFor = row.id
      try {
        const password = await this.setUserPassword(row.id)
        this.passwords = { ...this.passwords, [row.id]: password }
        if (!this.visiblePw.includes(row.id)) this.visiblePw.push(row.id)
        this.$toast?.success('تم إنشاء كلمة سر جديدة')
      } catch (err) {
        this.$toast?.error(err.normalized?.message || 'تعذّر تعيين كلمة السر')
      } finally {
        this.generatingPwFor = null
      }
    },

    sendWhats(whats) {
      if (!whats) return
      const num = digitsOnly(whats)
      const full = num.startsWith('970') || num.startsWith('972') ? num : `970${num}`
      window.open(`https://wa.me/${full}`, '_blank')
    },
    sendMail(mail) {
      if (!mail) return
      this.emailComposeTarget = mail
      this.emailComposeOpen = true
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
    },

    /** إرسال بيانات الدخول الجماعي — سوبر أدمن فقط */
    async loadNotifyDirectory() {
      this.notifySelectedIds = []
      this.notifyPreviewResult = null
      this.notifySpecFilter = ''
      this.notifyDirectoryLoading = true
      try {
        this.notifyDirectory = await this.fetchUsers(this.notifyRoleFilter)
      } catch (_) {
        this.$toast?.error('تعذّر تحميل الأعضاء')
      } finally {
        this.notifyDirectoryLoading = false
      }
    },
    async loadDeliveries() {
      try {
        await this.fetchDeliveries(this.deliveryStatusFilter ? { status: this.deliveryStatusFilter } : {})
      } catch (_) {
        // الخطأ متاح عبر deliveriesError عند الحاجة
      }
    },
    toggleNotifySelectAll() {
      const filteredIds = this.filteredNotifyDirectory.map((u) => u.id)
      this.notifySelectedIds = this.allNotifyFilteredSelected
        ? this.notifySelectedIds.filter((id) => !filteredIds.includes(id))
        : [...new Set([...this.notifySelectedIds, ...filteredIds])]
      this.notifyPreviewResult = null
    },
    async previewNotify() {
      try {
        this.notifyPreviewResult = await this.previewBulkNotify(this.notifySelectedIds, this.notifyChannel)
      } catch (err) {
        this.$toast?.error(err.normalized?.message || 'تعذّر تجهيز المعاينة')
      }
    },
    async confirmSendNotify() {
      this.notifySending = true
      try {
        const result = await this.sendBulkNotify(this.notifySelectedIds, this.notifyChannel)
        this.$toast?.success(`تم إرسال ${result.dispatched.length} رسالة${result.skipped.length ? ` (تخطّي ${result.skipped.length})` : ''}`)
        this.notifyPreviewResult = null
        this.notifySelectedIds = []
        await this.loadDeliveries()
      } catch (err) {
        this.$toast?.error(err.normalized?.message || 'تعذّر إرسال الرسائل')
      } finally {
        this.notifySending = false
      }
    },
    async retryDeliveryRow(row) {
      this.retryingDeliveryId = row.id
      try {
        await this.retryDelivery(row.id)
        this.$toast?.success('تمت إعادة المحاولة')
      } catch (err) {
        this.$toast?.error(err.normalized?.message || 'تعذّر إعادة المحاولة')
      } finally {
        this.retryingDeliveryId = null
      }
    },
    statusLabel(status) {
      return STATUS_LABELS[status] || status
    },
    statusVariant(status) {
      return STATUS_VARIANTS[status] || 'neutral'
    }
  }
}
</script>

<style scoped>
.mono { direction: ltr; text-align: start; display: inline-block; }
</style>
