<template>
  <div class="dash hd-page">
    <header class="dash-head">
      <h2 class="dash-title">الإعلانات</h2>
    </header>

    <p v-if="loading" class="pt-muted">جارٍ تحميل الإعلانات…</p>

    <div v-else-if="!myTeam" class="palert is-warning">
      لم تُنسب لمجموعة بعد
    </div>

    <div v-else-if="!announcements.length" class="palert is-info">
      لا توجد إعلانات من مشرفك
    </div>

    <div v-else class="flex flex-col gap-4">
      <article v-for="a in announcements" :key="a.id" class="dash-card">
        <div class="dash-card-head">
          <h3>{{ a.title || 'بلا عنوان' }}</h3>
          <span class="dash-chip">{{ formatDate(a.created_at) }}</span>
        </div>
        <p v-if="a.body" class="tl-desc">{{ a.body }}</p>
        <div class="dash-card-meta">
          <span class="pt-muted">من: {{ a.author?.name || 'المشرف' }}</span>
        </div>
      </article>
    </div>
  </div>
</template>

<script>
import { mapState, mapActions } from 'pinia'
import { useTeamsStore } from '@/stores/teams.store'
import { useAuthStore } from '@/stores/auth.store'
import api from '@/services/api'
import { formatDate } from '@/utils/formatters'

export default {
  name: 'StudentAnnouncementsPage',

  data() {
    return {
      announcements: [],
      loading: true
    }
  },

  computed: {
    ...mapState(useTeamsStore, ['teams']),
    ...mapState(useAuthStore, ['user']),

    myTeam() {
      return this.teams.find((t) => t.members?.some((m) => m.student?.id === this.user?.id))
    }
  },

  async created() {
    await this.fetchTeams()
    if (this.myTeam) {
      await this.loadAnnouncements()
    } else {
      this.loading = false
    }
  },

  methods: {
    ...mapActions(useTeamsStore, ['fetchTeams']),

    async loadAnnouncements() {
      this.loading = true
      try {
        const { data } = await api.get(`/teams/${this.myTeam.id}/announcements`)
        this.announcements = data.data || data || []
      } catch (err) {
        this.$toast?.error(err.normalized?.message || 'تعذّر تحميل الإعلانات')
      } finally {
        this.loading = false
      }
    },

    formatDate
  }
}
</script>
