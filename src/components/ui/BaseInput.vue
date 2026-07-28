<template>
  <div class="w-full">
    <label v-if="label" :for="inputId" class="block mb-2 text-label font-semibold text-text-700">
      {{ label }}
      <span v-if="required" class="text-error">*</span>
    </label>

    <div class="relative">
      <component
        :is="icon"
        v-if="icon"
        :size="18"
        class="pointer-events-none absolute top-1/2 -translate-y-1/2 start-3 text-text-400"
      />
      <input
        :id="inputId"
        ref="input"
        :type="type"
        :value="modelValue"
        :placeholder="placeholder"
        :disabled="disabled"
        :readonly="readonly"
        :autocomplete="autocomplete"
        :aria-invalid="Boolean(error)"
        :aria-describedby="error ? `${inputId}-error` : undefined"
        :class="[
          'w-full h-icon-btn rounded-sm border bg-surface text-body text-text-900 transition-colors duration-fast',
          icon ? 'ps-10 pe-3' : 'px-3',
          error ? 'border-error focus:border-error' : 'border-border focus:border-primary-600',
          disabled && 'bg-border-soft cursor-not-allowed opacity-70'
        ]"
        @input="$emit('update:modelValue', $event.target.value)"
        @blur="$emit('blur', $event)"
      >
      <slot name="suffix" />
    </div>

    <p v-if="error" :id="`${inputId}-error`" class="mt-1.5 text-label text-error">{{ error }}</p>
    <p v-else-if="hint" class="mt-1.5 text-label text-text-400">{{ hint }}</p>
  </div>
</template>

<script>
let uid = 0

export default {
  name: 'BaseInput',

  props: {
    modelValue: { type: [String, Number], default: '' },
    label: { type: String, default: '' },
    type: { type: String, default: 'text' },
    placeholder: { type: String, default: '' },
    hint: { type: String, default: '' },
    error: { type: String, default: '' },
    icon: { type: [Object, Function], default: null },
    required: { type: Boolean, default: false },
    disabled: { type: Boolean, default: false },
    readonly: { type: Boolean, default: false },
    autocomplete: { type: String, default: 'off' }
  },

  emits: ['update:modelValue', 'blur'],

  data() {
    uid += 1
    return { inputId: `input-${uid}` }
  },

  methods: {
    focus() {
      this.$refs.input?.focus()
    }
  }
}
</script>
