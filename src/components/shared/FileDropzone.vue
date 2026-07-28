<template>
  <div>
    <label v-if="label" class="block mb-2 text-label font-semibold text-text-700">{{ label }}</label>

    <div
      :class="[
        'flex flex-col items-center justify-center gap-2 px-6 py-8 rounded-md border-2 border-dashed text-center cursor-pointer transition-colors duration-fast',
        isDragging ? 'border-primary-600 bg-primary-50' : 'border-border hover:border-primary-100 hover:bg-border-soft/50',
        error && 'border-error'
      ]"
      role="button"
      tabindex="0"
      @click="$refs.fileInput.click()"
      @keydown.enter="$refs.fileInput.click()"
      @dragover.prevent="isDragging = true"
      @dragleave.prevent="isDragging = false"
      @drop.prevent="handleDrop"
    >
      <UploadCloud :size="28" class="text-text-400" />
      <p class="text-body-sm text-text-700 font-medium">اسحبي الملف هنا أو اضغطي للاختيار</p>
      <p class="text-label text-text-400">{{ hint }}</p>

      <input
        ref="fileInput"
        type="file"
        class="hidden"
        :accept="accept"
        :multiple="multiple"
        @change="handleSelect"
      >
    </div>

    <ul v-if="files.length" class="mt-3 space-y-2">
      <li
        v-for="(file, index) in files"
        :key="index"
        class="flex items-center gap-3 px-3 py-2 rounded-sm border border-border bg-surface"
      >
        <FileText :size="18" class="text-primary-600 shrink-0" />
        <span class="flex-1 min-w-0 text-body-sm text-text-700 truncate">{{ file.name }}</span>
        <span class="text-label text-text-400 shrink-0">{{ formatFileSize(file.size) }}</span>
        <button type="button" class="text-text-400 hover:text-error transition-colors duration-fast" aria-label="إزالة الملف" @click="removeFile(index)">
          <X :size="16" />
        </button>
      </li>
    </ul>

    <p v-if="error" class="mt-1.5 text-label text-error">{{ error }}</p>
  </div>
</template>

<script>
import { UploadCloud, FileText, X } from 'lucide-vue-next'
import { formatFileSize } from '@/utils/formatters'

export default {
  name: 'FileDropzone',

  components: { UploadCloud, FileText, X },

  props: {
    label: { type: String, default: '' },
    accept: { type: String, default: '' },
    multiple: { type: Boolean, default: false },
    maxSizeMb: { type: Number, default: 10 },
    hint: { type: String, default: 'PDF, DOCX — بحد أقصى 10 ميجابايت' },
    error: { type: String, default: '' }
  },

  emits: ['change'],

  data() {
    return { isDragging: false, files: [] }
  },

  methods: {
    formatFileSize,

    handleSelect(event) {
      this.addFiles(Array.from(event.target.files || []))
    },

    handleDrop(event) {
      this.isDragging = false
      this.addFiles(Array.from(event.dataTransfer.files || []))
    },

    addFiles(incoming) {
      const maxBytes = this.maxSizeMb * 1024 * 1024
      const valid = incoming.filter((file) => {
        if (file.size > maxBytes) {
          this.$toast?.error(`حجم الملف ${file.name} يتجاوز ${this.maxSizeMb} ميجابايت`)
          return false
        }
        return true
      })
      this.files = this.multiple ? [...this.files, ...valid] : valid.slice(0, 1)
      this.$emit('change', this.multiple ? this.files : this.files[0] || null)
    },

    removeFile(index) {
      this.files.splice(index, 1)
      this.$emit('change', this.multiple ? this.files : null)
    },

    reset() {
      this.files = []
      if (this.$refs.fileInput) this.$refs.fileInput.value = ''
    }
  }
}
</script>
