<template>
  <!-- الاجتماعات للطالب بهوية البوابة: رأس صفحة + بطاقتان (القادمة / المنتهية) بعنوان ≡ — بيانات تجريبية حين لا توجد اجتماعات -->
  <div class="dash hd-page">
    <header class="dash-head"><h2 class="dash-title">الاجتماعات</h2></header>

    <section class="dash-card">
      <div class="dash-card-head"><h3 class="portal-title">الاجتماعات القادمة</h3><span class="hd-card-sub">{{ upcoming.length }}</span></div>
      <p v-if="!upcoming.length" class="palert is-warning hd-alert"><span class="hd-ic is-warning">!</span> لا توجد اجتماعات قادمة حاليًا</p>
      <div v-else class="st-meetings">
        <MeetingCard v-for="meeting in upcomingPage" :key="meeting.id" :meeting="meeting" />
      </div>
      <Pagination v-if="upcoming.length > PAGE_SIZE" class="mt-4" :current-page="upcomingPage_" :last-page="upcomingLastPage" :total="upcoming.length" @change="upcomingPage_ = $event" />
    </section>

    <section class="dash-card">
      <div class="dash-card-head"><h3 class="portal-title">الاجتماعات المنتهية</h3><span class="hd-card-sub">{{ completed.length }}</span></div>
      <p v-if="!completed.length" class="palert is-warning hd-alert"><span class="hd-ic is-warning">!</span> لا توجد اجتماعات منتهية بعد</p>
      <div v-else class="st-meetings">
        <MeetingCard v-for="meeting in completedPage" :key="meeting.id" :meeting="meeting" done />
      </div>
      <Pagination v-if="completed.length > PAGE_SIZE" class="mt-4" :current-page="completedPage_" :last-page="completedLastPage" :total="completed.length" @change="completedPage_ = $event" />
    </section>
  </div>
</template>

<script>
import { mapState, mapActions } from 'pinia'
import Pagination from '@/components/ui/Pagination.vue'
import { placeholderMeetings } from '@/utils/studentPlaceholders'
import MeetingCard from '@/components/shared/MeetingCard.vue'
import { useTeamsStore } from '@/stores/teams.store'
import { useAuthStore } from '@/stores/auth.store'

const PAGE_SIZE = 4

export default {
  name: 'StudentMeetingsPage',

  components: { Pagination, MeetingCard },

  data() {
    return {
      PAGE_SIZE,
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
      // بلا فريق أو بلا اجتماعات: اجتماعات تجريبية (placeholder)
      const list = this.myTeam && this.meetings.length ? this.meetings : placeholderMeetings()
      return list.map((m) => ({
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
