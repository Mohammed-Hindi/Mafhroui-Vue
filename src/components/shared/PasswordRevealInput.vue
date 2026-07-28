<template>
  <div class="w-full">
    <label v-if="label" :for="fieldId" class="block mb-2 text-label font-semibold text-text-700">
      {{ label }}
      <span v-if="required" class="text-error">*</span>
    </label>

    <div class="relative">
      <Lock :size="18" class="pointer-events-none absolute top-1/2 -translate-y-1/2 start-3 text-text-400" />
      <input
        :id="fieldId"
        :type="isRevealed ? 'text' : 'password'"
        :value="modelValue"
        :placeholder="placeholder"
        :disabled="disabled"
        :autocomplete="autocomplete"
        :aria-invalid="Boolean(error)"
        :class="[
          'w-full h-icon-btn ps-10 pe-11 rounded-sm border bg-surface text-body text-text-900 transition-colors duration-fast',
          error ? 'border-error' : 'border-border focus:border-primary-600'
        ]"
        @input="$emit('update:modelValue', $event.target.value)"
        @blur="$emit('blur', $event)"
      >
      <button
        type="button"
        class="absolute top-1/2 -translate-y-1/2 end-2 grid place-items-center w-8 h-8 rounded-sm text-text-400 hover:text-primary-600 transition-colors duration-fast"
        :aria-label="isRevealed ? 'إخفاء كلمة المرور' : 'إظهار كلمة المرور'"
        @click="isRevealed = !isRevealed"
      >
        <component :is="isRevealed ? EyeOff : Eye" :size="18" />
      </button>
    </div>

    <p v-if="error" class="mt-1.5 text-label text-error">{{ error }}</p>
  </div>
</template>

<script>
import { Lock, Eye, EyeOff } from 'lucide-vue-next'

let uid = 0

export default {
  name: 'PasswordRevealInput',

  components: { Lock },

  props: {
    modelValue: { type: String, default: '' },
    label: { type: String, default: '' },
    placeholder: { type: String, default: '••••••••' },
    error: { type: String, default: '' },
    required: { type: Boolean, default: false },
    disabled: { type: Boolean, default: false },
    autocomplete: { type: String, default: 'current-password' }
  },

  emits: ['update:modelValue', 'blur'],

  data() {
    uid += 1
    return { isRevealed: false, fieldId: `password-${uid}`, Eye, EyeOff }
  }
}
</script>
