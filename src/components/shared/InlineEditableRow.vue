<template>
  <div class="flex items-center gap-2">
    <template v-if="isEditing">
      <input
        ref="input"
        v-model="draft"
        class="flex-1 min-w-0 h-9 px-2 rounded-sm border border-primary-600 bg-surface text-body-sm text-text-900"
        @keydown.enter="save"
        @keydown.esc="cancel"
      >
      <button type="button" class="text-success hover:opacity-80 transition-opacity duration-fast" aria-label="حفظ" @click="save">
        <Check :size="17" />
      </button>
      <button type="button" class="text-text-400 hover:text-error transition-colors duration-fast" aria-label="إلغاء" @click="cancel">
        <X :size="17" />
      </button>
    </template>

    <template v-else>
      <span class="flex-1 min-w-0 text-body-sm text-text-700 truncate">{{ modelValue || '—' }}</span>
      <button type="button" class="text-text-400 hover:text-primary-600 transition-colors duration-fast" aria-label="تعديل" @click="startEditing">
        <Pencil :size="15" />
      </button>
    </template>
  </div>
</template>

<script>
import { Pencil, Check, X } from 'lucide-vue-next'

export default {
  name: 'InlineEditableRow',

  components: { Pencil, Check, X },

  props: {
    modelValue: { type: [String, Number], default: '' }
  },

  emits: ['update:modelValue', 'save'],

  data() {
    return { isEditing: false, draft: '' }
  },

  methods: {
    startEditing() {
      this.draft = this.modelValue
      this.isEditing = true
      this.$nextTick(() => this.$refs.input?.focus())
    },
    save() {
      this.$emit('update:modelValue', this.draft)
      this.$emit('save', this.draft)
      this.isEditing = false
    },
    cancel() {
      this.isEditing = false
      this.draft = ''
    }
  }
}
</script>
