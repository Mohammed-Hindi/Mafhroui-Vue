<template>
  <div class="h-full bg-surface rounded-lg border border-border shadow-card p-4 flex flex-col gap-2.5">
    <div class="flex items-start justify-between gap-2">
      <h4 class="font-cairo font-bold text-body-sm text-text-900">{{ meeting.title }}</h4>
      <span
        :class="[
          'shrink-0 text-label font-bold px-2.5 py-1 rounded-pill',
          done ? 'bg-success-bg text-success' : 'bg-info-bg text-info'
        ]"
      >
        {{ done ? 'منتهي' : 'قادم' }}
      </span>
    </div>

    <div v-if="meeting.team" class="flex items-center justify-end gap-1.5 text-label font-bold text-primary-700 bg-primary-50 px-3 py-1.5 rounded-sm">
      {{ meeting.team }}
      <Users :size="12" />
    </div>

    <div class="flex items-center gap-1.5 text-caption text-text-600">
      <CalendarDays :size="13" class="text-text-400 shrink-0" />
      {{ meeting.date }}
    </div>
    <div class="flex items-center gap-1.5 text-caption text-text-600">
      <Clock :size="13" class="text-text-400 shrink-0" />
      {{ meeting.time }}
    </div>
    <div v-if="meeting.notes" class="flex items-center gap-1.5 text-caption text-text-600">
      <FileText :size="13" class="text-text-400 shrink-0" />
      {{ meeting.notes }}
    </div>

    <div class="flex items-center gap-2 mt-auto pt-2.5 border-t border-border-soft">
      <a
        v-if="meeting.link"
        :href="`https://${meeting.link}`"
        target="_blank"
        rel="noopener"
        class="flex-1 inline-flex items-center justify-center gap-2 h-9 rounded-sm border border-primary-100 bg-primary-50 text-primary-700 text-caption font-bold hover:bg-primary-100 transition-colors duration-fast"
      >
        <Video :size="14" />
        دخول
      </a>
      <button
        type="button"
        class="inline-flex items-center justify-center gap-2 h-9 px-3 rounded-sm border border-secondary-100 bg-secondary-50 text-secondary-700 text-caption font-bold hover:bg-secondary-100 transition-colors duration-fast shrink-0"
        @click="$emit('remind', meeting)"
      >
        <MessageCircle :size="14" />
        تذكير واتساب
      </button>
    </div>
  </div>
</template>

<script>
import { Users, CalendarDays, Clock, FileText, Video, MessageCircle } from 'lucide-vue-next'

export default {
  name: 'MeetingCard',

  components: { Users, CalendarDays, Clock, FileText, Video, MessageCircle },

  props: {
    meeting: { type: Object, required: true },
    done: { type: Boolean, default: false }
  },

  emits: ['remind']
}
</script>
