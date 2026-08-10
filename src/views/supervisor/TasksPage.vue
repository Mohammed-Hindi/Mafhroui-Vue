<template>
  <div>
    <div class="mb-6 max-w-xs">
      <BaseSelect v-model="selectedTeamId" label="اختر الفريق" :options="teamOptions" @update:model-value="loadTasks" />
    </div>

    <EmptyState v-if="!teamOptions.length" title="لا توجد فرق مُسندة إليك" />
    <TaskBoard
      v-else-if="selectedTeamId"
      :tasks="tasks"
      :can-create="true"
      :can-drag="false"
      :can-delete="true"
      @create="onCreate"
      @delete="onDelete"
    />
  </div>
</template>

<script>
import { mapState, mapActions } from 'pinia'
import TaskBoard from '@/components/shared/TaskBoard.vue'
import BaseSelect from '@/components/ui/BaseSelect.vue'
import EmptyState from '@/components/ui/EmptyState.vue'
import { useTeamsStore } from '@/stores/teams.store'
import { useAuthStore } from '@/stores/auth.store'

export default {
  name: 'SupervisorTasksPage',

  components: { TaskBoard, BaseSelect, EmptyState },

  data() {
    return {
      selectedTeamId: null
    }
  },

  computed: {
    ...mapState(useTeamsStore, ['teamsForDisplay', 'tasks']),
    ...mapState(useAuthStore, ['user']),

    myTeams() {
      return this.teamsForDisplay.filter((t) => t.supId === this.user?.id)
    },

    teamOptions() {
      return this.myTeams.map((t) => ({ value: t.id, label: t.name }))
    }
  },

  async created() {
    await this.fetchTeams()
    if (this.myTeams.length) {
      this.selectedTeamId = this.myTeams[0].id
      await this.loadTasks()
    }
  },

  methods: {
    ...mapActions(useTeamsStore, ['fetchTeams', 'fetchTasks', 'createTask', 'deleteTask']),

    async loadTasks() {
      if (!this.selectedTeamId) return
      try {
        await this.fetchTasks(this.selectedTeamId)
      } catch (err) {
        this.$toast?.error(err.normalized?.message || 'تعذّر تحميل المهام')
      }
    },

    async onCreate(payload) {
      try {
        await this.createTask(this.selectedTeamId, payload)
        this.$toast?.success('تمت إضافة المهمة')
      } catch (err) {
        this.$toast?.error(err.normalized?.message || 'تعذّر إضافة المهمة')
      }
    },

    async onDelete(id) {
      try {
        await this.deleteTask(id)
        this.$toast?.success('تم حذف المهمة')
      } catch (err) {
        this.$toast?.error(err.normalized?.message || 'تعذّر حذف المهمة')
      }
    }
  }
}
</script>
