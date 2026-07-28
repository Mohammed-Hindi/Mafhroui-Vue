<template>
  <div class="w-full">
    <label v-if="label" :for="areaId" class="block mb-2 text-label font-semibold text-text-700">
      {{ label }}
      <span v-if="required" class="text-error">*</span>
    </label>

    <textarea
      :id="areaId"
      :value="modelValue"
      :rows="rows"
      :placeholder="placeholder"
      :disabled="disabled"
      :maxlength="maxlength || undefined"
      :aria-invalid="Boolean(error)"
      :class="[
        'w-full px-3 py-2.5 rounded-sm border bg-surface text-body text-text-900 resize-y transition-colors duration-fast',
        error ? 'border-error' : 'border-border focus:border-primary-600',
        disabled && 'bg-border-soft cursor-not-allowed opacity-70'
      ]"
      @input="$emit('update:modelValue', $event.target.value)"
    />

    <div class="flex items-start justify-between gap-2 mt-1.5">
      <p v-if="error" class="text-label text-error">{{ error }}</p>
      <p v-else-if="hint" class="text-label text-text-400">{{ hint }}</p>
      <p v-if="maxlength" class="text-label text-text-400 ms-auto shrink-0">
        {{ (modelValue || '').length }} / {{ maxlength }}
      </p>
    </div>
  </div>
</template>

<script>
let uid = 0

export default {
  name: 'BaseTextarea',
  props: {
    modelValue: { type: String, default: '' },
    label: { type: String, default: '' },
    placeholder: { type: String, default: '' },
    hint: { type: String, default: '' },
    error: { type: String, default: '' },
    rows: { type: Number, default: 4 },
    maxlength: { type: Number, default: 0 },
    required: { type: Boolean, default: false },
    disabled: { type: Boolean, default: false }
  },
  emits: ['update:modelValue'],
  data() {
    uid += 1
    return { areaId: `textarea-${uid}` }
  }
}
</script>
