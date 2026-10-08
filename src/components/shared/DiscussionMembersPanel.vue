<template>
  <!-- تفاصيل موعد مناقشة + طلاب مجموعته (يُفتح تحت صف/بطاقة الموعد في صفحة مواعيد المناقشات) -->
  <div>
    <div class="flex flex-wrap gap-x-8 gap-y-2 px-5 py-3.5 bg-bg border-b border-border-soft text-caption">
      <div class="flex items-center gap-2 text-text-700"><MapPin :size="14" class="text-text-400 shrink-0" /><span class="text-text-400">المكان:</span> {{ discussion.place }}</div>
      <div class="flex items-center gap-2 text-text-700"><span class="text-text-400">الوقت:</span> {{ discussion.time }}</div>
      <div class="flex items-center gap-2 text-text-700"><Users :size="14" class="text-text-400 shrink-0" /><span class="text-text-400">لجنة المناقشة:</span> {{ discussion.committee }}</div>
      <div class="flex items-center gap-2 text-text-700"><span class="text-text-400">القسم:</span> {{ discussion.dept }} — {{ discussion.spec }}</div>
    </div>

    <div class="hidden md:block overflow-x-auto scrollbar-thin">
      <table class="w-full border-collapse min-w-[600px]">
        <thead>
          <tr class="bg-bg border-b-2 border-border divide-x divide-border-soft">
            <th class="px-5 py-3 text-start text-label font-extrabold text-text-700">اسم الطالب</th>
            <th class="px-5 py-3 text-start text-label font-extrabold text-text-700">الواتس</th>
            <th class="px-5 py-3 text-start text-label font-extrabold text-text-700">البريد</th>
            <th class="px-5 py-3 text-start text-label font-extrabold text-text-700">إجراءات</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-border-soft">
          <tr v-for="m in members" :key="m.id" class="divide-x divide-border-soft">
            <td class="px-5 py-3 font-bold text-text-900">{{ m.name }}</td>
            <td class="px-5 py-3 mono">{{ m.whats || '—' }}</td>
            <td class="px-5 py-3 mono whitespace-nowrap">{{ m.mail || '—' }}</td>
            <td class="px-5 py-3">
              <div class="flex gap-2">
                <button v-if="m.whats" type="button" class="grid place-items-center w-8 h-8 rounded-sm border border-whatsapp-bg text-whatsapp hover:bg-whatsapp-bg" title="واتساب" @click="$emit('whats', m.whats)"><MessageCircle :size="14" /></button>
                <button v-if="m.mail" type="button" class="grid place-items-center w-8 h-8 rounded-sm border border-primary-100 text-primary-600 hover:bg-primary-50" title="بريد" @click="$emit('mail', m.mail)"><Mail :size="14" /></button>
                <button type="button" class="grid place-items-center w-8 h-8 rounded-sm border border-border text-text-600 hover:bg-border-soft hover:text-primary-700" title="تعديل" @click="$emit('edit-student', m)"><Pencil :size="14" /></button>
                <button type="button" class="grid place-items-center w-8 h-8 rounded-sm border border-error-bg text-error hover:bg-error-bg" title="حذف" @click="$emit('delete-student', m)"><Trash2 :size="14" /></button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <div class="md:hidden divide-y divide-border-soft">
      <div v-for="m in members" :key="m.id" class="p-4 space-y-2">
        <div class="flex items-center justify-between gap-3">
          <span class="font-bold text-text-900">{{ m.name }}</span>
        </div>
        <button
          type="button"
          class="w-full flex items-center justify-center gap-1.5 text-caption font-bold text-primary-600 py-1.5 rounded-sm hover:bg-primary-50 transition-colors duration-fast"
          @click="toggleStudent(m.id)"
        >
          {{ openStudentIds.includes(m.id) ? 'إخفاء التفاصيل' : 'عرض التفاصيل' }}
          <ChevronDown :size="14" :class="['transition-transform duration-fast', openStudentIds.includes(m.id) && 'rotate-180']" />
        </button>
        <div v-if="openStudentIds.includes(m.id)" class="space-y-2 pt-2 border-t border-dashed border-border">
          <div class="flex items-start justify-between gap-3"><span class="text-label font-semibold text-text-400 shrink-0">رقم الواتس</span><span class="mono text-body-sm text-text-700">{{ m.whats || '—' }}</span></div>
          <div class="flex items-start justify-between gap-3"><span class="text-label font-semibold text-text-400 shrink-0">البريد الإلكتروني</span><span class="mono text-body-sm text-text-700 whitespace-nowrap">{{ m.mail || '—' }}</span></div>
          <div class="flex items-start justify-between gap-3">
            <span class="text-label font-semibold text-text-400 shrink-0">إجراءات</span>
            <div class="flex gap-1.5">
              <button v-if="m.whats" type="button" class="grid place-items-center w-8 h-8 rounded-sm border border-whatsapp-bg text-whatsapp hover:bg-whatsapp-bg" title="واتساب" @click="$emit('whats', m.whats)"><MessageCircle :size="14" /></button>
              <button v-if="m.mail" type="button" class="grid place-items-center w-8 h-8 rounded-sm border border-primary-100 text-primary-600 hover:bg-primary-50" title="بريد" @click="$emit('mail', m.mail)"><Mail :size="14" /></button>
              <button type="button" class="grid place-items-center w-8 h-8 rounded-sm border border-border text-text-600 hover:bg-border-soft hover:text-primary-700" title="تعديل" @click="$emit('edit-student', m)"><Pencil :size="14" /></button>
              <button type="button" class="grid place-items-center w-8 h-8 rounded-sm border border-error-bg text-error hover:bg-error-bg" title="حذف" @click="$emit('delete-student', m)"><Trash2 :size="14" /></button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div class="px-5 py-3 border-t border-border-soft">
      <button type="button" class="inline-flex items-center gap-1.5 text-caption font-bold text-primary-600 hover:underline disabled:opacity-40 disabled:pointer-events-none" :disabled="members.length >= 4" @click="$emit('add-student')">
        <Plus :size="14" /> {{ members.length >= 4 ? 'الفريق مكتمل (4 أعضاء)' : 'إضافة طالب لهذه المجموعة' }}
      </button>
    </div>
  </div>
</template>

<script>
import { MapPin, Users, MessageCircle, Mail, Pencil, Trash2, ChevronDown, Plus } from 'lucide-vue-next'

export default {
  name: 'DiscussionMembersPanel',

  components: { MapPin, Users, MessageCircle, Mail, Pencil, Trash2, ChevronDown, Plus },

  props: {
    discussion: { type: Object, required: true },
    members: { type: Array, required: true }
  },

  emits: ['whats', 'mail', 'edit-student', 'delete-student', 'add-student'],

  data() {
    return { openStudentIds: [] } // تفاصيل الطالب المفتوحة على الموبايل
  },

  methods: {
    toggleStudent(id) {
      this.openStudentIds = this.openStudentIds.includes(id) ? this.openStudentIds.filter((x) => x !== id) : [...this.openStudentIds, id]
    }
  }
}
</script>
