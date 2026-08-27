<template>
  <div>
    <div class="flex flex-wrap items-center justify-between gap-3 mb-3">
      <div class="flex flex-wrap gap-3">
        <button type="button" class="flex items-center gap-2 h-10 px-4 rounded-sm bg-success-bg text-success text-caption font-bold hover:brightness-95 transition-all duration-fast disabled:opacity-40 disabled:pointer-events-none" :disabled="sendingWhatsAll || !allMembers.some((m) => m.whats)" @click="sendWhatsAll">
          <MessageCircle :size="15" /> واتساب للجميع ({{ allMembers.filter((m) => m.whats).length }})
        </button>
        <button type="button" class="flex items-center gap-2 h-10 px-4 rounded-sm bg-primary-50 text-primary-700 text-caption font-bold hover:bg-primary-100 transition-colors duration-fast disabled:opacity-40 disabled:pointer-events-none" :disabled="sendingMailAll || !allMembers.some((m) => m.mail)" @click="sendMailAll">
          <Mail :size="15" /> بريد للجميع (Gmail)
        </button>
      </div>

      <BaseButton variant="outline" size="sm" :icon="Archive" @click="openTrashed">الفرق المحذوفة</BaseButton>
    </div>

    <div class="flex flex-wrap items-center gap-3 mb-6 p-4 rounded-lg bg-surface border border-border shadow-card">
      <div class="relative flex-1 min-w-[220px]">
        <Search :size="16" class="pointer-events-none absolute top-1/2 -translate-y-1/2 start-3 text-text-400" />
        <input v-model.trim="search" type="search" placeholder="ابحث عن طالب أو رقم جامعي..." class="w-full h-icon-btn ps-10 pe-3 rounded-sm border border-border bg-bg text-body text-text-900 focus:border-primary-600 transition-colors duration-fast">
      </div>
    </div>

    <EmptyState v-if="!filteredGroups.length" title="لا توجد فرق مطابقة" description="جرّبي تعديل البحث." />

    <div v-else class="flex flex-col gap-4">
      <div
        v-for="group in pageGroups" :id="`team-${group.id}`" :key="group.id"
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
              <div class="text-label text-text-400">رقم المجموعة {{ group.id }}<template v-if="group.section"> — {{ group.section }}</template></div>
            </div>
            <BaseBadge variant="info">{{ group.spec }}</BaseBadge>
            <BaseBadge>{{ group.members.length }} {{ group.members.length === 1 ? 'طالب' : 'طلاب' }}</BaseBadge>
            <BaseBadge v-if="group.projectName" variant="info">{{ group.projectName }}</BaseBadge>
          </div>

          <div class="flex gap-1.5 shrink-0">
            <button type="button" class="grid place-items-center w-8 h-8 rounded-sm border border-border text-text-600 hover:bg-border-soft hover:text-primary-700" title="تعديل" @click="openEditGroup(group)"><Pencil :size="14" /></button>
            <button type="button" class="grid place-items-center w-8 h-8 rounded-sm border border-error-bg text-error hover:bg-error-bg" title="حذف" @click="openDeleteGroup(group)"><Trash2 :size="14" /></button>
          </div>
        </div>

        <div v-show="isGroupOpen(group.id)" class="border-t border-border-soft">
          <!-- جدول (سطح المكتب) -->
          <div class="hidden md:block overflow-x-auto scrollbar-thin">
            <div class="min-w-[760px]">
              <div class="grid gap-2 px-5 py-3 bg-bg border-b-2 border-border" :style="memberGridCols">
                <span class="text-start text-label font-extrabold text-text-700">اسم العضو</span>
                <span class="text-start text-label font-extrabold text-text-700">الرقم الجامعي</span>
                <span class="text-start text-label font-extrabold text-text-700">الواتس</span>
                <span class="text-start text-label font-extrabold text-text-700">البريد</span>
                <span class="text-center text-label font-extrabold text-text-700">قائد الفريق</span>
                <span class="text-center text-label font-extrabold text-text-700">تواصل</span>
              </div>
              <div class="divide-y divide-border-soft">
                <div v-for="(member, idx) in group.members" :key="idx" class="row-interactive grid gap-2 px-5 py-3 items-center" :style="memberGridCols">
                  <span class="font-bold text-text-900 truncate" :title="member.name">{{ member.name }}</span>
                  <span class="mono truncate">{{ member.uid }}</span>
                  <span class="mono truncate">{{ member.whats || '—' }}</span>
                  <span class="mono truncate" :title="member.mail">{{ member.mail || '—' }}</span>
                  <span class="text-center">
                    <button
                      type="button"
                      class="grid place-items-center w-8 h-8 rounded-pill transition-colors duration-fast"
                      :class="member.leader ? 'bg-warning-bg text-warning-text' : 'border border-border text-text-400 hover:bg-warning-bg hover:text-warning-text'"
                      :title="member.leader ? 'قائد الفريق الحالي' : 'تعيين قائدًا للفريق'"
                      @click="requestLeaderChange(group, member)"
                    >
                      <Crown :size="14" :fill="member.leader ? 'currentColor' : 'none'" />
                    </button>
                  </span>
                  <span class="flex items-center justify-center gap-2">
                    <button type="button" class="grid place-items-center w-8 h-8 rounded-pill border border-border text-text-600 hover:bg-border-soft hover:text-primary-700" title="تعديل بيانات العضو" @click="openEditMember(member)"><Pencil :size="14" /></button>
                    <button v-if="member.whats" type="button" class="grid place-items-center w-8 h-8 rounded-pill bg-whatsapp-bg text-whatsapp hover:brightness-95" title="واتساب" @click="sendWhats(member)"><MessageCircle :size="14" /></button>
                    <button v-if="member.mail" type="button" class="grid place-items-center w-8 h-8 rounded-pill bg-primary-50 text-primary-600 hover:brightness-95" title="بريد" @click="sendMail(member)"><Mail :size="14" /></button>
                    <button type="button" class="grid place-items-center w-8 h-8 rounded-pill border border-border text-text-600 hover:bg-border-soft hover:text-primary-700" title="تقييد على المهام" @click="openRestrict(member)"><Lock :size="14" /></button>
                  </span>
                </div>
              </div>
            </div>
          </div>

          <!-- بطاقات (موبايل) -->
          <div class="md:hidden divide-y divide-border-soft">
            <div v-for="(member, idx) in group.members" :key="idx" class="p-4 space-y-2">
              <div class="flex items-center justify-between gap-3">
                <span class="font-bold text-text-900">{{ member.name }}</span>
                <Crown v-if="member.leader" :size="14" class="text-warning-text" fill="currentColor" />
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
                  <span class="text-label font-semibold text-text-400 shrink-0">تواصل</span>
                  <div class="flex gap-1.5">
                    <button type="button" class="grid place-items-center w-8 h-8 rounded-pill border border-border text-text-600 hover:bg-border-soft hover:text-primary-700" title="تعديل بيانات العضو" @click="openEditMember(member)"><Pencil :size="14" /></button>
                    <button v-if="member.whats" type="button" class="grid place-items-center w-8 h-8 rounded-pill bg-whatsapp-bg text-whatsapp hover:brightness-95" title="واتساب" @click="sendWhats(member)"><MessageCircle :size="14" /></button>
                    <button v-if="member.mail" type="button" class="grid place-items-center w-8 h-8 rounded-pill bg-primary-50 text-primary-600 hover:brightness-95" title="بريد" @click="sendMail(member)"><Mail :size="14" /></button>
                    <button
                      type="button"
                      class="grid place-items-center w-8 h-8 rounded-pill transition-colors duration-fast"
                      :class="member.leader ? 'bg-warning-bg text-warning-text' : 'border border-border text-text-400'"
                      :title="member.leader ? 'قائد الفريق الحالي' : 'تعيين قائدًا للفريق'"
                      @click="requestLeaderChange(group, member)"
                    >
                      <Crown :size="14" :fill="member.leader ? 'currentColor' : 'none'" />
                    </button>
                    <button type="button" class="grid place-items-center w-8 h-8 rounded-pill border border-border text-text-600 hover:bg-border-soft hover:text-primary-700" title="تقييد على المهام" @click="openRestrict(member)"><Lock :size="14" /></button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
    <Pagination class="mt-6" :current-page="page" :last-page="totalPages" :total="filteredGroups.length" @change="page = $event" />

    <!-- تعديل مجموعة -->
    <BaseModal v-model="editGroupModal" title="تعديل بيانات الفريق">
      <div class="grid grid-cols-1 gap-4">
        <BaseInput v-model="editGroupForm.name" label="اسم الفريق" />
        <BaseSelect v-model="editGroupForm.specialization_id" label="التخصص" :options="specializationOptions" />
      </div>
      <template #footer>
        <BaseButton variant="ghost" @click="editGroupModal = false">إلغاء</BaseButton>
        <BaseButton :icon="Check" :loading="savingGroup" @click="saveEditGroup">حفظ التعديلات</BaseButton>
      </template>
    </BaseModal>

    <!-- حذف فريق -->
    <BaseModal v-model="deleteModal" title="حذف الفريق" :description="deleteLabel" size="sm">
      <template #footer>
        <BaseButton variant="ghost" @click="deleteModal = false">إلغاء</BaseButton>
        <BaseButton variant="danger" :icon="Trash2" :loading="deleting" @click="confirmDelete">تأكيد الحذف</BaseButton>
      </template>
    </BaseModal>

    <!-- تقييد قائد الفريق على وحدة المهام -->
    <BaseModal v-model="restrictModalOpen" title="تقييد الوصول للمهام" :description="restrictTarget ? `صلاحية ${restrictTarget.name} على وحدة المهام` : ''" size="sm">
      <div class="flex flex-col gap-4">
        <BaseSelect
          v-model="restrictLevel"
          :options="levelOptions"
          :disabled="restrictSaving"
        />
        <BaseInput
          v-model="restrictReason" label="سبب التقييد" placeholder="مطلوب عند اختيار مستوى غير 'كامل'"
          :disabled="restrictLevel === 'full' || restrictSaving"
        />
      </div>
      <template #footer>
        <BaseButton variant="ghost" :disabled="restrictSaving" @click="restrictModalOpen = false">إلغاء</BaseButton>
        <BaseButton :icon="Check" :loading="restrictSaving" @click="saveRestrict">حفظ</BaseButton>
      </template>
    </BaseModal>

    <!-- تعيين قائد الفريق -->
    <BaseModal v-model="leaderModal" title="تعيين قائد الفريق" :description="leaderTarget ? `سيصبح ‏${leaderTarget.member.name} قائدًا لـ${leaderTarget.group.name}` : ''" size="sm">
      <p class="text-body-sm text-text-600">سيفقد القائد الحالي صلاحية القيادة. هل تريدين المتابعة؟</p>
      <template #footer>
        <BaseButton variant="ghost" @click="leaderModal = false">إلغاء</BaseButton>
        <BaseButton :icon="Crown" :loading="submittingLeader" @click="confirmLeaderChange">تأكيد</BaseButton>
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

    <!-- الفرق المحذوفة -->
    <BaseModal v-model="trashedModal" title="الفرق المحذوفة" description="استرجعي أي فريق حُذف بالخطأ" size="lg">
      <SkeletonLoader v-if="trashedTeamsLoading" :rows="3" height="60px" />
      <EmptyState v-else-if="!trashedGroups.length" title="لا يوجد فرق محذوفة" description="كل الفرق المحذوفة ستظهر هنا وبإمكانك استرجاعها." />
      <div v-else class="flex flex-col gap-2 max-h-96 overflow-y-auto scrollbar-thin">
        <div v-for="group in trashedGroups" :key="group.id" class="flex items-center justify-between gap-3 p-3 rounded-sm border border-border bg-bg">
          <div class="min-w-0">
            <div class="font-bold text-text-900 truncate">{{ group.name }}</div>
            <div class="text-caption text-text-400">{{ group.members.length }} {{ group.members.length === 1 ? 'طالب' : 'طلاب' }}</div>
          </div>
          <BaseButton variant="outline" size="sm" :icon="RotateCcw" :loading="restoringId === group.id" @click="confirmRestore(group)">استرجاع</BaseButton>
        </div>
      </div>
      <template #footer>
        <BaseButton variant="ghost" @click="trashedModal = false">إغلاق</BaseButton>
      </template>
    </BaseModal>
  </div>
</template>

<script>
import { mapState, mapActions } from 'pinia'
import { Search, ChevronLeft, ChevronDown, MessageCircle, Mail, Pencil, Trash2, Check, Crown, Lock, Archive, RotateCcw } from 'lucide-vue-next'
import BaseButton from '@/components/ui/BaseButton.vue'
import BaseSelect from '@/components/ui/BaseSelect.vue'
import BaseInput from '@/components/ui/BaseInput.vue'
import BaseBadge from '@/components/ui/BaseBadge.vue'
import BaseModal from '@/components/ui/BaseModal.vue'
import EmptyState from '@/components/ui/EmptyState.vue'
import SkeletonLoader from '@/components/ui/SkeletonLoader.vue'
import Pagination from '@/components/ui/Pagination.vue'
import { useTeamsStore } from '@/stores/teams.store'
import { useAuthStore } from '@/stores/auth.store'
import { useUsersStore } from '@/stores/users.store'
import { sendEmail } from '@/services/api'

const GROUPS_PAGE_SIZE = 5

const LEVEL_OPTIONS = [
  { value: 'full', label: 'كامل' },
  { value: 'view_only', label: 'عرض فقط' },
  { value: 'blocked', label: 'محظور' }
]

function digitsOnly(value) {
  return String(value || '').replace(/\D/g, '').replace(/^0/, '')
}

export default {
  name: 'SupervisorTeamsPage',

  components: { Search, ChevronLeft, ChevronDown, MessageCircle, Mail, Pencil, Trash2, Crown, Lock, BaseButton, BaseSelect, BaseInput, BaseBadge, BaseModal, EmptyState, SkeletonLoader, Pagination },

  data() {
    return {
      Check, Trash2, Archive, RotateCcw,
      search: '',
      openGroupIds: [],
      openMemberKeys: [],
      highlightId: null,
      sendingWhatsAll: false,
      sendingMailAll: false,

      editGroupModal: false,
      editGroupTargetId: null,
      editGroupForm: {},
      savingGroup: false,

      deleteModal: false,
      deleteTargetId: null,
      deleteLabel: '',
      deleting: false,

      levelOptions: LEVEL_OPTIONS,
      restrictModalOpen: false,
      restrictTarget: null,
      restrictLevel: 'full',
      restrictReason: '',
      restrictionId: null,
      restrictSaving: false,

      trashedModal: false,
      restoringId: null,

      leaderModal: false,
      leaderTarget: null,
      submittingLeader: false,

      editMemberModal: false,
      editMemberTargetId: null,
      editMemberForm: {},
      submitting: false,

      page: 1
    }
  },

  computed: {
    ...mapState(useTeamsStore, ['teamsForDisplay', 'specializations', 'trashedTeamsForDisplay', 'trashedTeamsLoading']),
    ...mapState(useAuthStore, ['user']),

    trashedGroups() {
      return this.trashedTeamsForDisplay.filter((g) => g.supId === this.user?.id)
    },

    specializationOptions() {
      return this.specializations.map((s) => ({ value: s.id, label: s.name }))
    },

    memberGridCols() {
      return { gridTemplateColumns: '22% 16% 16% 22% 12% 12%' }
    },

    groups() {
      return this.teamsForDisplay.filter((g) => g.supId === this.user?.id)
    },

    allMembers() {
      return this.groups.flatMap((g) => g.members)
    },

    filteredGroups() {
      const q = this.search.trim()
      return this.groups.filter((g) => {
        const memberNames = g.members.map((m) => m.name).join(' ')
        return !q || `${g.name}${memberNames}`.includes(q)
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
    this.highlightFromQuery()
  },

  methods: {
    ...mapActions(useTeamsStore, ['fetchTeams', 'fetchSpecializations', 'updateTeam', 'deleteTeam', 'fetchTrashedTeams', 'restoreTeam', 'updateTeamLeader']),
    ...mapActions(useUsersStore, ['fetchRestrictions', 'setRestriction', 'removeRestriction', 'updateUser', 'setUserPassword']),

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
      const id = this.$route.query.team
      if (!id) return
      const target = this.groups.find((g) => String(g.id) === String(id))
      if (!target) return
      const index = this.filteredGroups.findIndex((g) => g.id === target.id)
      if (index >= 0) this.page = Math.floor(index / GROUPS_PAGE_SIZE) + 1
      this.openGroupIds.push(target.id)
      this.highlightId = target.id
      this.$nextTick(() => {
        document.getElementById(`team-${target.id}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' })
        setTimeout(() => { this.highlightId = null }, 1800)
      })
    },

    openEditGroup(group) {
      this.editGroupTargetId = group.id
      const spec = this.specializations.find((s) => s.name === group.spec)
      this.editGroupForm = { name: group.name, specialization_id: spec?.id ?? null }
      this.editGroupModal = true
    },
    async saveEditGroup() {
      this.savingGroup = true
      try {
        await this.updateTeam(this.editGroupTargetId, this.editGroupForm)
        this.editGroupModal = false
        this.$toast?.success('تم حفظ التعديلات')
      } catch (err) {
        this.$toast?.error(err.normalized?.message || 'تعذّر حفظ التعديلات')
      } finally {
        this.savingGroup = false
      }
    },

    openDeleteGroup(group) {
      this.deleteTargetId = group.id
      this.deleteLabel = `حذف فريق "${group.name}" بالكامل`
      this.deleteModal = true
    },
    async confirmDelete() {
      this.deleting = true
      try {
        await this.deleteTeam(this.deleteTargetId)
        this.deleteModal = false
        this.$toast?.success('تم الحذف')
      } catch (err) {
        this.$toast?.error(err.normalized?.message || 'تعذّر الحذف')
      } finally {
        this.deleting = false
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

    requestLeaderChange(group, member) {
      if (member.leader) return
      this.leaderTarget = { group, member }
      this.leaderModal = true
    },
    async confirmLeaderChange() {
      this.submittingLeader = true
      try {
        await this.updateTeamLeader(this.leaderTarget.group.id, this.leaderTarget.member.id)
        this.leaderModal = false
        this.$toast?.success('تم تعيين قائد الفريق')
        await this.fetchTeams()
      } catch (err) {
        this.$toast?.error(err.normalized?.message || 'تعذّر تعيين القائد')
      } finally {
        this.submittingLeader = false
      }
    },

    async openRestrict(member) {
      this.restrictTarget = member
      this.restrictLevel = 'full'
      this.restrictReason = ''
      this.restrictionId = null
      this.restrictModalOpen = true
      try {
        const restrictions = await this.fetchRestrictions(member.id)
        const current = restrictions.find((r) => r.module === 'tasks')
        if (current) {
          this.restrictLevel = current.level
          this.restrictionId = current.id
          this.restrictReason = current.reason || ''
        }
      } catch {
        this.$toast?.error('تعذّر تحميل حالة التقييد')
      }
    },

    async saveRestrict() {
      if (this.restrictLevel !== 'full' && !this.restrictReason.trim()) {
        this.$toast?.error('يرجى إدخال سبب التقييد')
        return
      }
      this.restrictSaving = true
      try {
        if (this.restrictLevel === 'full') {
          if (this.restrictionId) await this.removeRestriction(this.restrictionId)
          this.restrictionId = null
        } else {
          const restriction = await this.setRestriction(this.restrictTarget.id, 'tasks', this.restrictLevel, this.restrictReason.trim())
          this.restrictionId = restriction.id
        }
        this.$toast?.success(this.restrictLevel === 'full' ? 'تم إلغاء القيد' : `تم تحديث القيد — السبب: ${this.restrictReason.trim()}`)
        this.restrictModalOpen = false
      } catch (err) {
        this.$toast?.error(err.normalized?.message || 'تعذّر تحديث القيد')
      } finally {
        this.restrictSaving = false
      }
    },

    openEditMember(member) {
      this.editMemberTargetId = member.id
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

    credentialsMessage(member, password) {
      return [
        `مرحبًا ${member.name}،`,
        `بيانات تسجيل الدخول لمنصة ${APP_NAME}:`,
        `اسم المنصة: ${APP_NAME}`,
        `رابط المنصة: ${window.location.origin}`,
        `الاسم: ${member.name}`,
        `الرقم الجامعي: ${member.uid}`,
        `البريد الإلكتروني: ${member.mail}`,
        `كلمة السر: ${password}`
      ].join('\n')
    },

    async sendWhats(member) {
      if (!member.whats || !member.id) return
      try {
        const password = await this.setUserPassword(member.id)
        const num = digitsOnly(member.whats)
        const full = num.startsWith('970') || num.startsWith('972') ? num : `970${num}`
        window.open(`https://wa.me/${full}?text=${encodeURIComponent(this.credentialsMessage(member, password))}`, '_blank')
      } catch (err) {
        this.$toast?.error(err.normalized?.message || 'تعذّر توليد كلمة سر جديدة')
      }
    },
    async sendMail(member) {
      if (!member.mail || !member.id) return
      try {
        const password = await this.setUserPassword(member.id)
        await sendEmail({
          to: member.mail,
          subject: `بيانات تسجيل الدخول لمنصة ${APP_NAME}`,
          message: this.credentialsMessage(member, password)
        })
        this.$toast?.success('تم إرسال البريد')
      } catch (err) {
        this.$toast?.error(err.normalized?.message || 'تعذّر إرسال البريد')
      }
    },

    async sendWhatsAll() {
      const targets = this.allMembers.filter((m) => m.whats && m.id)
      if (!targets.length) return
      if (!window.confirm(`سيتم توليد كلمة سر جديدة لكل عضو وفتح ${targets.length} محادثة واتساب. متابعة؟`)) return
      this.sendingWhatsAll = true
      try {
        for (const [i, member] of targets.entries()) {
          const password = await this.setUserPassword(member.id)
          setTimeout(() => {
            const num = digitsOnly(member.whats)
            const full = num.startsWith('970') || num.startsWith('972') ? num : `970${num}`
            window.open(`https://wa.me/${full}?text=${encodeURIComponent(this.credentialsMessage(member, password))}`, '_blank')
          }, i * 300)
        }
      } catch (err) {
        this.$toast?.error(err.normalized?.message || 'تعذّر إرسال البيانات للجميع')
      } finally {
        this.sendingWhatsAll = false
      }
    },
    async sendMailAll() {
      const targets = this.allMembers.filter((m) => m.mail && m.id)
      if (!targets.length) return
      if (!window.confirm(`سيتم توليد كلمة سر جديدة لكل عضو وإرسال ${targets.length} رسالة بريد عبر ${APP_NAME}. متابعة؟`)) return
      this.sendingMailAll = true
      try {
        for (const member of targets) {
          const password = await this.setUserPassword(member.id)
          await sendEmail({
            to: member.mail,
            subject: `بيانات تسجيل الدخول لمنصة ${APP_NAME}`,
            message: this.credentialsMessage(member, password)
          })
        }
        this.$toast?.success('تم إرسال البريد للجميع')
      } catch (err) {
        this.$toast?.error(err.normalized?.message || 'تعذّر إرسال البيانات للجميع')
      } finally {
        this.sendingMailAll = false
      }
    }
  }
}
</script>

<style scoped>
.mono { direction: ltr; text-align: start; display: inline-block; }
</style>
