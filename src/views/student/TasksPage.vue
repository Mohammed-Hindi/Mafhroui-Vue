<template>
  <div class="dash hd-page">
    <header class="dash-head"><h2 class="dash-title">المهام</h2></header>
    <TaskBoard
      :tasks="boardTasks"
      :can-create="false" :can-drag="true" :can-delete="false" uploads uploads-live :show-log="false"
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
import { isPlaceholder, placeholderTasks } from '@/utils/studentPlaceholders'
import { useTeamsStore } from '@/stores/teams.store'
import { useAuthStore } from '@/stores/auth.store'

export default {
  name: 'StudentTasksPage',

  components: { TaskBoard },

  data() {
    return { demo: placeholderTasks() }
  },

  computed: {
    ...mapState(useTeamsStore, ['teams', 'tasks', 'taskNotes', 'taskNotesLoading']),
    ...mapState(useAuthStore, ['user']),

    myTeam() {
      return this.teams.find((t) => t.members?.some((m) => m.student?.id === this.user?.id))
    },

    /** بلا فريق أو بلا مهام: مهام تجريبية (placeholder) */
    boardTasks() {
      return this.myTeam && this.tasks.length ? this.tasks : this.demo
    }
  },

  async created() {
    await this.fetchTeams()
    if (this.myTeam) {
      try {
        await this.fetchTasks(this.myTeam.id)
      } catch (err) {
        this.$toast?.error(err.normalized?.message || 'تعذّر تحميل المهام')
      }
    }
  },

  methods: {
    ...mapActions(useTeamsStore, ['fetchTeams', 'fetchTasks', 'changeTaskStatus', 'fetchTaskNotes', 'addTaskNote']),

    async onMove({ id, status }) {
      if (isPlaceholder({ id })) {
        const t = this.demo.find((x) => x.id === id)
        if (t) t.status = status
        return
      }
      try {
        await this.changeTaskStatus(id, status)
      } catch (err) {
        this.$toast?.error(err.normalized?.message || 'تعذّر تحديث الحالة')
      }
    },

    async onLoadNotes(id) {
      if (isPlaceholder({ id })) return
      try {
        await this.fetchTaskNotes(id)
      } catch (err) {
        this.$toast?.error(err.normalized?.message || 'تعذّر تحميل الملاحظات')
      }
    },

    async onAddNote({ id, note }) {
      if (isPlaceholder({ id })) {
        const store = useTeamsStore()
        store.taskNotes = { ...store.taskNotes, [id]: [...(store.taskNotes[id] || []), { id: -Date.now(), note, user: { name: this.user?.name }, created_at: new Date().toISOString() }] }
        return
      }
      try {
        await this.addTaskNote(id, note)
      } catch (err) {
        this.$toast?.error(err.normalized?.message || 'تعذّر إضافة الملاحظة')
      }
    }
  }
}
</script>
