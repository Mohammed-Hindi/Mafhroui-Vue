<template>
  <div class="flex flex-col gap-8">
    <div v-if="canCreate" class="flex justify-end">
      <BaseButton :icon="Plus" @click="openCreate">اجتماع جديد</BaseButton>
    </div>

    <section>
      <h3 class="font-cairo font-bold text-h4 text-text-900 mb-4 flex items-center gap-2">
        <Clock :size="18" class="text-primary-600" />
        الاجتماعات القادمة
      </h3>
      <EmptyState v-if="!upcoming.length" title="لا توجد اجتماعات قادمة حاليًا" />
      <div v-else class="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <MeetingCard v-for="meeting in upcomingPage" :key="meeting.id" :meeting="meeting" @remind="sendReminder" />
      </div>
      <Pagination
        v-if="upcoming.length"
        class="mt-4"
        :current-page="upcomingPage_"
        :last-page="upcomingLastPage"
        :total="upcoming.length"
        @change="upcomingPage_ = $event"
      />
    </section>

    <section>
      <h3 class="font-cairo font-bold text-h4 text-text-900 mb-4 flex items-center gap-2">
        <CheckCircle2 :size="18" class="text-success" />
        الاجتماعات المنتهية
      </h3>
      <EmptyState v-if="!completed.length" title="لا توجد اجتماعات منتهية بعد" />
      <div v-else class="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <MeetingCard v-for="meeting in completedPage" :key="meeting.id" :meeting="meeting" done @remind="sendReminder" />
      </div>
      <Pagination
        v-if="completed.length"
        class="mt-4"
        :current-page="completedPage_"
        :last-page="completedLastPage"
        :total="completed.length"
        @change="completedPage_ = $event"
      />
    </section>

    <BaseModal v-model="modalOpen" title="طلب موعد اجتماع جديد" description="سيُرسل الطلب للمشرف لاعتماده وإنشائه على Google Meet">
      <div class="flex flex-col gap-4">
        <BaseInput v-model="form.title" label="اسم الاجتماع" placeholder="مثال: مراجعة الفصل الثاني من التقرير" required />
        <div class="grid grid-cols-2 gap-4">
          <BaseInput v-model="form.date" type="date" label="التاريخ" required />
          <BaseInput v-model="form.time" type="time" label="الوقت" required />
        </div>
        <BaseInput v-model="form.link" label="رابط الاجتماع (Google Meet)" placeholder="meet.google.com/xxx-xxxx-xxx" />
        <BaseTextarea v-model="form.notes" label="ملاحظات" placeholder="أي نقاط تودّ مناقشتها في الاجتماع..." :rows="3" />
      </div>
      <template #footer>
        <BaseButton variant="ghost" @click="modalOpen = false">إلغاء</BaseButton>
        <BaseButton :disabled="!canSubmit" @click="submitMeeting">إرسال طلب الاجتماع</BaseButton>
      </template>
    </BaseModal>
  </div>
</template>

<script>
import { Plus, Clock, CheckCircle2 } from 'lucide-vue-next'
import BaseButton from '@/components/ui/BaseButton.vue'
import BaseModal from '@/components/ui/BaseModal.vue'
import BaseInput from '@/components/ui/BaseInput.vue'
import BaseTextarea from '@/components/ui/BaseTextarea.vue'
import Pagination from '@/components/ui/Pagination.vue'
import EmptyState from '@/components/ui/EmptyState.vue'
import MeetingCard from './MeetingCard.vue'

const PAGE_SIZE = 4

let uid = 0

export default {
  name: 'MeetingsBoard',

  components: { BaseButton, BaseModal, BaseInput, BaseTextarea, Pagination, EmptyState, MeetingCard },

  props: {
    storageKey: { type: String, required: true },
    seed: { type: Array, default: () => [] },
    canCreate: { type: Boolean, default: true },
    reminderNumber: { type: String, default: '962790000000' }
  },

  data() {
    return {
      Plus,
      Clock,
      CheckCircle2,
      meetings: [],
      modalOpen: false,
      upcomingPage_: 1,
      completedPage_: 1,
      form: this.emptyForm()
    }
  },

  computed: {
    upcoming() {
      return this.meetings.filter((m) => !m.done)
    },
    completed() {
      return this.meetings.filter((m) => m.done)
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

  created() {
    this.meetings = this.loadMeetings()
  },

  methods: {
    emptyForm() {
      return { title: '', date: '', time: '', link: '', notes: '' }
    },

    loadMeetings() {
      try {
        const raw = localStorage.getItem(this.storageKey)
        if (raw) return JSON.parse(raw)
      } catch (_) { /* تخزين تالف — نتجاهله ونبدأ من البذرة */ }
      return this.seed.map((meeting) => ({ ...meeting, id: this.nextId() }))
    },

    persist() {
      localStorage.setItem(this.storageKey, JSON.stringify(this.meetings))
    },

    nextId() {
      uid += 1
      return `mt${Date.now()}-${uid}`
    },

    openCreate() {
      this.form = this.emptyForm()
      this.modalOpen = true
    },

    submitMeeting() {
      if (!this.canSubmit) return
      this.meetings.unshift({ id: this.nextId(), ...this.form, team: '', done: false })
      this.persist()
      this.modalOpen = false
    },

    sendReminder(meeting) {
      const text = [
        `تذكير باجتماع: ${meeting.title}`,
        `التاريخ: ${meeting.date}`,
        `الوقت: ${meeting.time}`,
        meeting.link ? `الرابط: https://${meeting.link}` : null,
        meeting.notes ? `الملاحظات: ${meeting.notes}` : null
      ].filter(Boolean).join('\n')
      window.open(`https://wa.me/${this.reminderNumber}?text=${encodeURIComponent(text)}`, '_blank')
    }
  }
}
</script>
