<template>
  <div>
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
      <!-- بيانات الطالب -->
      <div class="bg-surface rounded-lg border border-border shadow-card p-6 flex flex-col">
        <div class="flex items-center gap-3 mb-6">
          <span class="grid place-items-center w-9 h-9 rounded-md shrink-0 text-white" style="background: linear-gradient(135deg, var(--color-primary-600), var(--color-accent-500))"><User :size="18" /></span>
          <h3 class="text-h3 font-bold text-text-900">بيانات الطالب</h3>
        </div>

        <div class="flex items-center gap-4 mb-6 flex-wrap">
          <span class="grid place-items-center w-16 h-16 rounded-pill shrink-0 text-white font-cairo font-black text-h2" style="background: linear-gradient(135deg, var(--color-primary-600), var(--color-accent-500))">
            {{ initials }}
          </span>
          <div class="min-w-0">
            <div class="flex items-center gap-2 flex-wrap">
              <span class="text-h3 font-bold text-text-900 truncate">{{ profile.name }}</span>
              <span v-if="profile.isLeader" class="shrink-0 text-label font-bold text-warning-text bg-warning-bg px-2.5 py-1 rounded-pill">قائد الفريق</span>
            </div>
            <div class="text-caption text-text-400 mt-0.5">{{ profile.roleLabel }}</div>
          </div>
        </div>

        <div class="flex flex-col">
          <div v-for="row in infoRows" :key="row.k" class="flex items-center justify-between gap-4 py-3 border-b border-border-soft last:border-b-0 last:pb-0">
            <span class="text-caption text-text-400 shrink-0">{{ row.k }}</span>
            <span class="text-body-sm font-bold text-text-900 text-end break-words">{{ row.v }}</span>
          </div>
        </div>
      </div>

      <!-- فريقي -->
      <div class="bg-surface rounded-lg border border-border shadow-card p-6 flex flex-col">
        <div class="flex items-center gap-3 mb-6">
          <span class="grid place-items-center w-9 h-9 rounded-md shrink-0 text-white" style="background: linear-gradient(135deg, var(--color-primary-600), var(--color-accent-500))"><Users :size="18" /></span>
          <h3 class="text-h3 font-bold text-text-900">فريقي</h3>
        </div>

        <div class="flex flex-col">
          <div class="flex items-center justify-between gap-4 py-3 border-b border-border-soft">
            <span class="text-caption text-text-400 shrink-0">اسم الفريق</span>
            <span class="text-body-sm font-bold text-text-900 text-end">{{ team.name }}</span>
          </div>
          <div class="flex items-center justify-between gap-4 py-3 border-b border-border-soft">
            <span class="text-caption text-text-400 shrink-0">المشرف</span>
            <span class="text-body-sm font-bold text-text-900 text-end">{{ team.sup }}</span>
          </div>
          <div class="flex items-center justify-between gap-4 py-3 border-b border-border-soft">
            <span class="text-caption text-text-400 shrink-0">اسم المشروع</span>
            <span class="text-body-sm font-bold text-text-900 text-end">{{ team.proj }}</span>
          </div>
          <div class="py-3 border-b border-border-soft">
            <div class="text-caption text-text-400 mb-1.5">وصف المشروع</div>
            <p class="text-body-sm text-text-700 leading-relaxed">{{ team.projDesc }}</p>
          </div>
        </div>

        <div class="mt-4 flex-1">
          <div class="text-caption text-text-400 mb-2.5">أعضاء الفريق</div>
          <div class="flex flex-wrap gap-2">
            <span
              v-for="m in team.members" :key="m.name"
              class="inline-flex items-center gap-1.5 text-caption font-semibold px-3 py-1.5 rounded-pill"
              :class="m.leader ? 'bg-warning-bg text-warning-text' : 'bg-border-soft text-text-700'"
            >
              <Crown v-if="m.leader" :size="12" />
              {{ m.leader ? `قائد ${m.name}` : m.name }}
            </span>
          </div>
        </div>
      </div>
    </div>

    <!-- مخطط تقدم المشروع -->
    <div class="bg-surface rounded-lg border border-border shadow-card p-6">
      <div class="flex items-center justify-between gap-4 mb-5 flex-wrap">
        <div class="flex items-center gap-3">
          <span class="grid place-items-center w-9 h-9 rounded-md shrink-0 text-white" style="background: linear-gradient(135deg, var(--color-primary-600), var(--color-accent-500))"><BarChart3 :size="18" /></span>
          <h3 class="text-h3 font-bold text-text-900">مخطط تقدم المشروع</h3>
        </div>
        <router-link :to="{ name: 'team-leader-tasks' }" class="inline-flex items-center gap-1.5 text-caption font-bold text-text-600 bg-border-soft px-3 py-1.5 rounded-pill hover:text-primary-700 transition-colors duration-fast">
          <Kanban :size="13" /> انتقل إلى لوحة Kanban
        </router-link>
      </div>

      <div class="flex items-center justify-between text-caption text-text-600 mb-1.5 flex-wrap gap-1">
        <span>{{ kanban.done }} / {{ kanban.total }} مهمة منجزة</span>
        <span class="font-cairo font-extrabold text-h4 text-text-900">{{ kanbanPercent }}%</span>
      </div>
      <div class="h-2.5 rounded-pill bg-border-soft overflow-hidden mb-6">
        <div class="h-full rounded-pill bg-primary-600" :style="{ width: kanbanPercent + '%' }" />
      </div>

      <div class="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div v-for="stat in kanbanStats" :key="stat.key" class="bg-bg rounded-md border border-border-soft p-4 text-center">
          <div class="font-cairo font-extrabold text-h3" :class="stat.colorClass">{{ stat.value }}</div>
          <div class="text-label text-text-600 mt-1">{{ stat.label }}</div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { User, Users, Crown, BarChart3, Kanban } from 'lucide-vue-next'
import { initials } from '@/utils/formatters'

export default {
  name: 'TeamLeaderProfilePage',

  components: { User, Users, Crown, BarChart3, Kanban },

  data() {
    return {
      profile: {
        name: 'admin anas',
        roleLabel: 'الطالب',
        isLeader: true,
        uid: 'STU9000',
        mail: 'admin.anas@academy.edu.jo',
        spec: 'تصميم وتطوير مواقع الويب "دبلوم"',
        semester: '2026/2027-1'
      },
      team: {
        name: 'فريق الابتكار',
        sup: 'د. أحمد الحربي',
        proj: 'منصة إدارة مشاريع التخرج',
        projDesc: 'منصة تفاعلية لإدارة مشاريع التخرج تربط الطلاب بالمشرفين ولجنة الإشراف، وتتيح متابعة المقترحات والمهام والاجتماعات في مكان واحد.',
        members: [
          { name: 'admin anas', leader: true },
          { name: 'anas', leader: false },
          { name: 'هدى الجهني', leader: false },
          { name: 'جود الدوسري', leader: false }
        ]
      },
      kanban: { total: 4, done: 1, review: 1, progress: 1, pending: 1 }
    }
  },

  computed: {
    initials() {
      return initials(this.profile.name)
    },

    infoRows() {
      return [
        { k: 'الرقم الجامعي', v: this.profile.uid },
        { k: 'البريد الإلكتروني', v: this.profile.mail },
        { k: 'التخصص', v: this.profile.spec },
        { k: 'الفصل الدراسي', v: this.profile.semester }
      ]
    },

    kanbanPercent() {
      if (!this.kanban.total) return 0
      return Math.round((this.kanban.done / this.kanban.total) * 100)
    },

    kanbanStats() {
      return [
        { key: 'done', label: 'منجزة', value: this.kanban.done, colorClass: 'text-success' },
        { key: 'review', label: 'مراجعة', value: this.kanban.review, colorClass: 'text-warning-text' },
        { key: 'progress', label: 'قيد التنفيذ', value: this.kanban.progress, colorClass: 'text-primary-600' },
        { key: 'pending', label: 'قيد الانتظار', value: this.kanban.pending, colorClass: 'text-secondary-600' }
      ]
    }
  }
}
</script>
