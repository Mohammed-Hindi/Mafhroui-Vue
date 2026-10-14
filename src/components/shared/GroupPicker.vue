<template>
  <!-- اختيار مجموعات بفلاتر (التخصص، الدرجة، طلاب/طالبات، مكان التواجد، المشرف) — v-model = مصفوفة معرّفات المجموعات -->
  <div class="gp">
    <div class="gp-filters">
      <label class="gr-search">
        <Search :size="16" />
        <input v-model.trim="q" type="search" placeholder="بحث بالمجموعة أو الشعبة أو المشرف…">
      </label>
      <select v-model="f.spec" class="gr-select" aria-label="التخصص">
        <option value="">كل التخصصات</option>
        <option v-for="s in specs" :key="s" :value="s">{{ s }}</option>
      </select>
      <select v-model="f.degree" class="gr-select" aria-label="الدرجة">
        <option value="">كل الدرجات</option>
        <option v-for="(l, k) in DEGREES" :key="k" :value="k">{{ l }}</option>
      </select>
      <select v-model="f.gender" class="gr-select" aria-label="طلاب / طالبات">
        <option value="">طلاب وطالبات</option>
        <option value="male">طلاب</option>
        <option value="female">طالبات</option>
      </select>
      <select v-model="f.region" class="gr-select" aria-label="مكان التواجد">
        <option value="">كل المناطق</option>
        <option v-for="(l, k) in REGIONS" :key="k" :value="k">{{ l }}</option>
      </select>
      <select v-model="f.sup" class="gr-select" aria-label="المشرف">
        <option value="">كل المشرفين</option>
        <option v-for="s in sups" :key="s" :value="s">{{ s }}</option>
      </select>
    </div>

    <div class="gp-bar">
      <label class="gp-check">
        <input type="checkbox" :checked="allVisibleSelected" :indeterminate.prop="someVisibleSelected" @change="toggleVisible">
        تحديد الظاهر ({{ visible.length }})
      </label>
      <span class="pt-muted">المحدّد: <b>{{ modelValue.length }}</b> مجموعة · {{ selectedStudents }} طالبًا</span>
    </div>

    <ul class="gp-list">
      <li v-for="g in visible" :key="g.id">
        <label :class="['gp-item', modelValue.includes(g.id) && 'is-on']">
          <input type="checkbox" :checked="modelValue.includes(g.id)" @change="toggle(g.id)">
          <span class="gp-item-main">
            <b>{{ g.name }}</b>
            <span class="pt-muted">{{ g.section ? 'شعبة ' + g.section + ' · ' : '' }}{{ g.sup.name }} · {{ g.spec }}</span>
          </span>
          <span class="pt-muted">{{ g.members.length }} طلاب</span>
        </label>
      </li>
      <li v-if="!visible.length" class="gr-empty">لا توجد مجموعات مطابقة</li>
    </ul>
  </div>
</template>

<script>
import { Search } from 'lucide-vue-next'
import { DEGREES, REGIONS } from '@/utils/progressData'

export default {
  name: 'GroupPicker',

  components: { Search },

  props: {
    groups: { type: Array, required: true },
    modelValue: { type: Array, default: () => [] }
  },

  emits: ['update:modelValue'],

  data() {
    return { DEGREES, REGIONS, q: '', f: { spec: '', degree: '', gender: '', region: '', sup: '' } }
  },

  computed: {
    specs() {
      return [...new Set(this.groups.map((g) => g.spec).filter(Boolean))]
    },
    sups() {
      return [...new Set(this.groups.map((g) => g.sup.name).filter(Boolean))]
    },
    visible() {
      const { q, f } = this
      return this.groups.filter((g) =>
        (!q || `${g.name} ${g.section} ${g.sup.name}`.includes(q)) &&
        (!f.spec || g.spec === f.spec) &&
        (!f.degree || g.degree === f.degree) &&
        (!f.sup || g.sup.name === f.sup) &&
        (!f.gender || g.members.some((m) => m.gender === f.gender)) &&
        (!f.region || g.members.some((m) => m.region === f.region))
      )
    },
    allVisibleSelected() {
      return this.visible.length > 0 && this.visible.every((g) => this.modelValue.includes(g.id))
    },
    someVisibleSelected() {
      return !this.allVisibleSelected && this.visible.some((g) => this.modelValue.includes(g.id))
    },
    selectedStudents() {
      return this.groups.filter((g) => this.modelValue.includes(g.id)).reduce((n, g) => n + g.members.length, 0)
    }
  },

  methods: {
    toggle(id) {
      const set = new Set(this.modelValue)
      set.has(id) ? set.delete(id) : set.add(id)
      this.$emit('update:modelValue', [...set])
    },
    toggleVisible() {
      const ids = this.visible.map((g) => g.id)
      const next = this.allVisibleSelected
        ? this.modelValue.filter((id) => !ids.includes(id))
        : [...new Set([...this.modelValue, ...ids])]
      this.$emit('update:modelValue', next)
    }
  }
}
</script>
