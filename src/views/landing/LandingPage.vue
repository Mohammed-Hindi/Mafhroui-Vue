<template>
  <div>
    <HeroSection />

    <FeaturedProjects :projects="featured" />

    <div id="features" class="scroll-mt-20">
      <RolesSection />
    </div>

    <HowItWorksSection />

    <div id="departments" class="scroll-mt-20">
      <DepartmentsSection />
    </div>

    <StatsBanner />

    <CtaSection />
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
import StatsBanner from '@/components/landing/StatsBanner.vue'
import CtaSection from '@/components/landing/CtaSection.vue'

export default {
  name: 'LandingPage',

  components: { HeroSection, FeaturedProjects, RolesSection, HowItWorksSection, DepartmentsSection, StatsBanner, CtaSection },

  computed: {
    ...mapState(useLandingStore, ['featured'])
  }
}
</script>
