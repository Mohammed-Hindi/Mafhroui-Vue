<template>
  <!-- مهام المشرف: شريط فلاتر واحد (الشعبة + بحث + المكلّف + الترتيب + مبدّل العرض) فوق لوحة المهام أو تفاعل الطلاب -->
  <div class="dash svt-page">
    <SkeletonLoader v-if="!teamsLoaded && !myTeams.length" variant="cards" :rows="3" />
    <EmptyState
      v-else-if="!myTeams.length"
      :icon="UsersIcon"
      title="لا توجد فرق مُسندة إليك"
      description="عند إسناد مجموعات إليك من لجنة الإشراف ستظهر هنا مهامها وتفاعل طلابها."
    />

    <template v-else>
      <!-- شريط الفلاتر: الشعبة (مجموعة المشرف) + بحث + المكلّف + الترتيب + مبدّل العرض (لوحة المهام / تفاعل الطلاب) -->
      <div class="gr-filters svt-filters">
        <label class="gr-search">
          <Search :size="16" />
          <input
            v-model.trim="q"
            type="search"
            :placeholder="view === 'tasks' ? 'بحث في مهام المجموعة…' : 'بحث باسم الطالب أو رقمه الجامعي…'"
          >
        </label>
        <!-- الشعبة: قائمة منسدلة بنفس نظام الفلاتر — اختيار المجموعة المعروضة -->
        <BaseSelect
          :model-value="selectedTeamId"
          class="sup-select"
          aria-label="الشعبة"
          :options="teamOptions"
          @change="pickTeam"
        />
        <BaseSelect
          v-model="who"
          class="sup-select"
          aria-label="المكلّف"
          :placeholder="view === 'tasks' ? 'كل المهام' : 'كل الطلاب'"
          include-placeholder-option
          :options="whoOptions"
        />
        <BaseSelect v-model="sort" class="sup-select" aria-label="الترتيب" :options="sortOptions" />
        <div class="svt-views" role="tablist" aria-label="طريقة العرض">
          <button
            v-for="v in views"
            :key="v.key"
            type="button"
            role="tab"
            :class="view === v.key && 'is-active'"
            :aria-selected="view === v.key"
            @click="setView(v.key)"
          >
            <component :is="v.icon" :size="15" /> {{ v.label }} <b>{{ v.count }}</b>
          </button>
        </div>
      </div>

      <!-- تفاعل الطلاب: توزيع المهام على أفراد المجموعة ونسبة إنجاز كل طالب — بطاقة طويلة تملأ الشاشة -->
      <section v-if="view === 'engagement'" class="gr gr-card sup-tall-card">
        <header class="gr-card-head">
          <div class="gr-card-title"><h3>تفاعل الطلاب</h3><span>{{ selectedTeam?.name }}</span></div>
        </header>
        <div class="gr-table-wrap">
          <table class="gr-table sh-table">
            <thead>
              <tr>
                <th>الطالب</th>
                <th>الرقم الجامعي</th>
                <th>الدور</th>
                <th>المهام الموكلة</th>
                <th>المنجزة</th>
                <th>المتبقية</th>
                <th>نسبة الإنجاز</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="s in engagement" :key="s.id" class="gr-row">
                <td class="pt-strong">{{ s.name }}</td>
                <td class="mono">{{ s.uid }}</td>
                <td>
                  <span v-if="s.leader" class="svt-leader">قائد المجموعة</span>
                  <span v-else class="svt-muted">عضو</span>
                </td>
                <td>{{ s.total }}</td>
                <td>{{ s.done }}</td>
                <td>{{ s.total - s.done }}</td>
                <td class="sh-progress">
                  <span class="gr-progress"><span :class="level(s.pct)" :style="{ width: s.pct + '%' }" /></span>
                  <span class="gr-pct">{{ s.pct }}%</span>
                </td>
              </tr>
              <tr v-if="!engagement.length"><td colspan="7" class="gr-empty">لا يوجد طلاب في هذه المجموعة</td></tr>
            </tbody>
          </table>
        </div>
        <div class="gr-sumbar">
          <span>الطلاب: {{ group.students }}</span>
          <span>مهام المجموعة: {{ group.tasks }}</span>
          <span>المنجزة: {{ group.done }}</span>
          <span>متوسط إنجاز الطلاب: {{ group.avg }}%</span>
        </div>
      </section>

      <!-- لوحة المهام (كانبان) للمجموعة المختارة — بنفس نمط لوحة التكليفات (tk-board/tk-col/tk-card) -->
      <TaskBoard
        v-else
        variant="tk"
        :tasks="shownTasks"
        :loading="tasksLoading"
        :can-create="true"
        :hint="selectedTeam?.projectName || ''"
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
    </template>
  </div>
</template>

<script>
import { mapState, mapActions } from 'pinia'
import { markRaw } from 'vue'
import { ListTodo, Users, Search } from 'lucide-vue-next'
import TaskBoard from '@/components/shared/TaskBoard.vue'
import BaseSelect from '@/components/ui/BaseSelect.vue'
import EmptyState from '@/components/ui/EmptyState.vue'
import { level } from '@/utils/progressData'
import { useTeamsStore } from '@/stores/teams.store'
import { useAuthStore } from '@/stores/auth.store'
import api from '@/services/api'

export default {
  name: 'SupervisorTasksPage',

  components: { TaskBoard, EmptyState, BaseSelect, Search },

  data() {
    return {
      UsersIcon: markRaw(Users),
      selectedTeamId: null,
      view: 'tasks',
      q: '',
      who: '',
      sort: 'newest',
      restoringId: null,
      forceDeletingId: null
    }
  },

  computed: {
    ...mapState(useTeamsStore, ['teamsForDisplay', 'teamsLoaded', 'tasks', 'tasksLoading', 'trashedTasks', 'trashedTasksLoading', 'taskNotes', 'taskNotesLoading']),
    ...mapState(useAuthStore, ['user']),

    myTeams() {
      return this.teamsForDisplay.filter((t) => t.supId === this.user?.id)
    },

    selectedTeam() {
      return this.myTeams.find((t) => String(t.id) === String(this.selectedTeamId)) || null
    },

    /** خيارات فلتر الشعبة — مجموعات المشرف */
    teamOptions() {
      return this.myTeams.map((t) => ({ value: t.id, label: this.teamTitle(t) }))
    },

    views() {
      return [
        { key: 'tasks', label: 'المهام', icon: markRaw(ListTodo), count: this.shownTasks.length },
        { key: 'engagement', label: 'تفاعل الطلاب', icon: markRaw(Users), count: this.engagement.length }
      ]
    },

    /** خيارات فلتر المكلّف: في لوحة المهام تشمل مهام المجموعة (بلا مكلّفين)، وفي جدول الطلاب تقتصر على الأفراد */
    whoOptions() {
      const opts = []
      if (this.view === 'tasks') opts.push({ value: 'team', label: 'مهام المجموعة (بلا مكلّفين)' })
      for (const m of this.selectedTeam?.members || []) opts.push({ value: String(m.id), label: m.name })
      return opts
    },

    /** الترتيب يتبع العرض المعروض: زمني/أبجدي للمهام، ونِسَب للطلاب */
    sortOptions() {
      return this.view === 'tasks'
        ? [
            { value: 'newest', label: 'الأحدث أولًا' },
            { value: 'oldest', label: 'الأقدم أولًا' },
            { value: 'title', label: 'العنوان أبجديًا' }
          ]
        : [
            { value: 'name', label: 'الاسم أبجديًا' },
            { value: 'high', label: 'الأعلى إنجازًا' },
            { value: 'low', label: 'الأقل إنجازًا' }
          ]
    },

    /** مهام المجموعة بعد الفلترة والترتيب — تُمرَّر للوحة فتعكس أعمدتها العدّادات الصحيحة */
    shownTasks() {
      const q = this.q.toLowerCase()
      const list = this.tasks.filter((t) => {
        const assignees = t.assignees || []
        if (this.who === 'team' && assignees.length) return false
        if (this.who && this.who !== 'team' && !assignees.some((a) => String(a.id) === this.who)) return false
        if (!q) return true
        const hay = `${t.title || ''} ${t.description || ''} ${assignees.map((a) => a.name).join(' ')}`.toLowerCase()
        return hay.includes(q)
      })
      const byDate = (a, b) => new Date(a.created_at || 0).getTime() - new Date(b.created_at || 0).getTime()
      if (this.sort === 'oldest') return [...list].sort(byDate)
      if (this.sort === 'title') return [...list].sort((a, b) => (a.title || '').localeCompare(b.title || '', 'ar'))
      return [...list].sort((a, b) => -byDate(a, b))
    },

    /** لكل طالب: مهامه = المسندة له أو مهام المجموعة بلا مكلّفين */
    teamRows() {
      return (this.selectedTeam?.members || []).map((m) => {
        const mine = this.tasks.filter((t) => !(t.assignees || []).length || t.assignees.some((a) => String(a.id) === String(m.id)))
        const done = mine.filter((t) => t.status === 'done').length
        return { ...m, total: mine.length, done, pct: mine.length ? Math.round((done / mine.length) * 100) : 0 }
      })
    },

    /** صفوف تفاعل الطلاب بعد الفلترة والترتيب */
    engagement() {
      const q = this.q.toLowerCase()
      let rows = this.teamRows.filter((r) => {
        if (this.who && this.who !== 'team' && String(r.id) !== this.who) return false
        if (!q) return true
        return `${r.name} ${r.uid}`.toLowerCase().includes(q)
      })
      if (this.sort === 'high') return [...rows].sort((a, b) => b.pct - a.pct)
      if (this.sort === 'low') return [...rows].sort((a, b) => a.pct - b.pct)
      return [...rows].sort((a, b) => (a.name || '').localeCompare(b.name || '', 'ar'))
    },

    /** ملخّص المجموعة كاملًا (لا يتأثر بالفلاتر) */
    group() {
      const rows = this.teamRows
      return {
        students: rows.length,
        tasks: this.tasks.length,
        done: this.tasks.filter((t) => t.status === 'done').length,
        avg: rows.length ? Math.round(rows.reduce((n, r) => n + r.pct, 0) / rows.length) : 0
      }
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

    teamTitle(t) {
      return t.section ? `شعبة ${t.section}` : t.name
    },

    setView(v) {
      if (v === this.view) return
      this.view = v
      this.sort = this.sortOptions[0].value
      // خيار "مهام المجموعة" لا معنى له في جدول الطلاب — نُصفّره عند التبديل
      if (v === 'engagement' && this.who === 'team') this.who = ''
    },

    async pickTeam(id) {
      const teamId = Number(id)
      if (!teamId || teamId === this.selectedTeamId) return
      this.selectedTeamId = teamId
      // فلاتر البحث والمكلّف تخصّ المجموعة المختارة — نبدأ من الصفر عند التبديل
      this.q = ''
      this.who = ''
      await this.loadTasks()
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
        this.$toast?.success('تم حفظ الملاحظة')
      } catch (err) {
        this.$toast?.error(err.normalized?.message || 'تعذّر حفظ الملاحظة')
      }
    }
  }
}
</script>
