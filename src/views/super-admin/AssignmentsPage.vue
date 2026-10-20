<template>
  <!-- التكليفات: لوحة المهام هي الأساس، والإنشاء (مهمة أو إعلان) من نوافذ منبثقة.
       لا إرسال ملف مستقل — الملف يُرفق داخل المهمة أو الإعلان -->
  <div class="dash as-page">
    <TasksWorkspace :groups="groups" can-announce @announce="annComposer = true" />
    <BroadcastsWorkspace v-if="annComposer" type="announcement" compose-only :groups="groups" @close="annComposer = false" />
  </div>
</template>

<script>
import TasksWorkspace from './TasksWorkspace.vue'
import BroadcastsWorkspace from './BroadcastsWorkspace.vue'
import { fetchGroups } from '@/utils/progressData'

export default {
  name: 'AssignmentsPage',

  components: { TasksWorkspace, BroadcastsWorkspace },

  data() {
    return {
      groups: [],
      annComposer: false
    }
  },

  async created() {
    try {
      this.groups = await fetchGroups()
    } catch {
      this.$toast?.error('تعذّر تحميل المجموعات')
    }
  }
}
</script>
