<template>
  <div>
    <div class="flex flex-wrap items-center justify-between gap-4 mb-6">
      <div class="max-w-xs w-full">
        <BaseSelect v-model="selectedTeamId" label="اختر الفريق" :options="teamOptions" @update:model-value="onTeamChange" />
      </div>
      <BaseButton v-if="selectedTeamId" :icon="Plus" @click="openCreate">اجتماع جديد</BaseButton>
    </div>

    <EmptyState v-if="!teamOptions.length" title="لا توجد فرق مُسندة إليك" />
    <template v-else>
      <section class="mb-10">
        <h3 class="font-cairo font-bold text-h4 text-text-900 mb-4 flex items-center gap-2.5">
          الاجتماعات القادمة
          <span class="grid place-items-center w-8 h-8 rounded-pill bg-primary-50 text-primary-600"><Clock :size="16" /></span>
        </h3>
        <EmptyState v-if="!upcoming.length" title="لا توجد اجتماعات قادمة حاليًا" />
        <div v-else class="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <MeetingCard v-for="meeting in upcomingPage" :key="meeting.id" :meeting="meeting" deletable :remind-number="remindNumber" @remind="sendReminder" @delete="confirmCancel" />
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
          <MeetingCard v-for="meeting in completedPage" :key="meeting.id" :meeting="meeting" done @remind="sendReminder" />
        </div>
        <Pagination v-if="completed.length" class="mt-4" :current-page="completedPage_" :last-page="completedLastPage" :total="completed.length" @change="completedPage_ = $event" />
      </section>
    </template>

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
import { Plus, Clock, CheckCircle2, Trash2 } from 'lucide-vue-next'
import BaseButton from '@/components/ui/BaseButton.vue'
import BaseModal from '@/components/ui/BaseModal.vue'
import BaseInput from '@/components/ui/BaseInput.vue'
import BaseTextarea from '@/components/ui/BaseTextarea.vue'
import BaseSelect from '@/components/ui/BaseSelect.vue'
import Pagination from '@/components/ui/Pagination.vue'
import EmptyState from '@/components/ui/EmptyState.vue'
import MeetingCard from '@/components/shared/MeetingCard.vue'
import { useTeamsStore } from '@/stores/teams.store'
import { useAuthStore } from '@/stores/auth.store'

const PAGE_SIZE = 2

export default {
  name: 'SupervisorMeetingsPage',

  components: { BaseButton, BaseModal, BaseInput, BaseTextarea, BaseSelect, Pagination, EmptyState, MeetingCard },

  data() {
    return {
      Plus, Clock, CheckCircle2, Trash2,
      selectedTeamId: null,
      modalOpen: false,
      submitting: false,
      cancelModalOpen: false,
      cancelTarget: null,
      cancelling: false,
      upcomingPage_: 1,
      completedPage_: 1,
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

    mappedMeetings() {
      return this.meetings.map((m) => ({
        id: m.id,
        title: m.title,
        num: this.selectedTeamId,
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
      this.upcomingPage_ = 1
      this.completedPage_ = 1
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
        `التاريخ: ${meeting.date}`,
        `الوقت: ${meeting.time}`,
        meeting.link ? `الرابط: ${meeting.link}` : null,
        meeting.notes ? `الملاحظات: ${meeting.notes}` : null
      ].filter(Boolean).join('\n')
      window.open(`https://wa.me/${this.remindNumber}?text=${encodeURIComponent(text)}`, '_blank')
    }
  }
}
</script>
