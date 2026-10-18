<template>
  <!-- اختيار التخصص داخل النماذج: مجموعات حسب القسم، وكل تخصص بطاقة باسمه ودرجته (يميّز التخصصات المتشابهة بالاسم)،
       بحث سريع عند كثرة التخصصات، وخيار "كل التخصصات" اختياري -->
  <fieldset class="spk">
    <legend class="spk-label">{{ label }} <b v-if="required" class="spk-req">*</b></legend>

    <label v-if="specializations.length > 6" class="spk-search">
      <Search :size="15" />
      <input v-model.trim="q" type="search" placeholder="ابحث عن تخصص…">
    </label>

    <div class="spk-list" role="radiogroup" :aria-label="label">
      <button v-if="allowAll && !multiple" type="button" role="radio" :aria-checked="!modelValue" :class="['spk-opt is-all', !modelValue && 'is-on']" @click="$emit('update:modelValue', '')">
        <span class="spk-name">كل التخصصات</span>
        <span class="spk-tick" aria-hidden="true"><Check :size="13" /></span>
      </button>

      <div v-for="g in groups" :key="g.name" class="spk-group">
        <span class="spk-dept">{{ g.name }}</span>
        <button
          v-for="s in g.items" :key="s.id" type="button" :role="multiple ? 'checkbox' : 'radio'" :aria-checked="isPicked(s.id)"
          :class="['spk-opt', isPicked(s.id) && 'is-on']" @click="pick(s.id)"
        >
          <span class="spk-name">{{ s.name }}</span>
          <span :class="['spk-degree', `is-${s.degree}`]">{{ DEGREE_LABELS[s.degree] || s.degree }}</span>
          <span class="spk-tick" aria-hidden="true"><Check :size="13" /></span>
        </button>
      </div>

      <p v-if="!groups.length" class="spk-empty">{{ specializations.length ? 'لا يوجد تخصص مطابق' : 'لا توجد تخصصات — أضفها من صفحة الأقسام والفصول الدراسية' }}</p>
    </div>
    <small v-if="hint" class="spk-hint">{{ hint }}</small>
  </fieldset>
</template>

<script>
import { Search, Check } from 'lucide-vue-next'
import { DEGREE_LABELS } from '@/stores/landing.store'

export default {
  name: 'SpecializationPicker',

  components: { Search, Check },

  props: {
    modelValue: { type: [Number, String, Array], default: '' },
    /** عناصر GET /specializations (فيها department و degree) */
    specializations: { type: Array, default: () => [] },
    label: { type: String, default: 'التخصص' },
    required: { type: Boolean, default: false },
    allowAll: { type: Boolean, default: false },
    hint: { type: String, default: '' },
    /** اختيار متعدّد (حتى `max` تخصصات) — modelValue مصفوفة */
    multiple: { type: Boolean, default: false },
    max: { type: Number, default: 2 }
  },

  emits: ['update:modelValue'],

  data() {
    return { q: '', DEGREE_LABELS }
  },

  methods: {
    isPicked(id) {
      return this.multiple ? (this.modelValue || []).includes(id) : this.modelValue === id
    },
    pick(id) {
      if (!this.multiple) {
        this.$emit('update:modelValue', id)
        return
      }
      const cur = [...(this.modelValue || [])]
      const at = cur.indexOf(id)
      if (at > -1) cur.splice(at, 1)
      else cur.push(id)
      this.$emit('update:modelValue', cur.slice(-this.max))
    }
  },

  computed: {
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
  }
}
</script>
