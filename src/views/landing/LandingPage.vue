<template>
  <div>
    <HeroSection />

    <!-- تمرير البيانات وحالة التحميل والخطأ للمكون مباشرة -->
    <FeaturedProjects
      :projects="projects"
      :is-loading="isLoading"
      :error-message="errorMessage"
      @retry="fetchFeaturedProjects"
    />

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

<script setup>
import { ref, onMounted } from 'vue'
import api from '@/services/api'

// استيراد المكونات الفرعية
import HeroSection from '@/components/landing/HeroSection.vue'
import FeaturedProjects from '@/components/landing/FeaturedProjects.vue'
import RolesSection from '@/components/landing/RolesSection.vue'
import HowItWorksSection from '@/components/landing/HowItWorksSection.vue'
import DepartmentsSection from '@/components/landing/DepartmentsSection.vue'
import StatsBanner from '@/components/landing/StatsBanner.vue'
import CtaSection from '@/components/landing/CtaSection.vue'

// إدارة حالة المشاريع المميزة
const projects = ref([])
const isLoading = ref(true)
const errorMessage = ref('')

const fetchFeaturedProjects = async () => {
  isLoading.value = true
  errorMessage.value = ''
  try {
    const response = await api.get('http://23.95.13.99/api/projects/featured')
    projects.value = response.data?.data || response.data || []
  } catch (error) {
    console.error('خطأ في جلب المشاريع المميزة:', error)
    errorMessage.value = 'تعذر تحميل المشاريع المميزة حالياً.'
  } finally {
    isLoading.value = false
  }
}

onMounted(() => {
  fetchFeaturedProjects()
})
</script>