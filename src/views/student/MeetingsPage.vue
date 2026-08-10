<template>
  <div>
    <EmptyState v-if="!myTeam" title="لسا ما إلك فريق" />
    <div v-else class="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
      <div class="bg-surface rounded-lg border border-border shadow-card p-6">
        <MeetingCalendar :meetings="meetings" @select-day="onSelectDay" />
      </div>

      <div class="bg-surface rounded-lg border border-border shadow-card p-6 min-h-[360px] flex flex-col">
        <template v-if="dayMeetings.length">
          <div v-for="meeting in dayMeetings" :key="meeting.id" class="flex-1 flex flex-col" :class="{ 'mb-6 pb-6 border-b border-border-soft': dayMeetings.length > 1 }">
            <div class="flex items-center justify-between gap-2 mb-3">
              <h4 class="font-cairo font-bold text-h4 text-text-900">{{ meeting.title }}</h4>
              <span :class="['shrink-0 text-label font-bold px-2.5 py-1 rounded-pill', isPast(meeting) ? 'bg-success-bg text-success' : 'bg-info-bg text-info']">
                {{ isPast(meeting) ? 'منتهي' : 'قادم' }}
              </span>
            </div>
            <div class="flex items-center gap-1.5 text-caption text-text-600 mb-1.5">
              <CalendarDays :size="13" class="text-text-400 shrink-0" />
              {{ formatDate(meeting.scheduled_at) }}
            </div>
            <div class="flex items-center gap-1.5 text-caption text-text-600 mb-1.5">
              <Clock :size="13" class="text-text-400 shrink-0" />
              {{ formatTime(meeting.scheduled_at) }}
            </div>
            <p v-if="meeting.notes" class="flex items-start gap-1.5 text-caption text-text-600 mt-2">
              <FileText :size="13" class="text-text-400 shrink-0 mt-0.5" />
              {{ meeting.notes }}
            </p>

            <a v-if="meeting.google_meet_link" :href="meeting.google_meet_link" target="_blank" rel="noopener" class="inline-flex items-center justify-center gap-2 h-10 mt-4 pt-4 border-t border-border-soft rounded-sm border border-primary-100 bg-primary-50 text-primary-700 text-body-sm font-bold hover:bg-primary-100 transition-colors duration-fast">
              <Video :size="15" /> دخول
            </a>
          </div>
        </template>
        <div v-else class="flex-1 flex flex-col items-center justify-center text-center gap-2">
          <span class="grid place-items-center w-12 h-12 rounded-pill bg-bg border border-border text-text-400"><CalendarDays :size="20" /></span>
          <p class="text-body-sm font-bold text-text-900">اختاري يوم فيه اجتماع</p>
          <p class="text-caption text-text-600">الأيام المعلّمة بالأحمر فيها اجتماعات</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { mapState, mapActions } from 'pinia'
import { Clock, CalendarDays, FileText, Video } from 'lucide-vue-next'
import EmptyState from '@/components/ui/EmptyState.vue'
import MeetingCalendar from '@/components/shared/MeetingCalendar.vue'
import { useTeamsStore } from '@/stores/teams.store'
import { useAuthStore } from '@/stores/auth.store'

export default {
  name: 'StudentMeetingsPage',

  components: { EmptyState, MeetingCalendar, CalendarDays, Clock, FileText, Video },

  data() {
    return { dayMeetings: [] }
  },

  computed: {
    ...mapState(useTeamsStore, ['teams', 'meetings']),
    ...mapState(useAuthStore, ['user']),

    myTeam() {
      return this.teams.find((t) => t.members?.some((m) => m.student?.id === this.user?.id))
    }
  },

  async created() {
    await this.fetchTeams()
    if (this.myTeam) await this.fetchMeetings(this.myTeam.id)
  },

  methods: {
    ...mapActions(useTeamsStore, ['fetchTeams', 'fetchMeetings']),

    onSelectDay(dayMeetings) {
      this.dayMeetings = dayMeetings
    },
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
