<template>
  <BaseModal :model-value="modelValue" :title="title" size="sm" @update:model-value="$emit('update:modelValue', $event)">
    <p class="text-body text-text-700">{{ message }}</p>

    <template #footer>
      <BaseButton variant="ghost" :disabled="loading" @click="$emit('update:modelValue', false)">
        {{ cancelLabel }}
      </BaseButton>
      <BaseButton :variant="danger ? 'danger' : 'primary'" :loading="loading" @click="$emit('confirm')">
        {{ confirmLabel }}
      </BaseButton>
    </template>
  </BaseModal>
</template>

<script>
import BaseModal from './BaseModal.vue'
import BaseButton from './BaseButton.vue'

export default {
  name: 'ConfirmDialog',
  components: { BaseModal, BaseButton },
  props: {
    modelValue: { type: Boolean, default: false },
    title: { type: String, default: 'تأكيد العملية' },
    message: { type: String, default: 'هل أنت متأكدة من تنفيذ هذه العملية؟' },
    confirmLabel: { type: String, default: 'تأكيد' },
    cancelLabel: { type: String, default: 'إلغاء' },
    danger: { type: Boolean, default: false },
    loading: { type: Boolean, default: false }
  },
  emits: ['update:modelValue', 'confirm']
}
</script>
