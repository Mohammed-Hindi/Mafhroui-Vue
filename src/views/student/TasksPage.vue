<template>
  <!-- مهام الطالب: لوحة tk نفسها (بلا dash-head — اللوحة تبدأ من الأعلى) — سحب تغيير الحالة + ملاحظات ومرفقات بالبطاقة -->
  <div class="dash hd-page stasks-page">
    <TaskBoard
      variant="tk"
      :loading="loading"
      :tasks="boardTasks"
      :can-create="false" :can-drag="true" :can-delete="false" uploads uploads-live :can-act="isMine" show-source
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
    return { loading: true, demo: placeholderTasks() }
  },

  computed: {
    ...mapState(useTeamsStore, ['teams', 'tasks', 'taskNotes', 'taskNotesLoading']),
    ...mapState(useAuthStore, ['user']),

    myTeam() {
      return this.teams.find((t) => t.members?.some((m) => m.student?.id === this.user?.id))
    },

    boardTasks() {
      return this.myTeam ? this.tasks : []
    }
  },

  async created() {
    await this.fetchTeams().catch(() => {})
    if (this.myTeam) {
      try {
        await this.fetchTasks(this.myTeam.id)
      } catch (err) {
        this.$toast?.error(err.normalized?.message || 'تعذّر تحميل المهام')
      }
    }
    this.loading = false
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

    /** المنتسب للمهمة: من مكلّفيها، أو كل الفريق إن لم يُحدَّد مكلّفون (والمهام التجريبية مفتوحة) */
    isMine(task) {
      if (isPlaceholder(task)) return true
      const ids = (task.assignees || []).map((a) => a.id)
      return !ids.length || ids.includes(this.user?.id)
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
    },

    async onLoadNotes(id) {
      if (isPlaceholder({ id })) return
      try {
        await this.fetchTaskNotes(id)
      } catch (err) {
        this.$toast?.error(err.normalized?.message || 'تعذّر تحميل الملاحظات')
      }
    }
  }
}
</script>
