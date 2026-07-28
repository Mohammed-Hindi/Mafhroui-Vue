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
      // TODO API — GET /semesters | response: [{ id, name, is_active }]
      this.fetchSemesters().catch(() => {})
    }
  },

  methods: {
    ...mapActions(useUiStore, ['fetchSemesters', 'setActiveSemester']),

    onChange(value) {
      this.setActiveSemester(value)
      this.$emit('change', value)
      // تغيير الفصل يعيد تحميل بيانات الصفحة الحالية
      this.$router.replace({ query: { ...this.$route.query, _s: value } })
    }
  }
}
</script>
