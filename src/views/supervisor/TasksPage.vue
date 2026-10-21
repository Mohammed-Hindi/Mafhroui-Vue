<template>
  <div class="dash hd-page">
    <header class="dash-head">
      <h2 class="dash-title">المهام</h2>
    </header>

    <!-- فلتر الفرق بنمط تصنيف البوابة (شريط مقسّم بعدد طلاب كل فرقة) + سطر تعريف بالفرقة المختارة -->
    <section v-if="teamOptions.length" class="dash-card tk-teambar">
      <div class="gr-class" role="radiogroup" aria-label="المجموعة">
        <span class="gr-class-label">المجموعة</span>
        <div class="gr-seg">
          <button
            v-for="t in myTeams" :key="t.id" type="button" role="radio"
            :class="selectedTeamId === t.id && 'is-active'" :aria-checked="selectedTeamId === t.id" :title="t.name"
            @click="pickTeam(t.id)"
          >
            {{ t.section ? `شعبة ${t.section}` : t.name }} <b>{{ t.members.length }}</b>
          </button>
        </div>
      </div>
      <dl v-if="selectedTeam" class="tk-teammeta">
        <div><dt>الفرقة</dt><dd>{{ selectedTeam.name }}</dd></div>
        <div><dt>المشروع</dt><dd>{{ selectedTeam.projectName || 'لم يُسجَّل بعد' }}</dd></div>
        <div><dt>الطلاب</dt><dd>{{ selectedTeam.members.map((m) => m.name).join('، ') || '—' }}</dd></div>
      </dl>
    </section>

    <!-- ستيبر العروض بنمط الإدارة العامة: المهام (اللوحة) · تفاعل الطلاب وتقييمهم -->
    <PortalStepper v-if="selectedTeam" v-model="view" :items="views" label="عرض المهام" />

    <!-- تفاعل الطلاب: المهام الموكلة والمنجزة لكل طالب (مهمة بلا مكلّفين = لكل أعضاء المجموعة) -->
    <section v-if="selectedTeam && view === 'engagement'" class="gr gr-card">
      <header class="gr-card-head">
        <div class="gr-card-title"><h3>تفاعل الطلاب وتقييمهم</h3><span>{{ selectedTeam.name }}</span></div>
      </header>
      <div class="gr-table-wrap">
        <table class="gr-table sh-table">
          <thead><tr><th>الطالب</th><th>الرقم الجامعي</th><th>المهام الموكلة</th><th>المنجزة</th><th>المتبقية</th><th>نسبة الإنجاز</th><th>تاريخ آخر إنجاز</th><th>ملاحظات المشرف</th></tr></thead>
          <tbody>
            <tr v-for="s in engagement" :key="s.id" class="gr-row">
              <td class="pt-strong">{{ s.name }}</td>
              <td class="mono">{{ s.uid }}</td>
              <td>{{ s.total }}</td>
              <td>{{ s.done }}</td>
              <td>{{ s.total - s.done }}</td>
              <td class="sh-progress">
                <span class="gr-progress"><span :class="level(s.pct)" :style="{ width: s.pct + '%' }" /></span>
                <span class="gr-pct">{{ s.pct }}%</span>
              </td>
              <!-- ponytail: تاريخ آخر إنجاز وعدد ملاحظات المشرف placeholder — متاحان حاليًا من "سجل الحركة" و"الملاحظات" على كل بطاقة -->
              <td class="pt-muted">—</td>
              <td class="pt-muted">—</td>
            </tr>
            <tr v-if="!engagement.length"><td colspan="8" class="gr-empty">لا يوجد طلاب في هذه المجموعة</td></tr>
          </tbody>
        </table>
      </div>
      <div class="gr-sumbar">
        <span>الطلاب: {{ engagement.length }}</span>
        <span>مهام المجموعة: {{ tasks.length }}</span>
        <span>المنجزة: {{ tasks.filter((t) => t.status === 'done').length }}</span>
        <span>متوسط إنجاز الطلاب: {{ engagement.length ? Math.round(engagement.reduce((n, s) => n + s.pct, 0) / engagement.length) : 0 }}%</span>
      </div>
    </section>

    <SkeletonLoader v-if="!teamsLoaded && !teamOptions.length" variant="board" :rows="2" />
    <EmptyState v-else-if="!teamOptions.length" :icon="UsersIcon" title="لا توجد فرق مُسندة إليك" description="عند إسناد مجموعات إليك من لجنة الإشراف ستظهر هنا مهامها وتفاعل طلابها." />
    <TaskBoard
      v-else-if="selectedTeamId && view === 'tasks'"
      :tasks="tasks"
      :can-create="true"
      :members="selectedTeam?.members || []"
      :can-drag="false"
      :can-delete="true"
      :trashed-tasks="trashedTasks"
      :trashed-loading="trashedTasksLoading"
      :restoring-id="restoringId"
      :force-deleting-id="forceDeletingId"
      :notes-by-task="taskNotes"
      :notes-loading-by-task="taskNotesLoading"
      @create="onCreate"
      @archive="onArchive"
      @update="onUpdate"
      @open-archive="onOpenArchive"
      @restore="onRestore"
      @force-delete="onForceDelete"
      @load-notes="onLoadNotes"
      @add-note="onAddNote"
    />
  </div>
</template>

<script>
import { mapState, mapActions } from 'pinia'
import { markRaw } from 'vue'
import { ListTodo, Users } from 'lucide-vue-next'
import TaskBoard from '@/components/shared/TaskBoard.vue'
import PortalStepper from '@/components/shared/PortalStepper.vue'
import EmptyState from '@/components/ui/EmptyState.vue'
import { level } from '@/utils/progressData'
import { useTeamsStore } from '@/stores/teams.store'
import { useAuthStore } from '@/stores/auth.store'
import api from '@/services/api'

export default {
  name: 'SupervisorTasksPage',

  components: { TaskBoard, EmptyState, PortalStepper },

  data() {
    return {
      UsersIcon: markRaw(Users),
      selectedTeamId: null,
      view: 'tasks',
      restoringId: null,
      forceDeletingId: null
    }
  },

  computed: {
    ...mapState(useTeamsStore, ['teamsForDisplay', 'teamsLoaded', 'tasks', 'trashedTasks', 'trashedTasksLoading', 'taskNotes', 'taskNotesLoading']),
    ...mapState(useAuthStore, ['user']),

    myTeams() {
      return this.teamsForDisplay.filter((t) => t.supId === this.user?.id)
    },

    teamOptions() {
      return this.myTeams.map((t) => ({ value: t.id, label: t.name }))
    },

    views() {
      return [
        { key: 'tasks', label: 'المهام', icon: markRaw(ListTodo), count: this.tasks.length },
        { key: 'engagement', label: 'تفاعل الطلاب وتقييمهم', icon: markRaw(Users), count: this.selectedTeam?.members.length || 0 }
      ]
    },

    selectedTeam() {
      return this.myTeams.find((t) => t.id === this.selectedTeamId) || null
    },

    /** لكل طالب: مهامه = المسندة له أو مهام المجموعة بلا مكلّفين */
    engagement() {
      return (this.selectedTeam?.members || []).map((m) => {
        const mine = this.tasks.filter((t) => !(t.assignees || []).length || t.assignees.some((a) => a.id === m.id))
        const done = mine.filter((t) => t.status === 'done').length
        return { ...m, total: mine.length, done, pct: mine.length ? Math.round((done / mine.length) * 100) : 0 }
      })
    }
  },

  async created() {
    await this.fetchTeams()
    if (this.myTeams.length) {
      this.selectedTeamId = this.myTeams[0].id
      await this.loadTasks()
    }
  },

  methods: {
    ...mapActions(useTeamsStore, ['fetchTeams', 'fetchTasks', 'createTask', 'deleteTask', 'updateTask', 'fetchTrashedTasks', 'restoreTask', 'forceDeleteTask', 'fetchTaskNotes', 'addTaskNote']),
    level,

    pickTeam(id) {
      if (id === this.selectedTeamId) return
      this.selectedTeamId = id
      this.loadTasks()
    },

    async loadTasks() {
      if (!this.selectedTeamId) return
      try {
        await this.fetchTasks(this.selectedTeamId)
      } catch (err) {
        this.$toast?.error(err.normalized?.message || 'تعذّر تحميل المهام')
      }
    },

    /** POST /teams/{id}/tasks ثم الملاحظة (POST /tasks/{id}/notes) والملفات (POST /tasks/{id}/files — مُنشئ المهمة يرفق ملفاتها) */
    async onCreate({ note, files, ...payload }) {
      let task
      try {
        const data = await this.createTask(this.selectedTeamId, payload)
        task = data.data || data
      } catch (err) {
        return this.$toast?.error(err.normalized?.message || 'تعذّر إضافة المهمة')
      }
      const extras = await Promise.allSettled([
        ...(note ? [this.addTaskNote(task.id, note)] : []),
        ...files.map((file) => {
          const fd = new FormData()
          fd.append('file', file)
          return api.post(`/tasks/${task.id}/files`, fd, { headers: { 'Content-Type': 'multipart/form-data' } })
        })
      ])
      const failed = extras.filter((r) => r.status === 'rejected').length
      if (failed) this.$toast?.error(`أُضيفت المهمة، وتعذّر حفظ ${failed} من الملاحظة/الملفات`)
      else this.$toast?.success('تمت إضافة المهمة')
    },

    async onArchive(id) {
      try {
        await this.deleteTask(id)
        this.$toast?.success('تمت أرشفة المهمة')
      } catch (err) {
        this.$toast?.error(err.normalized?.message || 'تعذّر أرشفة المهمة')
      }
    },

    async onUpdate({ id, title, description }) {
      try {
        await this.updateTask(id, { title, description })
        this.$toast?.success('تم حفظ التعديلات')
      } catch (err) {
        this.$toast?.error(err.normalized?.message || 'تعذّر حفظ التعديلات')
      }
    },

    async onOpenArchive() {
      try {
        await this.fetchTrashedTasks(this.selectedTeamId)
      } catch (err) {
        this.$toast?.error(err.normalized?.message || 'تعذّر تحميل الأرشيف')
      }
    },

    async onRestore(id) {
      this.restoringId = id
      try {
        await this.restoreTask(id)
        this.$toast?.success('تم استرجاع المهمة')
      } catch (err) {
        this.$toast?.error(err.normalized?.message || 'تعذّر استرجاع المهمة')
      } finally {
        this.restoringId = null
      }
    },

    async onForceDelete(id) {
      this.forceDeletingId = id
      try {
        await this.forceDeleteTask(id)
        this.$toast?.success('تم حذف المهمة نهائيًا')
      } catch (err) {
        this.$toast?.error(err.normalized?.message || 'تعذّر حذف المهمة')
      } finally {
        this.forceDeletingId = null
      }
    },

    async onLoadNotes(id) {
      try {
        await this.fetchTaskNotes(id)
      } catch (err) {
        this.$toast?.error(err.normalized?.message || 'تعذّر تحميل الملاحظات')
      }
    },

    async onAddNote({ id, note }) {
      try {
        await this.addTaskNote(id, note)
      } catch (err) {
        this.$toast?.error(err.normalized?.message || 'تعذّر إضافة الملاحظة')
      }
    }
  }
}
</script>
