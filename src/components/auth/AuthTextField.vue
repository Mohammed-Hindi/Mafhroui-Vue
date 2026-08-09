<template>
  <div>
    <label :for="fieldId" class="block mb-2 text-[12.5px] font-bold text-text-700">{{ label }}</label>

    <div class="relative flex items-center">
      <component :is="icon" :size="17" class="pointer-events-none absolute start-[14px] text-text-400" />
      <input
        :id="fieldId"
        :type="type"
        :value="modelValue"
        :placeholder="placeholder"
        :autocomplete="autocomplete"
        :aria-invalid="Boolean(error)"
        :aria-describedby="error ? `${fieldId}-error` : undefined"
        class="w-full h-12 ps-11 pe-4 rounded-sm border bg-surface text-body text-text-900 outline-none transition-colors duration-fast"
        :class="error ? 'border-error bg-error-bg' : 'border-border focus:border-primary-500'"
        @input="$emit('update:modelValue', $event.target.value)"
        @blur="$emit('blur')"
      >
    </div>

    <p v-if="error" :id="`${fieldId}-error`" class="mt-1.5 flex items-center gap-1.5 text-[11.5px] text-error">
      <AppIcon name="alertCircle" :size="13" :stroke-width="2.3" />
      {{ error }}
    </p>
  </div>
</template>

<script>
import AppIcon from '@/components/icons/AppIcon.vue'

let uid = 0

export default {
  name: 'AuthTextField',

  components: { AppIcon },

  props: {
    modelValue: { type: String, default: '' },
    label: { type: String, default: '' },
    type: { type: String, default: 'text' },
    placeholder: { type: String, default: '' },
    autocomplete: { type: String, default: 'off' },
    error: { type: String, default: '' },
    icon: { type: [Object, Function], required: true }
  },

  emits: ['update:modelValue', 'blur'],

  data() {
    uid += 1
    return { fieldId: `auth-field-${uid}` }
  }
}
</script>
