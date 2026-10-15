<template>
  <!-- الأقسام والتخصصات بنمط قسم الإعلانات (195840): خلفية رمادية فاتحة وبطاقات بيضاء بعنوان أزرق.
       الحركة (GSAP): العنوان كلمة كلمة، البطاقات تنكشف من الأعلى قادمة من جانبيها، ثم التخصصات تتوالى -->
  <section id="departments" ref="root" class="us-section is-gray scroll-mt-24">
    <div class="us-wrap">
      <h2 class="us-title">الأقسام والتخصصات</h2>
      <p v-if="loading" class="us-empty">جارٍ التحميل…</p>
      <p v-else-if="!departments.length" class="us-empty">لا توجد أقسام بعد</p>
      <div v-else class="us-grid-2">
        <article v-for="department in departments" :key="department.id" class="us-card">
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
import { ref } from 'vue'
import { mapState, mapActions } from 'pinia'
import { useLandingStore, DEGREE_LABELS } from '@/stores/landing.store'
import { gsap, titleIn, useScrollMotion } from '@/composables/useScrollMotion'

export default {
  name: 'DepartmentsSection',

  setup() {
    const root = ref(null)
    const store = useLandingStore()
    // تُبنى الحركة بعد وصول الأقسام من الخادم
    useScrollMotion(root, (el) => {
      const tl = gsap.timeline({ scrollTrigger: { trigger: el, start: 'top 72%' } })
      titleIn(tl, el.querySelector('.us-title'))
      el.querySelectorAll('.us-card').forEach((card, i) => {
        tl.from(card, { x: i % 2 ? -60 : 60, autoAlpha: 0, clipPath: 'inset(0 0 100% 0)', duration: 0.9, ease: 'power3.out' }, i ? '<0.15' : '-=0.5')
          .from(card.querySelectorAll('li'), { x: 20, autoAlpha: 0, duration: 0.45, ease: 'power2.out', stagger: 0.06 }, '<0.35')
      })
    }, () => store.departments.length)
    return { root }
  },

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
