<template>
  <!-- مهامي — مهام الإدارة العامة المسندة لعضو لجنة الإشراف أو للمشرف: لوحة حالات يحرّكها صاحبها بنفسه + ملاحظات -->
  <div :class="usesPortal && 'dash hd-page'">
    <!-- الإدارة العامة واللجنة: رأس صفحة بطاقة بوابة كباقي الصفحات -->
    <header v-if="usesPortal" class="dash-head">
      <h2 class="dash-title">مهامي</h2>
      <!-- إرسال مهمة للمجموعات أو مجموعات محددة أو المشرفين (نفس أداة الإدارة العامة) -->
      <button v-if="!isSup" type="button" class="pbtn is-green" @click="openComposer"><Plus :size="16" /> مهمة جديدة</button>
    </header>
    <TasksWorkspace v-if="usesPortal && !isSup" ref="composer" compose-only :groups="groups" />
    <SkeletonLoader v-if="loading" variant="cards" :rows="4" />
    <EmptyState v-else-if="!tasks.length" title="لا توجد مهام مسندة لك" description="عندما ترسل لك الإدارة العامة أو لجنة الإشراف مهمة ستظهر هنا." />
    <TaskBoard
      v-else
      :tasks="tasks"
      :can-create="false" :can-drag="true" :can-delete="false" uploads
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
import { Plus } from 'lucide-vue-next'
import TaskBoard from '@/components/shared/TaskBoard.vue'
import TasksWorkspace from '@/views/super-admin/TasksWorkspace.vue'
import EmptyState from '@/components/ui/EmptyState.vue'
import api from '@/services/api'
import { fetchGroups } from '@/utils/progressData'
import { useTeamsStore } from '@/stores/teams.store'
import { useAuthStore } from '@/stores/auth.store'
import { isPlaceholder } from '@/utils/studentPlaceholders'

export default {
  name: 'CommitteeMyTasksPage',

  components: { Plus, TaskBoard, TasksWorkspace, EmptyState },

  data() {
    return { tasks: [], loading: true, groups: [] }
  },

  computed: {
    ...mapState(useTeamsStore, ['taskNotes', 'taskNotesLoading']),
    ...mapState(useAuthStore, ['user', 'usesPortal']),
    // المشرف يستقبل مهامه فقط (بلا إنشاء مهام من هنا)
    isSup() {
      return this.user?.role === 'supervisor'
    },
    // بلا مهام تجريبية: الصفحة تعرض المهام الحقيقية فقط
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

    // نافذة "مهمة جديدة" نفسها (بوب أب) بدل الانتقال لصفحة التكليفات؛ المجموعات تُجلب عند أول فتح
    async openComposer() {
      this.$refs.composer.openComposer()
      if (!this.groups.length) this.groups = await fetchGroups().catch(() => [])
    },

    // PATCH /tasks/{id}/status — تحديث فوري مع التراجع عند الفشل
    async onMove({ id, status }) {
      const task = this.tasks.find((t) => t.id === id)
      if (!task || task.status === status) return
      const prev = task.status
      task.status = status
      if (isPlaceholder(task)) return
      try {
        await api.patch(`/tasks/${id}/status`, { status })
      } catch (err) {
        task.status = prev
        this.$toast?.error(err.normalized?.message || 'تعذّر تحديث الحالة')
      }
    },

    async onLoadNotes(id) {
      if (id < 0) return
      try {
        await this.fetchTaskNotes(id)
      } catch (err) {
        this.$toast?.error(err.normalized?.message || 'تعذّر تحميل الملاحظات')
      }
    },

    async onAddNote({ id, note }) {
      if (id < 0) return this.$toast?.info('مهمة تجريبية — لا تُحفظ الملاحظات')
      try {
        await this.addTaskNote(id, note)
      } catch (err) {
        this.$toast?.error(err.normalized?.message || 'تعذّر إضافة الملاحظة')
      }
    }
  }
}
</script>
