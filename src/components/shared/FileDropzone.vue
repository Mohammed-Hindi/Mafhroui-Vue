<template>
  <!-- رفع ملفات بالسحب والإفلات أو الاختيار — v-model = مصفوفة File، مع التحقق من النوع والحجم قبل القبول -->
  <div class="fz">
    <label
      v-if="multiple || !modelValue.length"
      :class="['fz-drop', over && 'is-over']"
      @dragover.prevent="over = true" @dragleave="over = false" @drop.prevent="onDrop"
    >
      <UploadCloud :size="28" :stroke-width="1.5" />
      <b>اسحب الملفات وأفلتها هنا أو <u>تصفّح</u></b>
      <span>PDF، Word، PowerPoint، Excel، صور، ZIP أو RAR — حتى {{ maxMb }}MB للملف<template v-if="multiple"> · بحد أقصى {{ max }} ملفات</template></span>
      <input type="file" :accept="accept" :multiple="multiple" hidden @change="onPick">
    </label>

    <ul v-if="modelValue.length" class="fz-list">
      <li v-for="(f, i) in modelValue" :key="f.name + f.size">
        <span :class="['fz-ext', `is-${kind(f.name)}`]">{{ ext(f.name) }}</span>
        <span class="fz-meta"><b :title="f.name">{{ f.name }}</b><small>{{ formatFileSize(f.size) }}</small></span>
        <button type="button" class="as-file-x" :aria-label="`إزالة ${f.name}`" @click="remove(i)"><X :size="16" /></button>
      </li>
    </ul>

    <p v-for="e in errors" :key="e" class="fz-error">{{ e }}</p>
  </div>
</template>

<script>
import { UploadCloud, X } from 'lucide-vue-next'
import { formatFileSize } from '@/utils/formatters'

// نفس قائمة الخادم (AllowedDocumentTypes::MIMES)
const EXTS = ['pdf', 'doc', 'docx', 'ppt', 'pptx', 'xls', 'xlsx', 'zip', 'rar', 'png', 'jpg', 'jpeg']
const KINDS = { pdf: 'pdf', doc: 'doc', docx: 'doc', ppt: 'ppt', pptx: 'ppt', xls: 'xls', xlsx: 'xls', png: 'img', jpg: 'img', jpeg: 'img' }

export default {
  name: 'FileDropzone',

  components: { UploadCloud, X },

  props: {
    modelValue: { type: Array, default: () => [] },
    multiple: { type: Boolean, default: false },
    max: { type: Number, default: 5 },
    maxMb: { type: Number, default: 10 }
  },

  emits: ['update:modelValue'],

  data() {
    return { over: false, errors: [], accept: EXTS.map((e) => `.${e}`).join(',') }
  },

  methods: {
    formatFileSize,
    ext: (name) => name.split('.').pop().toLowerCase(),
    kind(name) {
      return KINDS[this.ext(name)] || 'zip'
    },

    onPick(e) {
      this.add([...e.target.files])
      e.target.value = ''
    },

    onDrop(e) {
      this.over = false
      this.add([...e.dataTransfer.files])
    },

    add(files) {
      this.errors = []
      const ok = files.filter((f) => {
        if (!EXTS.includes(this.ext(f.name))) return this.errors.push(`«${f.name}»: نوع غير مدعوم`) && false
        if (f.size > this.maxMb * 1024 * 1024) return this.errors.push(`«${f.name}»: أكبر من ${this.maxMb}MB`) && false
        return !this.modelValue.some((x) => x.name === f.name && x.size === f.size)
      })
      if (!this.multiple) return ok.length && this.$emit('update:modelValue', [ok[0]])
      const room = this.max - this.modelValue.length
      if (ok.length > room) this.errors.push(`الحد الأقصى ${this.max} ملفات`)
      this.$emit('update:modelValue', [...this.modelValue, ...ok.slice(0, Math.max(room, 0))])
    },

    remove(i) {
      this.errors = []
      this.$emit('update:modelValue', this.modelValue.filter((_, k) => k !== i))
    }
  }
}
</script>
