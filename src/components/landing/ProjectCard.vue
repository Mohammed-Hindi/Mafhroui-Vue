<template>
  <!-- بطاقة مشروع في معرض الأعمال: البطاقة كلها رابط لصفحة المشروع.
       مساحة بصرية بتدرّج الهوية (التخصص + الدرجة)، ثم القسم والعنوان الأزرق والوصف والمشرف والفريق -->
  <router-link :to="{ name: 'project-showcase', params: { id: project.id } }" class="us-proj">
    <span class="us-proj-media" aria-hidden="true">
      <span v-if="project.program_name" class="us-news-tag">{{ project.program_name }}</span>
      <span class="us-proj-mark"><UcasLogo :size="64" /></span>
      <span v-if="project.degree" class="us-proj-degree">{{ project.degree }}</span>
    </span>
    <span class="us-proj-body">
      <small v-if="project.dept_name" class="us-proj-dept">{{ project.dept_name }}</small>
      <h3>{{ project.title }}</h3>
      <p>{{ project.description || 'مشروع تخرج متميّز من مشاريع الكلية.' }}</p>
      <span class="us-proj-meta">
        <span><UserRound :size="15" /> {{ project.supervisor_name }}</span>
        <span v-if="project.members"><Users :size="15" /> {{ project.members }}</span>
      </span>
      <span class="us-proj-go">عرض المشروع <ArrowLeft :size="16" /></span>
    </span>
  </router-link>
</template>

<script>
import { ArrowLeft, UserRound, Users } from 'lucide-vue-next'
import UcasLogo from '@/components/icons/UcasLogo.vue'

export default {
  name: 'ProjectCard',

  components: { ArrowLeft, UcasLogo, UserRound, Users },

  props: {
    project: { type: Object, required: true }
  }
}
</script>
