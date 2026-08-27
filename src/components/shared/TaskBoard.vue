<template>
  <div>
    <div v-if="canCreate" class="flex items-center justify-between gap-4 mb-5 flex-wrap">
      <p class="text-body-sm text-text-600">{{ canDrag ? 'اسحبي البطاقات أو استخدمي القائمة على البطاقة لتحديث الحالة' : 'قائد الفريق هو من يقدر يغيّر حالة المهمة' }}</p>
      <div class="flex items-center gap-2">
        <BaseButton v-if="canDelete" variant="outline" size="sm" :icon="ArchiveIcon" @click="openArchive">الأرشيف</BaseButton>
        <BaseButton size="sm" :icon="Plus" @click="openCreate()">مهمة جديدة</BaseButton>
      </div>
    </div>

    <div class="sm:hidden mb-4">
      <BaseSelect v-model="mobileStatus" label="عرض قائمة" :options="columnOptions" />
    </div>

    <!-- خلفية شبكية هادئة خلف الأعمدة، بلمسة "لوحة عمل" -->
    <div class="relative rounded-xl p-4 sm:p-5 board-grid-bg">
      <div class="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 relative">
        <div
          v-for="column in columns"
          :key="column.id"
          class="bg-surface/90 backdrop-blur-sm rounded-xl border border-border-soft shadow-card flex-col min-h-[440px] overflow-hidden sm:flex"
          :class="mobileStatus === column.id ? 'flex' : 'hidden'"
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
              class="group bg-surface rounded-lg border border-border shadow-card p-3.5 border-s-[3px] transition-all duration-fast hover:shadow-card-hover hover:-translate-y-0.5 cursor-pointer"
              :class="[column.accentBorder, canDrag && 'cursor-grab active:cursor-grabbing']"
              @dragstart="onDragStart(task)"
              @dragend="dragOverColumn = null"
              @click="openDetail(task)"
            >
              <div class="flex items-start justify-between gap-2 mb-1.5">
                <p class="text-body-sm font-bold text-text-900 leading-snug">{{ task.title }}</p>
                <button
                  v-if="canDelete"
                  type="button"
                  class="grid place-items-center w-6 h-6 rounded-sm text-text-400 opacity-0 group-hover:opacity-100 hover:bg-error-bg hover:text-error transition-all duration-fast shrink-0"
                  aria-label="أرشفة المهمة"
                  title="أرشفة المهمة"
                  @click.stop="$emit('archive', task.id)"
                >
                  <ArchiveIcon :size="13" />
                </button>
              </div>

              <p v-if="task.description" class="text-caption text-text-600 mb-1 leading-relaxed line-clamp-2">{{ task.description }}</p>

              <div v-if="canDrag" class="mt-2" @click.stop>
                <BaseSelect
                  :model-value="task.status" :options="columnOptions"
                  @update:model-value="(val) => $emit('move', { id: task.id, status: val })"
                />
              </div>

              <p v-if="creatorName(task)" class="flex items-center gap-1.5 text-label text-text-400 mt-2.5 pt-2.5 border-t border-border-soft">
                <span class="grid place-items-center w-4 h-4 rounded-pill bg-primary-50 text-primary-600 text-[9px] font-bold shrink-0">{{ creatorName(task).charAt(0) }}</span>
                {{ creatorName(task) }}
              </p>

              <div class="mt-2.5 pt-2.5 border-t border-border-soft" @click.stop>
                <button
                  type="button"
                  class="flex items-center gap-1.5 text-label font-semibold text-primary-600 hover:text-primary-700 transition-colors duration-fast"
                  @click="toggleNotes(task)"
                >
                  <MessageSquare :size="12" />
                  الملاحظات
                  <span v-if="(notesByTask[task.id] || []).length" class="text-text-400 font-normal">({{ (notesByTask[task.id] || []).length }})</span>
                  <ChevronDown :size="12" :class="['transition-transform duration-fast', isNotesOpen(task.id) && 'rotate-180']" />
                </button>

                <div v-if="isNotesOpen(task.id)" class="mt-2 flex flex-col gap-2">
                  <SkeletonLoader v-if="notesLoadingByTask[task.id]" :rows="2" height="28px" />
                  <template v-else>
                    <p v-if="!(notesByTask[task.id] || []).length" class="text-label text-text-400 text-center py-1">لا توجد ملاحظات بعد</p>
                    <div v-for="note in notesByTask[task.id]" :key="note.id" class="bg-bg rounded-sm p-2">
                      <div class="flex items-center justify-between gap-2 mb-0.5">
                        <span class="text-label font-bold text-text-700">{{ note.user?.name || '—' }}</span>
                        <span class="text-label text-text-400 shrink-0">{{ formatRelativeTime(note.created_at) }}</span>
                      </div>
                      <p class="text-caption text-text-600 leading-relaxed">{{ note.note }}</p>
                    </div>
                  </template>
                  <div class="flex items-center gap-1.5">
                    <input
                      v-model="noteDrafts[task.id]" type="text" placeholder="اكتب ملاحظة..."
                      class="flex-1 h-8 px-2.5 rounded-sm border border-border bg-surface text-caption text-text-900 focus:border-primary-600 transition-colors duration-fast"
                      @keydown.enter="submitNote(task.id)"
                    >
                    <button
                      type="button"
                      class="grid place-items-center h-8 px-2.5 rounded-sm bg-primary-600 text-white text-caption font-bold hover:bg-primary-700 transition-colors duration-fast shrink-0"
                      @click="submitNote(task.id)"
                    >
                      إضافة
                    </button>
                  </div>
                </div>
              </div>
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

    <!-- تفاصيل / تعديل المهمة -->
    <BaseModal v-model="detailModalOpen" :title="canEditTask ? 'تعديل المهمة' : 'تفاصيل المهمة'" size="md">
      <div class="flex flex-col gap-4">
        <BaseInput v-model="detailForm.title" label="عنوان المهمة" :disabled="!canEditTask" required />
        <BaseTextarea v-model="detailForm.description" label="الوصف" placeholder="لا يوجد وصف" :rows="4" :disabled="!canEditTask" />
      </div>
      <template #footer>
        <BaseButton variant="ghost" @click="detailModalOpen = false">{{ canEditTask ? 'إلغاء' : 'إغلاق' }}</BaseButton>
        <BaseButton v-if="canEditTask" :icon="Check" :disabled="!detailForm.title.trim()" @click="saveDetail">حفظ التعديلات</BaseButton>
      </template>
    </BaseModal>

    <!-- أرشيف المهام -->
    <BaseModal v-model="archiveModalOpen" title="أرشيف المهام" description="استرجعي أي مهمة تمت أرشفتها بالخطأ" size="lg">
      <SkeletonLoader v-if="trashedLoading" :rows="3" height="60px" />
      <EmptyState v-else-if="!trashedTasks.length" title="لا توجد مهام مؤرشفة" description="كل مهمة يتم أرشفتها ستظهر هنا وبإمكانك استرجاعها." />
      <div v-else class="flex flex-col gap-2 max-h-96 overflow-y-auto scrollbar-thin">
        <div v-for="task in trashedTasks" :key="task.id" class="flex items-center justify-between gap-3 p-3 rounded-sm border border-border bg-bg">
          <div class="min-w-0">
            <div class="font-bold text-text-900 truncate">{{ task.title }}</div>
            <div v-if="task.description" class="text-caption text-text-400 truncate">{{ task.description }}</div>
          </div>
          <BaseButton variant="outline" size="sm" :icon="RotateCcw" :loading="restoringId === task.id" @click="$emit('restore', task.id)">استرجاع</BaseButton>
        </div>
      </div>
      <template #footer>
        <BaseButton variant="ghost" @click="archiveModalOpen = false">إغلاق</BaseButton>
      </template>
    </BaseModal>
  </div>
</template>

<script>
import { Plus, Archive as ArchiveIcon, Check, RotateCcw, MessageSquare, ChevronDown } from 'lucide-vue-next'
import BaseButton from '@/components/ui/BaseButton.vue'
import BaseModal from '@/components/ui/BaseModal.vue'
import BaseInput from '@/components/ui/BaseInput.vue'
import BaseTextarea from '@/components/ui/BaseTextarea.vue'
import BaseSelect from '@/components/ui/BaseSelect.vue'
import EmptyState from '@/components/ui/EmptyState.vue'
import SkeletonLoader from '@/components/ui/SkeletonLoader.vue'
import { formatRelativeTime } from '@/utils/formatters'

const COLUMNS = [
  { id: 'pending', label: 'قيد الانتظار', dot: 'bg-text-400', headBg: '', accentBorder: 'border-s-border' },
  { id: 'in_progress', label: 'قيد التنفيذ', dot: 'bg-primary-500', headBg: 'bg-primary-50/50', accentBorder: 'border-s-primary-400' },
  { id: 'review', label: 'مراجعة', dot: 'bg-warning', headBg: 'bg-warning-bg/50', accentBorder: 'border-s-warning' },
  { id: 'done', label: 'مكتمل', dot: 'bg-success', headBg: 'bg-success-bg/50', accentBorder: 'border-s-success' }
]

export default {
  name: 'TaskBoard',

  components: { BaseButton, BaseModal, BaseInput, BaseTextarea, BaseSelect, EmptyState, SkeletonLoader, MessageSquare, ChevronDown },

  props: {
    tasks: { type: Array, default: () => [] },
    canCreate: { type: Boolean, default: false },
    canDrag: { type: Boolean, default: false },
    canDelete: { type: Boolean, default: false },
    trashedTasks: { type: Array, default: () => [] },
    trashedLoading: { type: Boolean, default: false },
    restoringId: { type: [Number, String], default: null },
    notesByTask: { type: Object, default: () => ({}) },
    notesLoadingByTask: { type: Object, default: () => ({}) }
  },

  emits: ['create', 'move', 'archive', 'update', 'open-archive', 'restore', 'load-notes', 'add-note'],

  data() {
    return {
      Plus,
      ArchiveIcon,
      Check,
      RotateCcw,
      formatRelativeTime,
      columns: COLUMNS,
      mobileStatus: COLUMNS[0].id,
      modalOpen: false,
      draggingId: null,
      dragOverColumn: null,
      form: { title: '', description: '' },

      detailModalOpen: false,
      detailForm: { id: null, title: '', description: '' },

      archiveModalOpen: false,

      openNotesIds: [],
      noteDrafts: {}
    }
  },

  computed: {
    columnOptions() {
      return this.columns.map((c) => ({ value: c.id, label: c.label }))
    },
    // التعديل مسموح فقط لمن يقدر ينشئ مهام (المشرف/قائد الفريق) — نفس صلاحية الباك-إند
    canEditTask() {
      return this.canCreate
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

    openDetail(task) {
      this.detailForm = { id: task.id, title: task.title, description: task.description || '' }
      this.detailModalOpen = true
    },

    saveDetail() {
      if (!this.detailForm.title.trim()) return
      this.$emit('update', { id: this.detailForm.id, title: this.detailForm.title, description: this.detailForm.description })
      this.detailModalOpen = false
    },

    openArchive() {
      this.archiveModalOpen = true
      this.$emit('open-archive')
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
    },

    isNotesOpen(taskId) {
      return this.openNotesIds.includes(taskId)
    },
    toggleNotes(task) {
      if (this.isNotesOpen(task.id)) {
        this.openNotesIds = this.openNotesIds.filter((id) => id !== task.id)
        return
      }
      this.openNotesIds = [...this.openNotesIds, task.id]
      this.$emit('load-notes', task.id)
    },
    submitNote(taskId) {
      const note = (this.noteDrafts[taskId] || '').trim()
      if (!note) return
      this.$emit('add-note', { id: taskId, note })
      this.noteDrafts = { ...this.noteDrafts, [taskId]: '' }
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
