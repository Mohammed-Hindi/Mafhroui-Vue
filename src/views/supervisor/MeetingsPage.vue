<template>
  <!-- اجتماعات المشرف: بطاقة واحدة تجمع الفلاتر والجدول، والجدول يملأ ارتفاع الشاشة -->
  <div class="dash svm-page">
    <section class="gr gr-card svm-card">
      <!-- فلاتر: بحث + مجموعة + حالة + ترتيب + زر الإضافة -->
      <div class="svm-toolbar">
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
            :placeholder="statusPlaceholder"
            include-placeholder-option
            :disabled="!scopeCounts.total"
            :options="statusOptions"
          />
          <BaseSelect v-model="sort" class="sup-select" aria-label="الترتيب" :disabled="!scopeCounts.total" :options="sortOptions" />
          <button type="button" class="pbtn is-green svm-add" :disabled="!myTeams.length" @click="openCreate"><Plus :size="16" /> اجتماع جديد</button>
        </div>
      </div>

      <p v-if="nextMeeting && status !== 'past'" class="palert is-info svm-next">
        <CalendarClock :size="18" />
        <span><b>الاجتماع القادم:</b> {{ nextMeeting.title }} — {{ nextMeeting.date }} الساعة {{ nextMeeting.time }} ({{ nextMeeting.when }})</span>
      </p>

      <!-- جدول الاجتماعات: اسم الاجتماع (والملاحظات تحته) ثم المجموعة ثم الموعد ثم الحالة ثم الإجراءات -->
      <div class="gr-table-wrap svm-table-wrap">
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
            <SkeletonLoader v-if="loading || meetingsLoading" variant="table" :cols="5" :rows="4" />
            <tr v-for="m in rows" :key="m.id" class="gr-row">
              <td class="pt-strong">
                {{ m.title }}
                <span v-if="m.notes" class="svm-note">{{ m.notes }}</span>
              </td>
              <td v-if="!group" class="pt-muted">
                <button type="button" class="svm-team-link" @click="openTeam(m.teamId)">
                  <Users :size="14" />
                  <span>{{ m.teamLabel }}</span>
                  <b>{{ membersCount(m.teamId) }}</b>
                </button>
              </td>
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
            <tr v-if="!loading && !meetingsLoading && !rows.length">
              <td :colspan="group ? 4 : 5" class="gr-empty">
                {{ !myTeams.length ? 'لا توجد مجموعات مُسندة إليك' : status === 'upcoming' ? 'لا توجد اجتماعات قادمة حاليًا' : status === 'past' ? 'لا توجد اجتماعات منتهية بعد' : 'لا توجد اجتماعات مطابقة للفلاتر' }}
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

    <!-- تفاصيل المجموعة: الأعضاء بمعلوماتهم الكاملة + بيانات المشروع -->
    <BaseModal
      :model-value="teamOpen"
      :title="teamDetail?.name || 'تفاصيل المجموعة'"
      :description="teamSubtitle"
      size="xl"
      @update:model-value="!$event && closeTeam()"
    >
      <SkeletonLoader v-if="teamLoading" variant="list" :rows="3" />
      <div v-else-if="teamDetail" class="svm-team">
        <!-- بطاقات المعلومات: صف أفقي ياخد كل العرض بدل التكديس العمودي -->
        <div class="svm-meta">
          <div class="svm-meta-cell">
            <span class="svm-meta-label">المشروع</span>
            <span class="svm-meta-value">{{ teamDetail.project?.name || 'لم يُسجَّل مشروع بعد' }}</span>
          </div>
          <div class="svm-meta-cell">
            <span class="svm-meta-label">نوع المشروع</span>
            <span class="svm-meta-value">{{ teamDetail.project?.types?.join(' · ') || '—' }}</span>
          </div>
          <div class="svm-meta-cell">
            <span class="svm-meta-label">المشرف</span>
            <button v-if="teamDetail.supervisor?.id" type="button" class="svm-meta-link" @click="openSupervisor">
              {{ teamDetail.supervisor.name }} <UserRound :size="14" />
            </button>
            <span v-else class="svm-meta-value">—</span>
          </div>
          <div class="svm-meta-cell">
            <span class="svm-meta-label">قائد المجموعة</span>
            <span class="svm-meta-value">{{ teamDetail.leader?.name || '—' }}</span>
          </div>
          <div class="svm-meta-cell is-wide">
            <span class="svm-meta-label">وصف المشروع</span>
            <span class="svm-meta-desc">{{ teamDetail.project?.description || 'لا يوجد وصف للمشروع' }}</span>
          </div>
        </div>

        <!-- الأعضاء بمعلوماتهم الكاملة -->
        <section class="svm-team-members">
          <header class="svm-team-members-head">
            <h4>أعضاء المجموعة</h4>
            <b>{{ teamMembers.length }}</b>
          </header>
          <div class="gr-members">
            <table>
              <thead>
                <tr>
                  <th>الطالب</th>
                  <th>الرقم الجامعي</th>
                  <th>مكان التواجد</th>
                  <th>واتساب</th>
                  <th>البريد</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="mem in teamMembers" :key="mem.id">
                  <td>
                    <span class="svm-member">
                      <span class="gm-av" aria-hidden="true">{{ (mem.student?.name || '?').charAt(0) }}</span>
                      <span class="gr-member-name">{{ mem.student?.name || '—' }}</span>
                      <span v-if="mem.is_leader" class="svt-leader">قائد المجموعة</span>
                    </span>
                  </td>
                  <td><span class="mono">{{ mem.student?.university_number || '—' }}</span></td>
                  <td>{{ REGIONS[mem.student?.region] || '—' }}</td>
                  <td><span class="mono">{{ mem.student?.whatsapp || '—' }}</span></td>
                  <td><span class="mono">{{ mem.student?.email || '—' }}</span></td>
                </tr>
                <tr v-if="!teamMembers.length"><td colspan="5" class="gr-empty">لا يوجد أعضاء في هذه المجموعة</td></tr>
              </tbody>
            </table>
          </div>
        </section>
      </div>
      <p v-else class="gr-muted">تعذّر تحميل بيانات المجموعة</p>
    </BaseModal>

    <!-- بروفايل المشرف: يفتح من داخل بوب-أب المجموعة — GET /supervisors/{id}/profile -->
    <ProfileModal
      v-model="supervisorOpen"
      kind="supervisor"
      :person-id="teamDetail?.supervisor?.id"
      :name="teamDetail?.supervisor?.name || ''"
    />

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
import { CalendarClock, MessageCircle, Plus, Search, Trash2, UserRound, Users, Video as VideoIcon } from 'lucide-vue-next'
import BaseModal from '@/components/ui/BaseModal.vue'
import BaseSelect from '@/components/ui/BaseSelect.vue'
import ProfileModal from '@/components/shared/ProfileModal.vue'
import { useTeamsStore } from '@/stores/teams.store'
import { useAuthStore } from '@/stores/auth.store'
import api, { sendWhatsapp } from '@/services/api'
import { REGIONS } from '@/utils/progressData'

const DAY = 864e5

export default {
  name: 'SupervisorMeetingsPage',

  components: { BaseModal, BaseSelect, ProfileModal, CalendarClock, MessageCircle, Plus, Search, Trash2, UserRound, Users, VideoIcon },

  data() {
    return {
      REGIONS,
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
      form: {},
      /** بوب-أب تفاصيل المجموعة (أعضاء + مشروع) */
      teamOpen: false,
      teamLoading: false,
      teamDetail: null,
      /** بوب-أب بروفايل المشرف (يفتح من داخل بوب-أب المجموعة) */
      supervisorOpen: false
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

    /** ما هو متاح فعليًا داخل النطاق المختار (مجموعة) */
    scopeCounts() {
      const list = this.scoped
      return {
        total: list.length,
        upcoming: list.filter((m) => !m.past).length,
        past: list.filter((m) => m.past).length
      }
    },

    /** خيارات الحالة حيّة: ما في اجتماعات قادمة في النطاق؟ ما بيظهر خيار "القادمة" */
    statusOptions() {
      const opts = []
      if (this.scopeCounts.upcoming) opts.push({ value: 'upcoming', label: 'القادمة' })
      if (this.scopeCounts.past) opts.push({ value: 'past', label: 'المنتهية' })
      return opts
    },

    statusPlaceholder() {
      return this.scopeCounts.total ? 'كل الاجتماعات' : 'لا اجتماعات'
    },

    /** خيارات الترتيب حيّة: "القادمة الأقرب" تظهر فقط إذا في اجتماعات قادمة */
    sortOptions() {
      const opts = []
      if (this.scopeCounts.upcoming) opts.push({ value: 'soon', label: 'القادمة الأقرب أولًا' })
      opts.push({ value: 'new', label: 'الأحدث أولًا' })
      opts.push({ value: 'old', label: 'الأقدم أولًا' })
      opts.push({ value: 'title', label: 'العنوان أبجديًا' })
      return opts
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

    /** أعضاء المجموعة المعروضة في البوب-أب */
    teamMembers() {
      return this.teamDetail?.members || []
    },

    /** سطر العنوان الفرعي: الشعبة والتخصص */
    teamSubtitle() {
      if (!this.teamDetail) return ''
      const t = this.myTeams.find((x) => x.id === this.teamDetail.id)
      const parts = []
      if (this.teamDetail.section) parts.push(`شعبة ${this.teamDetail.section}`)
      if (t?.spec) parts.push(t.spec)
      parts.push(`${this.teamMembers.length} أعضاء`)
      return parts.join(' · ')
    },

    canCreate() {
      return !!this.form.teamId && !!this.form.title && !!this.form.at
    },

    minAt() {
      const d = new Date(Date.now() - new Date().getTimezoneOffset() * 6e4)
      return d.toISOString().slice(0, 16)
    }
  },

  watch: {
    /** تغيير المجموعة يغيّر المتاح فعليًا — نرجّع الاختيار الذي لم يعد متاحًا */
    group() {
      this.syncFilters()
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
    this.syncFilters()
  },

  methods: {
    ...mapActions(useTeamsStore, ['fetchTeams', 'createMeeting', 'deleteMeeting']),

    /** مزامنة الفلاتر مع الخيارات المتاحة: الحالة ترجع "الكل" والترتيب يرجع لأول خيار متاح */
    syncFilters() {
      if (this.status && !this.statusOptions.some((o) => o.value === this.status)) this.status = ''
      if (!this.sortOptions.some((o) => o.value === this.sort)) this.sort = this.sortOptions[0]?.value || ''
    },

    leaderOf(teamId) {
      return this.teams.find((t) => t.id === teamId)?.leader || null
    },

    /** عدد أعضاء المجموعة (من بيانات المجموعات المحمّلة) */
    membersCount(teamId) {
      return this.myTeams.find((t) => t.id === teamId)?.members?.length || 0
    },

    /** فتح بوب-أب تفاصيل المجموعة: GET /teams/{id} */
    async openTeam(teamId) {
      this.teamOpen = true
      this.teamLoading = true
      this.teamDetail = null
      try {
        const { data } = await api.get(`/teams/${teamId}`)
        this.teamDetail = data.data || data
      } catch (err) {
        this.$toast?.error(err.normalized?.message || 'تعذّر تحميل بيانات المجموعة')
      } finally {
        this.teamLoading = false
      }
    },

    closeTeam() {
      this.teamOpen = false
      this.teamDetail = null
    },

    /** فتح بروفايل المشرف (ProfileModal) من داخل بوب-أب المجموعة */
    openSupervisor() {
      if (!this.teamDetail?.supervisor?.id) return
      this.supervisorOpen = true
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
        // لو الفلتر على مجموعة ثانية، ننتقل لمجموعة الاجتماع الجديد حتى يظهر فورًا
        if (this.group && this.group !== f.teamId) this.group = f.teamId
        this.status = 'upcoming'
        this.syncFilters()
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
