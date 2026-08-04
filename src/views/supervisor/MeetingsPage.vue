<template>
  <MeetingsBoard storage-key="gp_meetings_supervisor_overview" :seed="seedMeetings" :can-create="false" />
</template>

<script>
import MeetingsBoard from '@/components/shared/MeetingsBoard.vue'

export default {
  name: 'SupervisorMeetingsPage',
  components: { MeetingsBoard },
  data() {
    return {
      seedMeetings: [
        { title: 'اجتماع مراجعة المتطلبات', team: 'فريق الابتكار', date: '2026-08-10', time: '11:00', link: 'meet.google.com/abc-defg-hij', notes: '', done: false },
        { title: 'اجتماع توزيع مهام الفريق', team: 'فريق البيانات', date: '2026-08-09', time: '12:00', link: 'meet.google.com/tlm-eetg-abc', notes: '', done: false },
        { title: 'اجتماع مراجعة المتطلبات الأولي', team: 'فريق الابتكار', date: '2026-06-10', time: '10:00', link: 'meet.google.com/qrs-tuvw-xyz', notes: 'مراجعة وثيقة SRS', done: true },
        { title: 'اجتماع تعريفي بالمشروع', team: 'فريق البيانات', date: '2026-05-25', time: '09:00', link: 'meet.google.com/tlm-intr-ghi', notes: '', done: true }
      ]
    }
  }
}
</script>
