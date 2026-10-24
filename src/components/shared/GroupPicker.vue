<template>
  <!-- اختيار مجموعات بفلاتر (التخصص، الدرجة، طلاب/طالبات، مكان التواجد، المشرف) — v-model = مصفوفة معرّفات المجموعات -->
  <div class="gp">
    <div class="gp-filters">
      <label class="gr-search">
        <Search :size="16" />
        <input v-model.trim="q" type="search" :placeholder="isSup ? 'بحث بالمجموعة أو الشعبة…' : 'بحث بالمجموعة أو الشعبة أو المشرف…'">
      </label>
      <BaseSelect v-model="f.spec" class="tk-filter" placeholder="كل التخصصات" include-placeholder-option :options="specs" />
      <!-- المشرف: فلتر التخصص وطلاب/طالبات فقط -->
      <BaseSelect v-if="!isSup" v-model="f.degree" class="tk-filter" placeholder="كل الدرجات" include-placeholder-option :options="degreeOptions" />
      <BaseSelect v-model="f.gender" class="tk-filter" placeholder="طلاب وطالبات" include-placeholder-option :options="genderOptions" />
      <BaseSelect v-if="!isSup" v-model="f.region" class="tk-filter" placeholder="كل المناطق" include-placeholder-option :options="regionOptions" />
      <BaseSelect v-if="!isSup" v-model="f.sup" class="tk-filter" placeholder="كل المشرفين" include-placeholder-option :options="sups" />
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
import BaseSelect from '@/components/ui/BaseSelect.vue'
import { DEGREES, REGIONS } from '@/utils/progressData'
import { useAuthStore } from '@/stores/auth.store'
import { useTeamsStore } from '@/stores/teams.store'

export default {
  name: 'GroupPicker',

  components: { BaseSelect, Search },

  props: {
    groups: { type: Array, required: true },
    modelValue: { type: Array, default: () => [] }
  },

  emits: ['update:modelValue'],

  data() {
    return { q: '', f: { spec: '', degree: '', gender: '', region: '', sup: '' } }
  },

  computed: {
    isSup() {
      return useAuthStore().userRole === 'supervisor'
    },

    /** التخصصات من دليل الهيكل الأكاديمي حتى تظهر الإضافات الجديدة، وإلا تخصصات المجموعات المعروضة */
    specs() {
      const catalog = useTeamsStore().specializationFilterOptions.map((o) => o.value)
      return catalog.length ? catalog : [...new Set(this.groups.map((g) => g.spec).filter(Boolean))]
    },
    sups() {
      return [...new Set(this.groups.map((g) => g.sup.name).filter(Boolean))]
    },
    degreeOptions() {
      return Object.entries(DEGREES).map(([value, label]) => ({ value, label }))
    },
    regionOptions() {
      return Object.entries(REGIONS).map(([value, label]) => ({ value, label }))
    },
    genderOptions() {
      return [{ value: 'male', label: 'طلاب' }, { value: 'female', label: 'طالبات' }]
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

  created() {
    useTeamsStore().fetchOrgCatalog().catch(() => {})
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
