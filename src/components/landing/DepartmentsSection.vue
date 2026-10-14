<template>
  <!-- الأقسام والتخصصات بنمط قسم الإعلانات (195840): خلفية رمادية فاتحة وبطاقات بيضاء بعنوان أزرق -->
  <section id="departments" class="us-section is-gray scroll-mt-24">
    <div class="us-wrap">
      <h2 class="us-title reveal">الأقسام والتخصصات</h2>
      <p v-if="loading" class="us-empty">جارٍ التحميل…</p>
      <p v-else-if="!departments.length" class="us-empty">لا توجد أقسام بعد</p>
      <div v-else class="us-grid-2">
        <article v-for="department in departments" :key="department.id" class="us-card reveal">
          <h3>{{ department.name }}</h3>
          <ul>
            <li v-for="spec in department.specializations" :key="spec.id">
              {{ spec.name }} <small v-if="spec.degree">{{ DEGREE_LABELS[spec.degree] }}</small>
            </li>
          </ul>
        </article>
      </div>
    </div>
  </section>
</template>

<script>
import { mapState, mapActions } from 'pinia'
import { useLandingStore, DEGREE_LABELS } from '@/stores/landing.store'

export default {
  name: 'DepartmentsSection',

  data() {
    return { DEGREE_LABELS }
  },

  computed: {
    ...mapState(useLandingStore, ['departments', 'departmentsLoading']),
    loading() {
      return this.departmentsLoading && !this.departments.length
    }
  },

  created() {
    if (!this.departments.length) this.fetchDepartments()
  },

  methods: {
    ...mapActions(useLandingStore, ['fetchDepartments'])
  }
}
</script>
