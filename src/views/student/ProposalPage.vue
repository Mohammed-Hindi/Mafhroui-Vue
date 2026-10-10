<template>
  <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch">
    <!-- المقترح -->
    <div class="bg-surface rounded-lg border border-border shadow-card p-6 flex flex-col">
      <div class="flex items-center gap-3 mb-6">
        <span class="grid place-items-center w-9 h-9 rounded-md shrink-0 text-white" style="background: linear-gradient(135deg, var(--color-primary-600), var(--color-accent-500))"><FileText :size="18" /></span>
        <h3 class="text-h3 font-bold text-text-900">المقترح (Proposal)</h3>
      </div>

      <!-- نموذج تقديم المقترح (أو إعادة تقديمه بعد الرفض) — نوع المشروع إجباري عند أول تقديم ويُقفل بعدها (يعدّله المشرف) -->
      <form v-if="showForm" class="flex flex-col gap-4" @submit.prevent="submit">
        <BaseInput v-model.trim="form.name" label="اسم المشروع" placeholder="مثال: نظام حجز القاعات الجامعية" required />
        <div>
          <div class="text-label font-bold text-text-700 mb-2">نوع المشروع <b v-if="!typesLocked" class="text-error">*</b></div>
          <div v-if="typesLocked">
            <div class="flex flex-wrap gap-2">
              <span v-for="t in projectTypes" :key="t" class="text-caption font-bold px-3 py-1.5 rounded-sm bg-primary-50 text-primary-700">{{ t }}</span>
            </div>
            <p class="text-caption text-text-400 mt-1.5">تم تحديد نوع المشروع، ويعدّله المشرف فقط.</p>
          </div>
          <template v-else>
            <div class="flex flex-wrap gap-2" role="group" aria-label="نوع المشروع">
              <button
                v-for="t in PROJECT_TYPES" :key="t" type="button" :aria-pressed="form.types.includes(t)"
                :disabled="!form.types.includes(t) && form.types.length >= 6"
                :class="['text-caption font-bold px-3 py-1.5 rounded-sm border transition-colors disabled:opacity-40', form.types.includes(t) ? 'bg-primary-600 border-primary-600 text-white' : 'border-border text-text-700 hover:border-primary-600']"
                @click="toggleType(t)"
              >
                {{ t }}
              </button>
            </div>
            <p class="text-caption text-text-400 mt-1.5">اختر نوعًا واحدًا على الأقل (حتى 6). لا يمكن تعديله بعد الإرسال إلا من المشرف.</p>
          </template>
        </div>
        <BaseTextarea v-model.trim="form.description" label="وصف المشروع" :rows="3" placeholder="فكرة المشروع باختصار" />
        <BaseTextarea v-model.trim="form.problems" label="المشكلة" :rows="2" placeholder="ما المشكلة التي يحلها المشروع؟" />
        <BaseTextarea v-model.trim="form.solutions" label="الحل المقترح" :rows="2" />
        <BaseTextarea v-model.trim="form.features_value" label="المميزات والقيمة" :rows="2" />
        <div>
          <div class="text-label font-bold text-text-700 mb-2">ملف المقترح <b v-if="!proposal" class="text-error">*</b><span v-else class="text-text-400 font-normal"> (اختياري — يبقى الملف السابق إن لم ترفع جديدًا)</span></div>
          <FileDropzone v-model="form.files" :max-mb="100" />
        </div>
        <p v-if="missing" class="text-caption text-error">{{ missing }}</p>
        <div class="flex gap-2">
          <BaseButton type="submit" :loading="sending" :disabled="!!missing">{{ proposal ? 'إعادة إرسال المقترح' : 'إرسال المقترح' }}</BaseButton>
          <BaseButton v-if="proposal" variant="outline" @click="editing = false">إلغاء</BaseButton>
        </div>
      </form>

      <div v-else-if="!proposal" class="flex-1 flex items-center justify-center p-6">
        <div class="flex flex-col items-center gap-2.5 bg-bg border border-border rounded-lg px-7 py-6 max-w-[260px] text-center">
          <span class="grid place-items-center w-12 h-12 rounded-pill bg-surface border border-border text-text-400"><Lock :size="20" /></span>
          <p class="text-body-sm font-bold text-text-900">بانتظار إرسال المقترح من فريقك</p>
          <p class="text-caption text-text-600">لتعبئة المقترح وإرساله</p>
        </div>
      </div>

      <SubmittedState
        v-else class="flex-1 flex flex-col justify-center"
        :rejected="proposal.status === 'rejected'"
        :title="proposal.status === 'approved' ? 'تم اعتماد المقترح' : proposal.status === 'rejected' ? 'تم رفض المقترح' : 'تم تسليم الملف، بانتظار الموافقة'"
        :description="proposal.status === 'approved' ? 'المشروع الآن قيد التنفيذ.' : proposal.status === 'rejected' ? 'يجب على الفريق تعديل المقترح وإعادة إرساله.' : 'بانتظار اعتماد المشرف للمقترح المُرسل.'"
        :reject-reason="proposal.rejection_reason"
        :items="proposalItems"
      />
      <BaseButton v-if="canResubmit && !editing" variant="outline" class="mt-4 self-start" @click="startEdit">تعديل المقترح وإعادة إرساله</BaseButton>
    </div>

    <!-- التقرير النهائي -->
    <div class="bg-surface rounded-lg border border-border shadow-card p-6 flex flex-col">
      <div class="flex items-center gap-3 mb-6">
        <span class="grid place-items-center w-9 h-9 rounded-md shrink-0 text-white" style="background: linear-gradient(135deg, var(--color-primary-600), var(--color-accent-500))"><FileCheck :size="18" /></span>
        <h3 class="text-h3 font-bold text-text-900">التقرير النهائي للمشروع</h3>
      </div>

      <!-- سبب الرفض ومن رفض (المشرف أو لجنة الإشراف) فوق نموذج إعادة الرفع -->
      <div v-if="reportRejected" class="flex items-start gap-2 p-3 mb-4 rounded-sm bg-error-bg">
        <XCircle :size="16" class="text-error shrink-0 mt-0.5" />
        <p class="text-caption text-error leading-relaxed">
          <span class="font-bold">رُفض التقرير من {{ rejectedBy(finalReport) }}: </span>{{ finalReport.review_note || '—' }}
          <span class="block mt-1">عدّل التقرير وأعد رفعه — يبدأ الاعتماد من جديد (المشرف ثم لجنة الإشراف).</span>
        </p>
      </div>

      <!-- رفع التقرير النهائي (أو إعادة رفعه بعد الرفض) — بعد اعتماد المقترح، من حساب الفريق الأساسي -->
      <form v-if="showReportForm" class="flex flex-col gap-4" @submit.prevent="submitReport">
        <div>
          <div class="text-label font-bold text-text-700 mb-2">ملف التقرير النهائي (PDF) <b class="text-error">*</b></div>
          <FileDropzone v-model="reportForm.files" :max-mb="100" />
        </div>
        <BaseInput v-model.trim="reportForm.video_url" label="رابط فيديو البرومو" placeholder="https://www.youtube.com/watch?v=…" dir="ltr" required />
        <div class="flex gap-2">
          <BaseButton type="submit" :loading="uploading" :disabled="!reportForm.files.length || !reportForm.video_url">{{ reportRejected ? 'إعادة رفع التقرير' : 'رفع التقرير النهائي' }}</BaseButton>
          <BaseButton v-if="reportRejected" variant="outline" @click="reportEditing = false">إلغاء</BaseButton>
        </div>
      </form>

      <div v-else-if="!finalReport" class="flex-1 flex items-center justify-center p-6">
        <div class="flex flex-col items-center gap-2.5 bg-bg border border-border rounded-lg px-7 py-6 max-w-[260px] text-center">
          <span class="grid place-items-center w-12 h-12 rounded-pill bg-surface border border-border text-text-400"><Lock :size="20" /></span>
          <p class="text-body-sm font-bold text-text-900">{{ proposal?.status === 'approved' ? 'بانتظار رفع التقرير من فريقك' : 'يُتاح بعد اعتماد المقترح' }}</p>
          <p class="text-caption text-text-600">لرفع التقرير النهائي والمخرج</p>
        </div>
      </div>

      <SubmittedState
        v-else class="flex-1 flex flex-col justify-center"
        :rejected="reportRejected"
        :title="REVIEW[finalReport.review_status || 'pending_supervisor'].label"
        :description="reportDescription"
        :items="reportItems"
      />
      <BaseButton v-if="reportRejected && canSubmit && proposal?.status === 'approved' && !reportEditing" variant="outline" class="mt-4 self-start" @click="reportEditing = true">تعديل التقرير وإعادة رفعه</BaseButton>
    </div>
  </div>
</template>

<script>
import { mapState, mapActions } from 'pinia'
import { FileText, FileCheck, Video, Lock, XCircle } from 'lucide-vue-next'
import { REVIEW, latestReport, rejectedBy } from '@/utils/finalReport'
import SubmittedState from '@/components/shared/SubmittedState.vue'
import FileDropzone from '@/components/shared/FileDropzone.vue'
import BaseInput from '@/components/ui/BaseInput.vue'
import BaseTextarea from '@/components/ui/BaseTextarea.vue'
import BaseButton from '@/components/ui/BaseButton.vue'
import { PROJECT_TYPES } from '@/utils/constants'
import { useTeamsStore } from '@/stores/teams.store'
import { useAuthStore } from '@/stores/auth.store'

export default {
  name: 'StudentProposalPage',

  components: { FileText, FileCheck, Lock, XCircle, SubmittedState, FileDropzone, BaseInput, BaseTextarea, BaseButton },

  data() {
    return {
      REVIEW,
      PROJECT_TYPES,
      editing: false,
      sending: false,
      reportEditing: false,
      uploading: false,
      reportForm: { files: [], video_url: '' },
      form: { name: '', description: '', problems: '', solutions: '', features_value: '', types: [], files: [] }
    }
  },

  computed: {
    ...mapState(useTeamsStore, ['teams']),
    ...mapState(useAuthStore, ['user']),

    myTeam() {
      return this.teams.find((t) => t.members?.some((m) => m.student?.id === this.user?.id))
    },

    proposal() {
      return this.myTeam?.project?.proposal || null
    },

    // الخادم يقبل التقديم من حساب الفريق الأساسي فقط (leader_id داخليًا)
    canSubmit() {
      return !!this.myTeam?.project && this.myTeam.leader?.id === this.user?.id
    },

    canResubmit() {
      return this.canSubmit && this.proposal?.status === 'rejected'
    },

    showForm() {
      return this.canSubmit && (!this.proposal || (this.canResubmit && this.editing))
    },

    projectTypes() {
      return this.myTeam?.project?.types || []
    },

    // بعد تحديد النوع أول مرة لا يغيّره الطالب
    typesLocked() {
      return this.projectTypes.length > 0
    },

    missing() {
      if (!this.form.name) return 'أدخل اسم المشروع'
      if (!this.typesLocked && !this.form.types.length) return 'اختر نوع المشروع'
      if (!this.proposal && !this.form.files.length) return 'أرفق ملف المقترح'
      return ''
    },

    finalReport() {
      return latestReport(this.myTeam?.project)
    },

    reportRejected() {
      return this.finalReport?.review_status === 'rejected'
    },

    /** أول رفع بعد اعتماد المقترح، أو إعادة الرفع بعد الرفض */
    showReportForm() {
      return this.canSubmit && this.proposal?.status === 'approved' && (!this.finalReport || (this.reportRejected && this.reportEditing))
    },

    /** مسار الاعتماد: المشرف يوافق ← لجنة الإشراف تعتمد ← يُؤرشف المشروع */
    reportDescription() {
      const r = this.finalReport
      return {
        pending_supervisor: 'تم رفع التقرير النهائي — بانتظار موافقة المشرف.',
        pending_committee: 'وافق المشرف على التقرير — بانتظار اعتماد لجنة الإشراف لأرشفة المشروع.',
        approved: 'اعتُمد التقرير من المشرف ولجنة الإشراف وأُرشف المشروع.',
        rejected: `رُفض من ${rejectedBy(r)} — عدّل التقرير وأعد رفعه.`
      }[r.review_status || 'pending_supervisor']
    },

    proposalItems() {
      if (!this.proposal) return []
      const ext = this.proposal.pdf_path?.split('.').pop() || 'pdf'
      const fileName = `مقترح-${this.proposal.name}.${ext}`
      return [{ icon: FileText, label: 'ملف المقترح', fileName, onClick: () => this.openProtectedFile(`/proposals/${this.proposal.id}/download`, fileName) }]
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
    ...mapActions(useTeamsStore, ['fetchTeams', 'openProtectedFile', 'submitProposal', 'updateProposal', 'submitFinalReport']),
    rejectedBy,

    // POST /projects/{id}/final-reports — تقرير جديد يبدأ مسار الاعتماد من المشرف
    async submitReport() {
      this.uploading = true
      try {
        await this.submitFinalReport(this.myTeam.project.id, { file: this.reportForm.files[0], video_url: this.reportForm.video_url })
        this.$toast?.success('تم رفع التقرير — بانتظار موافقة المشرف')
        this.reportForm = { files: [], video_url: '' }
        this.reportEditing = false
        await this.fetchTeams()
      } catch (err) {
        this.$toast?.error(err.normalized?.message || 'تعذّر رفع التقرير')
      } finally {
        this.uploading = false
      }
    },

    toggleType(t) {
      this.form.types = this.form.types.includes(t) ? this.form.types.filter((x) => x !== t) : [...this.form.types, t]
    },

    startEdit() {
      const p = this.proposal
      this.form = { name: p.name || '', description: p.description || '', problems: p.problems || '', solutions: p.solutions || '', features_value: p.features_value || '', types: [], files: [] }
      this.editing = true
    },

    /** POST /proposals (أول تقديم) أو PUT /proposals/{id} (إعادة تقديم بعد الرفض) */
    async submit() {
      const { files, types, ...fields } = this.form
      const payload = Object.fromEntries(Object.entries(fields).filter(([, v]) => v !== ''))
      if (files[0]) payload.pdf = files[0]
      if (!this.typesLocked) types.forEach((t, i) => { payload[`types[${i}]`] = t })
      this.sending = true
      try {
        if (this.proposal) await this.updateProposal(this.proposal.id, payload)
        else await this.submitProposal({ ...payload, project_id: this.myTeam.project.id })
        this.$toast?.success('تم إرسال المقترح للمراجعة')
        this.editing = false
        await this.fetchTeams()
      } catch (err) {
        this.$toast?.error(err.normalized?.message || 'تعذّر إرسال المقترح')
      } finally {
        this.sending = false
      }
    }
  }
}
</script>
