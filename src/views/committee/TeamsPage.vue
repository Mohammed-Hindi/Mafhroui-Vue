<template>
  <div>
    <div class="flex flex-wrap items-center justify-between gap-4 mb-6">
      <div class="flex flex-wrap gap-3">
        <BaseButton :icon="Plus" @click="openCreateTeam">إنشاء فريق جديد</BaseButton>
        <BaseButton variant="outline" :icon="Upload" @click="openImport">استيراد من Excel</BaseButton>
      </div>
      <div class="flex flex-wrap gap-2">
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
            <div class="text-body-sm font-extrabold text-text-900">{{ group.name }}</div>
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
          <div class="hidden md:block overflow-x-auto scrollbar-thin">
            <table class="w-full border-collapse min-w-[700px]">
              <thead>
                <tr class="bg-bg border-b-2 border-border divide-x divide-border-soft">
                  <th class="px-5 py-3 text-start text-label font-extrabold text-text-700">اسم العضو</th>
                  <th class="px-5 py-3 text-start text-label font-extrabold text-text-700">الرقم الجامعي</th>
                  <th class="px-5 py-3 text-start text-label font-extrabold text-text-700">الواتس</th>
                  <th class="px-5 py-3 text-start text-label font-extrabold text-text-700">البريد</th>
                  <th class="px-5 py-3 text-start text-label font-extrabold text-text-700">قائد الفريق</th>
                  <th class="px-5 py-3 text-start text-label font-extrabold text-text-700">إجراءات</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-border-soft">
                <tr v-for="member in group.members" :key="member.memberId" class="row-interactive divide-x divide-border-soft">
                  <td class="px-5 py-3 font-bold text-text-900">{{ member.name }}</td>
                  <td class="px-5 py-3 mono">{{ member.uid || '—' }}</td>
                  <td class="px-5 py-3 mono">{{ member.whats || '—' }}</td>
                  <td class="px-5 py-3 mono whitespace-nowrap">{{ member.mail }}</td>
                  <td class="px-5 py-3">
                    <button
                      type="button"
                      class="grid place-items-center w-8 h-8 rounded-pill transition-colors duration-fast"
                      :class="member.leader ? 'bg-warning-bg text-warning-text' : 'border border-border text-text-400 hover:bg-warning-bg hover:text-warning-text'"
                      :title="member.leader ? 'قائد الفريق الحالي' : 'تعيين قائدًا للفريق'"
                      @click="requestLeaderChange(group, member)"
                    >
                      <Crown :size="14" :fill="member.leader ? 'currentColor' : 'none'" />
                    </button>
                  </td>
                  <td class="px-5 py-3">
                    <div class="flex gap-2">
                      <button type="button" class="grid place-items-center w-8 h-8 rounded-pill bg-whatsapp-bg text-whatsapp hover:brightness-95 disabled:opacity-40 disabled:pointer-events-none" :disabled="!member.whats" title="واتساب" @click="sendWhats(member.whats)"><MessageCircle :size="14" /></button>
                      <button type="button" class="grid place-items-center w-8 h-8 rounded-pill bg-primary-50 text-primary-600 hover:brightness-95" title="بريد" @click="sendMail(member.mail)"><Mail :size="14" /></button>
                      <button type="button" class="grid place-items-center w-8 h-8 rounded-pill bg-error-bg text-error hover:brightness-95 disabled:opacity-40 disabled:pointer-events-none" :disabled="member.leader" :title="member.leader ? 'لا يمكن حذف القائد' : 'إزالة من الفريق'" @click="requestRemoveMember(group, member)"><Trash2 :size="14" /></button>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <div class="md:hidden divide-y divide-border-soft">
            <div v-for="member in group.members" :key="member.memberId" class="p-4 space-y-2">
              <div class="flex items-center justify-between gap-3">
                <span class="font-bold text-text-900">{{ member.name }}</span>
                <span v-if="member.leader" class="text-label font-bold text-warning-text bg-warning-bg px-2 py-0.5 rounded-pill">قائد</span>
              </div>
              <button
                type="button"
                class="w-full flex items-center justify-center gap-1.5 text-caption font-bold text-primary-600 py-1.5 rounded-sm hover:bg-primary-50 transition-colors duration-fast"
                @click="toggleMemberDetails(group.id, member.memberId)"
              >
                {{ isMemberOpen(group.id, member.memberId) ? 'إخفاء التفاصيل' : 'عرض التفاصيل' }}
                <ChevronDown :size="14" :class="['transition-transform duration-fast', isMemberOpen(group.id, member.memberId) && 'rotate-180']" />
              </button>
              <div v-if="isMemberOpen(group.id, member.memberId)" class="space-y-2 pt-2 border-t border-dashed border-border">
                <div class="flex items-start justify-between gap-3"><span class="text-label font-semibold text-text-400 shrink-0">الرقم الجامعي</span><span class="mono text-body-sm text-text-700">{{ member.uid || '—' }}</span></div>
                <div class="flex items-start justify-between gap-3"><span class="text-label font-semibold text-text-400 shrink-0">رقم الواتس</span><span class="mono text-body-sm text-text-700">{{ member.whats || '—' }}</span></div>
                <div class="flex items-start justify-between gap-3"><span class="text-label font-semibold text-text-400 shrink-0">البريد الإلكتروني</span><span class="mono text-body-sm text-text-700 whitespace-nowrap">{{ member.mail }}</span></div>
                <div class="flex items-start justify-between gap-3">
                  <span class="text-label font-semibold text-text-400 shrink-0">إجراءات</span>
                  <div class="flex gap-1.5">
                    <button type="button" class="grid place-items-center w-8 h-8 rounded-pill bg-whatsapp-bg text-whatsapp hover:brightness-95 disabled:opacity-40" :disabled="!member.whats" title="واتساب" @click="sendWhats(member.whats)"><MessageCircle :size="14" /></button>
                    <button type="button" class="grid place-items-center w-8 h-8 rounded-pill bg-primary-50 text-primary-600 hover:brightness-95" title="بريد" @click="sendMail(member.mail)"><Mail :size="14" /></button>
                    <button
                      type="button"
                      class="grid place-items-center w-8 h-8 rounded-pill transition-colors duration-fast"
                      :class="member.leader ? 'bg-warning-bg text-warning-text' : 'border border-border text-text-400'"
                      title="تعيين قائدًا"
                      @click="requestLeaderChange(group, member)"
                    ><Crown :size="14" :fill="member.leader ? 'currentColor' : 'none'" /></button>
                    <button type="button" class="grid place-items-center w-8 h-8 rounded-pill bg-error-bg text-error hover:brightness-95 disabled:opacity-40" :disabled="member.leader" title="إزالة من الفريق" @click="requestRemoveMember(group, member)"><Trash2 :size="14" /></button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div class="px-5 py-3 border-t border-border-soft">
            <button type="button" class="inline-flex items-center gap-1.5 text-caption font-bold text-primary-600 hover:underline disabled:opacity-40 disabled:pointer-events-none" :disabled="group.members.length >= 4" @click="openAddMember(group)">
              <Plus :size="14" /> {{ group.members.length >= 4 ? 'الفريق مكتمل (4 أعضاء)' : 'إضافة طالب لهذا الفريق' }}
            </button>
          </div>
        </div>
      </div>
    </div>
    <Pagination class="mt-6" :current-page="page" :last-page="totalPages" :total="filteredGroups.length" @change="page = $event" />

    <!-- إنشاء فريق جديد -->
    <BaseModal v-model="createModal" title="إنشاء فريق جديد" description="اختاري حتى 4 طلاب غير منضمّين لأي فريق هذا الفصل" size="lg">
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <BaseInput v-model="createForm.name" label="اسم الفريق" placeholder="مثال: فريق الابتكار" class="sm:col-span-2" />
        <BaseSelect v-model="createForm.supervisor_id" label="المشرف" placeholder="اختاري المشرف" :options="supervisorOptions" />
        <BaseSelect v-model="createForm.specialization_id" label="التخصص" placeholder="اختاري التخصص" :options="specializationSelectOptions" />
      </div>
      <div class="mt-4">
        <label class="block mb-2 text-label font-semibold text-text-700">الأعضاء (حتى 4)</label>
        <div v-if="!unassignedStudents.length" class="text-body-sm text-text-400 py-3">لا يوجد طلاب متاحون — استوردي طلابًا من Excel أولاً.</div>
        <div v-else class="max-h-60 overflow-y-auto border border-border rounded-sm divide-y divide-border-soft">
          <label v-for="s in unassignedStudents" :key="s.id" class="flex items-center gap-3 px-3 py-2.5 cursor-pointer hover:bg-border-soft">
            <input type="checkbox" :value="s.id" v-model="createForm.member_ids" :disabled="!createForm.member_ids.includes(s.id) && createForm.member_ids.length >= 4">
            <span class="text-body-sm text-text-900">{{ s.name }}</span>
            <span class="text-label text-text-400 mono">{{ s.university_number || s.email }}</span>
          </label>
        </div>
      </div>
      <div v-if="createForm.member_ids.length" class="mt-4">
        <BaseSelect v-model="createForm.leader_id" label="قائد الفريق" placeholder="اختاري القائد" :options="leaderPickOptions" />
      </div>
      <template #footer>
        <BaseButton variant="ghost" @click="createModal = false">إلغاء</BaseButton>
        <BaseButton :icon="Check" :loading="submitting" @click="submitCreateTeam">إنشاء الفريق</BaseButton>
      </template>
    </BaseModal>

    <!-- استيراد من Excel -->
    <BaseModal v-model="importModal" title="استيراد طلاب من Excel" description="الأعمدة المطلوبة بالترتيب: الاسم، البريد، الرقم الجامعي، الواتساب" size="lg">
      <div v-if="!importPreview">
        <input ref="fileInput" type="file" accept=".xlsx" class="block w-full text-body-sm text-text-700 file:me-3 file:h-icon-btn file:px-4 file:rounded-sm file:border-0 file:bg-primary-50 file:text-primary-700 file:font-bold" @change="onFileSelected">
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
        <BaseSelect v-model="editGroupForm.supervisor_id" label="المشرف" :options="supervisorOptions" />
        <BaseSelect v-model="editGroupForm.specialization_id" label="التخصص" :options="specializationSelectOptions" />
      </div>
      <template #footer>
        <BaseButton variant="ghost" @click="editGroupModal = false">إلغاء</BaseButton>
        <BaseButton :icon="Check" :loading="submitting" @click="saveEditGroup">حفظ التعديلات</BaseButton>
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
      <p class="text-body-sm text-text-600">سيُحذف الفريق وكل بيانات مشروعه المرتبطة. لا يمكن التراجع عن هذا الإجراء.</p>
      <template #footer>
        <BaseButton variant="ghost" @click="deleteModal = false">إلغاء</BaseButton>
        <BaseButton variant="danger" :icon="Trash2" :loading="submitting" @click="confirmDelete">تأكيد الحذف</BaseButton>
      </template>
    </BaseModal>
  </div>
</template>

<script>
import { mapState, mapActions } from 'pinia'
import { Plus, Upload, Download, FileDown, Search, ChevronLeft, ChevronDown, MessageCircle, Mail, Pencil, Trash2, Check, Crown } from 'lucide-vue-next'
import BaseButton from '@/components/ui/BaseButton.vue'
import BaseSelect from '@/components/ui/BaseSelect.vue'
import BaseInput from '@/components/ui/BaseInput.vue'
import BaseBadge from '@/components/ui/BaseBadge.vue'
import BaseModal from '@/components/ui/BaseModal.vue'
import EmptyState from '@/components/ui/EmptyState.vue'
import SkeletonLoader from '@/components/ui/SkeletonLoader.vue'
import Pagination from '@/components/ui/Pagination.vue'
import { useTeamsStore } from '@/stores/teams.store'
import { useUsersStore } from '@/stores/users.store'
import { exportStyledExcel, exportGroupsPdf } from '@/utils/exportReport'

const GROUPS_PAGE_SIZE = 5

function digitsOnly(value) {
  return String(value || '').replace(/\D/g, '').replace(/^0/, '')
}

const emptyCreateForm = () => ({ name: '', supervisor_id: '', specialization_id: '', member_ids: [], leader_id: '' })

export default {
  name: 'CommitteeTeamsPage',

  components: { Search, ChevronLeft, ChevronDown, MessageCircle, Mail, Pencil, Trash2, Crown, BaseButton, BaseSelect, BaseInput, BaseBadge, BaseModal, EmptyState, SkeletonLoader, Pagination },

  data() {
    return {
      Plus, Upload, Download, FileDown, Check, Trash2, Crown,
      exportingExcel: false,
      exportingPdf: false,
      submitting: false,
      search: '',
      supFilter: '',
      specFilter: '',
      openGroupIds: [],
      openMemberKeys: [],

      createModal: false,
      createForm: emptyCreateForm(),
      unassignedStudents: [],

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

      leaderModal: false,
      leaderTarget: null,

      removeMemberModal: false,
      removeMemberTarget: null,

      deleteModal: false,
      deleteTarget: null,

      page: 1
    }
  },

  computed: {
    ...mapState(useTeamsStore, ['teams', 'teamsLoading', 'specializations']),

    groups() {
      return this.teams.map((team) => ({
        id: team.id,
        name: team.name,
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
    leaderPickOptions() {
      return this.unassignedStudents
        .filter((s) => this.createForm.member_ids.includes(s.id))
        .map((s) => ({ value: s.id, label: s.name }))
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
    ...mapActions(useTeamsStore, ['fetchTeams', 'fetchSpecializations', 'specializationName', 'createTeam', 'updateTeam', 'deleteTeam', 'addTeamMember', 'removeTeamMember', 'updateTeamLeader', 'previewTeamImport', 'confirmTeamImport']),
    ...mapActions(useUsersStore, ['fetchUsers']),

    isGroupOpen(id) {
      return this.openGroupIds.includes(id)
    },
    toggleGroup(id) {
      this.openGroupIds = this.isGroupOpen(id) ? this.openGroupIds.filter((x) => x !== id) : [...this.openGroupIds, id]
    },

    isMemberOpen(groupId, memberId) {
      return this.openMemberKeys.includes(`${groupId}-${memberId}`)
    },
    toggleMemberDetails(groupId, memberId) {
      const key = `${groupId}-${memberId}`
      this.openMemberKeys = this.isMemberOpen(groupId, memberId) ? this.openMemberKeys.filter((k) => k !== key) : [...this.openMemberKeys, key]
    },

    async openCreateTeam() {
      this.createForm = emptyCreateForm()
      this.createModal = true
      try {
        this.unassignedStudents = await this.fetchUsers('student', { unassigned: 1 })
      } catch {
        this.$toast?.error('تعذّر تحميل الطلاب المتاحين')
      }
    },
    async submitCreateTeam() {
      const f = this.createForm
      if (!f.name || !f.supervisor_id || !f.specialization_id || !f.member_ids.length || !f.leader_id) {
        this.$toast?.error('يرجى تعبئة جميع الحقول واختيار عضو واحد على الأقل وقائد الفريق')
        return
      }
      this.submitting = true
      try {
        await this.createTeam(f)
        this.createModal = false
        this.$toast?.success('تم إنشاء الفريق')
      } catch (err) {
        this.$toast?.error(err.normalized?.message || 'تعذّر إنشاء الفريق')
      } finally {
        this.submitting = false
      }
    },

    openImport() {
      this.importPreview = null
      this.importSpecId = ''
      this.importRows = []
      this.importModal = true
    },
    async onFileSelected(event) {
      const file = event.target.files?.[0]
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
      this.editGroupForm = { name: group.name, supervisor_id: group.supId, specialization_id: group.specId }
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

    sendWhats(whats) {
      if (!whats) return
      const num = digitsOnly(whats)
      const full = num.startsWith('970') || num.startsWith('972') ? num : `970${num}`
      window.open(`https://wa.me/${full}`, '_blank')
    },
    sendMail(mail) {
      window.location.href = `mailto:${mail}`
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
          num: g.id, spec: g.spec, name: m.name, uid: m.uid || '', sup: g.sup, whats: m.whats || '', mail: m.mail
        })))
        await exportStyledExcel({
          fileName: 'فرق-مشاريع-التخرج.xlsx',
          sheetTitle: 'الفرق',
          columns: [
            { key: 'num', label: 'رقم الفريق', width: 12 },
            { key: 'spec', label: 'التخصص', width: 18 },
            { key: 'name', label: 'اسم العضو', width: 22 },
            { key: 'uid', label: 'الرقم الجامعي', width: 16 },
            { key: 'sup', label: 'المشرف', width: 20 },
            { key: 'whats', label: 'الواتس', width: 16 },
            { key: 'mail', label: 'البريد', width: 28 }
          ],
          rowGroups,
          mergeKeys: ['num', 'sup', 'spec']
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
