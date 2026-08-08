<template>
  <div>
    <div v-if="!readOnly" class="flex items-center justify-between gap-4 mb-5">
      <p class="text-body-sm text-text-600">اسحب البطاقات بين الأعمدة لتحديث الحالة</p>
      <BaseButton size="sm" :icon="Plus" @click="openCreate()">مهمة جديدة</BaseButton>
    </div>

    <div class="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
      <div
        v-for="column in columns"
        :key="column.id"
        class="bg-bg rounded-lg border border-border-soft flex flex-col min-h-[420px]"
        @dragover.prevent
        @drop="onDrop(column.id)"
      >
        <div class="flex items-center justify-between gap-2 px-4 py-3 border-b border-border-soft shrink-0">
          <span class="font-cairo font-bold text-body-sm text-text-900">{{ column.label }}</span>
          <span class="grid place-items-center min-w-[22px] h-[22px] px-1.5 rounded-pill bg-border-soft text-label font-bold text-text-600">
            {{ tasksByColumn(column.id).length }}
          </span>
        </div>

        <div class="flex-1 flex flex-col gap-2.5 p-3 overflow-y-auto scrollbar-thin">
          <div
            v-for="task in tasksByColumn(column.id)"
            :key="task.id"
            :draggable="!readOnly"
            class="bg-surface rounded-md border border-border shadow-card p-3 cursor-pointer transition-shadow duration-fast hover:shadow-card-hover"
            :class="!readOnly && 'active:cursor-grabbing'"
            @dragstart="onDragStart(task)"
            @click="!readOnly && openEdit(task)"
          >
            <div class="flex items-start justify-between gap-2 mb-2">
              <p class="text-body-sm font-semibold text-text-900 leading-snug">{{ task.title }}</p>
              <button
                v-if="!readOnly"
                type="button"
                class="grid place-items-center w-6 h-6 rounded-sm text-text-400 hover:bg-error-bg hover:text-error transition-colors duration-fast shrink-0"
                aria-label="حذف المهمة"
                @click.stop="removeTask(task.id)"
              >
                <Trash2 :size="13" />
              </button>
            </div>

            <p v-if="task.description" class="text-caption text-text-600 mb-3 line-clamp-2">{{ task.description }}</p>

            <div class="flex items-center justify-between gap-2">
              <span :class="['inline-flex items-center gap-1 px-2 py-0.5 rounded-pill text-label font-semibold', priorityMeta(task.priority).class]">
                <Flag :size="10" />
                {{ priorityMeta(task.priority).label }}
              </span>
              <span v-if="task.assignee" class="grid place-items-center w-6 h-6 rounded-pill bg-primary-50 text-primary-600 text-label font-bold shrink-0" :title="task.assignee">
                {{ initials(task.assignee) }}
              </span>
            </div>

            <div v-if="task.dueDate" class="flex items-center gap-1.5 mt-2.5 pt-2.5 border-t border-border-soft text-label text-text-400">
              <CalendarDays :size="12" />
              {{ formatDate(task.dueDate) }}
            </div>
          </div>

          <p v-if="!tasksByColumn(column.id).length" class="text-center text-label text-text-400 py-6">لا توجد مهام</p>
        </div>
      </div>
    </div>

    <BaseModal v-model="modalOpen" :title="editingId ? 'تعديل المهمة' : 'مهمة جديدة'" size="md">
      <div class="flex flex-col gap-4">
        <BaseInput v-model="form.title" label="عنوان المهمة" placeholder="مثال: تجهيز الفصل الثاني من التقرير" required />
        <BaseTextarea v-model="form.description" label="الوصف" placeholder="تفاصيل إضافية عن المهمة (اختياري)" :rows="3" />

        <div class="grid grid-cols-2 gap-4">
          <BaseSelect v-model="form.priority" label="الأولوية" :options="priorityOptions" />
          <BaseSelect v-model="form.columnId" label="الحالة" :options="columnOptions" />
        </div>

        <div class="grid grid-cols-2 gap-4">
          <BaseSelect
            v-model="form.assignee"
            label="المسؤول"
            placeholder="بدون تعيين"
            include-placeholder-option
            :options="teamMembers"
          />
          <BaseInput v-model="form.dueDate" type="date" label="تاريخ الاستحقاق" />
        </div>
      </div>

      <template #footer>
        <BaseButton variant="ghost" @click="modalOpen = false">إلغاء</BaseButton>
        <BaseButton :disabled="!form.title.trim()" @click="saveTask">{{ editingId ? 'حفظ التعديلات' : 'إضافة المهمة' }}</BaseButton>
      </template>
    </BaseModal>
  </div>
</template>

<script>
import { Plus, Trash2, Flag, CalendarDays } from 'lucide-vue-next'
import BaseButton from '@/components/ui/BaseButton.vue'
import BaseModal from '@/components/ui/BaseModal.vue'
import BaseInput from '@/components/ui/BaseInput.vue'
import BaseTextarea from '@/components/ui/BaseTextarea.vue'
import BaseSelect from '@/components/ui/BaseSelect.vue'
import { formatDate, initials } from '@/utils/formatters'

const COLUMNS = [
  { id: 'todo', label: 'قيد الانتظار' },
  { id: 'progress', label: 'قيد التنفيذ' },
  { id: 'review', label: 'مراجعة' },
  { id: 'done', label: 'مكتمل' }
]

const PRIORITY_META = {
  high: { label: 'عالية', class: 'bg-error-bg text-error' },
  medium: { label: 'متوسطة', class: 'bg-warning-bg text-warning-text' },
  low: { label: 'منخفضة', class: 'bg-success-bg text-success' }
}

let uid = 0

export default {
  name: 'TaskBoard',

  components: { Trash2, Flag, CalendarDays, BaseButton, BaseModal, BaseInput, BaseTextarea, BaseSelect },

  props: {
    storageKey: { type: String, required: true },
    teamMembers: { type: Array, default: () => [] },
    seed: { type: Array, default: () => [] },
    readOnly: { type: Boolean, default: false }
  },

  data() {
    return {
      Plus,
      columns: COLUMNS,
      tasks: [],
      modalOpen: false,
      editingId: null,
      draggingId: null,
      form: this.emptyForm()
    }
  },

  computed: {
    priorityOptions() {
      return Object.entries(PRIORITY_META).map(([value, meta]) => ({ value, label: meta.label }))
    },
    columnOptions() {
      return this.columns.map((c) => ({ value: c.id, label: c.label }))
    }
  },

  created() {
    this.tasks = this.loadTasks()
  },

  methods: {
    formatDate,
    initials,

    emptyForm(columnId = 'todo') {
      return { title: '', description: '', priority: 'medium', columnId, assignee: '', dueDate: '' }
    },

    priorityMeta(priority) {
      return PRIORITY_META[priority] || PRIORITY_META.medium
    },

    tasksByColumn(columnId) {
      return this.tasks.filter((t) => t.columnId === columnId)
    },

    loadTasks() {
      try {
        const raw = localStorage.getItem(this.storageKey)
        if (raw) return JSON.parse(raw)
      } catch (_) { /* تخزين تالف — نتجاهله ونبدأ من البذرة */ }
      return this.seed.map((task) => ({ ...task, id: this.nextId() }))
    },

    persist() {
      localStorage.setItem(this.storageKey, JSON.stringify(this.tasks))
    },

    nextId() {
      uid += 1
      return `t${Date.now()}-${uid}`
    },

    openCreate(columnId) {
      this.editingId = null
      this.form = this.emptyForm(columnId || 'todo')
      this.modalOpen = true
    },

    openEdit(task) {
      this.editingId = task.id
      this.form = { title: task.title, description: task.description, priority: task.priority, columnId: task.columnId, assignee: task.assignee, dueDate: task.dueDate }
      this.modalOpen = true
    },

    saveTask() {
      if (!this.form.title.trim()) return
      if (this.editingId) {
        const task = this.tasks.find((t) => t.id === this.editingId)
        Object.assign(task, this.form)
      } else {
        this.tasks.push({ id: this.nextId(), ...this.form })
      }
      this.persist()
      this.modalOpen = false
    },

    removeTask(id) {
      this.tasks = this.tasks.filter((t) => t.id !== id)
      this.persist()
    },

    onDragStart(task) {
      this.draggingId = task.id
    },

    onDrop(columnId) {
      if (!this.draggingId || this.readOnly) return
      const task = this.tasks.find((t) => t.id === this.draggingId)
      if (task) {
        task.columnId = columnId
        this.persist()
      }
      this.draggingId = null
    }
  }
}
</script>
