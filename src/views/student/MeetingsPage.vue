<template>
  <div>
    <EmptyState v-if="!myTeam" title="لسا ما إلك فريق" />
    <template v-else>
      <section class="mb-10">
        <h3 class="font-cairo font-bold text-h4 text-text-900 mb-4 flex items-center gap-2.5">
          الاجتماعات القادمة
          <span class="grid place-items-center w-8 h-8 rounded-pill bg-primary-50 text-primary-600"><Clock :size="16" /></span>
        </h3>
        <EmptyState v-if="!upcoming.length" title="لا توجد اجتماعات قادمة حاليًا" />
        <div v-else class="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <MeetingCard v-for="meeting in upcomingPage" :key="meeting.id" :meeting="meeting" />
        </div>
        <Pagination v-if="upcoming.length" class="mt-4" :current-page="upcomingPage_" :last-page="upcomingLastPage" :total="upcoming.length" @change="upcomingPage_ = $event" />
      </section>

      <section>
        <h3 class="font-cairo font-bold text-h4 text-text-900 mb-4 flex items-center gap-2.5">
          الاجتماعات المنتهية
          <span class="grid place-items-center w-8 h-8 rounded-pill bg-success-bg text-success"><CheckCircle2 :size="16" /></span>
        </h3>
        <EmptyState v-if="!completed.length" title="لا توجد اجتماعات منتهية بعد" />
        <div v-else class="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <MeetingCard v-for="meeting in completedPage" :key="meeting.id" :meeting="meeting" done />
        </div>
        <Pagination v-if="completed.length" class="mt-4" :current-page="completedPage_" :last-page="completedLastPage" :total="completed.length" @change="completedPage_ = $event" />
      </section>
    </template>
  </div>
</template>

<script>
import { mapState, mapActions } from 'pinia'
import { Clock, CheckCircle2 } from 'lucide-vue-next'
import Pagination from '@/components/ui/Pagination.vue'
import EmptyState from '@/components/ui/EmptyState.vue'
import MeetingCard from '@/components/shared/MeetingCard.vue'
import { useTeamsStore } from '@/stores/teams.store'
import { useAuthStore } from '@/stores/auth.store'

const PAGE_SIZE = 2

export default {
  name: 'StudentMeetingsPage',

  components: { Pagination, EmptyState, MeetingCard },

  data() {
    return {
      Clock, CheckCircle2,
      upcomingPage_: 1,
      completedPage_: 1
    }
  },

  computed: {
    ...mapState(useTeamsStore, ['teams', 'meetings']),
    ...mapState(useAuthStore, ['user']),

    myTeam() {
      return this.teams.find((t) => t.members?.some((m) => m.student?.id === this.user?.id))
    },

    mappedMeetings() {
      return this.meetings.map((m) => ({
        id: m.id,
        title: m.title,
        num: this.myTeam?.id,
        date: this.formatDate(m.scheduled_at),
        time: this.formatTime(m.scheduled_at),
        link: m.google_meet_link || '',
        notes: m.notes || '',
        raw: m
      }))
    },
    upcoming() {
      return this.mappedMeetings.filter((m) => !this.isPast(m.raw))
    },
    completed() {
      return this.mappedMeetings.filter((m) => this.isPast(m.raw))
    },
    upcomingLastPage() {
      return Math.max(1, Math.ceil(this.upcoming.length / PAGE_SIZE))
    },
    completedLastPage() {
      return Math.max(1, Math.ceil(this.completed.length / PAGE_SIZE))
    },
    upcomingPage() {
      const start = (this.upcomingPage_ - 1) * PAGE_SIZE
      return this.upcoming.slice(start, start + PAGE_SIZE)
    },
    completedPage() {
      const start = (this.completedPage_ - 1) * PAGE_SIZE
      return this.completed.slice(start, start + PAGE_SIZE)
    }
  },

  async created() {
    await this.fetchTeams()
    if (this.myTeam) await this.fetchMeetings(this.myTeam.id)
  },

  methods: {
    ...mapActions(useTeamsStore, ['fetchTeams', 'fetchMeetings']),

    formatDate(scheduledAt) {
      return new Date(scheduledAt).toLocaleDateString('ar-EG')
    },
    formatTime(scheduledAt) {
      return new Date(scheduledAt).toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })
    },
    isPast(meeting) {
      return new Date(meeting.scheduled_at) < new Date()
    }
  }
}
</script>
