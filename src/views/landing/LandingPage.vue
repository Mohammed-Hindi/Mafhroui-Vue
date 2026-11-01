<template>
  <div>
    <HeroSection />
    <DepartmentsSection />
    <FeaturedProjects :projects="featured" />
    <div id="features" class="scroll-mt-24">
      <RolesSection />
    </div>
    <HowItWorksSection />
  </div>
</template>

<script>
import { mapState } from 'pinia'
import { useLandingStore } from '@/stores/landing.store'
import HeroSection from '@/components/landing/HeroSection.vue'
import FeaturedProjects from '@/components/landing/FeaturedProjects.vue'
import RolesSection from '@/components/landing/RolesSection.vue'
import HowItWorksSection from '@/components/landing/HowItWorksSection.vue'
import DepartmentsSection from '@/components/landing/DepartmentsSection.vue'

export default {
  name: 'LandingPage',

  components: { HeroSection, FeaturedProjects, RolesSection, HowItWorksSection, DepartmentsSection },

  computed: {
    ...mapState(useLandingStore, ['featured'])
  },

  created() {
    useLandingStore().fetchFeaturedProjects().catch(() => {
      // القسم يعرض رسالة "لا مشاريع" عند الفشل
    })
  }
}
</script>
