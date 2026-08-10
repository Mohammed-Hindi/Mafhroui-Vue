<template>
  <div>
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
            <div class="text-body-sm font-extrabold text-text-900">{{ group.name }}</div>
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
                    <span v-if="member.leader" class="inline-grid place-items-center w-8 h-8 rounded-pill bg-warning-bg text-warning-text" title="قائد الفريق">
                      <Crown :size="14" fill="currentColor" />
                    </span>
                    <span v-else class="text-text-400">—</span>
                  </span>
                  <span class="flex items-center justify-center gap-2">
                    <button v-if="member.whats" type="button" class="grid place-items-center w-8 h-8 rounded-pill bg-whatsapp-bg text-whatsapp hover:brightness-95" title="واتساب" @click="sendWhats(member.whats)"><MessageCircle :size="14" /></button>
                    <button v-if="member.mail" type="button" class="grid place-items-center w-8 h-8 rounded-pill bg-primary-50 text-primary-600 hover:brightness-95" title="بريد" @click="sendMail(member.mail)"><Mail :size="14" /></button>
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
                    <button type="button" class="grid place-items-center w-8 h-8 rounded-pill bg-whatsapp-bg text-whatsapp hover:brightness-95" title="واتساب" @click="sendWhats(member.whats)"><MessageCircle :size="14" /></button>
                    <button type="button" class="grid place-items-center w-8 h-8 rounded-pill bg-primary-50 text-primary-600 hover:brightness-95" title="بريد" @click="sendMail(member.mail)"><Mail :size="14" /></button>
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
  </div>
</template>

<script>
import { mapState, mapActions } from 'pinia'
import { Search, ChevronLeft, ChevronDown, MessageCircle, Mail, Pencil, Trash2, Check, Crown } from 'lucide-vue-next'
import BaseButton from '@/components/ui/BaseButton.vue'
import BaseSelect from '@/components/ui/BaseSelect.vue'
import BaseInput from '@/components/ui/BaseInput.vue'
import BaseBadge from '@/components/ui/BaseBadge.vue'
import BaseModal from '@/components/ui/BaseModal.vue'
import EmptyState from '@/components/ui/EmptyState.vue'
import Pagination from '@/components/ui/Pagination.vue'
import { useTeamsStore } from '@/stores/teams.store'
import { useAuthStore } from '@/stores/auth.store'

const GROUPS_PAGE_SIZE = 5

function digitsOnly(value) {
  return String(value || '').replace(/\D/g, '').replace(/^0/, '')
}

export default {
  name: 'SupervisorTeamsPage',

  components: { Search, ChevronLeft, ChevronDown, MessageCircle, Mail, Pencil, Trash2, Crown, BaseButton, BaseSelect, BaseInput, BaseBadge, BaseModal, EmptyState, Pagination },

  data() {
    return {
      Check, Trash2,
      search: '',
      openGroupIds: [],
      openMemberKeys: [],
      highlightId: null,

      editGroupModal: false,
      editGroupTargetId: null,
      editGroupForm: {},
      savingGroup: false,

      deleteModal: false,
      deleteTargetId: null,
      deleteLabel: '',
      deleting: false,

      page: 1
    }
  },

  computed: {
    ...mapState(useTeamsStore, ['teamsForDisplay', 'specializations']),
    ...mapState(useAuthStore, ['user']),

    specializationOptions() {
      return this.specializations.map((s) => ({ value: s.id, label: s.name }))
    },

    memberGridCols() {
      return { gridTemplateColumns: '22% 16% 16% 22% 12% 12%' }
    },

    groups() {
      return this.teamsForDisplay.filter((g) => g.supId === this.user?.id)
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
    ...mapActions(useTeamsStore, ['fetchTeams', 'fetchSpecializations', 'updateTeam', 'deleteTeam']),

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

    sendWhats(whats) {
      const num = digitsOnly(whats)
      const full = num.startsWith('970') || num.startsWith('972') ? num : `970${num}`
      window.open(`https://wa.me/${full}`, '_blank')
    },
    sendMail(mail) {
      window.location.href = `mailto:${mail}`
    }
  }
}
</script>

<style scoped>
.mono { direction: ltr; text-align: start; display: inline-block; }
</style>
