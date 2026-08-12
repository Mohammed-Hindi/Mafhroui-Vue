<template>
  <BaseSelect
    :model-value="activeSemesterId"
    :options="semesterOptions"
    :placeholder="selectPlaceholder"
    :disabled="semestersLoading || !semesters.length"
    class="w-full sm:w-[220px]"
    @update:model-value="onChange"
  />
</template>

<script>
import { mapState, mapActions } from 'pinia'
import { useUiStore } from '@/stores/ui.store'
import BaseSelect from '@/components/ui/BaseSelect.vue'

export default {
  name: 'SemesterSelect',

  components: { BaseSelect },

  emits: ['change'],

  computed: {
    ...mapState(useUiStore, ['semesters', 'activeSemesterId', 'semestersLoading']),

    semesterOptions() {
      return this.semesters.map((semester) => ({ value: semester.id, label: semester.name }))
    },

    selectPlaceholder() {
      if (this.semestersLoading) return 'جارٍ التحميل…'
      if (!this.semesters.length) return 'لا توجد فصول'
      return 'اختاري الفصل'
    }
  },

  created() {
    if (!this.semesters.length) {
      this.fetchSemesters().catch(() => {})
    }
  },

  methods: {
    ...mapActions(useUiStore, ['fetchSemesters', 'setActiveSemester']),

    onChange(value) {
      if (value === this.activeSemesterId) return
      this.setActiveSemester(value)
      this.$emit('change', value)
      // كل بيانات الصفحات مرتبطة بـ term_id عبر الباك إند — إعادة تحميل كاملة أبسط وأضمن طريقة لتحديثها كلها دفعة وحدة
      window.location.reload()
    }
  }
}
</script>
