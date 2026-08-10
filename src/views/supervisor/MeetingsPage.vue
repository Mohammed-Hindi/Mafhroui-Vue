<template>
  <div>
    <div class="flex flex-wrap items-center justify-between gap-4 mb-6">
      <div class="max-w-xs w-full">
        <BaseSelect v-model="selectedTeamId" label="اختر الفريق" :options="teamOptions" @update:model-value="onTeamChange" />
      </div>
      <BaseButton v-if="selectedTeamId" :icon="Plus" @click="openCreate">اجتماع جديد</BaseButton>
    </div>

    <EmptyState v-if="!teamOptions.length" title="لا توجد فرق مُسندة إليك" />
    <div v-else-if="selectedTeamId" class="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
      <div class="bg-surface rounded-lg border border-border shadow-card p-6">
        <MeetingCalendar :meetings="meetings" :selected-id="selectedMeeting?.id" @select-day="onSelectDay" />
      </div>

      <div class="bg-surface rounded-lg border border-border shadow-card p-6 min-h-[360px] flex flex-col">
        <template v-if="dayMeetings.length">
          <div v-for="meeting in dayMeetings" :key="meeting.id" class="flex-1 flex flex-col" :class="{ 'mb-6 pb-6 border-b border-border-soft': dayMeetings.length > 1 }">
            <div class="flex items-center justify-between gap-2 mb-3">
              <h4 class="font-cairo font-bold text-h4 text-text-900">{{ meeting.title }}</h4>
              <div class="flex items-center gap-2 shrink-0">
                <span :class="['text-label font-bold px-2.5 py-1 rounded-pill', isPast(meeting) ? 'bg-success-bg text-success' : 'bg-info-bg text-info']">
                  {{ isPast(meeting) ? 'منتهي' : 'قادم' }}
                </span>
                <button type="button" class="grid place-items-center w-7 h-7 rounded-sm text-text-400 hover:bg-error-bg hover:text-error transition-colors duration-fast" title="إلغاء الاجتماع" @click="confirmCancel(meeting)">
                  <Trash2 :size="14" />
                </button>
              </div>
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

            <div v-if="meeting.google_meet_link || remindNumber" class="flex items-center gap-2 mt-4 pt-4 border-t border-border-soft">
              <a v-if="meeting.google_meet_link" :href="meeting.google_meet_link" target="_blank" rel="noopener" class="flex-1 inline-flex items-center justify-center gap-2 h-10 rounded-sm border border-primary-100 bg-primary-50 text-primary-700 text-body-sm font-bold hover:bg-primary-100 transition-colors duration-fast">
                <Video :size="15" /> دخول
              </a>
              <button v-if="remindNumber" type="button" class="inline-flex items-center justify-center gap-2 h-10 px-3 rounded-sm border border-secondary-100 bg-secondary-50 text-secondary-700 text-body-sm font-bold hover:bg-secondary-100 transition-colors duration-fast shrink-0" @click="sendReminder(meeting)">
                <MessageCircle :size="15" /> تذكير واتساب
              </button>
            </div>
          </div>
        </template>
        <div v-else class="flex-1 flex flex-col items-center justify-center text-center gap-2">
          <span class="grid place-items-center w-12 h-12 rounded-pill bg-bg border border-border text-text-400"><CalendarDays :size="20" /></span>
          <p class="text-body-sm font-bold text-text-900">اختاري يوم فيه اجتماع</p>
          <p class="text-caption text-text-600">الأيام المعلّمة بالأحمر فيها اجتماعات</p>
        </div>
      </div>
    </div>

    <BaseModal v-model="modalOpen" title="اجتماع جديد" description="سيتم إشعار الفريق المعني">
      <div class="flex flex-col gap-4">
        <BaseInput v-model="form.title" label="اسم الاجتماع" placeholder="مثال: مراجعة الفصل الثاني من التقرير" required />
        <div class="grid grid-cols-2 gap-4">
          <BaseInput v-model="form.date" type="date" label="التاريخ" required />
          <BaseInput v-model="form.time" type="time" label="الوقت" required />
        </div>
        <BaseInput v-model="form.link" label="رابط الاجتماع (Google Meet)" placeholder="https://meet.google.com/xxx-xxxx-xxx" />
        <BaseTextarea v-model="form.notes" label="ملاحظات" placeholder="أي نقاط تودّ مناقشتها في الاجتماع..." :rows="3" />
      </div>
      <template #footer>
        <BaseButton variant="ghost" @click="modalOpen = false">إلغاء</BaseButton>
        <BaseButton :disabled="!canSubmit" :loading="submitting" @click="submitMeeting">إنشاء الاجتماع</BaseButton>
      </template>
    </BaseModal>

    <BaseModal v-model="cancelModalOpen" title="إلغاء الاجتماع" :description="cancelTarget ? `حذف اجتماع &quot;${cancelTarget.title}&quot; نهائيًا` : ''" size="sm">
      <template #footer>
        <BaseButton variant="ghost" @click="cancelModalOpen = false">تراجع</BaseButton>
        <BaseButton variant="danger" :icon="Trash2" :loading="cancelling" @click="cancelMeeting">تأكيد الإلغاء</BaseButton>
      </template>
    </BaseModal>
  </div>
</template>

<script>
import { mapState, mapActions } from 'pinia'
import { Plus, Clock, CalendarDays, FileText, Video, MessageCircle, Trash2 } from 'lucide-vue-next'
import BaseButton from '@/components/ui/BaseButton.vue'
import BaseModal from '@/components/ui/BaseModal.vue'
import BaseInput from '@/components/ui/BaseInput.vue'
import BaseTextarea from '@/components/ui/BaseTextarea.vue'
import BaseSelect from '@/components/ui/BaseSelect.vue'
import EmptyState from '@/components/ui/EmptyState.vue'
import MeetingCalendar from '@/components/shared/MeetingCalendar.vue'
import { useTeamsStore } from '@/stores/teams.store'
import { useAuthStore } from '@/stores/auth.store'

export default {
  name: 'SupervisorMeetingsPage',

  components: { BaseButton, BaseModal, BaseInput, BaseTextarea, BaseSelect, EmptyState, MeetingCalendar, CalendarDays, Clock, FileText, Video, MessageCircle, Trash2 },

  data() {
    return {
      Plus, Trash2,
      selectedTeamId: null,
      modalOpen: false,
      submitting: false,
      cancelModalOpen: false,
      cancelTarget: null,
      cancelling: false,
      dayMeetings: [],
      form: this.emptyForm()
    }
  },

  computed: {
    ...mapState(useTeamsStore, ['teamsForDisplay', 'teams', 'meetings']),
    ...mapState(useAuthStore, ['user']),

    myTeams() {
      return this.teamsForDisplay.filter((t) => t.supId === this.user?.id)
    },

    teamOptions() {
      return this.myTeams.map((t) => ({ value: t.id, label: t.name }))
    },

    selectedTeamRaw() {
      return this.teams.find((t) => t.id === this.selectedTeamId)
    },

    remindNumber() {
      return this.selectedTeamRaw?.leader?.whatsapp || ''
    },

    selectedMeeting() {
      return this.dayMeetings[0] || null
    },

    canSubmit() {
      return this.form.title.trim() && this.form.date && this.form.time
    }
  },

  async created() {
    await this.fetchTeams()
    if (this.myTeams.length) {
      this.selectedTeamId = this.myTeams[0].id
      await this.loadMeetings()
    }
  },

  methods: {
    ...mapActions(useTeamsStore, ['fetchTeams', 'fetchMeetings', 'createMeeting', 'deleteMeeting']),

    async onTeamChange() {
      this.dayMeetings = []
      await this.loadMeetings()
    },

    async loadMeetings() {
      if (!this.selectedTeamId) return
      try {
        await this.fetchMeetings(this.selectedTeamId)
      } catch (err) {
        this.$toast?.error(err.normalized?.message || 'تعذّر تحميل الاجتماعات')
      }
    },

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
    },

    emptyForm() {
      return { title: '', date: '', time: '', link: '', notes: '' }
    },

    openCreate() {
      this.form = this.emptyForm()
      this.modalOpen = true
    },

    async submitMeeting() {
      if (!this.canSubmit) return
      this.submitting = true
      try {
        await this.createMeeting(this.selectedTeamId, {
          title: this.form.title,
          scheduled_at: `${this.form.date} ${this.form.time}:00`,
          google_meet_link: this.form.link || null,
          notes: this.form.notes || null
        })
        this.modalOpen = false
        this.$toast?.success('تم إنشاء الاجتماع بنجاح')
      } catch (err) {
        this.$toast?.error(err.normalized?.message || 'تعذّر إنشاء الاجتماع')
      } finally {
        this.submitting = false
      }
    },

    confirmCancel(meeting) {
      this.cancelTarget = meeting
      this.cancelModalOpen = true
    },

    async cancelMeeting() {
      if (!this.cancelTarget) return
      this.cancelling = true
      try {
        await this.deleteMeeting(this.cancelTarget.id)
        this.dayMeetings = this.dayMeetings.filter((m) => m.id !== this.cancelTarget.id)
        this.cancelModalOpen = false
        this.$toast?.success('تم إلغاء الاجتماع')
      } catch (err) {
        this.$toast?.error(err.normalized?.message || 'تعذّر إلغاء الاجتماع')
      } finally {
        this.cancelling = false
      }
    },

    sendReminder(meeting) {
      const text = [
        `تذكير باجتماع: ${meeting.title}`,
        `التاريخ: ${this.formatDate(meeting.scheduled_at)}`,
        `الوقت: ${this.formatTime(meeting.scheduled_at)}`,
        meeting.google_meet_link ? `الرابط: ${meeting.google_meet_link}` : null,
        meeting.notes ? `الملاحظات: ${meeting.notes}` : null
      ].filter(Boolean).join('\n')
      window.open(`https://wa.me/${this.remindNumber}?text=${encodeURIComponent(text)}`, '_blank')
    }
  }
}
</script>
