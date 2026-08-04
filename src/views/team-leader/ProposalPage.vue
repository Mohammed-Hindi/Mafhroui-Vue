<template>
  <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch">
    <!-- المقترح -->
    <div class="bg-surface rounded-lg border border-border shadow-card p-6 flex flex-col">
      <div class="flex items-center gap-3 mb-6">
        <span class="grid place-items-center w-9 h-9 rounded-md shrink-0 text-white" style="background: linear-gradient(135deg, var(--color-primary-600), var(--color-accent-500))"><FileText :size="18" /></span>
        <h3 class="text-h3 font-bold text-text-900">المقترح (Proposal)</h3>
      </div>

      <div v-if="!proposalSubmitted" class="flex-1 flex flex-col gap-4">
        <FileDropzone ref="attachmentDropzone" label="مرفق إضافي (اختياري)" :accept="attachmentAccept" hint="PDF, Word, PowerPoint أو صورة — بحد أقصى 10 ميجابايت" @change="proposalAttachment = $event" />

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

        <BaseButton block :icon="Send" :loading="proposalGenerating" :disabled="proposalGenerating" class="mt-auto pt-2" @click="submitProposal">إرسال المقترح</BaseButton>
      </div>

      <SubmittedState v-else class="flex-1 flex flex-col justify-center" title="تم تسليم الملف، بانتظار الموافقة" description="بانتظار اعتماد المشرف للمقترح المُرسل." :items="proposalItems" />
    </div>

    <!-- التقرير النهائي -->
    <div class="bg-surface rounded-lg border border-border shadow-card p-6 flex flex-col">
      <div class="flex items-center gap-3 mb-6">
        <span class="grid place-items-center w-9 h-9 rounded-md shrink-0 text-white" style="background: linear-gradient(135deg, var(--color-primary-600), var(--color-accent-500))"><FileCheck :size="18" /></span>
        <h3 class="text-h3 font-bold text-text-900">التقرير النهائي للمشروع</h3>
      </div>

      <div v-if="!reportSubmitted" class="flex-1 flex flex-col">
        <p class="text-body-sm text-text-600 leading-relaxed mb-5">
          التقرير النهائي هو التوثيق الرسمي لمشروع تخرجكم، ويُسلَّم بعد استكمال جميع مراحل التطوير. راجعوا المتطلبات أدناه قبل الرفع.
        </p>

        <FileDropzone ref="reportDropzone" label="ملف التقرير النهائي (PDF)" accept="application/pdf" hint="PDF — بحد أقصى 10 ميجابايت" class="mb-4" @change="reportFile = $event" />

        <div class="mb-4">
          <label class="block mb-2 text-label font-semibold text-text-700">فيديو العرض النهائي</label>
          <div class="inline-flex items-center gap-1 bg-bg border border-border rounded-md p-1 mb-3">
            <button
              type="button" class="h-8 px-3.5 rounded-sm text-caption font-bold transition-colors duration-fast"
              :class="videoMode === 'file' ? 'bg-primary-600 text-white shadow-card' : 'text-text-600 hover:text-primary-700'"
              @click="videoMode = 'file'"
            >
              رفع ملف
            </button>
            <button
              type="button" class="h-8 px-3.5 rounded-sm text-caption font-bold transition-colors duration-fast"
              :class="videoMode === 'link' ? 'bg-primary-600 text-white shadow-card' : 'text-text-600 hover:text-primary-700'"
              @click="videoMode = 'link'"
            >
              إدخال رابط
            </button>
          </div>
          <FileDropzone v-if="videoMode === 'file'" ref="videoDropzone" accept="video/*" hint="MP4 — بحد أقصى 10 ميجابايت" @change="videoFile = $event" />
          <BaseInput v-else v-model="videoLink" :icon="Link2" placeholder="https://drive.google.com/..." />
        </div>

        <BaseButton block :icon="Send" class="mt-auto pt-2" @click="submitReport">إرسال التقرير النهائي</BaseButton>
      </div>

      <SubmittedState v-else class="flex-1 flex flex-col justify-center" title="تم تسليم التقرير النهائي" description="بانتظار اعتماد المشرف واللجنة للتقرير والمخرج النهائي." :items="reportItems" />
    </div>
  </div>
</template>

<script>
import { FileText, FileCheck, Send, Link2, Video, ChevronDown } from 'lucide-vue-next'
import BaseInput from '@/components/ui/BaseInput.vue'
import BaseButton from '@/components/ui/BaseButton.vue'
import FileDropzone from '@/components/shared/FileDropzone.vue'
import SubmittedState from '@/components/shared/SubmittedState.vue'
import ClauseTextarea from '@/components/shared/ClauseTextarea.vue'
import { openPlaceholderPdf, openPlaceholderVideo, generateOfficialPdf } from '@/utils/filePreview'

const PROPOSAL_FIELDS = [
  { key: 'name', hint: 'اسم المشروع', type: 'input', placeholder: 'اسم مشروع التخرج' },
  { key: 'desc', hint: 'وصف المشروع', type: 'textarea', rows: 3, placeholder: 'وصف مختصر عن فكرة المشروع...' },
  { key: 'challenges', hint: 'التحديات', type: 'textarea', rows: 3, placeholder: 'التحديات التي يحلّها المشروع' },
  { key: 'solutions', hint: 'الحلول', type: 'textarea', rows: 3, placeholder: 'الحلول المقترحة' },
  { key: 'features', hint: 'الميزات', type: 'textarea', rows: 3, placeholder: 'أبرز ميزات المشروع' },
  { key: 'addedValue', hint: 'القيمة المضافة', type: 'textarea', rows: 3, placeholder: 'القيمة المضافة للمستخدم' }
]

const ATTACHMENT_ACCEPT = '.pdf,.doc,.docx,.ppt,.pptx,image/*'

export default {
  name: 'TeamLeaderProposalPage',

  components: { FileText, FileCheck, ChevronDown, BaseInput, BaseButton, FileDropzone, SubmittedState, ClauseTextarea },

  data() {
    return {
      Send, Link2,
      fieldsMeta: PROPOSAL_FIELDS,
      visibleFieldsCount: 2,
      attachmentAccept: ATTACHMENT_ACCEPT,

      proposalSubmitted: false,
      proposalGenerating: false,
      proposalPdfUrl: '',
      proposalAttachment: null,
      showMoreFields: false,
      proposalForm: {
        name: 'منصة إدارة مشاريع التخرج',
        desc: 'منصة تفاعلية لإدارة مشاريع التخرج تربط الطلاب بالمشرفين ولجنة الإشراف.',
        challenges: '',
        solutions: '',
        features: '',
        addedValue: ''
      },

      reportSubmitted: false,
      reportFile: null,
      videoMode: 'file',
      videoFile: null,
      videoLink: ''
    }
  },

  computed: {
    proposalItems() {
      const items = []
      if (this.proposalPdfUrl) {
        items.push({
          icon: FileText,
          label: 'ملف المقترح',
          fileName: `مقترح-${this.proposalForm.name || 'المشروع'}.pdf`,
          onClick: () => window.open(this.proposalPdfUrl, '_blank')
        })
      }
      if (this.proposalAttachment) {
        items.push({
          icon: FileText,
          label: 'مرفق إضافي',
          fileName: this.proposalAttachment.name,
          onClick: () => window.open(URL.createObjectURL(this.proposalAttachment), '_blank')
        })
      }
      return items
    },

    reportItems() {
      const items = []
      if (this.reportFile) {
        items.push({
          icon: FileText,
          label: 'ملف التقرير النهائي',
          fileName: this.reportFile.name,
          onClick: () => openPlaceholderPdf(this.reportFile.name, 'التقرير النهائي')
        })
      }
      if (this.videoMode === 'file' && this.videoFile) {
        items.push({
          icon: Video,
          label: 'فيديو العرض النهائي',
          fileName: this.videoFile.name,
          onClick: () => openPlaceholderVideo()
        })
      } else if (this.videoMode === 'link' && this.videoLink.trim()) {
        items.push({
          icon: Video,
          label: 'فيديو العرض النهائي (رابط)',
          fileName: this.videoLink,
          onClick: () => window.open(this.videoLink, '_blank')
        })
      }
      return items
    }
  },

  methods: {
    async submitProposal() {
      if (!this.proposalForm.name.trim() || !this.proposalForm.desc.trim()) {
        this.$toast?.error('يرجى تعبئة اسم المشروع ووصفه على الأقل')
        return
      }
      this.proposalGenerating = true
      try {
        this.proposalPdfUrl = await generateOfficialPdf('مقترح مشروع التخرج', this.proposalForm.name,
          this.fieldsMeta.map((field) => ({ label: field.hint, value: this.proposalForm[field.key] }))
        )
        this.proposalSubmitted = true
        this.$toast?.success('تم إرسال المقترح بنجاح، بانتظار اعتماد المشرف')
      } finally {
        this.proposalGenerating = false
      }
    },

    submitReport() {
      if (!this.reportFile) {
        this.$toast?.error('يرجى إرفاق ملف التقرير النهائي قبل الإرسال')
        return
      }
      if (this.videoMode === 'file' && !this.videoFile) {
        this.$toast?.error('يرجى إرفاق فيديو العرض النهائي أو إدخال رابط له')
        return
      }
      if (this.videoMode === 'link' && !this.videoLink.trim()) {
        this.$toast?.error('يرجى إدخال رابط فيديو العرض النهائي')
        return
      }
      this.reportSubmitted = true
      this.$toast?.success('تم إرسال التقرير النهائي والمخرج الرئيسي بنجاح')
    }
  }
}
</script>
