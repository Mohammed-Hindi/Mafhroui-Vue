<template>
  <div>
    <div class="flex flex-wrap items-center justify-between gap-4 mb-6">
      <div class="flex flex-wrap gap-3">
        <BaseButton :icon="Plus" @click="openSupervisorModal">إضافة مشرف</BaseButton>
        <BaseButton variant="secondary" :icon="Plus" @click="openStudentModal">إضافة طالب</BaseButton>
      </div>
      <div class="flex flex-wrap gap-2">
        <BaseButton variant="outline" :icon="Upload" @click="importPlaceholder">استيراد من Excel</BaseButton>
        <BaseButton variant="outline" :icon="Download" @click="exportCsv">تصدير Excel</BaseButton>
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
      <BaseSelect v-model="supFilter" class="min-w-[180px]" placeholder="جميع المشرفين" include-placeholder-option :options="supervisorOptions" />
      <BaseSelect v-model="specFilter" class="min-w-[170px]" placeholder="جميع التخصصات" include-placeholder-option :options="specializationOptions" />
    </div>

    <EmptyState v-if="!filteredGroups.length" title="لا توجد مجموعات مطابقة" description="جرّبي تعديل البحث أو الفلاتر." />

    <div v-else class="flex flex-col gap-4">
      <div
        v-for="group in pageGroups" :id="group.id" :key="group.id"
        class="bg-surface border border-border rounded-lg shadow-card overflow-hidden transition-shadow duration-base"
        :class="{ 'ring-2 ring-primary-500/40': highlightId === group.id }"
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
              <div class="text-label text-text-400">رقم المجموعة {{ group.num }} — {{ group.shu }}</div>
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
          <!-- جدول (سطح المكتب) -->
          <div class="hidden md:block overflow-x-auto scrollbar-thin">
            <table class="w-full border-collapse min-w-[700px]">
              <thead>
                <tr class="bg-bg border-b-2 border-border divide-x divide-border-soft">
                  <th class="px-5 py-3 text-start text-label font-extrabold text-text-700">اسم العضو</th>
                  <th class="px-5 py-3 text-start text-label font-extrabold text-text-700">الرقم الجامعي</th>
                  <th class="px-5 py-3 text-start text-label font-extrabold text-text-700">الواتس</th>
                  <th class="px-5 py-3 text-start text-label font-extrabold text-text-700">البريد</th>
                  <th class="px-5 py-3 text-start text-label font-extrabold text-text-700">إجراءات</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-border-soft">
                <tr v-for="(member, idx) in group.members" :key="idx" class="divide-x divide-border-soft">
                  <td class="px-5 py-3 font-bold text-text-900">{{ member.name }}</td>
                  <td class="px-5 py-3 mono">{{ member.uid }}</td>
                  <td class="px-5 py-3 mono">{{ member.whats }}</td>
                  <td class="px-5 py-3 mono whitespace-nowrap">{{ member.mail }}</td>
                  <td class="px-5 py-3">
                    <div class="flex gap-2">
                      <button type="button" class="grid place-items-center w-8 h-8 rounded-sm border border-whatsapp-bg text-whatsapp hover:bg-whatsapp-bg" title="واتساب" @click="sendWhats(member.whats)"><MessageCircle :size="14" /></button>
                      <button type="button" class="grid place-items-center w-8 h-8 rounded-sm border border-primary-100 text-primary-600 hover:bg-primary-50" title="بريد" @click="sendMail(member.mail)"><Mail :size="14" /></button>
                      <button type="button" class="grid place-items-center w-8 h-8 rounded-sm border border-border text-text-600 hover:bg-border-soft hover:text-primary-700" title="تعديل" @click="openEditMember(group, idx)"><Pencil :size="14" /></button>
                      <button type="button" class="grid place-items-center w-8 h-8 rounded-sm border border-error-bg text-error hover:bg-error-bg" title="حذف" @click="openDeleteMember(group, idx)"><Trash2 :size="14" /></button>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <!-- بطاقات (موبايل) — اسم العضو ظاهر دومًا + زر "عرض التفاصيل" لباقي الحقول -->
          <div class="md:hidden divide-y divide-border-soft">
            <div v-for="(member, idx) in group.members" :key="idx" class="p-4 space-y-2">
              <div class="flex items-center justify-between gap-3">
                <span class="font-bold text-text-900">{{ member.name }}</span>
              </div>

              <button
                type="button"
                class="w-full flex items-center justify-center gap-1.5 text-caption font-bold text-primary-600 py-1.5 rounded-sm hover:bg-primary-50 transition-colors duration-fast"
                @click="toggleMemberDetails(group.id, idx)"
              >
                {{ isMemberOpen(group.id, idx) ? 'إخفاء التفاصيل' : 'عرض التفاصيل' }}
                <ChevronDown :size="14" :class="['transition-transform duration-fast', isMemberOpen(group.id, idx) && 'rotate-180']" />
              </button>

              <div v-if="isMemberOpen(group.id, idx)" class="space-y-2 pt-2 border-t border-dashed border-border">
                <div class="flex items-start justify-between gap-3"><span class="text-label font-semibold text-text-400 shrink-0">الرقم الجامعي</span><span class="mono text-body-sm text-text-700">{{ member.uid }}</span></div>
                <div class="flex items-start justify-between gap-3"><span class="text-label font-semibold text-text-400 shrink-0">رقم الواتس</span><span class="mono text-body-sm text-text-700">{{ member.whats }}</span></div>
                <div class="flex items-start justify-between gap-3"><span class="text-label font-semibold text-text-400 shrink-0">البريد الإلكتروني</span><span class="mono text-body-sm text-text-700 whitespace-nowrap">{{ member.mail }}</span></div>
                <div class="flex items-start justify-between gap-3">
                  <span class="text-label font-semibold text-text-400 shrink-0">إجراءات</span>
                  <div class="flex gap-1.5">
                    <button type="button" class="grid place-items-center w-8 h-8 rounded-sm border border-whatsapp-bg text-whatsapp hover:bg-whatsapp-bg" title="واتساب" @click="sendWhats(member.whats)"><MessageCircle :size="14" /></button>
                    <button type="button" class="grid place-items-center w-8 h-8 rounded-sm border border-primary-100 text-primary-600 hover:bg-primary-50" title="بريد" @click="sendMail(member.mail)"><Mail :size="14" /></button>
                    <button type="button" class="grid place-items-center w-8 h-8 rounded-sm border border-border text-text-600 hover:bg-border-soft hover:text-primary-700" title="تعديل" @click="openEditMember(group, idx)"><Pencil :size="14" /></button>
                    <button type="button" class="grid place-items-center w-8 h-8 rounded-sm border border-error-bg text-error hover:bg-error-bg" title="حذف" @click="openDeleteMember(group, idx)"><Trash2 :size="14" /></button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
    <Pagination class="mt-6" :current-page="page" :last-page="totalPages" :total="filteredGroups.length" @change="page = $event" />

    <!-- إضافة طالب -->
    <BaseModal v-model="studentModal" title="إضافة طالب">
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <BaseInput v-model="studentForm.num" label="رقم المجموعة" placeholder="مثال: 31" />
        <BaseInput v-model="studentForm.shu" label="الشعبة" placeholder="مثال: شعبة 1" />
        <BaseSelect v-model="studentForm.spec" label="التخصص" placeholder="اختاري التخصص" class="sm:col-span-2" :options="specializationOptions" />
        <BaseInput v-model="studentForm.name" label="اسم العضو" placeholder="الاسم الكامل" />
        <BaseInput v-model="studentForm.uid" label="الرقم الجامعي" placeholder="رقم الطالب الجامعي" />
        <BaseInput v-model="studentForm.whats" label="رقم الواتس" placeholder="مثال: 05xxxxxxxx" />
        <BaseInput v-model="studentForm.mail" type="email" label="البريد الإلكتروني" placeholder="student@academy.edu.sa" />
        <div class="sm:col-span-2">
          <label class="block mb-2 text-label font-semibold text-text-700">كلمة السر</label>
          <div class="flex items-center gap-2">
            <button type="button" class="flex items-center gap-1.5 h-icon-btn px-3 rounded-sm border border-border text-text-600 hover:text-primary-700 hover:bg-primary-50 shrink-0 text-caption font-semibold transition-colors duration-fast" @click="studentForm.pw = genPass()"><RefreshCw :size="14" /> توليد</button>
            <BaseInput v-model="studentForm.pw" class="flex-1 mono" placeholder="اضغطي «توليد» لإنشاء كلمة سر" readonly />
          </div>
        </div>
        <BaseSelect v-model="studentForm.sup" label="اسم المشرف" placeholder="اختاري المشرف" class="sm:col-span-2" :options="supervisorOptions" />
      </div>
      <template #footer>
        <BaseButton variant="ghost" @click="studentModal = false">إلغاء</BaseButton>
        <BaseButton :icon="Check" @click="submitStudent">إضافة الطالب</BaseButton>
      </template>
    </BaseModal>

    <!-- إضافة مشرف -->
    <BaseModal v-model="supervisorModal" title="إضافة مشرف">
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <BaseInput v-model="supervisorForm.name" label="اسم الموظف" placeholder="مثال: د. أحمد الشريف" class="sm:col-span-2" />
        <BaseInput v-model="supervisorForm.empId" label="الرقم الوظيفي" placeholder="الرقم الوظيفي" />
        <BaseInput v-model="supervisorForm.mail" type="email" label="البريد الإلكتروني" placeholder="example@academy.edu.sa" />
        <BaseInput v-model="supervisorForm.whats" label="رقم الواتس" placeholder="مثال: 799123456" />
        <div>
          <label class="block mb-2 text-label font-semibold text-text-700">كلمة السر</label>
          <div class="flex items-center gap-2">
            <button type="button" class="flex items-center gap-1.5 h-icon-btn px-3 rounded-sm border border-border text-text-600 hover:text-primary-700 hover:bg-primary-50 shrink-0 text-caption font-semibold transition-colors duration-fast" @click="supervisorForm.pw = genPass()"><RefreshCw :size="14" /> توليد</button>
            <BaseInput v-model="supervisorForm.pw" class="flex-1 mono" placeholder="اضغطي «توليد» لإنشاء كلمة سر" readonly />
          </div>
        </div>
      </div>
      <template #footer>
        <BaseButton block :icon="Send" @click="submitSupervisor">إضافة وإرسال البيانات (واتس + بريد)</BaseButton>
      </template>
    </BaseModal>

    <!-- تعديل مجموعة -->
    <BaseModal v-model="editGroupModal" title="تعديل بيانات المجموعة">
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <BaseInput v-model="editGroupForm.name" label="اسم الفريق" class="sm:col-span-2" />
        <BaseInput v-model="editGroupForm.num" label="رقم المجموعة" />
        <BaseInput v-model="editGroupForm.shu" label="الشعبة" />
        <BaseSelect v-model="editGroupForm.spec" label="التخصص" :options="specializationOptions" />
        <BaseSelect v-model="editGroupForm.sup" label="اسم المشرف" :options="supervisorOptions" />
      </div>
      <template #footer>
        <BaseButton variant="ghost" @click="editGroupModal = false">إلغاء</BaseButton>
        <BaseButton :icon="Check" @click="saveEditGroup">حفظ التعديلات</BaseButton>
      </template>
    </BaseModal>

    <!-- تعديل عضو -->
    <BaseModal v-model="editMemberModal" title="تعديل بيانات العضو">
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <BaseInput v-model="editMemberForm.name" label="اسم العضو" class="sm:col-span-2" />
        <BaseInput v-model="editMemberForm.uid" label="الرقم الجامعي" />
        <BaseInput v-model="editMemberForm.whats" label="رقم الواتس" />
        <BaseInput v-model="editMemberForm.mail" type="email" label="البريد الإلكتروني" class="sm:col-span-2" />
      </div>
      <template #footer>
        <BaseButton variant="ghost" @click="editMemberModal = false">إلغاء</BaseButton>
        <BaseButton :icon="Check" @click="saveEditMember">حفظ التعديلات</BaseButton>
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
import { Plus, Upload, Download, Search, ChevronLeft, ChevronDown, MessageCircle, Mail, Pencil, Trash2, Check, Send, RefreshCw } from 'lucide-vue-next'
import BaseButton from '@/components/ui/BaseButton.vue'
import BaseSelect from '@/components/ui/BaseSelect.vue'
import BaseInput from '@/components/ui/BaseInput.vue'
import BaseBadge from '@/components/ui/BaseBadge.vue'
import BaseModal from '@/components/ui/BaseModal.vue'
import EmptyState from '@/components/ui/EmptyState.vue'
import Pagination from '@/components/ui/Pagination.vue'
import { genPass } from '@/utils/password'

const SPECS = ['هندسة حاسوب', 'نظم معلومات', 'أمن سيبراني']
const SUPS = ['د. أحمد الشريف', 'د. سلمى نصار', 'د. أحمد النبريص']
const GROUPS_PAGE_SIZE = 5

function digitsOnly(value) {
  return String(value || '').replace(/\D/g, '').replace(/^0/, '')
}

const emptyStudentForm = () => ({ num: '', shu: '', spec: '', name: '', uid: '', whats: '', mail: '', pw: '', sup: '' })
const emptySupervisorForm = () => ({ name: '', empId: '', mail: '', whats: '', pw: '' })

export default {
  name: 'CommitteeTeamsPage',

  components: { Search, ChevronLeft, ChevronDown, MessageCircle, Mail, Pencil, Trash2, RefreshCw, BaseButton, BaseSelect, BaseInput, BaseBadge, BaseModal, EmptyState, Pagination },

  data() {
    return {
      Plus, Upload, Download, Check, Send, Trash2,
      search: '',
      supFilter: '',
      specFilter: '',
      openGroupIds: [],
      openMemberKeys: [],
      highlightId: null,

      studentModal: false,
      studentForm: emptyStudentForm(),
      supervisorModal: false,
      supervisorForm: emptySupervisorForm(),

      editGroupModal: false,
      editGroupTargetId: null,
      editGroupForm: {},
      editMemberModal: false,
      editMemberTarget: { groupId: null, idx: null },
      editMemberForm: {},

      deleteModal: false,
      deleteKind: 'group',
      deleteTarget: { groupId: null, idx: null },
      deleteLabel: '',
      deleteReason: '',

      /* بيانات ثابتة — بانتظار GET /committee/teams */
      groups: [
        {
          id: 'G1', num: '31', shu: 'شعبة 1', name: 'فريق نوفا', spec: 'هندسة حاسوب', sup: 'د. أحمد الشريف',
          members: [
            { name: 'يوسف الدوسري', uid: '3175000', whats: '0551110001', mail: 'student1@academy.edu.sa' },
            { name: 'علي الحربي', uid: '3175001', whats: '0551110002', mail: 'student2@academy.edu.sa' },
            { name: 'سلطان الدوسري', uid: '3175006', whats: '0551110003', mail: 'student3@academy.edu.sa' }
          ]
        },
        {
          id: 'G2', num: '52', shu: 'شعبة 2', name: 'فريق كوانتم', spec: 'نظم معلومات', sup: 'د. سلمى نصار',
          members: [
            { name: 'فيصل الحربي', uid: '3175018', whats: '0551110004', mail: 'student4@academy.edu.sa' },
            { name: 'إبراهيم الدوسري', uid: '3175019', whats: '0551110005', mail: 'student5@academy.edu.sa' },
            { name: 'سعد الحربي', uid: '3175020', whats: '0551110006', mail: 'student6@academy.edu.sa' }
          ]
        },
        {
          id: 'G3', num: '54', shu: 'شعبة 3', name: 'فريق الابتكار', spec: 'أمن سيبراني', sup: 'د. أحمد النبريص',
          members: [
            { name: 'حسين الحربي', uid: '3175022', whats: '0551110007', mail: 'student7@academy.edu.sa' },
            { name: 'ماجد الحربي', uid: '3175023', whats: '0551110008', mail: 'student8@academy.edu.sa' },
            { name: 'سارة الحربي', uid: '3175024', whats: '0551110009', mail: 'student9@academy.edu.sa' },
            { name: 'رانا الحربي', uid: '3175025', whats: '0551110010', mail: 'student10@academy.edu.sa' }
          ]
        },
        {
          id: 'G4', num: '61', shu: 'شعبة 4', name: 'فريق فوكال', spec: 'نظم معلومات', sup: 'د. سلمى نصار',
          members: [
            { name: 'عبدالله الجهني', uid: '3175026', whats: '0551110011', mail: 'student11@academy.edu.sa' },
            { name: 'أحمد الحربي', uid: '3175027', whats: '0551110012', mail: 'student12@academy.edu.sa' }
          ]
        },
        {
          id: 'G5', num: '62', shu: 'شعبة 5', name: 'فريق أورانج', spec: 'هندسة حاسوب', sup: 'د. أحمد الشريف',
          members: [
            { name: 'نورة الدوسري', uid: '3175028', whats: '0551110013', mail: 'student13@academy.edu.sa' },
            { name: 'عمر الجهني', uid: '3175029', whats: '0551110014', mail: 'student14@academy.edu.sa' }
          ]
        },
        {
          id: 'G6', num: '63', shu: 'شعبة 6', name: 'فريق الأمن السيبراني', spec: 'أمن سيبراني', sup: 'د. أحمد النبريص',
          members: [
            { name: 'هدى الجهني', uid: '3175030', whats: '0551110015', mail: 'student15@academy.edu.sa' },
            { name: 'رامي الحربي', uid: '3175031', whats: '0551110016', mail: 'student16@academy.edu.sa' },
            { name: 'مني الحربي', uid: '3175032', whats: '0551110017', mail: 'student17@academy.edu.sa' }
          ]
        },
        {
          id: 'G7', num: '64', shu: 'شعبة 7', name: 'فريق سبعة', spec: 'نظم معلومات', sup: 'د. سلمى نصار',
          members: [
            { name: 'جود الدوسري', uid: '3175033', whats: '0551110018', mail: 'student18@academy.edu.sa' },
            { name: 'لينا الجهني', uid: '3175034', whats: '0551110019', mail: 'student19@academy.edu.sa' }
          ]
        }
      ],
      page: 1
    }
  },

  computed: {
    specializationOptions() {
      return SPECS.map((s) => ({ value: s, label: s }))
    },
    supervisorOptions() {
      return SUPS.map((s) => ({ value: s, label: s }))
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

  created() {
    this.highlightFromQuery()
  },

  methods: {
    genPass,

    isGroupOpen(id) {
      return this.openGroupIds.includes(id)
    },
    toggleGroup(id) {
      this.openGroupIds = this.isGroupOpen(id) ? this.openGroupIds.filter((x) => x !== id) : [...this.openGroupIds, id]
    },

    isMemberOpen(groupId, idx) {
      return this.openMemberKeys.includes(`${groupId}-${idx}`)
    },
    toggleMemberDetails(groupId, idx) {
      const key = `${groupId}-${idx}`
      this.openMemberKeys = this.isMemberOpen(groupId, idx) ? this.openMemberKeys.filter((k) => k !== key) : [...this.openMemberKeys, key]
    },

    highlightFromQuery() {
      const num = this.$route.query.group
      if (!num) return
      const target = this.groups.find((g) => g.num === String(num))
      if (!target) return
      const index = this.filteredGroups.findIndex((g) => g.id === target.id)
      if (index >= 0) this.page = Math.floor(index / GROUPS_PAGE_SIZE) + 1
      this.openGroupIds.push(target.id)
      this.highlightId = target.id
      this.$nextTick(() => {
        document.getElementById(target.id)?.scrollIntoView({ behavior: 'smooth', block: 'center' })
        setTimeout(() => { this.highlightId = null }, 1800)
      })
    },

    openEditGroup(group) {
      this.editGroupTargetId = group.id
      this.editGroupForm = { name: group.name, num: group.num, shu: group.shu, spec: group.spec, sup: group.sup }
      this.editGroupModal = true
    },
    saveEditGroup() {
      const group = this.groups.find((g) => g.id === this.editGroupTargetId)
      if (group) Object.assign(group, this.editGroupForm)
      this.editGroupModal = false
      this.$toast?.success('تم حفظ التعديلات')
    },

    openEditMember(group, idx) {
      this.editMemberTarget = { groupId: group.id, idx }
      const m = group.members[idx]
      this.editMemberForm = { name: m.name, uid: m.uid, whats: m.whats, mail: m.mail }
      this.editMemberModal = true
    },
    saveEditMember() {
      const group = this.groups.find((g) => g.id === this.editMemberTarget.groupId)
      if (group) Object.assign(group.members[this.editMemberTarget.idx], this.editMemberForm)
      this.editMemberModal = false
      this.$toast?.success('تم حفظ التعديلات')
    },

    openDeleteGroup(group) {
      this.deleteKind = 'group'
      this.deleteTarget = { groupId: group.id, idx: null }
      this.deleteLabel = `حذف فريق "${group.name}" بالكامل`
      this.deleteReason = ''
      this.deleteModal = true
    },
    openDeleteMember(group, idx) {
      this.deleteKind = 'member'
      this.deleteTarget = { groupId: group.id, idx }
      this.deleteLabel = `حذف "${group.members[idx].name}"`
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
        if (group) group.members.splice(this.deleteTarget.idx, 1)
      }
      this.deleteModal = false
      this.$toast?.success('تم الحذف')
    },

    openStudentModal() {
      this.studentForm = emptyStudentForm()
      this.studentModal = true
    },
    submitStudent() {
      const f = this.studentForm
      if (!f.num || !f.name || !f.uid) {
        this.$toast?.error('يرجى تعبئة رقم المجموعة، الاسم والرقم الجامعي على الأقل')
        return
      }
      if (!f.pw) {
        this.$toast?.error('يرجى توليد كلمة السر قبل الإضافة')
        return
      }
      let group = this.groups.find((g) => g.num === f.num)
      if (!group) {
        group = { id: `G${this.groups.length + 1}`, num: f.num, shu: f.shu, name: `مجموعة ${f.num}`, spec: f.spec, sup: f.sup, members: [] }
        this.groups.push(group)
      }
      group.members.push({ name: f.name, uid: f.uid, whats: f.whats, mail: f.mail })
      this.studentModal = false
      this.$toast?.success('تم إضافة الطالب')
    },

    openSupervisorModal() {
      this.supervisorForm = emptySupervisorForm()
      this.supervisorModal = true
    },
    submitSupervisor() {
      const f = this.supervisorForm
      if (!f.name || !f.mail) {
        this.$toast?.error('يرجى تعبئة اسم المشرف والبريد الإلكتروني على الأقل')
        return
      }
      if (!f.pw) {
        this.$toast?.error('يرجى توليد كلمة السر قبل الإضافة')
        return
      }
      SUPS.push(f.name)
      this.supervisorModal = false
      this.$toast?.success('تمت إضافة المشرف وإرسال بياناته')
    },

    sendWhats(whats) {
      const num = digitsOnly(whats)
      const full = num.startsWith('970') || num.startsWith('972') ? num : `970${num}`
      window.open(`https://wa.me/${full}`, '_blank')
    },
    sendMail(mail) {
      window.location.href = `mailto:${mail}`
    },
    sendWhatsAll() {
      const contacts = this.groups.flatMap((g) => g.members)
      if (!window.confirm(`سيتم فتح ${contacts.length} محادثة واتساب في تبويبات منفصلة. متابعة؟`)) return
      contacts.forEach((c, i) => setTimeout(() => this.sendWhats(c.whats), i * 300))
    },
    sendMailAll() {
      const emails = this.groups.flatMap((g) => g.members.map((m) => m.mail))
      const url = `https://mail.google.com/mail/?view=cm&fs=1&bcc=${encodeURIComponent(emails.join(','))}&su=${encodeURIComponent('تعميم لطلاب مشاريع التخرج')}`
      window.open(url, '_blank')
    },

    importPlaceholder() {
      this.$toast?.info('استيراد من Excel — قريبًا')
    },
    exportCsv() {
      const header = ['رقم المجموعة', 'الشعبة', 'التخصص', 'اسم العضو', 'الرقم الجامعي', 'المشرف', 'الواتس', 'البريد']
      const lines = [header]
      this.groups.forEach((g) => {
        g.members.forEach((m) => lines.push([g.num, g.shu, g.spec, m.name, m.uid, g.sup, m.whats, m.mail]))
      })
      const csv = lines.map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(',')).join('\r\n')
      const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' })
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = 'فرق-مشاريع-التخرج.csv'
      link.click()
      URL.revokeObjectURL(url)
    }
  }
}
</script>

<style scoped>
.mono { direction: ltr; text-align: start; display: inline-block; }
</style>
