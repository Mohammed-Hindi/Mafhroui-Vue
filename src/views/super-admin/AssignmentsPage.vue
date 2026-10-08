<template>
  <!-- التكليفات والإعلانات — إنشاء مهمة أو إعلان أو ملف وإرساله لمجموعات محددة أو لكل المجموعات أو للمشرفين (نمط Classroom) -->
  <div class="dash">
    <header class="dash-head">
      <div>
        <h2 class="dash-title">التكليفات والإعلانات</h2>
        <p class="dash-sub">أنشئ مهمة أو إعلانًا أو ملفًا وحدّد المستلمين بالفلاتر (التخصص، الدرجة، طلاب/طالبات، المكان، المشرف)</p>
      </div>
    </header>

    <nav class="rv-tabs as-types" aria-label="نوع التكليف">
      <button v-for="t in types" :key="t.value" type="button" :class="['rv-tab', type === t.value && 'is-active']" @click="setType(t.value)">
        <component :is="t.icon" :size="16" /> {{ t.label }}
      </button>
    </nav>

    <!-- تقييم المشرفين: نجوم + ملاحظات لكل مشرف حسب تقدّم مجموعاته، تُرسل كإعلان للمشرفين -->
    <section v-if="type === 'rating'" class="dash-card">
      <div class="dash-card-head">
        <h3>تقييم المشرفين وتقدّم مجموعاتهم</h3>
        <span class="dash-chip">قُيّم {{ ratedCount }} من {{ supervisors.length }}</span>
      </div>
      <label class="pfield">
        <span>رسالة عامة للمشرفين (اختياري)</span>
        <textarea v-model.trim="form.body" rows="2" placeholder="مثال: نشكر جهودكم، نرجو متابعة المجموعات المتأخرة قبل موعد المناقشات" />
      </label>
      <ul class="as-ratings">
        <li v-for="s in supervisors" :key="s.id" :class="rating[s.id].stars && 'is-on'">
          <div class="as-rating-head">
            <b>{{ s.name }}</b>
            <span class="pt-muted">{{ s.groups }} مجموعات · متوسط التقدّم</span>
            <span class="gr-progress is-sm"><span :class="level(s.progress)" :style="{ width: s.progress + '%' }" /></span>
            <span class="gr-pct">{{ s.progress }}%</span>
          </div>
          <div class="as-stars" role="radiogroup" :aria-label="`تقييم ${s.name}`">
            <button
              v-for="n in 5" :key="n" type="button" role="radio" :aria-checked="rating[s.id].stars === n" :aria-label="`${n} من 5`"
              :class="n <= rating[s.id].stars && 'is-on'" @click="rating[s.id].stars = rating[s.id].stars === n ? 0 : n"
            >
              <Star :size="20" :fill="n <= rating[s.id].stars ? 'currentColor' : 'none'" />
            </button>
          </div>
          <input v-model.trim="rating[s.id].note" type="text" class="ev-input" :placeholder="`ملاحظة لـ ${s.name} حول تقدّم مجموعاته`">
        </li>
      </ul>
      <div class="as-submit">
        <span class="pt-muted">يصل لكل مشرف تقييمه وملاحظته فقط</span>
        <button type="button" class="pbtn is-green" :disabled="!ratedCount || sending" @click="sendRatings">
          <Send :size="16" /> {{ sending ? `جارٍ الإرسال… ${done}/${total}` : `إرسال التقييم (${ratedCount})` }}
        </button>
      </div>
      <div v-if="results.length" class="as-results">
        <div class="palert is-success">تم إرسال التقييم إلى {{ results.length }} مشرفين.</div>
      </div>
    </section>

    <div v-else class="as-layout">
      <!-- النموذج -->
      <section class="dash-card">
        <div class="dash-card-head"><h3>{{ typeLabel }}</h3></div>
        <form class="as-form" @submit.prevent="submit">
          <label v-if="type !== 'file'" class="pfield">
            <span>العنوان <template v-if="type === 'task'">*</template></span>
            <input v-model.trim="form.title" type="text" maxlength="200" :placeholder="type === 'task' ? 'مثال: تسليم الفصل الثاني من التقرير' : 'مثال: تنبيه بخصوص موعد المناقشات'">
          </label>
          <label v-if="type !== 'file'" class="pfield">
            <span>{{ type === 'task' ? 'الوصف والملاحظات' : 'نص الإعلان *' }}</span>
            <textarea v-model.trim="form.body" :maxlength="type === 'announcement' ? 2000 : undefined" />
          </label>
          <label v-if="type === 'task'" class="pfield">
            <span>الموعد النهائي للتسليم</span>
            <input v-model="form.due" type="date">
          </label>
          <template v-if="type === 'file'">
            <label class="pfield">
              <span>وصف الملف / المرحلة</span>
              <input v-model.trim="form.stage" type="text" maxlength="120" placeholder="مثال: نموذج التقرير النهائي">
            </label>
            <label class="pfield">
              <span>الملف *</span>
              <input type="file" @change="form.file = $event.target.files[0] || null">
              <small>يُرفع لمشروع كل مجموعة محددة (المجموعات بلا مشروع تُتخطّى).</small>
            </label>
          </template>

          <!-- المكلّفون: عند اختيار مجموعة واحدة يمكن تحديد طلاب بعينهم -->
          <div v-if="type === 'task' && audience === 'groups' && selected.length === 1" class="pfield">
            <span>المكلّفون من {{ singleGroup.name }}</span>
            <div class="as-assignees">
              <label v-for="m in singleGroup.members" :key="m.id" class="gp-check">
                <input v-model="form.assignees" type="checkbox" :value="m.id"> {{ m.name }}
              </label>
            </div>
            <small>بدون تحديد = المهمة لكل أعضاء المجموعة.</small>
          </div>

          <div v-if="type === 'announcement' && audience === 'supervisors'" class="pfield">
            <span>قناة الإرسال للمشرفين</span>
            <select v-model="form.channel">
              <option value="whatsapp">واتساب</option>
              <option value="email">البريد الإلكتروني</option>
            </select>
          </div>

          <div class="as-submit">
            <span class="pt-muted">{{ summary }}</span>
            <button type="submit" class="pbtn is-green" :disabled="!canSubmit || sending">
              <Send :size="16" /> {{ sending ? `جارٍ الإرسال… ${done}/${total}` : 'إرسال' }}
            </button>
          </div>
        </form>

        <div v-if="results.length" class="as-results">
          <div :class="['palert', failed.length ? 'is-warning' : 'is-success']">
            تم الإرسال إلى {{ results.length - failed.length }} من {{ results.length }}.
          </div>
          <ul v-if="failed.length">
            <li v-for="r in failed" :key="r.label" class="pt-muted">✕ {{ r.label }} — {{ r.error }}</li>
          </ul>
        </div>
      </section>

      <!-- المستلمون -->
      <section class="dash-card">
        <div class="dash-card-head">
          <h3>المستلمون</h3>
          <div class="hm-tabs">
            <button type="button" :class="audience === 'groups' && 'is-active'" @click="audience = 'groups'">مجموعات محددة</button>
            <button type="button" :class="audience === 'all' && 'is-active'" @click="audience = 'all'">كل المجموعات</button>
            <button v-if="type === 'announcement'" type="button" :class="audience === 'supervisors' && 'is-active'" @click="audience = 'supervisors'">المشرفون</button>
          </div>
        </div>

        <p v-if="loading" class="pt-muted">جارٍ تحميل المجموعات…</p>
        <GroupPicker v-else-if="audience === 'groups'" v-model="selected" :groups="groups" />
        <div v-else-if="audience === 'all'" class="palert is-info">سيُرسل إلى كل مجموعات الفصل ({{ groups.length }} مجموعة، {{ allStudents }} طالبًا).</div>
        <div v-else>
          <label class="gp-check gp-bar">
            <input type="checkbox" :checked="supSelected.length === supervisors.length" @change="supSelected = supSelected.length === supervisors.length ? [] : supervisors.map((s) => s.id)">
            كل المشرفين ({{ supervisors.length }})
          </label>
          <ul class="gp-list">
            <li v-for="s in supervisors" :key="s.id">
              <label :class="['gp-item', supSelected.includes(s.id) && 'is-on']">
                <input v-model="supSelected" type="checkbox" :value="s.id">
                <span class="gp-item-main"><b>{{ s.name }}</b><span class="pt-muted mono">{{ form.channel === 'email' ? s.email || 'بلا بريد' : s.whatsapp || 'بلا واتساب' }}</span></span>
                <span class="pt-muted">{{ s.groups }} مجموعات</span>
              </label>
            </li>
          </ul>
        </div>
      </section>
    </div>
  </div>
</template>

<script>
import { ListTodo, Megaphone, Paperclip, Send, Star } from 'lucide-vue-next'
import GroupPicker from '@/components/shared/GroupPicker.vue'

import api, { sendEmail } from '@/services/api'
import { fetchGroups, level } from '@/utils/progressData'

const emptyForm = () => ({ title: '', body: '', due: '', stage: '', file: null, assignees: [], channel: 'whatsapp' })

export default {
  name: 'AssignmentsPage',

  components: { Send, Star, GroupPicker },

  data() {
    return {
      types: [
        { value: 'task', label: 'مهمة', icon: ListTodo },
        { value: 'announcement', label: 'إعلان', icon: Megaphone },
        { value: 'file', label: 'ملف', icon: Paperclip },
        { value: 'rating', label: 'تقييم المشرفين', icon: Star }
      ],
      type: 'task',
      audience: 'groups',
      groups: [],
      rating: {},
      loading: true,
      selected: [],
      supSelected: [],
      form: emptyForm(),
      sending: false,
      done: 0,
      total: 0,
      results: []
    }
  },

  computed: {
    typeLabel() {
      return { task: 'مهمة جديدة', announcement: 'إعلان جديد', file: 'رفع ملف' }[this.type]
    },
    singleGroup() {
      return this.groups.find((g) => g.id === this.selected[0]) || { members: [] }
    },
    targetGroups() {
      return this.audience === 'all' ? this.groups : this.groups.filter((g) => this.selected.includes(g.id))
    },
    supervisors() {
      const map = new Map()
      this.groups.forEach((g) => g.sup.id && !map.has(g.sup.id) && map.set(g.sup.id, g.sup))
      return [...map.values()].map((s) => {
        const own = this.groups.filter((g) => g.sup.id === s.id)
        return { ...s, groups: own.length, progress: own.length ? Math.round(own.reduce((n, g) => n + g.percentage, 0) / own.length) : 0 }
      })
    },
    ratedCount() {
      return Object.values(this.rating).filter((r) => r.stars).length
    },
    allStudents() {
      return this.groups.reduce((n, g) => n + g.members.length, 0)
    },
    summary() {
      if (this.audience === 'supervisors') return `${this.supSelected.length} مشرفًا`
      return `${this.targetGroups.length} مجموعة`
    },
    canSubmit() {
      const recipients = this.audience === 'supervisors' ? this.supSelected.length : this.targetGroups.length
      if (!recipients) return false
      if (this.type === 'task') return !!this.form.title
      if (this.type === 'announcement') return !!this.form.body
      return !!this.form.file
    },
    failed() {
      return this.results.filter((r) => !r.ok)
    }
  },

  async created() {
    try {
      this.groups = await fetchGroups()
      this.rating = Object.fromEntries(this.supervisors.map((s) => [s.id, { stars: 0, note: '' }]))
    } catch {
      this.$toast?.error('تعذّر تحميل المجموعات')
    } finally {
      this.loading = false
    }
  },

  methods: {
    level,

    setType(t) {
      this.type = t
      if (t !== 'announcement' && this.audience === 'supervisors') this.audience = 'groups'
      this.results = []
    },

    /** يرسل لكل مستلم على التوالي ويجمع النتائج */
    async run(items, label, fn) {
      this.sending = true
      this.done = 0
      this.total = items.length
      const results = []
      for (const item of items) {
        try {
          await fn(item)
          results.push({ label: label(item), ok: true })
        } catch (err) {
          results.push({ label: label(item), ok: false, error: err.normalized?.message || err.message || 'خطأ' })
        }
        this.done += 1
      }
      this.results = results
      this.sending = false
      const ok = results.filter((r) => r.ok).length
      ok ? this.$toast?.success(`تم الإرسال إلى ${ok} من ${results.length}`) : this.$toast?.error('تعذّر الإرسال')
      if (ok === results.length) this.form = { ...emptyForm(), channel: this.form.channel }
      return results
    },

    async submit() {
      if (!this.canSubmit || this.sending) return
      const f = this.form

      if (this.audience === 'supervisors') {
        const sups = this.supervisors.filter((s) => this.supSelected.includes(s.id))
        const message = f.title ? `${f.title}\n\n${f.body}` : f.body
        if (f.channel === 'email') {
          return this.run(sups.filter((s) => s.email), (s) => s.name, (s) => sendEmail({ to: s.email, subject: f.title || 'إعلان من الإدارة العامة — مسار', message: f.body }))
        }
        const recipients = sups.filter((s) => s.whatsapp).map((s) => ({ phone: s.whatsapp, name: s.name, user_id: s.id }))
        return this.run([recipients], () => `${recipients.length} مشرفًا (واتساب)`, (list) => api.post('/whatsapp/send', { recipients: list, message, context: 'announcement' }))
      }

      const groups = this.targetGroups
      if (this.type === 'task') {
        const assignees = this.selected.length === 1 && this.audience === 'groups' ? f.assignees : []
        return this.run(groups, (g) => g.name, (g) => api.post(`/teams/${g.id}/tasks`, {
          title: f.title,
          description: f.body || null,
          due_date: f.due || null,
          ...(assignees.length ? { assignee_ids: assignees } : {})
        }))
      }
      if (this.type === 'announcement') {
        return this.run(groups, (g) => g.name, (g) => api.post(`/teams/${g.id}/announcements`, { title: f.title || null, body: f.body }))
      }
      const withProject = groups.filter((g) => g.project)
      return this.run(withProject, (g) => g.name, (g) => {
        const fd = new FormData()
        fd.append('file', f.file)
        if (f.stage) fd.append('stage', f.stage)
        return api.post(`/projects/${g.project.id}/files`, fd, { headers: { 'Content-Type': 'multipart/form-data' } })
      })
    },

    /** تقييم المشرفين: إعلان لكل مشرف بنجومه وملاحظته (POST /announcements/supervisor) */
    async sendRatings() {
      const rated = this.supervisors.filter((s) => this.rating[s.id].stars)
      const general = this.form.body
      const results = await this.run(rated, (s) => `${s.name} — ${this.rating[s.id].stars}/5`, (s) => {
        const { stars, note } = this.rating[s.id]
        return api.post('/announcements/supervisor', {
          supervisor_id: s.id,
          title: 'تقييم تقدّم مجموعاتك',
          body: [note, general].filter(Boolean).join('\n\n') || `تقييم الإدارة العامة لتقدّم مجموعاتك: ${stars} من 5`,
          rating: stars
        })
      })
      results.forEach((r, i) => r.ok && (this.rating[rated[i].id] = { stars: 0, note: '' }))
    }
  }
}
</script>
