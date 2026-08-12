<template>
  <section class="relative overflow-hidden py-14 sm:py-20 bg-surface border-y border-border-soft">
    <span aria-hidden="true" data-parallax="0.09" class="animate-blob pointer-events-none absolute rounded-pill w-[260px] h-[260px] bg-accent-500/[0.06] -top-20 -end-20" style="animation-delay:3.5s" />
    <span aria-hidden="true" data-parallax="-0.07" class="animate-blob pointer-events-none absolute rounded-pill w-[200px] h-[200px] bg-primary-500/[0.05] bottom-0 -start-16" style="animation-delay:1s" />
    <div class="relative max-w-content mx-auto px-6">
      <div class="reveal text-center max-w-[640px] mx-auto mb-11">
        <span class="inline-block px-4 py-1.5 rounded-pill bg-primary-50 text-primary-700 text-label font-bold mb-3.5">
          الأقسام والتخصصات
        </span>
        <h2 class="font-cairo font-extrabold text-sec-title-sm sm:text-sec-title text-text-900">
          تخصصات العمادة
        </h2>
      </div>

      <div v-if="loading" class="grid lg:grid-cols-2 gap-6">
        <div v-for="n in 2" :key="n" class="h-40 rounded-lg bg-border-soft animate-pulse" />
      </div>

      <div v-else class="grid lg:grid-cols-2 gap-6">
        <article
          v-for="(department, index) in departments"
          :key="department.id"
          class="reveal p-[26px] rounded-lg bg-surface border border-border shadow-card"
          :style="{ transitionDelay: `${index * 80}ms` }"
        >
          <div class="flex items-center gap-3 mb-[18px]">
            <span class="grid place-items-center w-10 h-10 rounded-md bg-accent-50 text-accent-600 shrink-0">
              <AppIcon :name="iconFor(index)" :size="18" />
            </span>
            <h3 class="font-cairo font-extrabold text-[15.5px] text-text-900">
              {{ department.name }}
            </h3>
          </div>

          <ul class="flex flex-col gap-3">
            <li
              v-for="spec in department.specializations"
              :key="spec.id"
              class="flex items-center gap-2.5 text-body-sm font-semibold text-text-700"
            >
              <AppIcon name="star" :size="14" class="text-primary-500 shrink-0" />
              {{ spec.name }}<span v-if="spec.degree">&nbsp;"{{ DEGREE_LABELS[spec.degree] }}"</span>
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
import AppIcon from '@/components/icons/AppIcon.vue'

const ICONS = ['barChart', 'monitor']

export default {
  name: 'DepartmentsSection',

  components: { AppIcon },

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
    ...mapActions(useLandingStore, ['fetchDepartments']),

    iconFor(index) {
      return ICONS[index % ICONS.length]
    }
  }
}
</script>
