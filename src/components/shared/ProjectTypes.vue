<template>
  <!-- نوع المشروع: رقائق للعرض + تعديل في المكان (اختيار متعدد) عبر PATCH /projects/{id} — لكل الأدوار -->
  <div class="ptypes">
    <template v-if="!editing">
      <span v-for="t in types" :key="t" class="ptypes-chip">{{ t }}</span>
      <span v-if="!types.length" class="ptypes-empty">لم يُحدَّد نوع المشروع</span>
      <button v-if="editable && projectId" type="button" class="ptypes-edit" :title="types.length ? 'تعديل نوع المشروع' : 'تحديد نوع المشروع'" @click.stop="start">
        <Pencil :size="13" /> {{ types.length ? 'تعديل' : 'تحديد النوع' }}
      </button>
    </template>

    <div v-else class="ptypes-panel" @click.stop>
      <div class="ptypes-options" role="group" aria-label="نوع المشروع">
        <button
          v-for="t in options" :key="t" type="button"
          :class="['ptypes-opt', draft.includes(t) && 'is-on']" :aria-pressed="draft.includes(t)"
          :disabled="!draft.includes(t) && draft.length >= MAX" @click="toggle(t)"
        >
          <Check v-if="draft.includes(t)" :size="13" /> {{ t }}
        </button>
      </div>
      <div class="ptypes-actions">
        <small>{{ draft.length }} / {{ MAX }} — يمكن اختيار أكثر من نوع</small>
        <button type="button" class="ptypes-btn" :disabled="saving" @click="editing = false">إلغاء</button>
        <button type="button" class="ptypes-btn is-save" :disabled="saving" @click="save">{{ saving ? 'جارٍ الحفظ…' : 'حفظ' }}</button>
      </div>
    </div>
  </div>
</template>

<script>
import { Check, Pencil } from 'lucide-vue-next'
import api from '@/services/api'
import { PROJECT_TYPES } from '@/utils/constants'

export default {
  name: 'ProjectTypes',

  components: { Check, Pencil },

  props: {
    projectId: { type: [Number, String], default: null },
    types: { type: Array, default: () => [] },
    editable: { type: Boolean, default: true }
  },

  emits: ['saved'],

  data() {
    return { MAX: 6, editing: false, saving: false, draft: [] }
  },

  computed: {
    // أنواع قديمة خارج القائمة تبقى ظاهرة قابلة للإلغاء
    options() {
      return [...new Set([...PROJECT_TYPES, ...this.types])]
    }
  },

  methods: {
    start() {
      this.draft = [...this.types]
      this.editing = true
    },

    toggle(t) {
      this.draft = this.draft.includes(t) ? this.draft.filter((x) => x !== t) : [...this.draft, t]
    },

    async save() {
      this.saving = true
      try {
        const { data } = await api.patch(`/projects/${this.projectId}`, { types: this.draft })
        this.$emit('saved', data.types || this.draft)
        this.editing = false
        this.$toast?.success('تم حفظ نوع المشروع')
      } catch (err) {
        this.$toast?.error(err.normalized?.message || 'تعذّر حفظ نوع المشروع')
      } finally {
        this.saving = false
      }
    }
  }
}
</script>

<style scoped>
.ptypes { display: flex; flex-wrap: wrap; align-items: center; gap: 6px; }
.ptypes-chip { padding: 3px 10px; border-radius: 4px; background: color-mix(in srgb, var(--portal-cyan, #35B8E0) 12%, var(--color-surface)); color: var(--color-text-900); font-size: 12.5px; font-weight: 700; }
.ptypes-empty { font-size: 12.5px; color: var(--color-text-400); }
.ptypes-edit { display: inline-flex; align-items: center; gap: 4px; padding: 3px 8px; border: 1px dashed var(--portal-cyan, #35B8E0); border-radius: 4px; color: var(--portal-cyan, #35B8E0); font-size: 12.5px; font-weight: 700; }
.ptypes-edit:hover { background: color-mix(in srgb, var(--portal-cyan, #35B8E0) 8%, transparent); }
.ptypes-panel { width: 100%; padding: 12px; border: 1px solid var(--color-border); border-radius: 4px; background: var(--color-surface); }
.ptypes-options { display: flex; flex-wrap: wrap; gap: 6px; }
.ptypes-opt { display: inline-flex; align-items: center; gap: 4px; padding: 5px 12px; border: 1px solid var(--color-border); border-radius: 4px; font-size: 13px; font-weight: 600; color: var(--color-text-700); transition: background-color .2s, border-color .2s; }
.ptypes-opt:hover:not(:disabled) { border-color: var(--portal-cyan, #35B8E0); }
.ptypes-opt.is-on { border-color: var(--portal-cyan, #35B8E0); background: var(--portal-cyan, #35B8E0); color: #FFFFFF; }
.ptypes-opt:disabled { opacity: .45; cursor: not-allowed; }
.ptypes-actions { display: flex; flex-wrap: wrap; align-items: center; gap: 8px; margin-top: 10px; }
.ptypes-actions small { margin-inline-end: auto; font-size: 12px; color: var(--color-text-400); }
.ptypes-btn { height: 32px; padding: 0 14px; border: 1px solid var(--portal-cyan, #35B8E0); border-radius: 4px; color: var(--portal-cyan, #35B8E0); font-size: 13px; font-weight: 700; }
.ptypes-btn.is-save { background: #10C469; border-color: #10C469; color: #FFFFFF; }
.ptypes-btn:disabled { opacity: .6; }
</style>
