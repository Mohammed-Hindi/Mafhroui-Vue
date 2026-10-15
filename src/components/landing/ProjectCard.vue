<template>
  <!-- بطاقة مشروع بنمط معارض الأعمال الأكاديمية: صورة المشروع 16:10 (أو غلاف بهوية المنصة بالحرف الأول)،
       عند المرور تغمق الصورة ويظهر "عرض المشروع"، ثم سطر القسم والدرجة، العنوان، الفريق والمشرف. البطاقة كلها رابط -->
  <router-link :to="{ name: 'project-showcase', params: { id: project.id }, query: project.video_url ? { play: 1 } : {} }" class="us-pf">
    <span class="us-pf-media">
      <img v-if="project.cover" :src="project.cover" :alt="project.title" loading="lazy">
      <span v-else class="us-pf-fallback" aria-hidden="true"><b>{{ project.title?.charAt(0) }}</b><UcasLogo :size="34" /></span>
      <span v-if="project.program_name" class="us-pf-tag">{{ project.program_name }}</span>
      <!-- مشروع بفيديو: زر تشغيل على الصورة، والضغط يفتح صفحة المشروع والفيديو يعمل -->
      <span v-if="project.video_url" class="us-pf-play" aria-hidden="true"><Play :size="26" /></span>
      <span class="us-pf-hover"><span>{{ project.video_url ? 'تشغيل الفيديو' : 'عرض المشروع' }} <ArrowLeft :size="16" /></span></span>
    </span>
    <span class="us-pf-body">
      <small class="us-pf-eyebrow">{{ [project.dept_name, project.degree, project.semester].filter(Boolean).join(' · ') }}</small>
      <h3>{{ project.title }}</h3>
      <p>{{ project.description || 'مشروع تخرج من مشاريع الكلية.' }}</p>
      <span class="us-pf-meta">
        <span v-if="project.members"><Users :size="15" /> {{ project.members }}</span>
        <span><UserRound :size="15" /> {{ project.supervisor_name }}</span>
      </span>
    </span>
  </router-link>
</template>

<script setup>
import { ArrowLeft, Play, UserRound, Users } from 'lucide-vue-next'
import UcasLogo from '@/components/icons/UcasLogo.vue'

defineProps({
  project: { type: Object, required: true }
})
</script>
