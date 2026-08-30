<template>
  <div>
    <div class="flex flex-wrap items-center justify-between gap-4 mb-6">
      <div class="flex flex-wrap gap-3">
        <BaseButton :icon="UserPlus" @click="openAddStudent">إضافة طالب</BaseButton>
        <BaseButton variant="secondary" :icon="UserPlus" @click="openAddSupervisor">إضافة مشرف</BaseButton>
        <BaseButton variant="outline" :icon="Upload" @click="openImport">استيراد من Excel</BaseButton>
      </div>
      <div class="flex flex-wrap gap-2">
        <BaseButton variant="outline" :icon="Archive" @click="openTrashed">الفرق المحذوفة</BaseButton>
        <BaseButton variant="outline" :icon="Download" :loading="exportingExcel" @click="exportExcel">تصدير Excel</BaseButton>
        <BaseButton variant="outline" :icon="FileDown" :loading="exportingPdf" @click="exportPdf">تصدير PDF</BaseButton>
      </div>
    </div>

    <div class="flex flex-wrap gap-3 mb-6">
      <button type="button" class="flex items-center gap-2 h-10 px-4 rounded-sm bg-success-bg text-success text-caption font-bold hover:brightness-95 transition-all duration-fast" @click="sendWhatsAll">
        <MessageCircle :size="15" /> إرسال واتساب للجميع ({{ totalMembers }})
      </button>
      <button type="button" class="flex items-center gap-2 h-10 px-4 rounded-sm bg-primary-50 text-primary-700 text-caption font-bold hover:bg-primary-100 transition-colors duration-fast" @click="sendMailAll">
        <Mail :size="15" /> إرسال بريد للجميع (Gmail)
      </button>
    </div>

    <div class="flex flex-wrap items-center gap-3 mb-6 p-4 rounded-lg bg-surface border border-border shadow-card">
      <div class="relative flex-1 min-w-[220px]">
        <Search :size="16" class="pointer-events-none absolute top-1/2 -translate-y-1/2 start-3 text-text-400" />
        <input v-model.trim="search" type="search" placeholder="ابحث عن طالب، مشرف أو رقم جامعي..." class="w-full h-icon-btn ps-10 pe-3 rounded-sm border border-border bg-bg text-body text-text-900 focus:border-primary-600 transition-colors duration-fast">
      </div>
      <BaseSelect v-model="supFilter" class="min-w-[180px]" placeholder="جميع المشرفين" include-placeholder-option :options="supervisorFilterOptions" />
      <BaseSelect v-model="specFilter" class="min-w-[170px]" placeholder="جميع التخصصات" include-placeholder-option :options="specializationOptions" />
    </div>

    <SkeletonLoader v-if="teamsLoading" :rows="4" height="80px" />
    <EmptyState v-else-if="!filteredGroups.length" title="لا توجد مجموعات مطابقة" description="جرّبي تعديل البحث أو الفلاتر، أو أنشئي فريقًا جديدًا." />

    <div v-else class="flex flex-col gap-4">
      <div
        v-for="group in pageGroups" :id="group.id" :key="group.id"
        class="bg-surface border border-border rounded-lg shadow-card overflow-hidden transition-shadow duration-base"
      >
        <div class="flex items-center gap-4 p-4 flex-wrap">
          <button
            type="button" class="grid place-items-center w-9 h-9 rounded-sm bg-border-soft text-text-600 transition-all duration-base shrink-0"
            :class="{ '!bg-primary-600 !text-white rotate-90': isGroupOpen(group.id) }"
            @click="toggleGroup(group.id)"
          >
            <ChevronLeft :size="16" />
          </button>

          <div class="w-10 h-10 rounded-md shrink-0 grid place-items-center font-cairo font-extrabold text-body-sm text-white" style="background: linear-gradient(135deg, var(--color-primary-600), var(--color-accent-500))">
            {{ group.id }}
          </div>

          <div class="flex-1 min-w-0 flex items-center gap-3 sm:gap-6 flex-wrap">
            <div>
              <div class="text-body-sm font-extrabold text-text-900">{{ group.name }}</div>
              <div class="text-label text-text-400">رقم المجموعة {{ group.id }}<template v-if="group.section"> — {{ group.section }}</template></div>
            </div>
            <div class="text-caption"><span class="text-text-400">المشرف </span><span class="font-bold text-text-900">{{ group.sup }}</span></div>
            <BaseBadge variant="info">{{ group.spec }}</BaseBadge>
            <BaseBadge>{{ group.members.length }} {{ group.members.length === 1 ? 'طالب' : 'طلاب' }}</BaseBadge>
          </div>

          <div class="flex gap-1.5 shrink-0">
            <button type="button" class="grid place-items-center w-8 h-8 rounded-sm border border-border text-text-600 hover:bg-border-soft hover:text-primary-700" title="تعديل" @click="openEditGroup(group)"><Pencil :size="14" /></button>
            <button type="button" class="grid place-items-center w-8 h-8 rounded-sm border border-error-bg text-error hover:bg-error-bg" title="حذف" @click="openDeleteGroup(group)"><Trash2 :size="14" /></button>
          </div>
        </div>

        <div v-show="isGroupOpen(group.id)" class="border-t border-border-soft">
          <DataTable
            flush
            :columns="memberColumns" :rows="group.members" row-key="memberId" :primary-keys="['name', 'actions']"
            empty-title="لا يوجد أعضاء بعد"
          >
            <template #cell-name="{ row }">
              <span class="inline-flex items-center gap-2">
                <span class="font-bold text-text-900 truncate" :title="row.name">{{ row.name }}</span>
                <span v-if="row.leader" class="text-label font-bold text-warning-text bg-warning-bg px-2 py-0.5 rounded-pill shrink-0">قائد</span>
              </span>
            </template>
            <template #cell-uid="{ value }"><span class="mono">{{ value || '—' }}</span></template>
            <template #cell-whats="{ value }"><span class="mono">{{ value || '—' }}</span></template>
            <template #cell-mail="{ value }"><span class="mono" :title="value">{{ value }}</span></template>
            <template #cell-leader="{ row }">
              <div class="flex justify-center">
                <button
                  type="button"
                  class="grid place-items-center w-8 h-8 rounded-pill transition-colors duration-fast"
                  :class="row.leader ? 'bg-warning-bg text-warning-text' : 'border border-border text-text-400 hover:bg-warning-bg hover:text-warning-text'"
                  :title="row.leader ? 'قائد الفريق الحالي' : 'تعيين قائدًا للفريق'"
                  @click="requestLeaderChange(group, row)"
                >
                  <Crown :size="14" :fill="row.leader ? 'currentColor' : 'none'" />
                </button>
              </div>
            </template>
            <template #cell-actions="{ row }">
              <div class="flex items-center justify-center gap-1.5">
                <button type="button" class="grid place-items-center w-8 h-8 rounded-pill border border-border text-text-600 hover:bg-border-soft hover:text-primary-700" title="تعديل بيانات العضو" @click="openEditMember(group, row)"><Pencil :size="14" /></button>
                <button type="button" class="grid place-items-center w-8 h-8 rounded-pill bg-whatsapp-bg text-whatsapp hover:brightness-95 disabled:opacity-40 disabled:pointer-events-none" :disabled="!row.whats" title="واتساب" @click="sendWhats(row.whats)"><MessageCircle :size="14" /></button>
                <button type="button" class="grid place-items-center w-8 h-8 rounded-pill bg-primary-50 text-primary-600 hover:brightness-95" title="بريد" @click="sendMail(row.mail)"><Mail :size="14" /></button>
                <button type="button" class="grid place-items-center w-8 h-8 rounded-pill bg-error-bg text-error hover:brightness-95 disabled:opacity-40 disabled:pointer-events-none" :disabled="row.leader" :title="row.leader ? 'لا يمكن حذف القائد' : 'إزالة من الفريق'" @click="requestRemoveMember(group, row)"><Trash2 :size="14" /></button>
              </div>
            </template>
          </DataTable>

          <div class="px-5 py-3 border-t border-border-soft">
            <button type="button" class="inline-flex items-center gap-1.5 text-caption font-bold text-primary-600 hover:underline disabled:opacity-40 disabled:pointer-events-none" :disabled="group.members.length >= 4" @click="openAddMember(group)">
              <Plus :size="14" /> {{ group.members.length >= 4 ? 'الفريق مكتمل (4 أعضاء)' : 'إضافة طالب لهذا الفريق' }}
            </button>
          </div>
        </div>
      </div>
    </div>
    <Pagination class="mt-6" :current-page="page" :last-page="totalPages" :total="filteredGroups.length" @change="page = $event" />

    <!-- إضافة طالب -->
    <BaseModal v-model="addStudentModal" title="إضافة طالب" description="إنشاء حساب الطالب، وإنشاء فريقه الجديد بقائد الفريق الأول (اختياري)" size="lg">
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <BaseInput v-model="addStudentForm.name" label="اسم الطالب" placeholder="مثال: سيف قطناني" class="sm:col-span-2" />
        <BaseInput v-model="addStudentForm.university_number" label="الرقم الجامعي" placeholder="اختياري" />
        <BaseSelect v-model="addStudentForm.specialization_id" label="التخصص" placeholder="اختاري التخصص" :options="specializationSelectOptions" />
        <BaseInput v-model="addStudentForm.email" type="email" label="البريد الإلكتروني" placeholder="name@mashroui.local" />
        <BaseInput v-model="addStudentForm.whatsapp" label="رقم الواتساب" placeholder="مثال: 970591234567" class="sm:col-span-2" />

        <div class="sm:col-span-2 pt-2 mt-1 border-t border-dashed border-border">
          <label class="flex items-center gap-2 text-body-sm font-bold text-text-900 cursor-pointer">
            <input v-model="addStudentForm.createTeam" type="checkbox">
            إنشاء فريق جديد لهذا الطالب (كقائد الفريق)
          </label>
        </div>
        <template v-if="addStudentForm.createTeam">
          <BaseInput v-model="addStudentForm.team_name" label="اسم الفريق" placeholder="مثال: فريق نوفا" />
          <BaseInput v-model="addStudentForm.section" label="الشعبة" placeholder="مثال: شعبة 1" />
          <BaseSelect v-model="addStudentForm.supervisor_id" label="المشرف" placeholder="اختاري المشرف" :options="supervisorOptions" class="sm:col-span-2" />
        </template>
      </div>
      <template #footer>
        <BaseButton variant="ghost" @click="addStudentModal = false">إلغاء</BaseButton>
        <BaseButton :icon="Send" :loading="submitting" @click="submitAddStudent">إضافة وإرسال البيانات (واتس + بريد)</BaseButton>
      </template>
    </BaseModal>

    <!-- إضافة مشرف -->
    <BaseModal v-model="addSupervisorModal" title="إضافة مشرف" description="إنشاء حساب مشرف جديد مباشرة">
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <BaseInput v-model="addSupervisorForm.name" label="اسم المشرف" placeholder="مثال: د. نورة العتيبي" class="sm:col-span-2" />
        <BaseInput v-model="addSupervisorForm.employee_number" label="الرقم الوظيفي" placeholder="اختياري" />
        <BaseInput v-model="addSupervisorForm.email" type="email" label="البريد الإلكتروني" placeholder="name@mashroui.local" class="sm:col-span-2" />
        <BaseInput v-model="addSupervisorForm.whatsapp" label="رقم الواتساب" placeholder="مثال: 970591234567" class="sm:col-span-2" />
      </div>
      <template #footer>
        <BaseButton variant="ghost" @click="addSupervisorModal = false">إلغاء</BaseButton>
        <BaseButton :icon="Send" :loading="submitting" @click="submitAddSupervisor">إضافة وإرسال البيانات (واتس + بريد)</BaseButton>
      </template>
    </BaseModal>

    <!-- بيانات الحساب بعد الإنشاء -->
    <BaseModal v-model="inviteModal" title="تم إنشاء الحساب" description="تم توليد كلمة سر مؤقتة وفتح واتساب/البريد لإرسالها للعضو تلقائيًا." size="sm">
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
        <BaseButton block @click="inviteModal = false">تم</BaseButton>
      </template>
    </BaseModal>

    <!-- استيراد من Excel -->
    <BaseModal v-model="importModal" title="استيراد طلاب من Excel" description="الأعمدة المطلوبة بالترتيب: الاسم، البريد، الرقم الجامعي، الواتساب" size="lg">
      <div v-if="!importPreview">
        <FileDropzone label="ملف الطلاب" accept=".xlsx" hint="Excel (.xlsx) — الأعمدة بالترتيب: الاسم، البريد، الرقم الجامعي، الواتساب" @change="onFileSelected" />
      </div>
      <div v-else class="flex flex-col gap-4">
        <BaseSelect v-model="importSpecId" label="التخصص لكل الطلاب المستوردين" placeholder="اختاري التخصص" :options="specializationSelectOptions" />
        <div v-if="importPreview.valid.length" class="text-body-sm text-success font-bold">{{ importPreview.valid.length }} سجل صالح جاهز للإضافة</div>
        <div v-if="importPreview.invalid.length" class="flex flex-col gap-1.5 max-h-40 overflow-y-auto">
          <p class="text-body-sm text-error font-bold">{{ importPreview.invalid.length }} سجل به أخطاء (لن تُستورد):</p>
          <div v-for="row in importPreview.invalid" :key="row.row" class="text-caption text-error bg-error-bg px-3 py-2 rounded-sm">
            صف {{ row.row }}: {{ row.errors.join('، ') }}
          </div>
        </div>
      </div>
      <template #footer>
        <BaseButton variant="ghost" @click="importModal = false">إلغاء</BaseButton>
        <BaseButton v-if="importPreview" :icon="Check" :loading="submitting" :disabled="!importPreview.valid.length || !importSpecId" @click="submitImport">تأكيد الاستيراد ({{ importPreview?.valid.length || 0 }})</BaseButton>
      </template>
    </BaseModal>

    <!-- إضافة طالب لفريق -->
    <BaseModal v-model="addMemberModal" title="إضافة طالب للفريق" :description="addMemberTarget ? `إضافة عضو إلى ${addMemberTarget.name}` : ''">
      <BaseSelect v-model="addMemberStudentId" label="الطالب" placeholder="اختاري طالبًا غير منضم" :options="unassignedOptions" />
      <template #footer>
        <BaseButton variant="ghost" @click="addMemberModal = false">إلغاء</BaseButton>
        <BaseButton :icon="Check" :loading="submitting" :disabled="!addMemberStudentId" @click="submitAddMember">إضافة</BaseButton>
      </template>
    </BaseModal>

    <!-- تعديل فريق -->
    <BaseModal v-model="editGroupModal" title="تعديل بيانات الفريق">
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <BaseInput v-model="editGroupForm.name" label="اسم الفريق" class="sm:col-span-2" />
        <BaseInput v-model="editGroupForm.section" label="الشعبة" placeholder="مثال: شعبة 1" />
        <BaseSelect v-model="editGroupForm.supervisor_id" label="المشرف" :options="supervisorOptions" />
        <BaseSelect v-model="editGroupForm.specialization_id" label="التخصص" :options="specializationSelectOptions" />
      </div>
      <template #footer>
        <BaseButton variant="ghost" @click="editGroupModal = false">إلغاء</BaseButton>
        <BaseButton :icon="Check" :loading="submitting" @click="saveEditGroup">حفظ التعديلات</BaseButton>
      </template>
    </BaseModal>

    <!-- تعديل بيانات عضو -->
    <BaseModal v-model="editMemberModal" title="تعديل بيانات العضو">
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <BaseInput v-model="editMemberForm.name" label="اسم الطالب" class="sm:col-span-2" />
        <BaseInput v-model="editMemberForm.university_number" label="الرقم الجامعي" />
        <BaseInput v-model="editMemberForm.whatsapp" label="رقم الواتس" />
      </div>
      <template #footer>
        <BaseButton variant="ghost" @click="editMemberModal = false">إلغاء</BaseButton>
        <BaseButton :icon="Check" :loading="submitting" @click="saveEditMember">حفظ التعديلات</BaseButton>
      </template>
    </BaseModal>

    <!-- تأكيد تغيير القائد -->
    <BaseModal v-model="leaderModal" title="تعيين قائد الفريق" :description="leaderTarget ? `سيصبح ‏${leaderTarget.member.name} قائدًا لـ${leaderTarget.group.name}` : ''" size="sm">
      <p class="text-body-sm text-text-600">سيفقد القائد الحالي صلاحية القيادة. هل تريدين المتابعة؟</p>
      <template #footer>
        <BaseButton variant="ghost" @click="leaderModal = false">إلغاء</BaseButton>
        <BaseButton :icon="Crown" :loading="submitting" @click="confirmLeaderChange">تأكيد</BaseButton>
      </template>
    </BaseModal>

    <!-- تأكيد إزالة عضو -->
    <BaseModal v-model="removeMemberModal" title="إزالة عضو من الفريق" :description="removeMemberTarget ? `إزالة ‏${removeMemberTarget.member.name} من ${removeMemberTarget.group.name}` : ''" size="sm">
      <p class="text-body-sm text-text-600">لن يعود الطالب عضوًا بهذا الفريق. هل تريدين المتابعة؟</p>
      <template #footer>
        <BaseButton variant="ghost" @click="removeMemberModal = false">إلغاء</BaseButton>
        <BaseButton variant="danger" :icon="Trash2" :loading="submitting" @click="confirmRemoveMember">تأكيد الإزالة</BaseButton>
      </template>
    </BaseModal>

    <!-- تأكيد حذف فريق -->
    <BaseModal v-model="deleteModal" title="حذف الفريق" :description="deleteTarget ? `حذف فريق ‏${deleteTarget.name} بالكامل` : ''" size="sm">
      <p class="text-body-sm text-text-600">سيُحذف الفريق ويمكن استرجاعه لاحقًا من "الفرق المحذوفة".</p>
      <template #footer>
        <BaseButton variant="ghost" @click="deleteModal = false">إلغاء</BaseButton>
        <BaseButton variant="danger" :icon="Trash2" :loading="submitting" @click="confirmDelete">تأكيد الحذف</BaseButton>
      </template>
    </BaseModal>

    <!-- الفرق المحذوفة -->
    <BaseModal v-model="trashedModal" title="الفرق المحذوفة" description="استرجعي أي فريق حُذف بالخطأ" size="lg">
      <SkeletonLoader v-if="trashedTeamsLoading" :rows="3" height="60px" />
      <EmptyState v-else-if="!trashedTeamsForDisplay.length" title="لا يوجد فرق محذوفة" description="كل الفرق المحذوفة ستظهر هنا وبإمكانك استرجاعها." />
      <div v-else class="flex flex-col gap-2 max-h-96 overflow-y-auto scrollbar-thin">
        <div v-for="group in trashedTeamsForDisplay" :key="group.id" class="flex items-center justify-between gap-3 p-3 rounded-sm border border-border bg-bg">
          <div class="min-w-0">
            <div class="font-bold text-text-900 truncate">{{ group.name }}</div>
            <div class="text-caption text-text-400">المشرف {{ group.sup }} · {{ group.members.length }} {{ group.members.length === 1 ? 'طالب' : 'طلاب' }}</div>
          </div>
          <BaseButton variant="outline" size="sm" :icon="RotateCcw" :loading="restoringId === group.id" @click="confirmRestore(group)">استرجاع</BaseButton>
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
import { mapState, mapActions } from 'pinia'
import { Plus, Upload, Download, FileDown, Search, ChevronLeft, MessageCircle, Mail, Pencil, Trash2, Check, Crown, Archive, RotateCcw, UserPlus, Send, Copy } from 'lucide-vue-next'
import BaseButton from '@/components/ui/BaseButton.vue'
import BaseSelect from '@/components/ui/BaseSelect.vue'
import BaseInput from '@/components/ui/BaseInput.vue'
import BaseBadge from '@/components/ui/BaseBadge.vue'
import BaseModal from '@/components/ui/BaseModal.vue'
import EmptyState from '@/components/ui/EmptyState.vue'
import SkeletonLoader from '@/components/ui/SkeletonLoader.vue'
import DataTable from '@/components/ui/DataTable.vue'
import Pagination from '@/components/ui/Pagination.vue'
import { useTeamsStore } from '@/stores/teams.store'
import { useUsersStore } from '@/stores/users.store'
import { exportStyledExcel, exportGroupsPdf } from '@/utils/exportReport'
import { APP_NAME } from '@/utils/constants'
import { sendEmail } from '@/services/api'
import FileDropzone from '@/components/shared/FileDropzone.vue'
import EmailComposeModal from '@/components/shared/EmailComposeModal.vue'

const GROUPS_PAGE_SIZE = 5

function digitsOnly(value) {
  return String(value || '').replace(/\D/g, '').replace(/^0/, '')
}

const emptyStudentForm = () => ({ name: '', university_number: '', email: '', whatsapp: '', createTeam: false, team_name: '', section: '', specialization_id: '', supervisor_id: '' })
const emptySupervisorForm = () => ({ name: '', employee_number: '', email: '', whatsapp: '' })

export default {
  name: 'CommitteeTeamsPage',

  components: { Search, ChevronLeft, MessageCircle, Mail, Pencil, Trash2, Crown, UserPlus, Plus, BaseButton, BaseSelect, BaseInput, BaseBadge, BaseModal, EmptyState, SkeletonLoader, DataTable, Pagination, FileDropzone, EmailComposeModal },

  data() {
    return {
      Plus, Upload, Download, FileDown, Check, Trash2, Crown, Archive, RotateCcw, Send, Copy, UserPlus,
      memberColumns: [
        { key: 'name', label: 'اسم العضو' },
        { key: 'uid', label: 'الرقم الجامعي' },
        { key: 'whats', label: 'الواتس' },
        { key: 'mail', label: 'البريد' },
        { key: 'leader', label: 'قائد الفريق', className: 'text-center' },
        { key: 'actions', label: 'إجراءات', className: 'text-center' }
      ],
      exportingExcel: false,
      exportingPdf: false,
      submitting: false,
      search: '',
      supFilter: '',
      specFilter: '',
      openGroupIds: [],
      emailComposeOpen: false,
      emailComposeTarget: '',

      addStudentModal: false,
      addStudentForm: emptyStudentForm(),

      addSupervisorModal: false,
      addSupervisorForm: emptySupervisorForm(),

      inviteModal: false,
      inviteLink: '',
      inviteTarget: null,

      importModal: false,
      importPreview: null,
      importSpecId: '',
      importRows: [],

      addMemberModal: false,
      addMemberTarget: null,
      addMemberStudentId: '',
      unassignedOptions: [],

      editGroupModal: false,
      editGroupTargetId: null,
      editGroupForm: {},

      editMemberModal: false,
      editMemberTargetId: null,
      editMemberForm: {},

      leaderModal: false,
      leaderTarget: null,

      removeMemberModal: false,
      removeMemberTarget: null,

      deleteModal: false,
      deleteTarget: null,

      trashedModal: false,
      restoringId: null,

      page: 1
    }
  },

  computed: {
    ...mapState(useTeamsStore, ['teams', 'teamsLoading', 'specializations', 'trashedTeamsForDisplay', 'trashedTeamsLoading']),

    groups() {
      return this.teams.map((team) => ({
        id: team.id,
        name: team.name,
        section: team.section || '',
        spec: this.specializationName(team.specialization_id),
        specId: team.specialization_id,
        sup: team.supervisor?.name || 'غير محدد',
        supId: team.supervisor?.id ?? null,
        members: (team.members || []).map((m) => ({
          memberId: m.id,
          studentId: m.student?.id,
          name: m.student?.name || '',
          uid: m.student?.university_number,
          whats: m.student?.whatsapp,
          mail: m.student?.email,
          leader: !!m.is_leader
        }))
      }))
    },

    supervisorOptions() {
      const seen = new Set()
      const options = []
      this.teams.forEach((t) => {
        if (t.supervisor && !seen.has(t.supervisor.id)) {
          seen.add(t.supervisor.id)
          options.push({ value: t.supervisor.id, label: t.supervisor.name })
        }
      })
      return options
    },
    supervisorFilterOptions() {
      return [...new Set(this.groups.map((g) => g.sup))].map((name) => ({ value: name, label: name }))
    },
    specializationOptions() {
      return [...new Set(this.groups.map((g) => g.spec))].map((s) => ({ value: s, label: s }))
    },
    specializationSelectOptions() {
      return this.specializations.map((s) => ({ value: s.id, label: s.name }))
    },

    totalMembers() {
      return this.groups.reduce((sum, g) => sum + g.members.length, 0)
    },

    filteredGroups() {
      const q = this.search.trim()
      return this.groups.filter((g) => {
        const memberNames = g.members.map((m) => m.name).join(' ')
        const matchQ = !q || `${g.name}${g.sup}${memberNames}`.includes(q)
        const matchSup = !this.supFilter || g.sup === this.supFilter
        const matchSpec = !this.specFilter || g.spec === this.specFilter
        return matchQ && matchSup && matchSpec
      })
    },

    totalPages() {
      return Math.max(1, Math.ceil(this.filteredGroups.length / GROUPS_PAGE_SIZE))
    },
    pageGroups() {
      const start = (this.page - 1) * GROUPS_PAGE_SIZE
      return this.filteredGroups.slice(start, start + GROUPS_PAGE_SIZE)
    }
  },

  watch: {
    filteredGroups() {
      this.page = 1
    }
  },

  async created() {
    await Promise.all([this.fetchTeams(), this.fetchSpecializations()])
  },

  methods: {
    ...mapActions(useTeamsStore, ['fetchTeams', 'fetchSpecializations', 'specializationName', 'createTeam', 'updateTeam', 'deleteTeam', 'addTeamMember', 'removeTeamMember', 'updateTeamLeader', 'previewTeamImport', 'confirmTeamImport', 'fetchTrashedTeams', 'restoreTeam']),
    ...mapActions(useUsersStore, ['fetchUsers', 'createUser', 'updateUser', 'setUserPassword']),

    isGroupOpen(id) {
      return this.openGroupIds.includes(id)
    },
    toggleGroup(id) {
      this.openGroupIds = this.isGroupOpen(id) ? this.openGroupIds.filter((x) => x !== id) : [...this.openGroupIds, id]
    },

    openAddStudent() {
      this.addStudentForm = emptyStudentForm()
      this.addStudentModal = true
    },
    async submitAddStudent() {
      const f = this.addStudentForm
      if (!f.name || !f.email) {
        this.$toast?.error('يرجى تعبئة الاسم والبريد الإلكتروني على الأقل')
        return
      }
      if (f.createTeam && (!f.team_name || !f.specialization_id || !f.supervisor_id)) {
        this.$toast?.error('يرجى تعبئة اسم الفريق والتخصص والمشرف لإنشاء الفريق')
        return
      }
      this.submitting = true
      try {
        const result = await this.createUser({
          name: f.name, email: f.email, whatsapp: f.whatsapp, university_number: f.university_number,
          role: 'student', specialization_id: f.specialization_id || null
        })
        const password = await this.setUserPassword(result.user.id)
        if (f.createTeam) {
          await this.createTeam({
            name: f.team_name, section: f.section || null, supervisor_id: f.supervisor_id, specialization_id: f.specialization_id,
            member_ids: [result.user.id], leader_id: result.user.id
          })
        }
        this.addStudentModal = false
        this.inviteLink = `${window.location.origin}/reset-password?token=${result.invite_token}`
        this.inviteTarget = { name: f.name, mail: f.email, whats: f.whatsapp, password }
        this.inviteModal = true
        this.sendInviteWhats()
        this.sendInviteMail()
        this.$toast?.success('تم إنشاء حساب الطالب وإرسال بياناته')
      } catch (err) {
        this.$toast?.error(err.normalized?.message || 'تعذّر إنشاء حساب الطالب')
      } finally {
        this.submitting = false
      }
    },

    openAddSupervisor() {
      this.addSupervisorForm = emptySupervisorForm()
      this.addSupervisorModal = true
    },
    async submitAddSupervisor() {
      if (!this.addSupervisorForm.name || !this.addSupervisorForm.email) {
        this.$toast?.error('يرجى تعبئة الاسم والبريد الإلكتروني على الأقل')
        return
      }
      this.submitting = true
      try {
        const result = await this.createUser({ ...this.addSupervisorForm, role: 'supervisor' })
        const password = await this.setUserPassword(result.user.id)
        this.addSupervisorModal = false
        this.inviteLink = `${window.location.origin}/reset-password?token=${result.invite_token}`
        this.inviteTarget = { name: this.addSupervisorForm.name, mail: this.addSupervisorForm.email, whats: this.addSupervisorForm.whatsapp, password }
        this.inviteModal = true
        this.sendInviteWhats()
        this.sendInviteMail()
        this.$toast?.success('تم إنشاء حساب المشرف وإرسال بياناته')
      } catch (err) {
        this.$toast?.error(err.normalized?.message || 'تعذّر إنشاء حساب المشرف')
      } finally {
        this.submitting = false
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
    },

    openImport() {
      this.importPreview = null
      this.importSpecId = ''
      this.importRows = []
      this.importModal = true
    },
    async onFileSelected(file) {
      if (!file) return
      this.submitting = true
      try {
        const result = await this.previewTeamImport(file)
        this.importPreview = result
        this.importRows = result.valid
      } catch (err) {
        this.$toast?.error(err.normalized?.message || 'تعذّر قراءة الملف')
      } finally {
        this.submitting = false
      }
    },
    async submitImport() {
      if (!this.importRows.length || !this.importSpecId) return
      this.submitting = true
      try {
        await this.confirmTeamImport(this.importRows, this.importSpecId)
        this.importModal = false
        this.$toast?.success(`تم إنشاء ${this.importRows.length} حساب طالب`)
      } catch (err) {
        this.$toast?.error(err.normalized?.message || 'تعذّر تأكيد الاستيراد')
      } finally {
        this.submitting = false
      }
    },

    async openAddMember(group) {
      this.addMemberTarget = group
      this.addMemberStudentId = ''
      this.addMemberModal = true
      try {
        const students = await this.fetchUsers('student', { unassigned: 1 })
        this.unassignedOptions = students.map((s) => ({ value: s.id, label: s.name }))
      } catch {
        this.$toast?.error('تعذّر تحميل الطلاب المتاحين')
      }
    },
    async submitAddMember() {
      if (!this.addMemberStudentId) return
      this.submitting = true
      try {
        await this.addTeamMember(this.addMemberTarget.id, this.addMemberStudentId)
        this.addMemberModal = false
        this.$toast?.success('تم إضافة الطالب للفريق')
      } catch (err) {
        this.$toast?.error(err.normalized?.message || 'تعذّر إضافة الطالب')
      } finally {
        this.submitting = false
      }
    },

    openEditMember(group, member) {
      this.editMemberTargetId = member.studentId
      this.editMemberForm = { name: member.name, university_number: member.uid || '', whatsapp: member.whats || '' }
      this.editMemberModal = true
    },
    async saveEditMember() {
      if (!this.editMemberForm.name) {
        this.$toast?.error('يرجى إدخال الاسم')
        return
      }
      this.submitting = true
      try {
        await this.updateUser(this.editMemberTargetId, this.editMemberForm)
        this.editMemberModal = false
        this.$toast?.success('تم حفظ التعديلات')
        await this.fetchTeams()
      } catch (err) {
        this.$toast?.error(err.normalized?.message || 'تعذّر حفظ التعديلات')
      } finally {
        this.submitting = false
      }
    },

    requestLeaderChange(group, member) {
      if (member.leader) return
      this.leaderTarget = { group, member }
      this.leaderModal = true
    },
    async confirmLeaderChange() {
      this.submitting = true
      try {
        await this.updateTeamLeader(this.leaderTarget.group.id, this.leaderTarget.member.studentId)
        this.leaderModal = false
        this.$toast?.success('تم تعيين قائد الفريق')
      } catch (err) {
        this.$toast?.error(err.normalized?.message || 'تعذّر تعيين القائد')
      } finally {
        this.submitting = false
      }
    },

    requestRemoveMember(group, member) {
      if (member.leader) return
      this.removeMemberTarget = { group, member }
      this.removeMemberModal = true
    },
    async confirmRemoveMember() {
      this.submitting = true
      try {
        await this.removeTeamMember(this.removeMemberTarget.group.id, this.removeMemberTarget.member.memberId)
        this.removeMemberModal = false
        this.$toast?.success('تمت إزالة العضو من الفريق')
      } catch (err) {
        this.$toast?.error(err.normalized?.message || 'تعذّر إزالة العضو')
      } finally {
        this.submitting = false
      }
    },

    openEditGroup(group) {
      this.editGroupTargetId = group.id
      this.editGroupForm = { name: group.name, section: group.section, supervisor_id: group.supId, specialization_id: group.specId }
      this.editGroupModal = true
    },
    async saveEditGroup() {
      this.submitting = true
      try {
        await this.updateTeam(this.editGroupTargetId, this.editGroupForm)
        this.editGroupModal = false
        this.$toast?.success('تم حفظ التعديلات')
      } catch (err) {
        this.$toast?.error(err.normalized?.message || 'تعذّر حفظ التعديلات')
      } finally {
        this.submitting = false
      }
    },

    openDeleteGroup(group) {
      this.deleteTarget = group
      this.deleteModal = true
    },
    async confirmDelete() {
      this.submitting = true
      try {
        await this.deleteTeam(this.deleteTarget.id)
        this.deleteModal = false
        this.$toast?.success('تم حذف الفريق')
      } catch (err) {
        this.$toast?.error(err.normalized?.message || 'تعذّر حذف الفريق')
      } finally {
        this.submitting = false
      }
    },

    async openTrashed() {
      this.trashedModal = true
      try {
        await this.fetchTrashedTeams()
      } catch (err) {
        this.$toast?.error(err.normalized?.message || 'تعذّر تحميل الفرق المحذوفة')
      }
    },
    async confirmRestore(group) {
      this.restoringId = group.id
      try {
        await this.restoreTeam(group.id)
        this.$toast?.success(`تم استرجاع فريق ${group.name}`)
      } catch (err) {
        this.$toast?.error(err.normalized?.message || 'تعذّر استرجاع الفريق')
      } finally {
        this.restoringId = null
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
    sendWhatsAll() {
      const contacts = this.groups.flatMap((g) => g.members).filter((m) => m.whats)
      if (!contacts.length) return
      if (!window.confirm(`سيتم فتح ${contacts.length} محادثة واتساب في تبويبات منفصلة. متابعة؟`)) return
      contacts.forEach((c, i) => setTimeout(() => this.sendWhats(c.whats), i * 300))
    },
    sendMailAll() {
      const emails = this.groups.flatMap((g) => g.members.map((m) => m.mail))
      const url = `https://mail.google.com/mail/?view=cm&fs=1&bcc=${encodeURIComponent(emails.join(','))}&su=${encodeURIComponent('تعميم لطلاب مشاريع التخرج')}`
      window.open(url, '_blank')
    },

    async exportExcel() {
      this.exportingExcel = true
      try {
        const rowGroups = this.groups.map((g) => g.members.map((m) => ({
          num: g.id, section: g.section || '', spec: g.spec, name: m.name, uid: m.uid || '', sup: g.sup, whats: m.whats || '', mail: m.mail
        })))
        await exportStyledExcel({
          fileName: 'فرق-مشاريع-التخرج.xlsx',
          sheetTitle: 'الفرق',
          columns: [
            { key: 'num', label: 'رقم المجموعة', width: 14 },
            { key: 'section', label: 'الشعبة', width: 12 },
            { key: 'spec', label: 'التخصص', width: 18 },
            { key: 'name', label: 'اسم العضو', width: 22 },
            { key: 'uid', label: 'الرقم الجامعي', width: 16 },
            { key: 'sup', label: 'المشرف', width: 20 },
            { key: 'whats', label: 'الواتس', width: 16 },
            { key: 'mail', label: 'البريد', width: 28 }
          ],
          rowGroups,
          mergeKeys: ['num', 'section', 'sup', 'spec']
        })
      } finally {
        this.exportingExcel = false
      }
    },

    async exportPdf() {
      this.exportingPdf = true
      try {
        await exportGroupsPdf({
          fileName: 'فرق-مشاريع-التخرج.pdf',
          title: 'تقرير فرق مشاريع التخرج',
          subtitle: `${this.groups.length} فرق — ${this.totalMembers} عضوًا`,
          sections: this.groups.map((g) => ({
            heading: `${g.name}`,
            meta: [
              { label: 'رقم المجموعة', value: String(g.id) },
              { label: 'الشعبة', value: g.section || '—' },
              { label: 'التخصص', value: g.spec },
              { label: 'المشرف', value: g.sup },
              { label: 'عدد الأعضاء', value: String(g.members.length) }
            ],
            tableColumns: [
              { key: 'name', label: 'اسم العضو' },
              { key: 'uid', label: 'الرقم الجامعي' },
              { key: 'whats', label: 'الواتس' },
              { key: 'mail', label: 'البريد' }
            ],
            tableRows: g.members
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
