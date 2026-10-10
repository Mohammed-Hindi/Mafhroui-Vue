<template>
  <!-- إدخال درجة بند: رقم من 0 للقصوى (درجات رقمية) أو اختيار مستوى (مقياس تقديري) — القيمة المحفوظة رقم دائمًا -->
  <select v-if="method === 'scale'" class="ev-score" :value="scaleOf(modelValue, max)" :aria-label="label" @change="pick($event.target.value)">
    <option value="">—</option>
    <option v-for="l in SCALE" :key="l.pct" :value="l.pct">{{ l.label }} ({{ round(l.pct * max) }})</option>
  </select>
  <input
    v-else type="number" class="ev-score mono" min="0" :max="max" step="0.5" :value="modelValue ?? ''" :aria-label="label" placeholder="—"
    :class="invalid && 'is-invalid'" @input="set($event.target.value)"
  >
</template>

<script>
import { SCALE, scaleOf } from '@/utils/evaluation'

export default {
  name: 'ScoreInput',

  props: {
    modelValue: { type: [Number, String], default: null },
    max: { type: Number, required: true },
    method: { type: String, default: 'points' },
    label: { type: String, default: '' }
  },

  emits: ['update:modelValue'],

  data() {
    return { SCALE }
  },

  computed: {
    invalid() {
      const v = Number(this.modelValue)
      return this.modelValue !== null && this.modelValue !== '' && (v < 0 || v > this.max)
    }
  },

  methods: {
    scaleOf,
    round: (v) => Math.round(v * 100) / 100,
    set(v) {
      this.$emit('update:modelValue', v === '' ? null : Number(v))
    },
    pick(pct) {
      this.$emit('update:modelValue', pct === '' ? null : this.round(Number(pct) * this.max))
    }
  }
}
</script>
