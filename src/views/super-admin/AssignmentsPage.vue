<template>
  <!-- التكليفات والإعلانات — ثلاث مساحات بنفس النظام: المهام، الإعلانات، الملفات (مرسَلة + فلاتر + إرسال جديد) -->
  <div class="dash">
    <header class="dash-head">
      <div>
        <h2 class="dash-title">التكليفات والإعلانات</h2>
      </div>
    </header>

    <nav class="rv-tabs as-types" aria-label="نوع التكليف">
      <button v-for="t in types" :key="t.value" type="button" :class="['rv-tab', type === t.value && 'is-active']" @click="type = t.value">
        <component :is="t.icon" :size="16" /> {{ t.label }}
      </button>
    </nav>

    <TasksWorkspace v-if="type === 'task'" :groups="groups" />
    <BroadcastsWorkspace v-else :key="type" :type="type" :groups="groups" />
  </div>
</template>

<script>
import { ListTodo, Megaphone, Paperclip } from 'lucide-vue-next'
import TasksWorkspace from './TasksWorkspace.vue'
import BroadcastsWorkspace from './BroadcastsWorkspace.vue'
import { fetchGroups } from '@/utils/progressData'

export default {
  name: 'AssignmentsPage',

  components: { TasksWorkspace, BroadcastsWorkspace },

  data() {
    return {
      types: [
        { value: 'task', label: 'مهمة', icon: ListTodo },
        { value: 'announcement', label: 'إعلان', icon: Megaphone },
        { value: 'file', label: 'ملف', icon: Paperclip }
      ],
      type: 'task',
      groups: []
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
