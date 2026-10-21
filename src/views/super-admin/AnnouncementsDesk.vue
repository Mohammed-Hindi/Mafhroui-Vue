<template>
  <!-- الإعلانات والملفات للجنة الإشراف والمشرف والطالب — على نمط لوحة الإدارة العامة:
       بطاقة واحدة (عنوان + شريط فلاتر + قائمة/تفاصيل مسطّحة)، بلا عنوان مكرّر ولا تبويبات -->
  <div class="dash ads-page">
    <section class="dash-card ads-card">
      <div class="dash-card-head ads-head">
        <h3>الإعلانات والملفات</h3>
      </div>

      <div class="gr-filters ads-filters">
        <label class="gr-search">
          <Search :size="16" />
          <input v-model.trim="q" type="search" placeholder="بحث بالعنوان أو النص أو المرسل أو اسم الملف…">
        </label>
        <BaseSelect v-model="kindFilter" class="ads-select" aria-label="النوع" placeholder="كل الأنواع" :options="typeOptions" />
        <BaseSelect v-model="sender" class="ads-select" aria-label="المرسل" placeholder="كل المرسلين" include-placeholder-option :options="senders" />
        <BaseSelect v-model="sort" class="ads-select" aria-label="الترتيب" :options="sortOptions" />
      </div>

      <div class="ads-layout">
        <section class="ads-list" aria-label="المراسلات">
          <header class="ads-list-head">
            <h4 class="portal-title">{{ typeLabel }}</h4>
            <span class="dash-chip">{{ shown.length }}</span>
          </header>
          <SkeletonLoader v-if="loading" variant="list" :rows="5" />
          <p v-else-if="!shown.length" class="palert is-warning ads-alert"><span class="ads-ic is-warning">!</span> لا توجد مراسلات في «{{ typeLabel }}»</p>
          <button
            v-for="a in shown" :key="a.id" type="button"
            :class="['ads-item', current?.id === a.id && 'is-selected']" @click="open(a)"
          >
            <span :class="['an-icon', `is-${kind(a)}`]" aria-hidden="true"><component :is="TYPE[kind(a)].icon" :size="16" /></span>
            <span class="ads-item-body">
              <span class="ads-item-top">
                <span class="ads-item-title">{{ titleOf(a) }}</span>
                <span class="ads-time">{{ ago(a.created_at) }}</span>
              </span>
              <span class="ads-snippet">{{ snippetOf(a) }}</span>
              <span class="ads-item-meta">
                <span>{{ a.author?.name || '—' }}</span>
                <span v-if="a.attachments?.length" class="ads-attach"><Paperclip :size="13" /> {{ a.attachments.length }}</span>
                <span :class="['ads-state', TYPE[kind(a)].cls]">{{ TYPE[kind(a)].label }}</span>
              </span>
            </span>
          </button>
        </section>

        <section v-if="current" :class="['ads-detail', mobileOpen && 'is-open']">
          <header class="ads-detail-head">
            <button type="button" class="ads-back" @click="mobileOpen = false"><ArrowRight :size="18" /> رجوع للقائمة</button>
            <div class="ads-detail-title">
              <h3 class="portal-title">{{ titleOf(current) }}</h3>
              <span class="ads-detail-meta">
                <span :class="['ads-state', TYPE[kind(current)].cls]">{{ TYPE[kind(current)].label }}</span>
                <span class="dash-chip">من {{ current.author?.name || '—' }} · {{ when(current.created_at) }}</span>
              </span>
            </div>
            <div v-if="current.attachments?.length > 1" class="ads-tools">
              <button type="button" class="pbtn is-cyan is-sm" @click="downloadAll"><Download :size="15" /> تنزيل الكل ({{ current.attachments.length }})</button>
            </div>
          </header>

          <div class="ads-body">
            <div class="ads-conv">
              <div class="ads-scroll">
                <div v-if="current.rating" class="an-rating" :aria-label="`${current.rating} من 5`">
                  <Star v-for="n in 5" :key="n" :size="20" :fill="n <= current.rating ? 'currentColor' : 'none'" :class="n > current.rating && 'is-off'" />
                  <b>{{ current.rating }} من 5</b>
                </div>
                <article class="an-body">
                  <p v-if="current.body">{{ current.body }}</p>
                  <p v-else class="pt-muted">بلا نص مرفق.</p>
                </article>
                <router-link v-if="current.type === 'task'" :to="{ name: tasksRoute }" class="pbtn is-cyan is-sm ads-task-link"><ListTodo :size="15" /> فتح في لوحة المهام</router-link>

                <section v-if="current.attachments?.length" class="an-files" aria-label="المرفقات">
                  <h4 class="portal-title an-files-title">المرفقات</h4>
                  <ul>
                    <li v-for="f in current.attachments" :key="f.id">
                      <span class="an-file-ic" aria-hidden="true"><FileText :size="18" /></span>
                      <span class="an-file-main"><b><bdi>{{ f.name }}</bdi></b><span class="pt-muted">{{ formatFileSize(f.size) }}</span></span>
                      <button type="button" class="pbtn is-outline is-sm" :title="`تنزيل ${f.name}`" @click="download(f)"><Download :size="15" /> تنزيل</button>
                    </li>
                  </ul>
                </section>
              </div>
            </div>

            <aside class="ads-props" aria-label="بيانات المراسلة">
              <div class="ads-requester">
                <span class="ads-avatar" aria-hidden="true"><UcasLogo :size="24" /></span>
                <div><b>{{ current.author?.name || '—' }}</b><span class="pt-muted">{{ ROLE_LABELS[current.author?.role] || '' }}</span></div>
              </div>
              <h4 class="portal-title an-files-title">بيانات المراسلة</h4>
              <dl class="ads-data">
                <div><dt>النوع :</dt><dd>{{ TYPE[kind(current)].label }}</dd></div>
                <div><dt>التاريخ :</dt><dd>{{ when(current.created_at) }}</dd></div>
                <template v-if="current.type === 'task'">
                  <div><dt>موعد التسليم :</dt><dd class="mono">{{ current.due_date || 'بلا موعد' }}</dd></div>
                  <div><dt>الحالة :</dt><dd>{{ STATUS[current.status] || current.status }}</dd></div>
                </template>
                <div v-if="current.team"><dt>المجموعة :</dt><dd>{{ current.team.section ? `شعبة ${current.team.section}` : current.team.name }}</dd></div>
                <div><dt>المرفقات :</dt><dd>{{ current.attachments?.length || 0 }}</dd></div>
              </dl>
            </aside>
          </div>
        </section>

        <section v-else class="ads-detail ads-empty">
          <Inbox :size="40" />
          <p>اختر إعلانًا أو ملفًا من القائمة لعرضه</p>
        </section>
      </div>
    </section>
  </div>
</template>

<script>
import { markRaw } from 'vue'
import { ArrowRight, Download, FileText, Inbox, ListTodo, Megaphone, Paperclip, Search, Star } from 'lucide-vue-next'
import UcasLogo from '@/components/icons/UcasLogo.vue'
import BaseSelect from '@/components/ui/BaseSelect.vue'
import api from '@/services/api'
import { downloadAttachment } from '@/services/announcements'
import { ROLE_LABELS } from '@/utils/constants'
import { formatFileSize } from '@/utils/formatters'
import { isPlaceholder } from '@/utils/studentPlaceholders'
import { mapState } from 'pinia'
import { useAuthStore } from '@/stores/auth.store'
import { useTeamsStore } from '@/stores/teams.store'

const TYPE = {
  announcement: { label: 'إعلان', cls: 'is-answered', icon: markRaw(Megaphone) },
  file: { label: 'ملف', cls: 'is-closed', icon: markRaw(FileText) },
  rating: { label: 'تقييم', cls: 'is-awaiting', icon: markRaw(Star) },
  task: { label: 'مهمة', cls: 'is-awaiting', icon: markRaw(ListTodo) }
}
const STATUS = { pending: 'لم تبدأ', in_progress: 'قيد التنفيذ', review: 'قيد المراجعة', done: 'مكتملة' }
const STAFF = ['supervisor', 'committee', 'super_admin']
const rtf = new Intl.RelativeTimeFormat('ar', { numeric: 'auto' })

export default {
  name: 'AnnouncementsDesk',

  components: { ArrowRight, BaseSelect, Download, FileText, Inbox, ListTodo, Paperclip, Search, Star, UcasLogo },

  data() {
    return {
      ROLE_LABELS,
      TYPE,
      STATUS,
      kindFilter: '',
      q: '',
      sender: '',
      sort: 'newest',
      items: [],
      loading: true,
      current: null,
      mobileOpen: false
    }
  },

  computed: {
    ...mapState(useAuthStore, ['userRole', 'user']),
    ...mapState(useTeamsStore, ['teams']),
    // أنواع المراسلة (بديل التبويبات): مُرشّح "النوع" بعدد كل نوع
    types() {
      const ratings = !['student', 'supervisor'].includes(this.userRole)
      return [
        { value: '', label: 'كل الوارد' },
        { value: 'announcement', label: 'الإعلانات' },
        { value: 'file', label: 'الملفات' },
        { value: 'task', label: 'المهام' },
        ...(ratings ? [{ value: 'rating', label: 'التقييمات' }] : [])
      ]
    },
    // خيارات مُرشّح النوع مع عدد كل نوع
    typeOptions() {
      return this.types.map((t) => ({
        value: t.value,
        label: t.value ? `${t.label} (${this.count(t.value)})` : `كل الوارد (${this.items.length})`
      }))
    },
    typeLabel() {
      return this.types.find((t) => t.value === this.kindFilter)?.label
    },
    senders() {
      return [...new Set(this.items.map((a) => a.author?.name).filter(Boolean))]
    },
    sortOptions() {
      return [
        { value: 'newest', label: 'الأحدث أولًا' },
        { value: 'oldest', label: 'الأقدم أولًا' }
      ]
    },
    // زر "فتح في لوحة المهام" يذهب لصفحة مهام صاحب الحساب
    tasksRoute() {
      if (this.userRole === 'student') return 'student-tasks'
      if (this.userRole === 'supervisor') return 'supervisor-my-tasks'
      return 'committee-my-tasks'
    },
    shown() {
      const q = this.q
      return this.items
        .filter((a) => (!this.kindFilter || this.kind(a) === this.kindFilter) && (!this.sender || a.author?.name === this.sender) &&
          (!q || `${a.title || ''} ${a.body || ''} ${a.author?.name || ''} ${(a.attachments || []).map((f) => f.name).join(' ')}`.includes(q)))
        .sort((x, y) => (this.sort === 'oldest' ? 1 : -1) * (new Date(x.created_at) - new Date(y.created_at)))
    }
  },

  created() {
    this.load()
  },

  methods: {
    formatFileSize,

    // GET /announcements — ما وُجّه للمستخدم أو لفرقه (الإرسال الواحد يظهر مرة واحدة)
    async load() {
      this.loading = true
      try {
        const { data } = await api.get('/announcements')
        this.items = data.data || data
        // المشرف بلا تقييمات
        if (this.userRole === 'supervisor') this.items = this.items.filter((a) => this.kind(a) !== 'rating')
        if (this.userRole === 'student') {
          this.items = this.items.filter((a) => this.kind(a) !== 'rating')
          this.items = [...this.items, ...(await this.staffTasks())]
        } else if (['supervisor', 'committee'].includes(this.userRole)) {
          this.items = [...this.items, ...(await this.myTasks())]
        }
        // على الشاشات العريضة يُفتح أول عنصر تلقائيًا (كصناديق البريد)؛ على الجوال التفاصيل صفحة كاملة فلا تُفتح وحدها
        this.current = this.items.find((a) => a.id === this.current?.id) || (window.innerWidth >= 1024 ? this.shown[0] : null) || null
      } catch (err) {
        this.$toast?.error(err.normalized?.message || 'تعذّر تحميل الإعلانات')
      } finally {
        this.loading = false
      }
    },

    /** GET /teams/{id}/tasks — مهام فريق الطالب التي أنشأها المشرف أو اللجنة أو الإدارة، بشكل المراسلة */
    async staffTasks() {
      const teams = useTeamsStore()
      await teams.fetchTeams()
      const team = this.teams.find((t) => t.members?.some((m) => m.student?.id === this.user?.id))
      if (!team) return []
      try {
        const { data } = await api.get(`/teams/${team.id}/tasks`)
        return (data.data || data)
          .filter((t) => STAFF.includes(t.created_by?.role))
          .map((t) => ({ ...t, id: `t${t.id}`, type: 'task', body: t.description || '', author: t.created_by, attachments: [] }))
      } catch {
        return []
      }
    },

    /** المشرف/اللجنة: المهام المسندة لهم (GET /tasks?audience=…&assignee_id=me) بشكل المراسلة */
    async myTasks() {
      try {
        const audience = this.userRole === 'supervisor' ? 'supervisors' : 'committee'
        const { data } = await api.get('/tasks', { params: { audience, assignee_id: this.user?.id } })
        return (data.data || []).map((t) => ({ ...t, id: `t${t.id}`, type: 'task', body: t.description || '', author: t.created_by, attachments: [] }))
      } catch {
        return []
      }
    },

    kind(a) {
      return ['file', 'rating', 'task'].includes(a.type) ? a.type : a.rating ? 'rating' : 'announcement'
    },

    titleOf(a) {
      return a.title || TYPE[this.kind(a)].label
    },

    /** سطر مختصر أسفل العنوان: نص الإعلان، وإلا أسماء المرفقات */
    snippetOf(a) {
      return a.body || (a.attachments?.length ? a.attachments.map((f) => f.name).join('، ') : '—')
    },

    count(type) {
      return type ? this.items.filter((a) => this.kind(a) === type).length : this.items.length
    },

    open(a) {
      this.current = a
      this.mobileOpen = true
    },

    async download(f) {
      if (isPlaceholder(f)) return this.$toast?.info(`${f.name} — ملف تجريبي`)
      try {
        await downloadAttachment(f)
      } catch {
        this.$toast?.error('تعذّر تنزيل الملف')
      }
    },

    async downloadAll() {
      for (const f of this.current.attachments) await this.download(f)
    },

    when(d) {
      return d ? new Date(d).toLocaleString('ar-EG', { dateStyle: 'medium', timeStyle: 'short' }) : ''
    },

    ago(d) {
      if (!d) return ''
      const mins = Math.round((new Date(d) - Date.now()) / 60000)
      if (Math.abs(mins) < 60) return rtf.format(mins, 'minute')
      if (Math.abs(mins) < 1440) return rtf.format(Math.round(mins / 60), 'hour')
      if (Math.abs(mins) < 10080) return rtf.format(Math.round(mins / 1440), 'day')
      return new Date(d).toLocaleDateString('ar-EG', { day: 'numeric', month: 'short' })
    }
  }
}
</script>
