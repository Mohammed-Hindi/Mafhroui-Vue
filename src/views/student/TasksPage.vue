<template>
  <div>
    <EmptyState v-if="!myTeam" title="لسا ما إلك فريق" description="لما ينسبك مشرف لفريق رح تقدر تشوف مهامه من هون." />
    <TaskBoard v-else :tasks="tasks" :can-create="false" :can-drag="false" :can-delete="false" />
  </div>
</template>

<script>
import { mapState, mapActions } from 'pinia'
import TaskBoard from '@/components/shared/TaskBoard.vue'
import EmptyState from '@/components/ui/EmptyState.vue'
import { useTeamsStore } from '@/stores/teams.store'
import { useAuthStore } from '@/stores/auth.store'

export default {
  name: 'StudentTasksPage',

  components: { TaskBoard, EmptyState },

  computed: {
    ...mapState(useTeamsStore, ['teams', 'tasks']),
    ...mapState(useAuthStore, ['user']),

    myTeam() {
      return this.teams.find((t) => t.members?.some((m) => m.student?.id === this.user?.id))
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
    ...mapActions(useTeamsStore, ['fetchTeams', 'fetchTasks'])
  }
}
</script>
