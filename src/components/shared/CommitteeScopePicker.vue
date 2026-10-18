<template>
  <!-- نطاق عضو لجنة الإشراف: حتى 5 تخصصات محددة، أو قسم كامل (كل تخصصاته الحالية والمستقبلية).
       v-model = { ids: [], dept: '' } — المرسَل للخادم specialization_ids / scope_department_id -->
  <div class="csp">
    <div class="mf-roles" role="radiogroup" aria-label="نطاق عضو اللجنة">
      <button v-for="m in modes" :key="m.value" type="button" role="radio" :aria-checked="mode === m.value" :class="['mf-role', mode === m.value && 'is-on']" @click="setMode(m.value)">
        <component :is="m.icon" :size="20" />
        <b>{{ m.label }}</b>
        <small>{{ m.hint }}</small>
      </button>
    </div>

    <SpecializationPicker
      v-if="mode === 'specs'" :model-value="modelValue.ids" multiple :max="MAX" :specializations="specializations"
      label="التخصصات التي ينتمي لها" :required="required" :allow-all="!required"
      hint="عضو اللجنة يرى المجموعات والمشاريع والمقترحات الخاصة بهذه التخصصات فقط"
      @update:model-value="$emit('update:modelValue', { ids: $event, dept: '' })"
    />

    <fieldset v-else class="spk">
      <legend class="spk-label">القسم <b v-if="required" class="spk-req">*</b></legend>
      <div class="spk-list" role="radiogroup" aria-label="القسم">
        <div class="spk-group">
          <button
            v-for="d in departments" :key="d.id" type="button" role="radio" :aria-checked="modelValue.dept === d.id"
            :class="['spk-opt', modelValue.dept === d.id && 'is-on']" @click="$emit('update:modelValue', { ids: [], dept: d.id })"
          >
            <span class="spk-name">{{ d.name }}</span>
            <span class="spk-degree is-bachelor">{{ d.count }} تخصصات</span>
            <span class="spk-tick" aria-hidden="true"><Check :size="13" /></span>
          </button>
        </div>
        <p v-if="!departments.length" class="spk-empty">لا توجد أقسام — أضفها من صفحة الأقسام والفصول الدراسية</p>
      </div>
      <small class="spk-hint">عضو اللجنة يرى كل تخصصات القسم، ومنها ما يُضاف للقسم لاحقًا</small>
    </fieldset>
  </div>
</template>

<script>
import { Check, ListChecks, Building2 } from 'lucide-vue-next'
import SpecializationPicker from '@/components/shared/SpecializationPicker.vue'

export default {
  name: 'CommitteeScopePicker',

  components: { Check, SpecializationPicker },

  props: {
    modelValue: { type: Object, default: () => ({ ids: [], dept: '' }) },
    specializations: { type: Array, default: () => [] },
    required: { type: Boolean, default: false }
  },

  emits: ['update:modelValue'],

  data() {
    return {
      MAX: 5,
      mode: this.modelValue.dept ? 'dept' : 'specs',
      modes: [
        { value: 'specs', label: 'تخصصات محددة', hint: 'حتى 5 تخصصات', icon: ListChecks },
        { value: 'dept', label: 'قسم كامل', hint: 'كل تخصصات القسم', icon: Building2 }
      ]
    }
  },

  computed: {
    /** الأقسام مستخرجة من التخصصات (كل تخصص يحمل قسمه) مع عدد تخصصات كل قسم */
    departments() {
      const map = new Map()
      this.specializations.forEach((s) => {
        if (!s.department_id) return
        const d = map.get(s.department_id) || { id: s.department_id, name: s.department?.name || 'بلا اسم', count: 0 }
        d.count++
        map.set(s.department_id, d)
      })
      return [...map.values()]
    }
  },

  methods: {
    setMode(mode) {
      if (mode === this.mode) return
      this.mode = mode
      this.$emit('update:modelValue', { ids: [], dept: '' })
    }
  }
}
</script>
