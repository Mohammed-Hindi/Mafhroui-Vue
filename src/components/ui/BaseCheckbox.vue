<template>
  <label class="inline-flex items-start gap-2 cursor-pointer select-none" :class="disabled && 'opacity-60 cursor-not-allowed'">
    <input
      type="checkbox"
      :checked="modelValue"
      :disabled="disabled"
      class="mt-0.5 w-[18px] h-[18px] rounded-[6px] border-border text-primary-600 cursor-pointer accent-[color:var(--color-primary-600)]"
      @change="$emit('update:modelValue', $event.target.checked)"
    >
    <span class="text-body-sm text-text-700"><slot>{{ label }}</slot></span>
  </label>
</template>

<script>
export default {
  name: 'BaseCheckbox',
  props: {
    modelValue: { type: Boolean, default: false },
    label: { type: String, default: '' },
    disabled: { type: Boolean, default: false }
  },
  emits: ['update:modelValue']
}
</script>
