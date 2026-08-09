<template>
  <div v-if="password" class="mt-2">
    <div class="flex gap-1.5">
      <span
        v-for="bar in 4"
        :key="bar"
        :class="['h-1.5 flex-1 rounded-pill transition-colors duration-base', bar <= strength.score ? barColor : 'bg-border-soft']"
      />
    </div>
    <p :class="['mt-1.5 text-label font-medium', textColor]">قوة كلمة المرور: {{ strength.label }}</p>
  </div>
</template>

<script>
import { passwordStrength } from '@/utils/validators'

export default {
  name: 'PasswordStrengthMeter',
  props: { password: { type: String, default: '' } },
  computed: {
    strength() {
      return passwordStrength(this.password)
    },
    barColor() {
      return ['bg-error', 'bg-error', 'bg-warning', 'bg-secondary-500', 'bg-success'][this.strength.score]
    },
    textColor() {
      return ['text-error', 'text-error', 'text-warning-text', 'text-secondary-600', 'text-success'][this.strength.score]
    }
  }
}
</script>
