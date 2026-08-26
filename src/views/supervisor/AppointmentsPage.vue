<template>
  <div>
    <div class="flex flex-wrap gap-3 mb-6">
      <button type="button" class="flex items-center gap-2 h-10 px-4 rounded-sm bg-success-bg text-success text-caption font-bold hover:brightness-95 transition-all duration-fast disabled:opacity-40 disabled:pointer-events-none" :disabled="!allMembersWhats.length" @click="sendWhatsAll">
        <MessageCircle :size="15" /> واتساب للجميع ({{ allMembersWhats.length }})
      </button>
      <button type="button" class="flex items-center gap-2 h-10 px-4 rounded-sm bg-primary-50 text-primary-700 text-caption font-bold hover:bg-primary-100 transition-colors duration-fast disabled:opacity-40 disabled:pointer-events-none" :disabled="!allMembersMail.length" @click="sendMailAll">
        <Mail :size="15" /> بريد للجميع (Gmail)
      </button>
    </div>

    <div class="flex flex-wrap items-center gap-3 mb-6 p-4 rounded-lg bg-surface border border-border shadow-card">
      <div class="relative flex-1 min-w-[220px]">
        <Search :size="16" class="pointer-events-none absolute top-1/2 -translate-y-1/2 start-3 text-text-400" />
        <input v-model.trim="search" type="search" placeholder="ابحث عن مشروع أو فريق..." class="w-full h-icon-btn ps-10 pe-3 rounded-sm border border-border bg-bg text-body text-text-900 focus:border-primary-600 transition-colors duration-fast">
      </div>
    </div>

    <div class="flex items-center justify-between gap-4 mb-4">
      <h3 class="font-cairo font-bold text-h4 text-text-900">مواعيد مناقشات فرقي</h3>
      <span class="text-caption text-text-600">{{ filteredDiscussions.length }} مجموعة — {{ filteredStudentsCount }} طالبًا</span>
    </div>

    <SkeletonLoader v-if="discussionsLoading" :rows="4" height="80px" />
    <EmptyState v-else-if="!filteredDiscussions.length" title="لا توجد مواعيد مسجّلة" description="لجنة الإشراف هي من تحدد مواعيد المناقشات لفرقك." />

    <div v-else class="flex flex-col gap-4">
      <div v-for="d in pageDiscussions" :key="d.id" class="bg-surface border border-border rounded-lg shadow-card overflow-hidden">
        <div class="flex items-center gap-4 p-4 flex-wrap">
          <button
            type="button" class="grid place-items-center w-9 h-9 rounded-sm bg-border-soft text-text-600 transition-all duration-base shrink-0"
            :class="{ '!bg-primary-600 !text-white rotate-90': isDiscussionOpen(d.id) }"
            @click="toggleDiscussion(d.id)"
          >
            <ChevronDown :size="16" />
          </button>

          <div class="w-10 h-10 rounded-md shrink-0 grid place-items-center text-white" style="background: linear-gradient(135deg, var(--color-primary-600), var(--color-accent-500))">
            <CalendarClock :size="18" />
          </div>

          <div class="flex-1 min-w-0 flex items-center gap-3 sm:gap-6 flex-wrap">
            <div>
              <div class="text-body-sm font-extrabold text-text-900">{{ d.proj }}</div>
              <div class="text-label text-text-400">{{ d.team }}</div>
            </div>
            <BaseBadge variant="info">{{ formatDate(d.date) }} — {{ d.time }}</BaseBadge>
            <BaseBadge>{{ membersFor(d.teamId).length }} {{ membersFor(d.teamId).length === 1 ? 'طالب' : 'طلاب' }}</BaseBadge>
            <BaseBadge :variant="d.status === 'confirmed' ? 'success' : 'warning'" dot>{{ d.status === 'confirmed' ? 'مؤكَّد' : 'قيد الانتظار' }}</BaseBadge>
          </div>

          <button v-if="d.whatsapp" type="button" class="grid place-items-center w-8 h-8 rounded-sm border border-whatsapp-bg text-whatsapp hover:bg-whatsapp-bg shrink-0" title="تذكير واتساب" @click="sendWhats(d.whatsapp)"><MessageCircle :size="14" /></button>
        </div>

        <div v-show="isDiscussionOpen(d.id)" class="border-t border-border-soft">
          <div class="flex flex-wrap gap-x-8 gap-y-2 px-5 py-3.5 bg-bg border-b border-border-soft text-caption">
            <div class="flex items-center gap-2 text-text-700"><MapPin :size="14" class="text-text-400 shrink-0" /><span class="text-text-400">المكان:</span> {{ d.place }}</div>
            <div class="flex items-center gap-2 text-text-700"><span class="text-text-400">الوقت:</span> {{ d.time }}</div>
            <div class="flex items-center gap-2 text-text-700"><Users :size="14" class="text-text-400 shrink-0" /><span class="text-text-400">لجنة المناقشة:</span> {{ d.committee }}</div>
          </div>

          <div class="hidden md:block overflow-x-auto scrollbar-thin">
            <table class="w-full border-collapse min-w-[500px]">
              <thead>
                <tr class="bg-bg border-b-2 border-border divide-x divide-border-soft">
                  <th class="px-5 py-3 text-start text-label font-extrabold text-text-700">اسم الطالب</th>
                  <th class="px-5 py-3 text-start text-label font-extrabold text-text-700">الواتس</th>
                  <th class="px-5 py-3 text-start text-label font-extrabold text-text-700">البريد</th>
                  <th class="px-5 py-3 text-start text-label font-extrabold text-text-700">إجراءات</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-border-soft">
                <tr v-for="m in membersFor(d.teamId)" :key="m.id" class="divide-x divide-border-soft">
                  <td class="px-5 py-3 font-bold text-text-900">{{ m.name }}</td>
                  <td class="px-5 py-3 mono">{{ m.whats || '—' }}</td>
                  <td class="px-5 py-3 mono whitespace-nowrap">{{ m.mail || '—' }}</td>
                  <td class="px-5 py-3">
                    <div class="flex gap-2">
                      <button v-if="m.whats" type="button" class="grid place-items-center w-8 h-8 rounded-sm border border-whatsapp-bg text-whatsapp hover:bg-whatsapp-bg" title="واتساب" @click="sendWhats(m.whats)"><MessageCircle :size="14" /></button>
                      <button v-if="m.mail" type="button" class="grid place-items-center w-8 h-8 rounded-sm border border-primary-100 text-primary-600 hover:bg-primary-50" title="بريد" @click="sendMail(m.mail)"><Mail :size="14" /></button>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <div class="md:hidden divide-y divide-border-soft">
            <div v-for="m in membersFor(d.teamId)" :key="m.id" class="p-4 space-y-2">
              <div class="flex items-center justify-between gap-3">
                <span class="font-bold text-text-900">{{ m.name }}</span>
              </div>
              <button
                type="button"
                class="w-full flex items-center justify-center gap-1.5 text-caption font-bold text-primary-600 py-1.5 rounded-sm hover:bg-primary-50 transition-colors duration-fast"
                @click="toggleStudentDetails(d.id, m.id)"
              >
                {{ isStudentOpen(d.id, m.id) ? 'إخفاء التفاصيل' : 'عرض التفاصيل' }}
                <ChevronDown :size="14" :class="['transition-transform duration-fast', isStudentOpen(d.id, m.id) && 'rotate-180']" />
              </button>
              <div v-if="isStudentOpen(d.id, m.id)" class="space-y-2 pt-2 border-t border-dashed border-border">
                <div class="flex items-start justify-between gap-3"><span class="text-label font-semibold text-text-400 shrink-0">رقم الواتس</span><span class="mono text-body-sm text-text-700">{{ m.whats || '—' }}</span></div>
                <div class="flex items-start justify-between gap-3"><span class="text-label font-semibold text-text-400 shrink-0">البريد الإلكتروني</span><span class="mono text-body-sm text-text-700 whitespace-nowrap">{{ m.mail || '—' }}</span></div>
                <div class="flex items-start justify-between gap-3">
                  <span class="text-label font-semibold text-text-400 shrink-0">إجراءات</span>
                  <div class="flex gap-1.5">
                    <button v-if="m.whats" type="button" class="grid place-items-center w-8 h-8 rounded-sm border border-whatsapp-bg text-whatsapp hover:bg-whatsapp-bg" title="واتساب" @click="sendWhats(m.whats)"><MessageCircle :size="14" /></button>
                    <button v-if="m.mail" type="button" class="grid place-items-center w-8 h-8 rounded-sm border border-primary-100 text-primary-600 hover:bg-primary-50" title="بريد" @click="sendMail(m.mail)"><Mail :size="14" /></button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div v-if="totalPages > 1" class="flex flex-wrap items-center justify-between gap-4 mt-6">
      <BaseSelect v-model="pageDropdown" class="min-w-[160px]" :options="pageOptions" />
      <Pagination :current-page="page" :last-page="totalPages" :total="filteredDiscussions.length" @change="page = $event" />
    </div>

    <EmailComposeModal v-model="emailComposeOpen" :to="emailComposeTarget" />
  </div>
</template>

<script>
import { Search, MessageCircle, Mail, MapPin, Users, ChevronDown, CalendarClock } from 'lucide-vue-next'
import { mapState, mapActions } from 'pinia'
import { useAuthStore } from '@/stores/auth.store'
import BaseSelect from '@/components/ui/BaseSelect.vue'
import BaseBadge from '@/components/ui/BaseBadge.vue'
import EmptyState from '@/components/ui/EmptyState.vue'
import SkeletonLoader from '@/components/ui/SkeletonLoader.vue'
import Pagination from '@/components/ui/Pagination.vue'
import { formatDate } from '@/utils/formatters'
import { useDiscussionsStore } from '@/stores/discussions.store'
import { useTeamsStore } from '@/stores/teams.store'
import EmailComposeModal from '@/components/shared/EmailComposeModal.vue'

const APPTS_PAGE_SIZE = 5

function digitsOnly(value) {
  return String(value || '').replace(/\D/g, '').replace(/^0/, '')
}

export default {
  name: 'SupervisorAppointmentsPage',

  components: { Search, MessageCircle, Mail, MapPin, Users, ChevronDown, CalendarClock, BaseSelect, BaseBadge, EmptyState, SkeletonLoader, Pagination, EmailComposeModal },

  data() {
    return {
      search: '',
      openDiscussionIds: [],
      openStudentKeys: [],
      page: 1,
      emailComposeOpen: false,
      emailComposeTarget: ''
    }
  },

  computed: {
    ...mapState(useDiscussionsStore, ['discussions', 'discussionsLoading']),
    ...mapState(useTeamsStore, ['teams']),
    ...mapState(useAuthStore, ['user']),

    rows() {
      return this.discussions
        .filter((d) => d.supervisor_id === this.user?.id)
        .map((d) => ({
          id: d.id,
          teamId: d.project?.team?.id ?? null,
          proj: d.project?.name || '—',
          team: d.project?.team?.name || '—',
          place: d.place,
          date: d.discussion_date,
          time: (d.discussion_time || '').slice(0, 5),
          committee: d.committee,
          whatsapp: d.whatsapp,
          status: d.status
        }))
    },

    filteredDiscussions() {
      const q = this.search.trim()
      return this.rows.filter((r) => !q || `${r.proj}${r.team}`.includes(q))
    },

    filteredStudentsCount() {
      return this.filteredDiscussions.reduce((sum, d) => sum + this.membersFor(d.teamId).length, 0)
    },
    discussionMembers() {
      return this.filteredDiscussions.flatMap((d) => this.membersFor(d.teamId))
    },
    allMembersWhats() {
      return this.discussionMembers.filter((m) => m.whats)
    },
    allMembersMail() {
      return this.discussionMembers.map((m) => m.mail).filter(Boolean)
    },

    totalPages() {
      return Math.max(1, Math.ceil(this.filteredDiscussions.length / APPTS_PAGE_SIZE))
    },
    pageOptions() {
      return Array.from({ length: this.totalPages }, (_, i) => ({ value: i + 1, label: `الصفحة ${i + 1} من ${this.totalPages}` }))
    },
    pageDropdown: {
      get() { return this.page },
      set(value) { this.page = value }
    },
    pageDiscussions() {
      const start = (this.page - 1) * APPTS_PAGE_SIZE
      return this.filteredDiscussions.slice(start, start + APPTS_PAGE_SIZE)
    }
  },

  watch: {
    filteredDiscussions() {
      this.page = 1
    }
  },

  async created() {
    await Promise.all([this.fetchDiscussions(), this.fetchTeams()])
  },

  methods: {
    formatDate,
    ...mapActions(useDiscussionsStore, ['fetchDiscussions']),
    ...mapActions(useTeamsStore, ['fetchTeams']),

    isDiscussionOpen(id) {
      return this.openDiscussionIds.includes(id)
    },
    toggleDiscussion(id) {
      this.openDiscussionIds = this.isDiscussionOpen(id) ? this.openDiscussionIds.filter((x) => x !== id) : [...this.openDiscussionIds, id]
    },
    membersFor(teamId) {
      const team = this.teams.find((t) => t.id === teamId)
      return (team?.members || []).map((m) => ({
        id: m.id,
        name: m.student?.name || '',
        whats: m.student?.whatsapp,
        mail: m.student?.email
      }))
    },

    isStudentOpen(discussionId, memberId) {
      return this.openStudentKeys.includes(`${discussionId}-${memberId}`)
    },
    toggleStudentDetails(discussionId, memberId) {
      const key = `${discussionId}-${memberId}`
      this.openStudentKeys = this.isStudentOpen(discussionId, memberId) ? this.openStudentKeys.filter((k) => k !== key) : [...this.openStudentKeys, key]
    },

    sendWhats(whats) {
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
      if (!this.allMembersWhats.length) return
      if (!window.confirm(`سيتم فتح ${this.allMembersWhats.length} محادثة واتساب في تبويبات منفصلة. متابعة؟`)) return
      this.allMembersWhats.forEach((m, i) => setTimeout(() => this.sendWhats(m.whats), i * 300))
    },
    sendMailAll() {
      if (!this.allMembersMail.length) return
      const url = `https://mail.google.com/mail/?view=cm&fs=1&bcc=${encodeURIComponent(this.allMembersMail.join(','))}&su=${encodeURIComponent('تعميم بخصوص مواعيد المناقشات')}`
      window.open(url, '_blank')
    }
  }
}
</script>

<style scoped>
.mono { direction: ltr; text-align: start; display: inline-block; }
</style>
