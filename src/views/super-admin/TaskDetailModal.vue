<template>
  <!-- تفاصيل مهمة: الحالة، التعديل، المكلّفون، المرفقات، الملاحظات، وسجل الحركة — الإدارة العامة تملك كل الصلاحيات -->
  <BaseModal :model-value="!!task" :title="task ? task.title : ''" size="xl" @update:model-value="!$event && $emit('close')">
    <div v-if="task" class="tk-detail">
      <div class="tk-detail-main">
        <template v-if="editing">
          <label class="pfield">
            <span>العنوان <b class="as-req">*</b></span>
            <input v-model.trim="edit.title" type="text" maxlength="200">
          </label>
          <label class="pfield">
            <span>الوصف والتعليمات</span>
            <textarea v-model.trim="edit.description" rows="5" />
          </label>
          <div class="tk-detail-actions">
            <button type="button" class="pbtn is-green is-sm" :disabled="!edit.title || saving" @click="save">{{ saving ? 'جارٍ الحفظ…' : 'حفظ التعديلات' }}</button>
            <button type="button" class="pbtn is-outline is-sm" @click="editing = false">إلغاء</button>
          </div>
        </template>
        <template v-else>
          <p v-if="task.description" class="tl-desc">{{ task.description }}</p>
          <p v-else class="pt-muted">لا يوجد وصف لهذه المهمة.</p>
        </template>

        <section class="tk-detail-block">
          <h4>المرفقات <span class="pt-muted">{{ files.length }}</span></h4>
          <ul v-if="files.length" class="tk-files">
            <li v-for="f in files" :key="f.id">
              <FileText :size="16" />
              <span class="tk-file-name">{{ fileName(f.file_path) }}</span>
              <span class="pt-muted">{{ f.uploaded_by?.name || '' }} · {{ formatDate(f.created_at) }}</span>
            </li>
          </ul>
          <label class="pbtn is-outline is-sm tk-upload">
            <Paperclip :size="14" /> {{ uploading ? 'جارٍ الرفع…' : 'إرفاق ملف' }}
            <input type="file" :accept="ACCEPT" hidden :disabled="uploading" @change="upload">
          </label>
        </section>

        <section class="tk-detail-block">
          <h4>الملاحظات <span class="pt-muted">{{ notes.length }}</span></h4>
          <ul v-if="notes.length" class="tk-notes">
            <li v-for="n in notes" :key="n.id">
              <span class="tk-avatar">{{ initials(n.user?.name) }}</span>
              <div>
                <b>{{ n.user?.name || '—' }}</b> <span class="pt-muted">{{ formatDateTime(n.created_at) }}</span>
                <p>{{ n.note }}</p>
              </div>
            </li>
          </ul>
          <form class="tk-note-form" @submit.prevent="addNote">
            <input v-model.trim="note" type="text" class="ev-input" placeholder="اكتب ملاحظة للمجموعة…">
            <button type="submit" class="pbtn is-cyan is-sm" :disabled="!note || posting">إضافة</button>
          </form>
        </section>

        <section class="tk-detail-block">
          <h4>سجل الحركة</h4>
          <p v-if="!log.length" class="pt-muted">لا توجد حركات مسجّلة بعد.</p>
          <ol v-else class="tl-log">
            <li v-for="(e, i) in log" :key="i">
              <span class="tl-dot" />
              <span><b>{{ e.user?.name || 'النظام' }}</b> {{ describe(e) }}</span>
              <span class="pt-muted">{{ formatDateTime(e.created_at) }}</span>
            </li>
          </ol>
        </section>
      </div>

      <aside class="tk-detail-side">
        <!-- الحالة للمتابعة فقط: يحرّكها المشرف والطلاب -->
        <div class="pfield">
          <span>الحالة</span>
          <span :class="['tk-status', `is-${task.status}`]">{{ statuses.find((s) => s.value === task.status)?.label || task.status }}</span>
        </div>
        <label class="pfield">
          <span>موعد التسليم</span>
          <input :value="task.due" type="date" @change="saveField({ due_date: $event.target.value || null })">
        </label>
        <dl class="tk-meta">
          <div><dt>{{ task.groupId ? 'المجموعة' : 'الجهة' }}</dt><dd>{{ task.group }}</dd></div>
          <div v-if="task.groupId"><dt>المشرف</dt><dd>{{ task.sup }}</dd></div>
        </dl>
        <div class="pfield">
          <span>المكلّفون</span>
          <div class="tk-assign">
            <label v-for="m in members" :key="m.id" class="gp-check">
              <input type="checkbox" :checked="assigneeIds.includes(m.id)" @change="toggleAssignee(m.id)"> {{ m.name }}
            </label>
            <small v-if="task.groupId && !assigneeIds.length" class="pt-muted">بدون تحديد = كل أعضاء المجموعة</small>
          </div>
        </div>
        <div class="tk-detail-actions">
          <button v-if="!editing" type="button" class="pbtn is-outline is-sm" @click="startEdit"><Pencil :size="14" /> تعديل</button>
          <button type="button" class="pbtn is-red is-sm" :disabled="saving" @click="remove"><Trash2 :size="14" /> حذف</button>
        </div>
      </aside>
    </div>
  </BaseModal>
</template>

<script>
import { FileText, Paperclip, Pencil, Trash2 } from 'lucide-vue-next'
import BaseModal from '@/components/ui/BaseModal.vue'
import api from '@/services/api'
import { TASK_STATUS } from '@/utils/progressData'
import { formatDate, formatDateTime, initials } from '@/utils/formatters'

export const ACCEPT = '.pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.zip,.rar,.png,.jpg,.jpeg'
const ACTIONS = { create: 'أنشأ المهمة', delete: 'حذف المهمة', restore: 'استرجع المهمة', force_delete: 'حذف المهمة نهائيًا', update: 'عدّل المهمة' }

export default {
  name: 'TaskDetailModal',

  components: { BaseModal, FileText, Paperclip, Pencil, Trash2 },

  props: {
    task: { type: Object, default: null },
    members: { type: Array, default: () => [] },
    statuses: { type: Array, required: true }
  },

  emits: ['close', 'updated', 'removed'],

  data() {
    return { ACCEPT, files: [], notes: [], log: [], note: '', edit: {}, editing: false, saving: false, uploading: false, posting: false }
  },

  computed: {
    assigneeIds() {
      return this.task.assignees.map((a) => a.id)
    }
  },

  watch: {
    'task.id': {
      immediate: true,
      handler(id) {
        this.editing = false
        this.files = []
        this.notes = []
        this.log = []
        if (id) this.load(id)
      }
    }
  },

  methods: {
    formatDate,
    formatDateTime,
    initials,

    async load(id) {
      const [detail, log] = await Promise.allSettled([api.get(`/tasks/${id}`), api.get(`/tasks/${id}/activity`)])
      const t = detail.value?.data?.data || detail.value?.data || {}
      this.files = t.files || []
      this.notes = t.notes || []
      this.log = log.value?.data || []
    },

    fileName: (path = '') => path.split('/').pop(),

    describe(e) {
      if (e.action === 'status_change') return `نقل المهمة من «${TASK_STATUS[e.meta?.from] || e.meta?.from}» إلى «${TASK_STATUS[e.meta?.to] || e.meta?.to}»`
      return ACTIONS[e.action] || e.action
    },

    startEdit() {
      this.edit = { title: this.task.title, description: this.task.description || '' }
      this.editing = true
    },

    async save() {
      await this.saveField({ title: this.edit.title, description: this.edit.description || null })
      this.editing = false
    },

    /** PUT /tasks/{id} — يعيد المهمة المحدّثة للصفحة الأم */
    async saveField(payload) {
      this.saving = true
      try {
        const { data } = await api.put(`/tasks/${this.task.id}`, payload)
        this.$emit('updated', data.data || data)
        this.$toast?.success('تم حفظ التعديل')
      } catch (err) {
        this.$toast?.error(err.normalized?.message || 'تعذّر حفظ التعديل')
      } finally {
        this.saving = false
      }
    },

    toggleAssignee(id) {
      const ids = this.assigneeIds.includes(id) ? this.assigneeIds.filter((x) => x !== id) : [...this.assigneeIds, id]
      this.saveField({ assignee_ids: ids })
    },

    async upload(e) {
      const file = e.target.files[0]
      e.target.value = ''
      if (!file) return
      if (file.size > 10 * 1024 * 1024) return this.$toast?.error('الحد الأقصى لحجم الملف 10MB')
      this.uploading = true
      try {
        const fd = new FormData()
        fd.append('file', file)
        const { data } = await api.post(`/tasks/${this.task.id}/files`, fd, { headers: { 'Content-Type': 'multipart/form-data' } })
        this.files.push(data)
      } catch (err) {
        this.$toast?.error(err.normalized?.message || 'تعذّر رفع الملف')
      } finally {
        this.uploading = false
      }
    },

    async addNote() {
      this.posting = true
      try {
        const { data } = await api.post(`/tasks/${this.task.id}/notes`, { note: this.note })
        this.notes.push(data.data || data)
        this.note = ''
      } catch (err) {
        this.$toast?.error(err.normalized?.message || 'تعذّر إضافة الملاحظة')
      } finally {
        this.posting = false
      }
    },

    async remove() {
      if (!window.confirm(`حذف المهمة «${this.task.title}»؟`)) return
      this.saving = true
      try {
        await api.delete(`/tasks/${this.task.id}`)
        this.$emit('removed', this.task)
        this.$toast?.success('تم حذف المهمة')
      } catch (err) {
        this.$toast?.error(err.normalized?.message || 'تعذّر حذف المهمة')
      } finally {
        this.saving = false
      }
    }
  }
}
</script>
