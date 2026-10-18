<template>
  <!-- اختيار التخصص داخل النماذج: مجموعات حسب القسم، وكل تخصص بطاقة باسمه ودرجته (يميّز التخصصات المتشابهة بالاسم)،
       بحث سريع عند كثرة التخصصات، وخيار "كل التخصصات" اختياري. multiple: اختيار عدة تخصصات (حتى max) -->
  <fieldset class="spk">
    <legend class="spk-label">{{ label }} <b v-if="required" class="spk-req">*</b><small v-if="multiple && max" class="spk-count">({{ selected.length }} من {{ max }})</small></legend>

    <label v-if="specializations.length > 6" class="spk-search">
      <Search :size="15" />
      <input v-model.trim="q" type="search" placeholder="ابحث عن تخصص…">
    </label>

    <div class="spk-list" :role="multiple ? 'group' : 'radiogroup'" :aria-label="label">
      <button v-if="allowAll" type="button" :role="optRole" :aria-checked="!selected.length" :class="['spk-opt is-all', !selected.length && 'is-on']" @click="$emit('update:modelValue', multiple ? [] : '')">
        <span class="spk-name">كل التخصصات</span>
        <span class="spk-tick" aria-hidden="true"><Check :size="13" /></span>
      </button>

      <div v-for="g in groups" :key="g.name" class="spk-group">
        <span class="spk-dept">{{ g.name }}</span>
        <button
          v-for="s in g.items" :key="s.id" type="button" :role="optRole" :aria-checked="selected.includes(s.id)"
          :disabled="atMax && !selected.includes(s.id)"
          :class="['spk-opt', selected.includes(s.id) && 'is-on']" @click="pick(s.id)"
        >
          <span class="spk-name">{{ s.name }}</span>
          <span :class="['spk-degree', `is-${s.degree}`]">{{ DEGREE_LABELS[s.degree] || s.degree }}</span>
          <span class="spk-tick" aria-hidden="true"><Check :size="13" /></span>
        </button>
      </div>

      <p v-if="!groups.length" class="spk-empty">{{ specializations.length ? 'لا يوجد تخصص مطابق' : 'لا توجد تخصصات — أضفها من صفحة الأقسام والفصول الدراسية' }}</p>
    </div>
    <small v-if="atMax" class="spk-hint is-max">وصلت للحد الأقصى ({{ max }} تخصصات) — ألغِ تخصصًا لاختيار غيره، أو اختر القسم كاملًا</small>
    <small v-else-if="hint" class="spk-hint">{{ hint }}</small>
  </fieldset>
</template>

<script>
import { Search, Check } from 'lucide-vue-next'
import { DEGREE_LABELS } from '@/stores/landing.store'

export default {
  name: 'SpecializationPicker',

  components: { Search, Check },

  props: {
    /** معرّف واحد، أو مصفوفة معرّفات مع multiple */
    modelValue: { type: [Number, String, Array], default: '' },
    /** عناصر GET /specializations (فيها department و degree) */
    specializations: { type: Array, default: () => [] },
    label: { type: String, default: 'التخصص' },
    required: { type: Boolean, default: false },
    allowAll: { type: Boolean, default: false },
    multiple: { type: Boolean, default: false },
    /** أقصى عدد مع multiple (0 = بلا حد) */
    max: { type: Number, default: 0 },
    hint: { type: String, default: '' }
  },

  emits: ['update:modelValue'],

  data() {
    return { q: '', DEGREE_LABELS }
  },

  computed: {
    selected() {
      if (this.multiple) return this.modelValue || []
      return this.modelValue ? [this.modelValue] : []
    },

    atMax() {
      return this.multiple && this.max > 0 && this.selected.length >= this.max
    },

    optRole() {
      return this.multiple ? 'checkbox' : 'radio'
    },

    groups() {
      const map = new Map()
      this.specializations
        .filter((s) => !this.q || s.name.includes(this.q) || (s.department?.name || '').includes(this.q))
        .forEach((s) => {
          const name = s.department?.name || 'بلا قسم'
          if (!map.has(name)) map.set(name, { name, items: [] })
          map.get(name).items.push(s)
        })
      return [...map.values()]
    }
  },

  methods: {
    pick(id) {
      if (!this.multiple) return this.$emit('update:modelValue', id)
      this.$emit('update:modelValue', this.selected.includes(id) ? this.selected.filter((x) => x !== id) : [...this.selected, id])
    }
  }
}
</script>
