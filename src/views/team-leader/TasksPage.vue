<template>
  <div>
    <EmptyState v-if="!myTeam" title="لسا ما إلك فريق" description="لما ينسبك مشرف لفريق رح تقدر تدير مهامه من هون." />
    <TaskBoard
      v-else
      :tasks="tasks"
      :can-create="true"
      :can-drag="true"
      :can-delete="true"
      :trashed-tasks="trashedTasks"
      :trashed-loading="trashedTasksLoading"
      :restoring-id="restoringId"
      @create="onCreate"
      @move="onMove"
      @archive="onArchive"
      @update="onUpdate"
      @open-archive="onOpenArchive"
      @restore="onRestore"
    />
  </div>
</template>

<script>
import { mapState, mapActions } from 'pinia'
import TaskBoard from '@/components/shared/TaskBoard.vue'
import EmptyState from '@/components/ui/EmptyState.vue'
import { useTeamsStore } from '@/stores/teams.store'
import { useAuthStore } from '@/stores/auth.store'

export default {
  name: 'TeamLeaderTasksPage',

  components: { TaskBoard, EmptyState },

  data() {
    return {
      restoringId: null
    }
  },

  computed: {
    ...mapState(useTeamsStore, ['teams', 'tasks', 'trashedTasks', 'trashedTasksLoading']),
    ...mapState(useAuthStore, ['user']),

    myTeam() {
      return this.teams.find((t) => t.members?.some((m) => m.student?.id === this.user?.id))
    }
  },

  async created() {
    await this.fetchTeams()
    if (this.myTeam) await this.loadTasks()
  },

  methods: {
    ...mapActions(useTeamsStore, ['fetchTeams', 'fetchTasks', 'createTask', 'changeTaskStatus', 'deleteTask', 'updateTask', 'fetchTrashedTasks', 'restoreTask']),

    async loadTasks() {
      try {
        await this.fetchTasks(this.myTeam.id)
      } catch (err) {
        this.$toast?.error(err.normalized?.message || 'تعذّر تحميل المهام')
      }
    },

    async onCreate(payload) {
      try {
        await this.createTask(this.myTeam.id, payload)
        this.$toast?.success('تمت إضافة المهمة')
      } catch (err) {
        this.$toast?.error(err.normalized?.message || 'تعذّر إضافة المهمة')
      }
    },

    async onMove({ id, status }) {
      try {
        await this.changeTaskStatus(id, status)
      } catch (err) {
        this.$toast?.error(err.normalized?.message || 'تعذّر تحديث الحالة')
      }
    },

    async onArchive(id) {
      try {
        await this.deleteTask(id)
        this.$toast?.success('تمت أرشفة المهمة')
      } catch (err) {
        this.$toast?.error(err.normalized?.message || 'تعذّر أرشفة المهمة')
      }
    },

    async onUpdate({ id, title, description }) {
      try {
        await this.updateTask(id, { title, description })
        this.$toast?.success('تم حفظ التعديلات')
      } catch (err) {
        this.$toast?.error(err.normalized?.message || 'تعذّر حفظ التعديلات')
      }
    },

    async onOpenArchive() {
      try {
        await this.fetchTrashedTasks(this.myTeam.id)
      } catch (err) {
        this.$toast?.error(err.normalized?.message || 'تعذّر تحميل الأرشيف')
      }
    },

    async onRestore(id) {
      this.restoringId = id
      try {
        await this.restoreTask(id)
        this.$toast?.success('تم استرجاع المهمة')
      } catch (err) {
        this.$toast?.error(err.normalized?.message || 'تعذّر استرجاع المهمة')
      } finally {
        this.restoringId = null
      }
    }
  }
}
</script>
