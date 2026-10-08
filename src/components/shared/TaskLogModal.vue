<template>
  <!-- سجل مهام مجموعة وحركتها: كل مهمة مع حالتها، والضغط عليها يعرض سجل الحركة (من نقلها ومن أي عمود لأي عمود) -->
  <BaseModal :model-value="modelValue" :title="`سجل المهام — ${teamName}`" size="xl" @update:model-value="$emit('update:modelValue', $event)">
    <p v-if="loading" class="pf-muted">جارٍ تحميل المهام…</p>
    <p v-else-if="!tasks.length" class="pf-muted">لا توجد مهام لهذه المجموعة</p>
    <ul v-else class="tl">
      <li v-for="t in tasks" :key="t.id" :class="['tl-task', openId === t.id && 'is-open']">
        <button type="button" class="tl-head" :aria-expanded="openId === t.id" @click="toggle(t)">
          <span :class="['rv-pill', t.status === 'done' ? 'is-approved' : isLate(t) ? 'is-rejected' : 'is-pending']">{{ isLate(t) ? 'متأخرة' : TASK_STATUS[t.status] || t.status }}</span>
          <b>{{ t.title }}</b>
          <span class="pf-muted">
            {{ (t.assignees || []).map((a) => a.name).join('، ') || 'كل الفريق' }}
            <template v-if="t.due_date"> · التسليم {{ formatDate(t.due_date) }}</template>
            · أنشأها {{ t.created_by?.name || '—' }}
          </span>
        </button>
        <div v-if="openId === t.id" class="tl-body">
          <p v-if="t.description" class="tl-desc">{{ t.description }}</p>
          <p v-if="logs[t.id] === undefined" class="pf-muted">جارٍ تحميل السجل…</p>
          <p v-else-if="!logs[t.id].length" class="pf-muted">لا توجد حركات مسجّلة لهذه المهمة بعد</p>
          <ol v-else class="tl-log">
            <li v-for="(e, i) in logs[t.id]" :key="i">
              <span class="tl-dot" />
              <span><b>{{ e.user?.name || 'النظام' }}</b> {{ describe(e) }}</span>
              <span class="pf-muted">{{ when(e.created_at) }}</span>
            </li>
          </ol>
        </div>
      </li>
    </ul>
  </BaseModal>
</template>

<script>
import BaseModal from '@/components/ui/BaseModal.vue'
import api from '@/services/api'
import { TASK_STATUS } from '@/utils/progressData'
import { formatDate } from '@/utils/formatters'

const ACTIONS = { create: 'أنشأ المهمة', delete: 'حذف المهمة', restore: 'استرجع المهمة', force_delete: 'حذف المهمة نهائيًا', update: 'عدّل المهمة' }

export default {
  name: 'TaskLogModal',

  components: { BaseModal },

  props: {
    modelValue: { type: Boolean, default: false },
    teamId: { type: [Number, String], default: null },
    teamName: { type: String, default: '' }
  },

  emits: ['update:modelValue'],

  data() {
    return { TASK_STATUS, tasks: [], logs: {}, loading: false, openId: null }
  },

  watch: {
    modelValue(open) {
      if (open) this.load()
    }
  },

  methods: {
    formatDate,

    async load() {
      this.loading = true
      this.tasks = []
      this.logs = {}
      this.openId = null
      try {
        const { data } = await api.get(`/teams/${this.teamId}/tasks`)
        this.tasks = data.data || data
      } catch {
        this.tasks = []
      } finally {
        this.loading = false
      }
    },

    async toggle(t) {
      this.openId = this.openId === t.id ? null : t.id
      if (this.openId && this.logs[t.id] === undefined) {
        try {
          const { data } = await api.get(`/tasks/${t.id}/activity`)
          this.logs = { ...this.logs, [t.id]: data }
        } catch {
          this.logs = { ...this.logs, [t.id]: [] }
        }
      }
    },

    describe(e) {
      if (e.action === 'status_change') {
        const from = TASK_STATUS[e.meta?.from] || e.meta?.from
        const to = TASK_STATUS[e.meta?.to] || e.meta?.to
        return `نقل المهمة من «${from}» إلى «${to}»`
      }
      return ACTIONS[e.action] || e.action
    },

    isLate(t) {
      return t.status !== 'done' && t.due_date && new Date(t.due_date) < new Date()
    },

    when(d) {
      return d ? new Date(d).toLocaleString('ar-EG', { dateStyle: 'medium', timeStyle: 'short' }) : ''
    }
  }
}
</script>
