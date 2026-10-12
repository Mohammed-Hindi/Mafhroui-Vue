<template>
  <div>
    <nav class="flex flex-wrap gap-2 mb-5" aria-label="نوع الإرسال">
      <button v-for="tab in tabs" :key="tab.value" type="button" class="px-4 py-2 border text-caption font-bold transition-colors" :class="active === tab.value ? 'bg-primary-600 text-white border-primary-600' : 'bg-surface text-text-700 border-border hover:border-primary-600'" @click="active = tab.value">{{ tab.label }}</button>
    </nav>
    <BroadcastsWorkspace :key="active" :type="active" :groups="myTeams" />
  </div>
</template>

<script>
import { mapActions, mapState } from 'pinia'
import BroadcastsWorkspace from '@/views/super-admin/BroadcastsWorkspace.vue'
import { useAuthStore } from '@/stores/auth.store'
import { useTeamsStore } from '@/stores/teams.store'

export default {
  name: 'SupervisorAssignmentsPage',
  components: { BroadcastsWorkspace },
  data() { return { active: 'announcement', tabs: [{ value: 'announcement', label: 'الإعلانات' }, { value: 'file', label: 'ملفات المشاريع' }] } },
  computed: {
    ...mapState(useAuthStore, ['user']),
    ...mapState(useTeamsStore, ['teams']),
    myTeams() { return this.teams.filter((team) => team.supervisor?.id === this.user?.id) }
  },
  async created() { await Promise.all([this.fetchCurrentUser(), this.fetchTeams()]) },
  methods: { ...mapActions(useAuthStore, ['fetchCurrentUser']), ...mapActions(useTeamsStore, ['fetchTeams']) }
}
</script>
