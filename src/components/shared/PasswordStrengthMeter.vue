<template>
  <p v-if="password" :class="['mt-2 text-label font-medium', textColor]">قوة كلمة المرور: {{ strength.label }}</p>
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
    textColor() {
      return ['text-error', 'text-error', 'text-warning-text', 'text-secondary-600', 'text-success'][this.strength.score]
    }
  }
}
</script>
