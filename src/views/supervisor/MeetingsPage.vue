<template>
  <!-- اجتماعات المشرف: الجدول فيه كل اجتماعات المشرف، والفلاتر (مجموعة + حالة + بحث + ترتيب) تضيّق المعروض -->
  <div class="dash svm-page">
    <SkeletonLoader v-if="loading" variant="table" :cols="5" :rows="4" />
    <p v-else-if="!myTeams.length" class="palert is-info"><CalendarDays :size="18" /><span>لا توجد مجموعات مُسندة إليك</span></p>

    <template v-else>
      <!-- فلاتر: المجموعة + الحالة + البحث + الترتيب — والجدول يعرض كل الاجتماعات -->
      <div class="gr-filters svm-filters">
        <label class="gr-search">
          <Search :size="16" />
          <input v-model.trim="q" type="search" placeholder="بحث باسم الاجتماع أو في الملاحظات…">
        </label>
        <BaseSelect
          v-model="group"
          class="sup-select"
          aria-label="المجموعة"
          placeholder="كل المجموعات"
          include-placeholder-option
          :options="groupOptions"
        />
        <BaseSelect
          v-model="status"
          class="sup-select"
          aria-label="الحالة"
          placeholder="كل الاجتماعات"
          include-placeholder-option
          :options="statusOptions"
        />
        <BaseSelect v-model="sort" class="sup-select" aria-label="الترتيب" :options="sortOptions" />
      </div>

      <!-- جدول الاجتماعات: اسم الاجتماع (والملاحظات تحته) ثم المجموعة ثم الموعد ثم الحالة ثم الإجراءات -->
      <section class="gr gr-card">
        <header class="gr-card-head">
          <div class="gr-card-title">
            <h3>{{ listTitle }}</h3>
            <span>{{ scopeName }}</span>
          </div>
          <div class="gr-card-actions">
            <button type="button" class="pbtn is-green" @click="openCreate"><Plus :size="16" /> اجتماع جديد</button>
          </div>
        </header>

        <p v-if="nextMeeting && status !== 'past'" class="palert is-info svm-next">
          <CalendarClock :size="18" />
          <span><b>الاجتماع القادم:</b> {{ nextMeeting.title }} — {{ nextMeeting.date }} الساعة {{ nextMeeting.time }} ({{ nextMeeting.when }})</span>
        </p>

        <div class="gr-table-wrap">
          <table class="gr-table">
            <thead>
              <tr>
                <th>اسم الاجتماع</th>
                <th v-if="!group">المجموعة</th>
                <th>الموعد</th>
                <th>الحالة</th>
                <th>الإجراءات</th>
              </tr>
            </thead>
            <tbody>
              <SkeletonLoader v-if="meetingsLoading" variant="table" :cols="5" :rows="3" />
              <tr v-for="m in rows" :key="m.id" class="gr-row">
                <td class="pt-strong">
                  {{ m.title }}
                  <span v-if="m.notes" class="svm-note">{{ m.notes }}</span>
                </td>
                <td v-if="!group" class="pt-muted">{{ m.teamLabel }}</td>
                <td class="mono">
                  {{ m.date }}
                  <span class="svm-when">{{ m.time }}</span>
                </td>
                <td><span :class="['svm-pill', m.past ? 'is-done' : 'is-next']">{{ m.past ? 'منتهٍ' : m.when }}</span></td>
                <td>
                  <span v-if="m.past" class="pt-muted">—</span>
                  <span v-else class="svm-acts">
                    <a v-if="m.link" :href="m.link" target="_blank" rel="noopener" class="pbtn is-cyan is-sm"><VideoIcon :size="15" /> انضمام</a>
                    <button v-if="leaderOf(m.teamId)?.whatsapp" type="button" class="pbtn is-outline is-sm" @click="sendReminder(m)"><MessageCircle :size="15" /> تذكير</button>
                    <button type="button" class="pbtn is-outline is-sm is-red-text" @click="cancelTarget = m"><Trash2 :size="15" /> إلغاء</button>
                  </span>
                </td>
              </tr>
              <tr v-if="!meetingsLoading && !rows.length">
                <td :colspan="group ? 4 : 5" class="gr-empty">
                  {{ status === 'upcoming' ? 'لا توجد اجتماعات قادمة حاليًا' : status === 'past' ? 'لا توجد اجتماعات منتهية بعد' : 'لا توجد اجتماعات مطابقة للفلاتر' }}
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <div class="gr-sumbar">
          <span>عدد الاجتماعات: {{ scoped.length }}</span>
          <span>القادمة: {{ scopedUpcoming.length }}</span>
          <span>المنتهية: {{ scopedDone.length }}</span>
        </div>
      </section>
    </template>

    <!-- اجتماع جديد: POST /teams/{id}/meetings — المجموعة، الاسم، الموعد، الرابط، الملاحظات -->
    <BaseModal v-model="createOpen" title="اجتماع جديد" size="md">
      <form id="sup-meeting-form" class="sp-form" @submit.prevent="create">
        <label class="pfield">
          <span>المجموعة <b class="as-req">*</b></span>
          <select v-model="form.teamId" class="gr-select">
            <option v-for="o in teamOptions" :key="o.value" :value="o.value">{{ o.label }}</option>
          </select>
        </label>
        <label class="pfield">
          <span>اسم الاجتماع <b class="as-req">*</b></span>
          <input v-model.trim="form.title" type="text" maxlength="200" placeholder="مثال: مراجعة الفصل الثاني">
        </label>
        <label class="pfield">
          <span>موعد الاجتماع <b class="as-req">*</b></span>
          <input v-model="form.at" type="datetime-local" :min="minAt">
        </label>
        <label class="pfield">
          <span>رابط الاجتماع</span>
          <input v-model.trim="form.link" type="url" dir="ltr" placeholder="https://meet.google.com/…">
        </label>
        <label class="pfield">
          <span>ملاحظات</span>
          <textarea v-model.trim="form.notes" rows="3" placeholder="جدول الأعمال أو ما يجب تجهيزه" />
        </label>
      </form>
      <template #footer>
        <span :class="['as-summary', !canCreate && 'is-missing']">{{ canCreate ? 'سيُبلَّغ طلاب المجموعة بالاجتماع' : 'اختر المجموعة وأدخل اسم الاجتماع وموعده' }}</span>
        <button type="button" class="pbtn is-outline" @click="createOpen = false">إلغاء</button>
        <button type="submit" form="sup-meeting-form" class="pbtn is-green" :disabled="!canCreate || saving"><Plus :size="16" /> {{ saving ? 'جارٍ الإنشاء…' : 'إنشاء الاجتماع' }}</button>
      </template>
    </BaseModal>

    <!-- تأكيد إلغاء الاجتماع: DELETE /meetings/{id} -->
    <BaseModal :model-value="!!cancelTarget" title="إلغاء الاجتماع" size="sm" @update:model-value="!$event && (cancelTarget = null)">
      <p>سيُلغى اجتماع «{{ cancelTarget?.title }}» ({{ cancelTarget?.date }} الساعة {{ cancelTarget?.time }}).</p>
      <template #footer>
        <button type="button" class="pbtn is-outline" @click="cancelTarget = null">رجوع</button>
        <button type="button" class="pbtn is-red" :disabled="cancelling" @click="cancel"><Trash2 :size="15" /> {{ cancelling ? 'جارٍ الإلغاء…' : 'تأكيد الإلغاء' }}</button>
      </template>
    </BaseModal>
  </div>
</template>

<script>
import { mapState, mapActions } from 'pinia'
import { CalendarClock, CalendarDays, MessageCircle, Plus, Search, Trash2, Video as VideoIcon } from 'lucide-vue-next'
import BaseModal from '@/components/ui/BaseModal.vue'
import BaseSelect from '@/components/ui/BaseSelect.vue'
import { useTeamsStore } from '@/stores/teams.store'
import { useAuthStore } from '@/stores/auth.store'
import api, { sendWhatsapp } from '@/services/api'

const DAY = 864e5

export default {
  name: 'SupervisorMeetingsPage',

  components: { BaseModal, BaseSelect, CalendarClock, CalendarDays, MessageCircle, Plus, Search, Trash2, VideoIcon },

  data() {
    return {
      loading: true,
      meetingsLoading: true,
      status: '',
      q: '',
      sort: 'soon',
      /** فلتر المجموعة — فارغ = كل المجموعات (والجدول يعرض كل الاجتماعات) */
      group: '',
      /** اجتماعات كل مجموعة — لجمع كل اجتماعات المشرف في جدول واحد */
      teamMeetings: {},
      createOpen: false,
      saving: false,
      cancelTarget: null,
      cancelling: false,
      form: {}
    }
  },

  computed: {
    ...mapState(useTeamsStore, ['teamsForDisplay', 'teams']),
    ...mapState(useAuthStore, ['user']),

    myTeams() {
      return this.teamsForDisplay.filter((t) => t.supId === this.user?.id)
    },

    teamOptions() {
      return this.myTeams.map((t) => ({ value: t.id, label: t.section ? `شعبة ${t.section}` : t.name, name: t.name }))
    },

    /** خيارات فلتر المجموعة في شريط الفلاتر */
    groupOptions() {
      return this.myTeams.map((t) => ({ value: t.id, label: t.section ? `شعبة ${t.section}` : t.name }))
    },

    statusOptions() {
      return [
        { value: 'upcoming', label: 'القادمة' },
        { value: 'past', label: 'المنتهية' }
      ]
    },

    sortOptions() {
      return [
        { value: 'soon', label: 'القادمة الأقرب أولًا' },
        { value: 'new', label: 'الأحدث أولًا' },
        { value: 'old', label: 'الأقدم أولًا' },
        { value: 'title', label: 'العنوان أبجديًا' }
      ]
    },

    /** كل اجتماعات مجموعات المشرف، مرتّبة بالأقرب زمنًا */
    allMeetings() {
      const now = Date.now()
      return this.myTeams
        .flatMap((t) => (this.teamMeetings[t.id] || []).map((m) => ({ ...m, teamId: m.team_id ?? t.id, teamLabel: t.section ? `شعبة ${t.section}` : t.name })))
        .map((m) => {
          const at = new Date(m.scheduled_at)
          const days = Math.ceil((at.getTime() - now) / DAY)
          return {
            ...m,
            at: at.getTime(),
            date: at.toLocaleDateString('en-CA'),
            time: at.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }),
            link: m.google_meet_link || '',
            notes: m.notes || '',
            past: at.getTime() < now,
            when: days <= 0 ? 'اليوم' : days === 1 ? 'غدًا' : `بعد ${days} أيام`
          }
        })
        .sort((a, b) => a.at - b.at)
    },

    /** نطاق العرض: كل المجموعات أو مجموعة بعينها (فلتر المجموعة) */
    scoped() {
      return this.group ? this.allMeetings.filter((m) => m.teamId === this.group) : this.allMeetings
    },

    scopedUpcoming() {
      return this.scoped.filter((m) => !m.past)
    },

    scopedDone() {
      return this.scoped.filter((m) => m.past)
    },

    /** الصفوف المعروضة: النطاق + حالة + بحث + ترتيب */
    rows() {
      let list = this.scoped
      if (this.status === 'upcoming') list = list.filter((m) => !m.past)
      else if (this.status === 'past') list = list.filter((m) => m.past)
      const q = this.q.toLowerCase()
      if (q) list = list.filter((m) => `${m.title} ${m.notes} ${m.teamLabel}`.toLowerCase().includes(q))
      if (this.sort === 'new') return [...list].sort((a, b) => b.at - a.at)
      if (this.sort === 'old') return [...list].sort((a, b) => a.at - b.at)
      if (this.sort === 'title') return [...list].sort((a, b) => (a.title || '').localeCompare(b.title || '', 'ar'))
      // الافتراضي: القادمة الأقرب أولًا ثم المنتهية الأحدث أولًا
      return [...list].sort((a, b) => (a.past === b.past ? (a.past ? b.at - a.at : a.at - b.at) : a.past ? 1 : -1))
    },

    nextMeeting() {      return this.scopedUpcoming[0] || null
    },

    listTitle() {
      if (this.status === 'upcoming') return 'الاجتماعات القادمة'
      if (this.status === 'past') return 'الاجتماعات المنتهية'
      return 'كل الاجتماعات'
    },

    scopeName() {
      const t = this.myTeams.find((x) => x.id === this.group)
      return t ? (t.section ? `شعبة ${t.section}` : t.name) : 'كل المجموعات'
    },

    canCreate() {
      return !!this.form.teamId && !!this.form.title && !!this.form.at
    },

    minAt() {
      const d = new Date(Date.now() - new Date().getTimezoneOffset() * 6e4)
      return d.toISOString().slice(0, 16)
    }
  },

  async created() {
    try {
      await this.fetchTeams()
    } catch {
      this.$toast?.error('تعذّر تحميل المجموعات')
    }
    await this.loadAllMeetings()
    this.loading = false
    this.meetingsLoading = false
  },

  methods: {
    ...mapActions(useTeamsStore, ['fetchTeams', 'createMeeting', 'deleteMeeting']),

    leaderOf(teamId) {
      return this.teams.find((t) => t.id === teamId)?.leader || null
    },

    /** اجتماعات كل المجموعات — بالتوازي حتى لا تتأخر البطاقة الأولى */
    async loadAllMeetings() {
      const results = await Promise.all(
        this.myTeams.map(async (t) => {
          try {
            const { data } = await api.get(`/teams/${t.id}/meetings`)
            return [t.id, data.data || data]
          } catch {
            return [t.id, []]
          }
        })
      )
      this.teamMeetings = Object.fromEntries(results)
    },

    /** إعادة تحميل اجتماعات مجموعة واحدة (بعد إنشاء أو إلغاء) */
    async refreshTeam(teamId) {
      try {
        const { data } = await api.get(`/teams/${teamId}/meetings`)
        this.teamMeetings = { ...this.teamMeetings, [teamId]: data.data || data }
      } catch {
        /* البقية تُعرض من آخر تحميل */
      }
    },

    openCreate() {
      this.form = { teamId: this.group || this.teamOptions[0]?.value, title: '', at: '', link: '', notes: '' }
      this.createOpen = true
    },

    async create() {
      if (!this.canCreate) return
      this.saving = true
      try {
        const f = this.form
        await this.createMeeting(f.teamId, { title: f.title, scheduled_at: `${f.at.replace('T', ' ')}:00`, google_meet_link: f.link || null, notes: f.notes || null })
        this.$toast?.success('تم إنشاء الاجتماع')
        this.createOpen = false
        this.status = 'upcoming'
        await this.refreshTeam(f.teamId)
      } catch (err) {
        this.$toast?.error(err.normalized?.message || 'تعذّر إنشاء الاجتماع')
      } finally {
        this.saving = false
      }
    },

    async cancel() {
      this.cancelling = true
      const target = this.cancelTarget
      try {
        await this.deleteMeeting(target.id)
        this.cancelTarget = null
        this.$toast?.success('تم إلغاء الاجتماع')
        await this.refreshTeam(target.teamId)
      } catch (err) {
        this.$toast?.error(err.normalized?.message || 'تعذّر إلغاء الاجتماع')
      } finally {
        this.cancelling = false
      }
    },

    async sendReminder(m) {
      const leader = this.leaderOf(m.teamId)
      if (!leader?.whatsapp) return this.$toast?.error('رقم واتساب قائد المجموعة غير متاح')
      const text = [`تذكير باجتماع: ${m.title}`, `التاريخ: ${m.date}`, `الوقت: ${m.time}`, m.link && `الرابط: ${m.link}`, m.notes && `الملاحظات: ${m.notes}`].filter(Boolean).join('\n')
      try {
        const res = await sendWhatsapp({ whats: leader.whatsapp, name: leader.name, user_id: leader.id }, text, 'meeting')
        if (res.queued) this.$toast?.success('تم إرسال التذكير عبر واتساب')
        else this.$toast?.error('رقم الواتساب غير صالح للإرسال')
      } catch (err) {
        this.$toast?.error(err.normalized?.message || 'تعذّر إرسال التذكير')
      }
    }
  }
}
</script>
