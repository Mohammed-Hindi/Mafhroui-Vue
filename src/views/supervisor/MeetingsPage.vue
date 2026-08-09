<template>
  <div>
    <div class="flex justify-end mb-6">
      <BaseButton :icon="Plus" @click="openCreate">اجتماع جديد</BaseButton>
    </div>

    <section class="mb-10">
      <h3 class="font-cairo font-bold text-h4 text-text-900 mb-4 flex items-center gap-2.5">
        الاجتماعات القادمة
        <span class="grid place-items-center w-8 h-8 rounded-pill bg-primary-50 text-primary-600"><Clock :size="16" /></span>
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
      <h3 class="font-cairo font-bold text-h4 text-text-900 mb-4 flex items-center gap-2.5">
        الاجتماعات المنتهية
        <span class="grid place-items-center w-8 h-8 rounded-pill bg-success-bg text-success"><CheckCircle2 :size="16" /></span>
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

    <BaseModal v-model="modalOpen" title="اجتماع جديد" description="سيتم إنشاؤه على Google Meet وإشعار الفريق المعني">
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
        <BaseButton :disabled="!canSubmit" @click="submitMeeting">إنشاء الاجتماع</BaseButton>
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
import MeetingCard from '@/components/shared/MeetingCard.vue'

const PAGE_SIZE = 2
const REMINDER_NUMBER = '962790000000'

let uid = 0
function nextId() {
  uid += 1
  return `mt${uid}`
}

export default {
  name: 'SupervisorMeetingsPage',

  components: { BaseButton, BaseModal, BaseInput, BaseTextarea, Pagination, EmptyState, MeetingCard },

  data() {
    return {
      Plus, Clock, CheckCircle2,
      modalOpen: false,
      upcomingPage_: 1,
      completedPage_: 1,
      form: this.emptyForm(),

      /* بيانات ثابتة — بانتظار GET /supervisor/meetings */
      meetings: [
        { id: nextId(), title: 'اجتماع مراجعة المتطلبات', team: 'فريق الابتكار', date: '2026-08-10', time: '11:00', link: 'meet.google.com/abc-defg-hij', notes: '', done: false },
        { id: nextId(), title: 'اجتماع توزيع مهام الفريق', team: 'فريق البيانات', date: '2026-08-09', time: '12:00', link: 'meet.google.com/tlm-eetg-abc', notes: '', done: false },
        { id: nextId(), title: 'اجتماع متابعة تصميم قاعدة البيانات', team: 'فريق البيانات', date: '2026-08-12', time: '13:00', link: 'meet.google.com/klm-nopq-rst', notes: 'مراجعة ERD قبل البدء بالتطوير', done: false },
        { id: nextId(), title: 'اجتماع مراجعة الفصل الثالث من التقرير', team: 'فريق الأمن السيبراني', date: '2026-08-14', time: '10:30', link: 'meet.google.com/xyz-abcd-efg', notes: '', done: false },
        { id: nextId(), title: 'اجتماع مراجعة المتطلبات الأولي', team: 'فريق الابتكار', date: '2026-06-10', time: '10:00', link: 'meet.google.com/qrs-tuvw-xyz', notes: 'مراجعة وثيقة SRS', done: true },
        { id: nextId(), title: 'اجتماع تعريفي بالمشروع', team: 'فريق البيانات', date: '2026-05-25', time: '09:00', link: 'meet.google.com/tlm-intr-ghi', notes: '', done: true },
        { id: nextId(), title: 'اجتماع مراجعة المقترح الأولي', team: 'فريق الابتكار', date: '2026-05-18', time: '11:30', link: 'meet.google.com/prs-mnop-qrs', notes: 'اعتماد فكرة المشروع', done: true },
        { id: nextId(), title: 'اجتماع تعريفي بالفريق', team: 'فريق الأمن السيبراني', date: '2026-05-10', time: '09:30', link: 'meet.google.com/def-ghij-klm', notes: '', done: true }
      ]
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

  methods: {
    emptyForm() {
      return { title: '', date: '', time: '', link: '', notes: '' }
    },

    openCreate() {
      this.form = this.emptyForm()
      this.modalOpen = true
    },

    submitMeeting() {
      if (!this.canSubmit) return
      this.meetings.unshift({ id: nextId(), ...this.form, team: '', done: false })
      this.modalOpen = false
      this.$toast?.success('تم إنشاء الاجتماع بنجاح')
    },

    sendReminder(meeting) {
      const text = [
        `تذكير باجتماع: ${meeting.title}`,
        `التاريخ: ${meeting.date}`,
        `الوقت: ${meeting.time}`,
        meeting.link ? `الرابط: https://${meeting.link}` : null,
        meeting.notes ? `الملاحظات: ${meeting.notes}` : null
      ].filter(Boolean).join('\n')
      window.open(`https://wa.me/${REMINDER_NUMBER}?text=${encodeURIComponent(text)}`, '_blank')
    }
  }
}
</script>
