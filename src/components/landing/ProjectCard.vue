<template>
  <!-- بطاقة مشروع بنمط معارض الأعمال الأكاديمية: صورة المشروع 16:10 (أو غلاف بهوية المنصة بالحرف الأول)،
       عند المرور تغمق الصورة ويظهر "عرض المشروع"، ثم سطر القسم والدرجة، العنوان، الفريق والمشرف. البطاقة كلها رابط -->
  <router-link :to="{ name: 'project-showcase', params: { id: project.id }, query: project.video_url ? { play: 1 } : {} }" class="us-pf">
    <span class="us-pf-media">
      <img v-if="project.cover" :src="project.cover" :alt="project.title" loading="lazy">
      <span v-else class="us-pf-fallback" aria-hidden="true"><b>{{ project.title?.charAt(0) }}</b><UcasLogo :size="34" /></span>
      <span v-if="project.program_name" class="us-pf-tag">{{ project.program_name }}</span>
      <!-- وسم المرموق: المعرض لا يعرض إلا المشاريع المصنّفة مرموقة من الإدارة -->
      <span class="us-pf-crown"><Crown :size="13" /> مرموق</span>
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
import { ArrowLeft, Crown, Play, UserRound, Users } from 'lucide-vue-next'
import UcasLogo from '@/components/icons/UcasLogo.vue'

defineProps({
  project: { type: Object, required: true }
})
</script>

<style scoped>
/* وسم «مرموق» أعلى يسار البطاقة — تاج تصنيف الإدارة (أرقى من نجوم المميّز) */
.us-pf-crown {
  position: absolute;
  top: 10px;
  inset-inline-start: 10px;
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 3px 9px;
  border-radius: var(--radius-pill, 999px);
  background: var(--color-warning-bg, #fff6e5);
  color: var(--color-warning-text, #8a5a00);
  font-size: 11.5px;
  font-weight: 800;
  box-shadow: inset 0 0 0 1px var(--color-warning, #e0a200);
  z-index: 2;
}
</style>
