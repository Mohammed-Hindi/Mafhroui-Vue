<template>
  <div>
    <div class="flex items-center justify-between mb-5">
      <button type="button" class="grid place-items-center w-9 h-9 rounded-sm border border-border text-text-600 hover:bg-border-soft hover:text-primary-700 transition-colors duration-fast" @click="shiftMonth(-1)">
        <ChevronRight :size="16" />
      </button>
      <h3 class="font-cairo font-bold text-body text-text-900">{{ monthLabel }}</h3>
      <button type="button" class="grid place-items-center w-9 h-9 rounded-sm border border-border text-text-600 hover:bg-border-soft hover:text-primary-700 transition-colors duration-fast" @click="shiftMonth(1)">
        <ChevronLeft :size="16" />
      </button>
    </div>

    <div class="grid grid-cols-7 gap-1.5 mb-2">
      <span v-for="d in weekDays" :key="d" class="text-center text-label font-bold text-text-400 py-1.5">{{ d }}</span>
    </div>

    <div class="grid grid-cols-7 gap-1.5">
      <div v-for="n in leadingBlanks" :key="`b${n}`" />
      <button
        v-for="day in daysInMonth" :key="day"
        type="button"
        class="relative aspect-square rounded-md flex flex-col items-center justify-center gap-0.5 text-body-sm font-semibold transition-colors duration-fast"
        :class="dayClass(day)"
        @click="onDayClick(day)"
      >
        {{ day }}
        <span v-if="meetingsOnDay(day).length" class="w-1.5 h-1.5 rounded-pill bg-error absolute bottom-1.5" />
      </button>
    </div>
  </div>
</template>

<script>
import { ChevronRight, ChevronLeft } from 'lucide-vue-next'

export default {
  name: 'MeetingCalendar',

  components: { ChevronRight, ChevronLeft },

  props: {
    meetings: { type: Array, default: () => [] },
    selectedId: { type: [Number, String], default: null }
  },

  emits: ['select-day'],

  data() {
    const now = new Date()
    return {
      ChevronRight, ChevronLeft,
      viewYear: now.getFullYear(),
      viewMonth: now.getMonth(),
      weekDays: ['أحد', 'اثنين', 'ثلاثاء', 'أربعاء', 'خميس', 'جمعة', 'سبت']
    }
  },

  computed: {
    monthLabel() {
      return new Date(this.viewYear, this.viewMonth, 1).toLocaleDateString('ar-EG', { month: 'long', year: 'numeric' })
    },
    leadingBlanks() {
      return new Date(this.viewYear, this.viewMonth, 1).getDay()
    },
    daysInMonth() {
      return new Date(this.viewYear, this.viewMonth + 1, 0).getDate()
    }
  },

  methods: {
    shiftMonth(delta) {
      const d = new Date(this.viewYear, this.viewMonth + delta, 1)
      this.viewYear = d.getFullYear()
      this.viewMonth = d.getMonth()
    },

    meetingsOnDay(day) {
      return this.meetings.filter((m) => {
        const dt = new Date(m.scheduled_at)
        return dt.getFullYear() === this.viewYear && dt.getMonth() === this.viewMonth && dt.getDate() === day
      })
    },

    isToday(day) {
      const now = new Date()
      return now.getFullYear() === this.viewYear && now.getMonth() === this.viewMonth && now.getDate() === day
    },

    dayClass(day) {
      const has = this.meetingsOnDay(day).length > 0
      const selected = has && this.meetingsOnDay(day).some((m) => m.id === this.selectedId)
      if (selected) return 'bg-primary-600 text-white'
      if (has) return 'bg-error-bg text-error hover:bg-error-bg/70 cursor-pointer'
      if (this.isToday(day)) return 'border border-primary-300 text-primary-700'
      return 'text-text-600 hover:bg-border-soft cursor-default'
    },

    onDayClick(day) {
      const dayMeetings = this.meetingsOnDay(day)
      if (dayMeetings.length) this.$emit('select-day', dayMeetings)
    }
  }
}
</script>
