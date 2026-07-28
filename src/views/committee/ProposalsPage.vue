<template>
  <div>
    <div class="flex items-start gap-3 mb-6 p-4 rounded-lg bg-warning-bg border border-warning-border">
      <AlertTriangle :size="18" class="text-warning shrink-0 mt-0.5" />
      <p class="text-caption text-warning-text leading-relaxed">
        الباك إند الحالي لا يوثّق endpoint لعرض قائمة كل المقترحات المعلّقة — فقط الموافقة/الرفض على مقترح معروف رقمه
        (<code class="bg-surface px-1.5 py-0.5 rounded-sm">POST /proposals/{id}/approve</code> و
        <code class="bg-surface px-1.5 py-0.5 rounded-sm">POST /proposals/{id}/reject</code>). لحد ما يوفَّر endpoint
        قائمة، هذه الشاشة تكتفي بإجراء يدوي عبر رقم المقترح.
      </p>
    </div>

    <div class="bg-surface rounded-lg border border-border shadow-card p-6 max-w-xl">
      <h3 class="text-h3 font-bold text-text-900 mb-1">اتخاذ إجراء على مقترح</h3>
      <p class="text-caption text-text-600 mb-5">أدخلي رقم المقترح (project_id) ثم اختاري الإجراء المطلوب.</p>

      <BaseInput v-model="proposalId" type="number" label="رقم المقترح" placeholder="مثال: 12" class="mb-4" />

      <div class="flex gap-3">
        <BaseButton variant="secondary" :icon="Check" :loading="approving" :disabled="!proposalId" @click="approve">موافقة</BaseButton>
        <BaseButton variant="danger" :icon="X" :disabled="!proposalId" @click="openReject">رفض</BaseButton>
      </div>

      <p v-if="lastResult" class="mt-4 text-caption font-semibold" :class="lastResult.ok ? 'text-success' : 'text-error'">{{ lastResult.message }}</p>
    </div>

    <BaseModal v-model="rejectModal.open" title="سبب الرفض" description="سيُرسل السبب مع الرد للمقترح">
      <BaseTextarea v-model="rejectReason" placeholder="اكتبي سبب الرفض..." :rows="4" />
      <template #footer>
        <BaseButton variant="ghost" @click="rejectModal.open = false">إلغاء</BaseButton>
        <BaseButton variant="danger" :icon="X" :loading="rejectModal.saving" @click="confirmReject">تأكيد الرفض</BaseButton>
      </template>
    </BaseModal>
  </div>
</template>

<script>
import { AlertTriangle, Check, X } from 'lucide-vue-next'
import api from '@/services/api'
import BaseInput from '@/components/ui/BaseInput.vue'
import BaseButton from '@/components/ui/BaseButton.vue'
import BaseModal from '@/components/ui/BaseModal.vue'
import BaseTextarea from '@/components/ui/BaseTextarea.vue'

export default {
  name: 'ProposalsPage',

  components: { BaseInput, BaseButton, BaseModal, BaseTextarea, AlertTriangle },

  data() {
    return {
      Check, X,
      proposalId: '',
      approving: false,
      rejectReason: '',
      rejectModal: { open: false, saving: false },
      lastResult: null
    }
  },

  methods: {
    async approve() {
      this.approving = true
      this.lastResult = null
      try {
        await api.post(`/proposals/${this.proposalId}/approve`)
        this.lastResult = { ok: true, message: `تمت الموافقة على المقترح رقم ${this.proposalId}` }
        this.$toast.success(this.lastResult.message)
      } catch (err) {
        this.lastResult = { ok: false, message: err.normalized?.message || 'تعذّر تنفيذ الموافقة' }
        this.$toast.error(this.lastResult.message)
      } finally {
        this.approving = false
      }
    },

    openReject() {
      this.rejectReason = ''
      this.rejectModal.open = true
    },

    async confirmReject() {
      if (!this.rejectReason.trim()) {
        this.$toast.error('يرجى كتابة سبب الرفض قبل المتابعة')
        return
      }
      this.rejectModal.saving = true
      try {
        await api.post(`/proposals/${this.proposalId}/reject`, { reason: this.rejectReason.trim() })
        this.rejectModal.open = false
        this.lastResult = { ok: true, message: `تم رفض المقترح رقم ${this.proposalId}` }
        this.$toast.success(this.lastResult.message)
      } catch (err) {
        this.lastResult = { ok: false, message: err.normalized?.message || 'تعذّر تنفيذ الرفض' }
        this.$toast.error(this.lastResult.message)
      } finally {
        this.rejectModal.saving = false
      }
    }
  }
}
</script>
