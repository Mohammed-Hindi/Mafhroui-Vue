<template>
  <div class="w-full">
    <label v-if="label" :for="areaId" class="block mb-2 text-label font-semibold text-text-700">{{ label }}</label>

    <textarea
      :id="areaId"
      ref="area"
      :value="modelValue"
      :rows="rows"
      :placeholder="placeholder"
      class="w-full px-3 py-2.5 rounded-sm border border-border bg-surface text-body text-text-900 resize-y transition-colors duration-fast focus:border-primary-600"
      @keydown.enter.prevent="insertClause"
      @input="handleInput"
      @focus="handleFocus"
    />

    <p class="mt-1.5 text-label text-text-400">اضغطي Enter أو مسافتين لبدء بند جديد تلقائيًا.</p>
  </div>
</template>

<script>
let uid = 0

export default {
  name: 'ClauseTextarea',

  props: {
    modelValue: { type: String, default: '' },
    label: { type: String, default: '' },
    placeholder: { type: String, default: '' },
    rows: { type: Number, default: 4 }
  },

  emits: ['update:modelValue'],

  data() {
    uid += 1
    return { areaId: `clause-textarea-${uid}` }
  },

  methods: {
    nextClauseLabel(text) {
      const matches = text.match(/^بند \d+:/gm) || []
      return `بند ${matches.length + 1}: `
    },

    focusEnd() {
      const el = this.$refs.area
      if (!el) return
      el.focus()
      const end = el.value.length
      el.setSelectionRange(end, end)
    },

    handleFocus() {
      if (!this.modelValue) {
        this.$emit('update:modelValue', this.nextClauseLabel(''))
        this.$nextTick(this.focusEnd)
      }
    },

    insertClause() {
      const base = this.modelValue.endsWith('\n') || !this.modelValue ? this.modelValue : `${this.modelValue}\n`
      this.$emit('update:modelValue', base + this.nextClauseLabel(base))
      this.$nextTick(this.focusEnd)
    },

    handleInput(event) {
      const value = event.target.value
      if (value.endsWith('  ') && !value.slice(0, -2).endsWith('\n')) {
        const trimmed = value.slice(0, -2)
        const base = `${trimmed}\n`
        this.$emit('update:modelValue', base + this.nextClauseLabel(base))
        this.$nextTick(this.focusEnd)
        return
      }
      this.$emit('update:modelValue', value)
    }
  }
}
</script>
