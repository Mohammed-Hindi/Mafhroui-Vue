<template>
  <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch">
    <!-- المقترح -->
    <div class="bg-surface rounded-lg border border-border shadow-card p-6 flex flex-col">
      <div class="flex items-center gap-3 mb-6">
        <span class="grid place-items-center w-9 h-9 rounded-md shrink-0 text-white" style="background: linear-gradient(135deg, var(--color-primary-600), var(--color-accent-500))"><FileText :size="18" /></span>
        <h3 class="text-h3 font-bold text-text-900">المقترح (Proposal)</h3>
      </div>

      <div v-if="!proposal || proposal.status === 'rejected'" class="flex-1 flex flex-col gap-4">
        <div v-if="proposal?.status === 'rejected'" class="bg-error-bg text-error text-body-sm rounded-md p-3">
          تم رفض المقترح: {{ proposal.rejection_reason }}. عدّلي البيانات وأعيدي الإرسال.
        </div>

        <template v-for="(field, i) in fieldsMeta" :key="field.key">
          <BaseInput v-if="i < visibleFieldsCount && field.type === 'input'" v-model="proposalForm[field.key]" :label="field.hint" :placeholder="field.placeholder" />
          <ClauseTextarea v-else-if="i < visibleFieldsCount" v-model="proposalForm[field.key]" :label="field.hint" :placeholder="field.placeholder" :rows="field.rows" />
        </template>

        <button
          type="button"
          class="flex items-center justify-center gap-1.5 h-10 rounded-sm border border-border bg-bg text-primary-700 text-body-sm font-bold hover:bg-primary-50 transition-colors duration-fast"
          @click="showMoreFields = !showMoreFields"
        >
          {{ showMoreFields ? 'عرض أقل' : 'عرض المزيد' }}
          <ChevronDown :size="14" :class="['transition-transform duration-fast', showMoreFields && 'rotate-180']" />
        </button>

        <template v-if="showMoreFields">
          <template v-for="(field, i) in fieldsMeta" :key="field.key">
            <ClauseTextarea v-if="i >= visibleFieldsCount" v-model="proposalForm[field.key]" :label="field.hint" :placeholder="field.placeholder" :rows="field.rows" />
          </template>
        </template>

        <BaseButton block :icon="Send" :loading="proposalGenerating" :disabled="proposalGenerating" class="mt-auto pt-2" @click="submitProposal">{{ proposal?.status === 'rejected' ? 'إعادة إرسال المقترح' : 'إرسال المقترح' }}</BaseButton>
      </div>

      <SubmittedState
        v-else class="flex-1 flex flex-col justify-center"
        :rejected="false"
        :title="proposal.status === 'approved' ? 'تم اعتماد المقترح' : 'تم تسليم الملف، بانتظار الموافقة'"
        :description="proposal.status === 'approved' ? 'المشروع الآن قيد التنفيذ.' : 'بانتظار اعتماد المشرف للمقترح المُرسل.'"
        :items="proposalItems"
      />
    </div>

    <!-- التقرير النهائي -->
    <div class="bg-surface rounded-lg border border-border shadow-card p-6 flex flex-col">
      <div class="flex items-center gap-3 mb-6">
        <span class="grid place-items-center w-9 h-9 rounded-md shrink-0 text-white" style="background: linear-gradient(135deg, var(--color-primary-600), var(--color-accent-500))"><FileCheck :size="18" /></span>
        <h3 class="text-h3 font-bold text-text-900">التقرير النهائي للمشروع</h3>
      </div>

      <div v-if="proposal?.status !== 'approved'" class="flex-1 flex items-center justify-center p-6">
        <div class="flex flex-col items-center gap-2.5 bg-bg border border-border rounded-lg px-7 py-6 max-w-[280px] text-center">
          <span class="grid place-items-center w-12 h-12 rounded-pill bg-surface border border-border text-text-400"><Lock :size="20" /></span>
          <p class="text-body-sm font-bold text-text-900">الرفع يُتاح بعد اعتماد المقترح</p>
        </div>
      </div>

      <div v-else-if="!finalReport" class="flex-1 flex flex-col">
        <p class="text-body-sm text-text-600 leading-relaxed mb-5">
          التقرير النهائي هو التوثيق الرسمي لمشروع تخرجكم، ويُسلَّم بعد استكمال جميع مراحل التطوير.
        </p>

        <FileDropzone ref="reportDropzone" label="ملف التقرير النهائي (PDF)" accept="application/pdf" hint="PDF — بحد أقصى 20 ميجابايت" class="mb-4" @change="reportFile = $event" />

        <div class="mb-4">
          <BaseInput v-model="videoLink" label="رابط فيديو العرض النهائي (اختياري)" :icon="Link2" placeholder="https://drive.google.com/..." />
        </div>

        <BaseButton block :icon="Send" :loading="reportSubmitting" :disabled="reportSubmitting" class="mt-auto pt-2" @click="submitReport">إرسال التقرير النهائي</BaseButton>
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
import { FileText, FileCheck, Send, Link2, Video, ChevronDown, Lock } from 'lucide-vue-next'
import BaseInput from '@/components/ui/BaseInput.vue'
import BaseButton from '@/components/ui/BaseButton.vue'
import FileDropzone from '@/components/shared/FileDropzone.vue'
import SubmittedState from '@/components/shared/SubmittedState.vue'
import ClauseTextarea from '@/components/shared/ClauseTextarea.vue'
import { generateOfficialPdf } from '@/utils/filePreview'
import { useTeamsStore } from '@/stores/teams.store'
import { useAuthStore } from '@/stores/auth.store'

const PROPOSAL_FIELDS = [
  { key: 'name', hint: 'اسم المشروع', type: 'input', placeholder: 'اسم مشروع التخرج' },
  { key: 'desc', hint: 'وصف المشروع', type: 'textarea', rows: 3, placeholder: 'وصف مختصر عن فكرة المشروع...' },
  { key: 'challenges', hint: 'التحديات', type: 'textarea', rows: 3, placeholder: 'التحديات التي يحلّها المشروع' },
  { key: 'solutions', hint: 'الحلول', type: 'textarea', rows: 3, placeholder: 'الحلول المقترحة' },
  { key: 'features', hint: 'الميزات', type: 'textarea', rows: 3, placeholder: 'أبرز ميزات المشروع' },
  { key: 'addedValue', hint: 'القيمة المضافة', type: 'textarea', rows: 3, placeholder: 'القيمة المضافة للمستخدم' }
]

export default {
  name: 'TeamLeaderProposalPage',

  components: { FileText, FileCheck, ChevronDown, Lock, BaseInput, BaseButton, FileDropzone, SubmittedState, ClauseTextarea },

  data() {
    return {
      Send, Link2,
      fieldsMeta: PROPOSAL_FIELDS,
      visibleFieldsCount: 2,
      showMoreFields: false,
      proposalGenerating: false,
      proposalForm: { name: '', desc: '', challenges: '', solutions: '', features: '', addedValue: '' },

      reportFile: null,
      videoLink: '',
      reportSubmitting: false
    }
  },

  computed: {
    ...mapState(useTeamsStore, ['teams']),
    ...mapState(useAuthStore, ['user']),

    myTeam() {
      return this.teams.find((t) => t.leader?.id === this.user?.id)
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
    if (this.proposal) {
      this.proposalForm.name = this.proposal.name
      this.proposalForm.desc = this.proposal.description
      this.proposalForm.challenges = this.proposal.problems
      this.proposalForm.solutions = this.proposal.solutions
      this.proposalForm.features = this.proposal.features_value
    }
  },

  methods: {
    ...mapActions(useTeamsStore, ['fetchTeams', 'submitProposal', 'updateProposal', 'submitFinalReport', 'openProtectedFile']),

    async submitProposal() {
      if (!this.proposalForm.name.trim() || !this.proposalForm.desc.trim()) {
        this.$toast?.error('يرجى تعبئة اسم المشروع ووصفه على الأقل')
        return
      }
      if (!this.myTeam?.project?.id) {
        this.$toast?.error('لسا ما إلك فريق/مشروع')
        return
      }
      this.proposalGenerating = true
      try {
        const pdfBlob = await generateOfficialPdf('مقترح مشروع التخرج', this.proposalForm.name,
          this.fieldsMeta.map((field) => ({ label: field.hint, value: this.proposalForm[field.key] }))
        )
        const pdfFile = new File([pdfBlob], 'proposal.pdf', { type: 'application/pdf' })
        const featuresValue = this.proposalForm.addedValue.trim()
          ? `${this.proposalForm.features}\n\nالقيمة المضافة: ${this.proposalForm.addedValue}`
          : this.proposalForm.features

        const payload = {
          project_id: this.myTeam.project.id,
          name: this.proposalForm.name,
          description: this.proposalForm.desc,
          problems: this.proposalForm.challenges,
          solutions: this.proposalForm.solutions,
          features_value: featuresValue,
          pdf: pdfFile
        }

        if (this.proposal?.id) {
          await this.updateProposal(this.proposal.id, payload)
        } else {
          await this.submitProposal(payload)
        }
        await this.fetchTeams()
        this.$toast?.success('تم إرسال المقترح بنجاح، بانتظار اعتماد المشرف')
      } catch (err) {
        this.$toast?.error(err.normalized?.message || 'تعذّر إرسال المقترح')
      } finally {
        this.proposalGenerating = false
      }
    },

    async submitReport() {
      if (!this.reportFile) {
        this.$toast?.error('يرجى إرفاق ملف التقرير النهائي قبل الإرسال')
        return
      }
      this.reportSubmitting = true
      try {
        await this.submitFinalReport(this.myTeam.project.id, { file: this.reportFile, video_url: this.videoLink.trim() || null })
        await this.fetchTeams()
        this.$toast?.success('تم إرسال التقرير النهائي بنجاح')
      } catch (err) {
        this.$toast?.error(err.normalized?.message || 'تعذّر إرسال التقرير النهائي')
      } finally {
        this.reportSubmitting = false
      }
    }
  }
}
</script>
