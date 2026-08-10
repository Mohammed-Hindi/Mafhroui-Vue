<template>
  <div>
    <div v-if="canCreate" class="flex items-center justify-between gap-4 mb-5">
      <p class="text-body-sm text-text-600">{{ canDrag ? 'اسحب البطاقات بين الأعمدة لتحديث الحالة' : 'قائد الفريق هو من يقدر يغيّر حالة المهمة' }}</p>
      <BaseButton size="sm" :icon="Plus" @click="openCreate()">مهمة جديدة</BaseButton>
    </div>

    <!-- خلفية شبكية هادئة خلف الأعمدة، بلمسة "لوحة عمل" -->
    <div class="relative rounded-xl p-4 sm:p-5 board-grid-bg">
      <div class="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 relative">
        <div
          v-for="column in columns"
          :key="column.id"
          class="bg-surface/90 backdrop-blur-sm rounded-xl border border-border-soft shadow-card flex flex-col min-h-[440px] overflow-hidden"
          @dragover.prevent
          @drop="onDrop(column.id)"
        >
          <div class="flex items-center justify-between gap-2 px-4 py-3.5 border-b border-border-soft shrink-0" :class="column.headBg">
            <span class="flex items-center gap-2 font-cairo font-bold text-body-sm text-text-900">
              <span class="w-2 h-2 rounded-pill shrink-0" :class="column.dot" />
              {{ column.label }}
            </span>
            <span class="grid place-items-center min-w-[24px] h-[24px] px-1.5 rounded-pill bg-surface border border-border-soft text-label font-bold text-text-600 shadow-[0_1px_2px_rgba(0,0,0,.04)]">
              {{ tasksByColumn(column.id).length }}
            </span>
          </div>

          <div
            class="flex-1 flex flex-col gap-2.5 p-3 overflow-y-auto scrollbar-thin transition-colors duration-fast"
            :class="dragOverColumn === column.id && 'bg-primary-50/40'"
            @dragenter="dragOverColumn = column.id"
            @dragleave="dragOverColumn = null"
          >
            <div
              v-for="task in tasksByColumn(column.id)"
              :key="task.id"
              :draggable="canDrag"
              class="group bg-surface rounded-lg border border-border shadow-card p-3.5 border-s-[3px] transition-all duration-fast hover:shadow-card-hover hover:-translate-y-0.5"
              :class="[column.accentBorder, canDrag && 'cursor-grab active:cursor-grabbing']"
              @dragstart="onDragStart(task)"
              @dragend="dragOverColumn = null"
            >
              <div class="flex items-start justify-between gap-2 mb-1.5">
                <p class="text-body-sm font-bold text-text-900 leading-snug">{{ task.title }}</p>
                <button
                  v-if="canDelete"
                  type="button"
                  class="grid place-items-center w-6 h-6 rounded-sm text-text-400 opacity-0 group-hover:opacity-100 hover:bg-error-bg hover:text-error transition-all duration-fast shrink-0"
                  aria-label="حذف المهمة"
                  @click.stop="$emit('delete', task.id)"
                >
                  <Trash2 :size="13" />
                </button>
              </div>

              <p v-if="task.description" class="text-caption text-text-600 mb-1 leading-relaxed">{{ task.description }}</p>
              <p v-if="creatorName(task)" class="flex items-center gap-1.5 text-label text-text-400 mt-2.5 pt-2.5 border-t border-border-soft">
                <span class="grid place-items-center w-4 h-4 rounded-pill bg-primary-50 text-primary-600 text-[9px] font-bold shrink-0">{{ creatorName(task).charAt(0) }}</span>
                {{ creatorName(task) }}
              </p>
            </div>

            <p v-if="!tasksByColumn(column.id).length" class="text-center text-label text-text-400 py-8">لا توجد مهام</p>
          </div>
        </div>
      </div>
    </div>

    <BaseModal v-model="modalOpen" title="مهمة جديدة" size="md">
      <div class="flex flex-col gap-4">
        <BaseInput v-model="form.title" label="عنوان المهمة" placeholder="مثال: تجهيز الفصل الثاني من التقرير" required />
        <BaseTextarea v-model="form.description" label="الوصف" placeholder="تفاصيل إضافية عن المهمة (اختياري)" :rows="3" />
      </div>
      <template #footer>
        <BaseButton variant="ghost" @click="modalOpen = false">إلغاء</BaseButton>
        <BaseButton :disabled="!form.title.trim()" @click="saveTask">إضافة المهمة</BaseButton>
      </template>
    </BaseModal>
  </div>
</template>

<script>
import { Plus, Trash2 } from 'lucide-vue-next'
import BaseButton from '@/components/ui/BaseButton.vue'
import BaseModal from '@/components/ui/BaseModal.vue'
import BaseInput from '@/components/ui/BaseInput.vue'
import BaseTextarea from '@/components/ui/BaseTextarea.vue'

const COLUMNS = [
  { id: 'pending', label: 'قيد الانتظار', dot: 'bg-text-400', headBg: '', accentBorder: 'border-s-border' },
  { id: 'in_progress', label: 'قيد التنفيذ', dot: 'bg-primary-500', headBg: 'bg-primary-50/50', accentBorder: 'border-s-primary-400' },
  { id: 'review', label: 'مراجعة', dot: 'bg-warning', headBg: 'bg-warning-bg/50', accentBorder: 'border-s-warning' },
  { id: 'done', label: 'مكتمل', dot: 'bg-success', headBg: 'bg-success-bg/50', accentBorder: 'border-s-success' }
]

export default {
  name: 'TaskBoard',

  components: { Trash2, BaseButton, BaseModal, BaseInput, BaseTextarea },

  props: {
    tasks: { type: Array, default: () => [] },
    canCreate: { type: Boolean, default: false },
    canDrag: { type: Boolean, default: false },
    canDelete: { type: Boolean, default: false }
  },

  emits: ['create', 'move', 'delete'],

  data() {
    return {
      Plus,
      columns: COLUMNS,
      modalOpen: false,
      draggingId: null,
      dragOverColumn: null,
      form: { title: '', description: '' }
    }
  },

  methods: {
    tasksByColumn(columnId) {
      return this.tasks.filter((t) => t.status === columnId)
    },

    creatorName(task) {
      return typeof task.created_by === 'object' ? task.created_by?.name : null
    },

    openCreate() {
      this.form = { title: '', description: '' }
      this.modalOpen = true
    },

    saveTask() {
      if (!this.form.title.trim()) return
      this.$emit('create', { title: this.form.title, description: this.form.description })
      this.modalOpen = false
    },

    onDragStart(task) {
      if (!this.canDrag) return
      this.draggingId = task.id
    },

    onDrop(columnId) {
      this.dragOverColumn = null
      if (!this.canDrag || !this.draggingId) return
      this.$emit('move', { id: this.draggingId, status: columnId })
      this.draggingId = null
    }
  }
}
</script>

<style scoped>
.board-grid-bg {
  background-color: var(--color-bg);
  background-image: radial-gradient(circle, var(--color-border) 1px, transparent 1px);
  background-size: 22px 22px;
}
</style>
