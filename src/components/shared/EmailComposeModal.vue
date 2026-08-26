<template>
  <BaseModal :model-value="modelValue" title="إرسال بريد إلكتروني" :description="to ? `إلى: ${to}` : ''" @update:model-value="$emit('update:modelValue', $event)">
    <div class="flex flex-col gap-4">
      <BaseInput v-model="subject" label="الموضوع" placeholder="موضوع الرسالة" required />
      <BaseTextarea v-model="message" label="نص الرسالة" placeholder="اكتب رسالتك هنا..." :rows="6" required />
    </div>
    <template #footer>
      <BaseButton variant="ghost" @click="close">إلغاء</BaseButton>
      <BaseButton :disabled="!subject.trim() || !message.trim()" :loading="sending" @click="send">إرسال</BaseButton>
    </template>
  </BaseModal>
</template>

<script>
import BaseModal from '@/components/ui/BaseModal.vue'
import BaseInput from '@/components/ui/BaseInput.vue'
import BaseTextarea from '@/components/ui/BaseTextarea.vue'
import BaseButton from '@/components/ui/BaseButton.vue'
import { sendEmail } from '@/services/api'

export default {
  name: 'EmailComposeModal',

  components: { BaseModal, BaseInput, BaseTextarea, BaseButton },

  props: {
    modelValue: { type: Boolean, default: false },
    to: { type: String, default: '' },
    defaultSubject: { type: String, default: '' }
  },

  emits: ['update:modelValue', 'sent'],

  data() {
    return { subject: this.defaultSubject, message: '', sending: false }
  },

  watch: {
    modelValue(open) {
      if (open) {
        this.subject = this.defaultSubject
        this.message = ''
      }
    }
  },

  methods: {
    close() {
      this.$emit('update:modelValue', false)
    },
    async send() {
      if (!this.to || !this.subject.trim() || !this.message.trim()) return
      this.sending = true
      try {
        await sendEmail({ to: this.to, subject: this.subject, message: this.message })
        this.$toast?.success('تم إرسال البريد')
        this.$emit('sent')
        this.close()
      } catch (err) {
        this.$toast?.error(err.normalized?.message || 'تعذّر إرسال البريد')
      } finally {
        this.sending = false
      }
    }
  }
}
</script>
