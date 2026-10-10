<template>
  <!-- مهامي — مهام الإدارة العامة المسندة لعضو لجنة الإشراف أو للمشرف: لوحة حالات يحرّكها صاحبها بنفسه + ملاحظات -->
  <div>
    <LoadingSpinner v-if="loading" />
    <EmptyState v-else-if="!tasks.length" title="لا توجد مهام مسندة لك" description="عندما ترسل لك الإدارة العامة مهمة ستظهر هنا." />
    <TaskBoard
      v-else
      :tasks="tasks"
      :can-create="false" :can-drag="true" :can-delete="false"
      :notes-by-task="taskNotes"
      :notes-loading-by-task="taskNotesLoading"
      @move="onMove"
      @load-notes="onLoadNotes"
      @add-note="onAddNote"
    />
  </div>
</template>

<script>
import { mapState, mapActions } from 'pinia'
import TaskBoard from '@/components/shared/TaskBoard.vue'
import EmptyState from '@/components/ui/EmptyState.vue'
import LoadingSpinner from '@/components/ui/LoadingSpinner.vue'
import api from '@/services/api'
import { useTeamsStore } from '@/stores/teams.store'
import { useAuthStore } from '@/stores/auth.store'

export default {
  name: 'CommitteeMyTasksPage',

  components: { TaskBoard, EmptyState, LoadingSpinner },

  data() {
    return { tasks: [], loading: true }
  },

  computed: {
    ...mapState(useTeamsStore, ['taskNotes', 'taskNotesLoading']),
    ...mapState(useAuthStore, ['user'])
  },

  // GET /tasks?audience=committee|supervisors&assignee_id=me (الخادم يفرض للمشرف مهامه هو فقط)
  async created() {
    try {
      const audience = this.user?.role === 'supervisor' ? 'supervisors' : 'committee'
      const { data } = await api.get('/tasks', { params: { audience, assignee_id: this.user?.id } })
      this.tasks = data.data || []
    } catch (err) {
      this.$toast?.error(err.normalized?.message || 'تعذّر تحميل المهام')
    } finally {
      this.loading = false
    }
  },

  methods: {
    ...mapActions(useTeamsStore, ['fetchTaskNotes', 'addTaskNote']),

    // PATCH /tasks/{id}/status — تحديث فوري مع التراجع عند الفشل
    async onMove({ id, status }) {
      const task = this.tasks.find((t) => t.id === id)
      if (!task || task.status === status) return
      const prev = task.status
      task.status = status
      try {
        await api.patch(`/tasks/${id}/status`, { status })
      } catch (err) {
        task.status = prev
        this.$toast?.error(err.normalized?.message || 'تعذّر تحديث الحالة')
      }
    },

    async onLoadNotes(id) {
      try {
        await this.fetchTaskNotes(id)
      } catch (err) {
        this.$toast?.error(err.normalized?.message || 'تعذّر تحميل الملاحظات')
      }
    },

    async onAddNote({ id, note }) {
      try {
        await this.addTaskNote(id, note)
      } catch (err) {
        this.$toast?.error(err.normalized?.message || 'تعذّر إضافة الملاحظة')
      }
    }
  }
}
</script>
