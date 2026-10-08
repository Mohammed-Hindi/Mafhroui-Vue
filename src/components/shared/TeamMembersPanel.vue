<template>
  <!-- أعضاء مجموعة واحدة (يُفتح تحت صف/بطاقة المجموعة في صفحة المجموعات) -->
  <div>
    <DataTable
      flush
      :columns="columns" :rows="group.members" row-key="memberId" :primary-keys="['name', 'actions']"
      empty-title="لا يوجد أعضاء بعد"
    >
      <template #cell-name="{ row }">
        <span class="inline-flex items-center gap-2">
          <span class="font-bold text-text-900 truncate" :title="row.name">{{ row.name }}</span>
                  </span>
      </template>
      <template #cell-uid="{ value }"><span class="mono">{{ value || '—' }}</span></template>
      <template #cell-whats="{ value }"><span class="mono">{{ value || '—' }}</span></template>
      <template #cell-mail="{ value }"><span class="mono" :title="value">{{ value }}</span></template>
      <template #cell-actions="{ row }">
        <div class="flex items-center justify-center gap-1.5">
          <button type="button" class="grid place-items-center w-8 h-8 rounded-pill border border-border text-text-600 hover:bg-border-soft hover:text-primary-700" title="تعديل بيانات العضو" @click="$emit('edit-member', row)"><Pencil :size="14" /></button>
          <button type="button" class="grid place-items-center w-8 h-8 rounded-pill bg-whatsapp-bg text-whatsapp hover:brightness-95 disabled:opacity-40 disabled:pointer-events-none" :disabled="!row.whats" title="واتساب" @click="$emit('whats', row.whats)"><MessageCircle :size="14" /></button>
          <button type="button" class="grid place-items-center w-8 h-8 rounded-pill bg-primary-50 text-primary-600 hover:brightness-95" title="بريد" @click="$emit('mail', row.mail)"><Mail :size="14" /></button>
          <button type="button" class="grid place-items-center w-8 h-8 rounded-pill bg-error-bg text-error hover:brightness-95 disabled:opacity-40 disabled:pointer-events-none" title="إزالة من الفريق" @click="$emit('remove-member', row)"><Trash2 :size="14" /></button>
        </div>
      </template>
    </DataTable>

    <div class="px-5 py-3 border-t border-border-soft">
      <button type="button" class="inline-flex items-center gap-1.5 text-caption font-bold text-primary-600 hover:underline disabled:opacity-40 disabled:pointer-events-none" :disabled="group.members.length >= 4" @click="$emit('add-member')">
        <Plus :size="14" /> {{ group.members.length >= 4 ? 'الفريق مكتمل (4 أعضاء)' : 'إضافة طالب لهذا الفريق' }}
      </button>
    </div>
  </div>
</template>

<script>
import { Pencil, MessageCircle, Mail, Trash2, Plus } from 'lucide-vue-next'
import DataTable from '@/components/ui/DataTable.vue'

export default {
  name: 'TeamMembersPanel',

  components: { Pencil, MessageCircle, Mail, Trash2, Plus, DataTable },

  props: {
    group: { type: Object, required: true },
    columns: { type: Array, required: true }
  },

  emits: ['edit-member', 'whats', 'mail', 'remove-member', 'add-member']
}
</script>
