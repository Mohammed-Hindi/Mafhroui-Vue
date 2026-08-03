<template>
  <TaskBoard storage-key="gp_tasks_supervisor_overview" :seed="seedTasks" read-only />
</template>

<script>
import TaskBoard from '@/components/shared/TaskBoard.vue'

export default {
  name: 'SupervisorTasksPage',
  components: { TaskBoard },
  data() {
    return {
      seedTasks: [
        { title: 'مراجعة الفصل الثاني من التقرير', description: 'فريق: أنظمة الذكاء الاصطناعي', priority: 'high', columnId: 'todo', assignee: 'قائد الفريق', dueDate: '' },
        { title: 'توزيع مهام الاختبار', description: 'فريق: تطبيقات الجوال', priority: 'medium', columnId: 'progress', assignee: '', dueDate: '' },
        { title: 'اختبار وحدة المصادقة', description: 'فريق: أنظمة الذكاء الاصطناعي', priority: 'medium', columnId: 'review', assignee: 'سارة عودة', dueDate: '' },
        { title: 'تجهيز عرض المقترح الأولي', description: 'فريق: تطبيقات الجوال', priority: 'low', columnId: 'done', assignee: 'أحمد الحربي', dueDate: '' }
      ]
    }
  }
}
</script>
