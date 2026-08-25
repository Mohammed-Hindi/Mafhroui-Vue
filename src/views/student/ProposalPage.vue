<template>
  <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch">
    <!-- المقترح -->
    <div class="bg-surface rounded-lg border border-border shadow-card p-6 flex flex-col">
      <div class="flex items-center gap-3 mb-6">
        <span class="grid place-items-center w-9 h-9 rounded-md shrink-0 text-white" style="background: linear-gradient(135deg, var(--color-primary-600), var(--color-accent-500))"><FileText :size="18" /></span>
        <h3 class="text-h3 font-bold text-text-900">المقترح (Proposal)</h3>
      </div>

      <div v-if="!proposal" class="flex-1 flex items-center justify-center p-6">
        <div class="flex flex-col items-center gap-2.5 bg-bg border border-border rounded-lg px-7 py-6 max-w-[260px] text-center">
          <span class="grid place-items-center w-12 h-12 rounded-pill bg-surface border border-border text-text-400"><Lock :size="20" /></span>
          <p class="text-body-sm font-bold text-text-900">بانتظار قائد الفريق</p>
          <p class="text-caption text-text-600">لتعبئة المقترح وإرساله</p>
        </div>
      </div>

      <SubmittedState
        v-else class="flex-1 flex flex-col justify-center"
        :rejected="proposal.status === 'rejected'"
        :title="proposal.status === 'approved' ? 'تم اعتماد المقترح' : proposal.status === 'rejected' ? 'تم رفض المقترح' : 'تم تسليم الملف، بانتظار الموافقة'"
        :description="proposal.status === 'approved' ? 'المشروع الآن قيد التنفيذ.' : proposal.status === 'rejected' ? 'قائد الفريق لازم يعدّل ويعيد الإرسال.' : 'بانتظار اعتماد المشرف للمقترح المُرسل.'"
        :reject-reason="proposal.rejection_reason"
        :items="proposalItems"
      />
    </div>

    <!-- التقرير النهائي -->
    <div class="bg-surface rounded-lg border border-border shadow-card p-6 flex flex-col">
      <div class="flex items-center gap-3 mb-6">
        <span class="grid place-items-center w-9 h-9 rounded-md shrink-0 text-white" style="background: linear-gradient(135deg, var(--color-primary-600), var(--color-accent-500))"><FileCheck :size="18" /></span>
        <h3 class="text-h3 font-bold text-text-900">التقرير النهائي للمشروع</h3>
      </div>

      <div v-if="!finalReport" class="flex-1 flex items-center justify-center p-6">
        <div class="flex flex-col items-center gap-2.5 bg-bg border border-border rounded-lg px-7 py-6 max-w-[260px] text-center">
          <span class="grid place-items-center w-12 h-12 rounded-pill bg-surface border border-border text-text-400"><Lock :size="20" /></span>
          <p class="text-body-sm font-bold text-text-900">بانتظار قائد الفريق</p>
          <p class="text-caption text-text-600">لرفع التقرير النهائي والمخرج</p>
        </div>
      </div>

      <SubmittedState
        v-else class="flex-1 flex flex-col justify-center"
        :rejected="false"
        title="تم تسليم التقرير النهائي"
        description="تم رفع التقرير النهائي بنجاح."
        :items="reportItems"
      />
    </div>
  </div>
</template>

<script>
import { mapState, mapActions } from 'pinia'
import { FileText, FileCheck, Video, Lock } from 'lucide-vue-next'
import SubmittedState from '@/components/shared/SubmittedState.vue'
import { useTeamsStore } from '@/stores/teams.store'
import { useAuthStore } from '@/stores/auth.store'

export default {
  name: 'StudentProposalPage',

  components: { FileText, FileCheck, Lock, SubmittedState },

  computed: {
    ...mapState(useTeamsStore, ['teams']),
    ...mapState(useAuthStore, ['user']),

    myTeam() {
      return this.teams.find((t) => t.members?.some((m) => m.student?.id === this.user?.id))
    },

    proposal() {
      return this.myTeam?.project?.proposal || null
    },

    finalReport() {
      const reports = this.myTeam?.project?.final_reports
      return reports?.length ? reports[0] : null
    },

    proposalItems() {
      if (!this.proposal) return []
      return [{ icon: FileText, label: 'ملف المقترح', fileName: `مقترح-${this.proposal.name}.pdf`, onClick: () => this.openProtectedFile(`/proposals/${this.proposal.id}/download`, `مقترح-${this.proposal.name}.pdf`) }]
    },

    reportItems() {
      if (!this.finalReport) return []
      const items = [{ icon: FileText, label: 'ملف التقرير النهائي', fileName: 'التقرير-النهائي.pdf', onClick: () => this.openProtectedFile(`/final-reports/${this.finalReport.id}/download`, 'التقرير-النهائي.pdf') }]
      if (this.finalReport.video_url) {
        items.push({ icon: Video, label: 'فيديو العرض النهائي', fileName: this.finalReport.video_url, onClick: () => window.open(this.finalReport.video_url, '_blank') })
      }
      return items
    }
  },

  async created() {
    await this.fetchTeams()
  },
  methods: {
    ...mapActions(useTeamsStore, ['fetchTeams', 'openProtectedFile'])
  }
}
</script>
