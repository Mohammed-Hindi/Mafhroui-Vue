<template>
  <div>
    <div class="flex flex-wrap items-center gap-3 mb-6 p-4 rounded-lg bg-surface border border-border shadow-card">
      <div class="relative flex-1 min-w-[220px]">
        <Search :size="16" class="pointer-events-none absolute top-1/2 -translate-y-1/2 start-3 text-text-400" />
        <input v-model.trim="search" type="search" placeholder="ابحث عن مشروع أو فريق..." class="w-full h-icon-btn ps-10 pe-3 rounded-sm border border-border bg-bg text-body text-text-900 focus:border-primary-600 transition-colors duration-fast">
      </div>
    </div>

    <div class="flex items-center justify-between gap-4 mb-4">
      <h3 class="font-cairo font-bold text-h4 text-text-900">مواعيد مناقشات فرقي</h3>
      <span class="text-caption text-text-600">{{ filteredDiscussions.length }} موعد</span>
    </div>

    <SkeletonLoader v-if="discussionsLoading" :rows="4" height="80px" />
    <EmptyState v-else-if="!filteredDiscussions.length" title="لا توجد مواعيد مسجّلة" description="لجنة الإشراف هي من تحدد مواعيد المناقشات لفرقك." />

    <div v-else class="flex flex-col gap-4">
      <div v-for="d in pageDiscussions" :key="d.id" class="bg-surface border border-border rounded-lg shadow-card overflow-hidden">
        <div class="flex items-center gap-4 p-4 flex-wrap">
          <div class="w-10 h-10 rounded-md shrink-0 grid place-items-center text-white" style="background: linear-gradient(135deg, var(--color-primary-600), var(--color-accent-500))">
            <CalendarClock :size="18" />
          </div>

          <div class="flex-1 min-w-0 flex items-center gap-3 sm:gap-6 flex-wrap">
            <div>
              <div class="text-body-sm font-extrabold text-text-900">{{ d.proj }}</div>
              <div class="text-label text-text-400">{{ d.team }}</div>
            </div>
            <BaseBadge variant="info">{{ formatDate(d.date) }} — {{ d.time }}</BaseBadge>
            <BaseBadge :variant="d.status === 'confirmed' ? 'success' : 'warning'" dot>{{ d.status === 'confirmed' ? 'مؤكَّد' : 'قيد الانتظار' }}</BaseBadge>
          </div>

          <button v-if="d.whatsapp" type="button" class="grid place-items-center w-8 h-8 rounded-sm border border-whatsapp-bg text-whatsapp hover:bg-whatsapp-bg shrink-0" title="تذكير واتساب" @click="sendWhats(d.whatsapp)"><MessageCircle :size="14" /></button>
        </div>

        <div class="flex flex-wrap gap-x-8 gap-y-2 px-5 py-3.5 bg-bg border-t border-border-soft text-caption">
          <div class="flex items-center gap-2 text-text-700"><MapPin :size="14" class="text-text-400 shrink-0" /><span class="text-text-400">المكان:</span> {{ d.place }}</div>
          <div class="flex items-center gap-2 text-text-700"><Users :size="14" class="text-text-400 shrink-0" /><span class="text-text-400">لجنة المناقشة:</span> {{ d.committee }}</div>
        </div>
      </div>
    </div>

    <div v-if="totalPages > 1" class="flex flex-wrap items-center justify-between gap-4 mt-6">
      <BaseSelect v-model="pageDropdown" class="min-w-[160px]" :options="pageOptions" />
      <Pagination :current-page="page" :last-page="totalPages" :total="filteredDiscussions.length" @change="page = $event" />
    </div>
  </div>
</template>

<script>
import { Search, MessageCircle, MapPin, Users, CalendarClock } from 'lucide-vue-next'
import { mapState, mapActions } from 'pinia'
import { useAuthStore } from '@/stores/auth.store'
import BaseSelect from '@/components/ui/BaseSelect.vue'
import BaseBadge from '@/components/ui/BaseBadge.vue'
import EmptyState from '@/components/ui/EmptyState.vue'
import SkeletonLoader from '@/components/ui/SkeletonLoader.vue'
import Pagination from '@/components/ui/Pagination.vue'
import { formatDate } from '@/utils/formatters'
import { useDiscussionsStore } from '@/stores/discussions.store'

const APPTS_PAGE_SIZE = 5

function digitsOnly(value) {
  return String(value || '').replace(/\D/g, '').replace(/^0/, '')
}

export default {
  name: 'SupervisorAppointmentsPage',

  components: { Search, MessageCircle, MapPin, Users, CalendarClock, BaseSelect, BaseBadge, EmptyState, SkeletonLoader, Pagination },

  data() {
    return {
      search: '',
      page: 1
    }
  },

  computed: {
    ...mapState(useDiscussionsStore, ['discussions', 'discussionsLoading']),
    ...mapState(useAuthStore, ['user']),

    rows() {
      return this.discussions
        .filter((d) => d.supervisor_id === this.user?.id)
        .map((d) => ({
          id: d.id,
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
    await this.fetchDiscussions()
  },

  methods: {
    formatDate,
    ...mapActions(useDiscussionsStore, ['fetchDiscussions']),

    sendWhats(whats) {
      const num = digitsOnly(whats)
      const full = num.startsWith('970') || num.startsWith('972') ? num : `970${num}`
      window.open(`https://wa.me/${full}`, '_blank')
    }
  }
}
</script>
