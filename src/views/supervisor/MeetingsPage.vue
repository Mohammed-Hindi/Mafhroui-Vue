<template>
  <!-- الاجتماعات للمشرف بنمط صفحة الطالب: اختيار المجموعة ← شريط عروض (القادمة / المنتهية) ← جدول البوابة + شريط ملخص أخضر -->
  <div class="dash hd-page">
    <header class="dash-head">
      <h2 class="dash-title">الاجتماعات</h2>
      <button v-if="selectedTeamId" type="button" class="pbtn is-green" @click="openCreate"><Plus :size="16" /> اجتماع جديد</button>
    </header>

    <!-- فلتر الفرق بنفس شريط صفحة المهام -->
    <section v-if="teamOptions.length" class="dash-card tk-teambar">
      <div class="gr-class" role="radiogroup" aria-label="المجموعة">
        <span class="gr-class-label">المجموعة</span>
        <div class="gr-seg">
          <button
            v-for="o in teamOptions" :key="o.value" type="button" role="radio"
            :class="selectedTeamId === o.value && 'is-active'" :aria-checked="selectedTeamId === o.value" :title="o.name"
            @click="pickTeam(o.value)"
          >
            {{ o.label }}
          </button>
        </div>
      </div>
    </section>

    <p v-if="loading" class="pt-muted">جارٍ التحميل…</p>
    <p v-else-if="!teamOptions.length" class="palert is-info"><CalendarDays :size="18" /><span>لا توجد مجموعات مُسندة إليك</span></p>
    <template v-else>
      <PortalStepper v-model="view" :items="views" label="عرض الاجتماعات" />

      <section class="dash-card">
        <div class="dash-card-head"><h3 class="portal-title">{{ view === 'upcoming' ? 'الاجتماعات القادمة' : 'الاجتماعات المنتهية' }}</h3></div>

        <p v-if="view === 'upcoming' && upcoming[0]" class="palert is-info mt-meet-next">
          <CalendarClock :size="18" />
          <span><b>الاجتماع القادم:</b> {{ upcoming[0].title }} — {{ upcoming[0].date }} الساعة {{ upcoming[0].time }} ({{ upcoming[0].when }})</span>
        </p>

        <div class="gr-table-wrap">
          <table class="gr-table mt-table">
            <thead><tr><th>#</th><th>اسم الاجتماع</th><th>التاريخ</th><th>الساعة</th><th>الملاحظات</th><th>الحالة</th><th>الإجراءات</th></tr></thead>
            <tbody>
              <tr v-for="(m, i) in rows" :key="m.id" class="gr-row">
                <td>{{ i + 1 }}</td>
                <td class="pt-strong">{{ m.title }}</td>
                <td class="mono">{{ m.date }}</td>
                <td class="mono">{{ m.time }}</td>
                <td class="pt-muted">{{ m.notes || '—' }}</td>
                <td><span :class="['rv-pill', m.past ? 'is-approved' : 'is-pending']">{{ m.past ? 'منتهٍ' : m.when }}</span></td>
                <td>
                  <span v-if="m.past" class="pt-muted">—</span>
                  <span v-else class="mt-acts">
                    <a v-if="m.link" :href="m.link" target="_blank" rel="noopener" class="pbtn is-cyan is-sm"><Video :size="15" /> انضمام</a>
                    <button v-if="remindNumber" type="button" class="pbtn is-outline is-sm" @click="sendReminder(m)"><MessageCircle :size="15" /> تذكير</button>
                    <button type="button" class="pbtn is-outline is-sm is-red-text" @click="cancelTarget = m"><Trash2 :size="15" /> إلغاء</button>
                  </span>
                </td>
              </tr>
              <tr v-if="!rows.length"><td colspan="7" class="gr-empty">{{ view === 'upcoming' ? 'لا توجد اجتماعات قادمة حاليًا' : 'لا توجد اجتماعات منتهية بعد' }}</td></tr>
            </tbody>
          </table>
        </div>

        <div class="gr-sumbar">
          <span>عدد الاجتماعات: {{ all.length }}</span>
          <span>القادمة: {{ upcoming.length }}</span>
          <span>المنتهية: {{ completed.length }}</span>
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
        <button type="button" class="pbtn is-red" :disabled="cancelling" @click="cancel"><Trash2 :size="16" /> {{ cancelling ? 'جارٍ الإلغاء…' : 'تأكيد الإلغاء' }}</button>
      </template>
    </BaseModal>
  </div>
</template>

<script>
import { mapState, mapActions } from 'pinia'
import { CalendarClock, CalendarDays, CheckCircle2, MessageCircle, Plus, Trash2, Video } from 'lucide-vue-next'
import BaseModal from '@/components/ui/BaseModal.vue'
import PortalStepper from '@/components/shared/PortalStepper.vue'
import { useTeamsStore } from '@/stores/teams.store'
import { useAuthStore } from '@/stores/auth.store'

const DAY = 864e5

export default {
  name: 'SupervisorMeetingsPage',

  components: { BaseModal, CalendarClock, CalendarDays, MessageCircle, Plus, PortalStepper, Trash2, Video },

  data() {
    return { loading: true, view: 'upcoming', selectedTeamId: null, createOpen: false, saving: false, cancelTarget: null, cancelling: false, form: {} }
  },

  computed: {
    ...mapState(useTeamsStore, ['teamsForDisplay', 'teams', 'meetings']),
    ...mapState(useAuthStore, ['user']),

    teamOptions() {
      return this.teamsForDisplay.filter((t) => t.supId === this.user?.id).map((t) => ({ value: t.id, label: t.section ? `شعبة ${t.section}` : t.name, name: t.name }))
    },
    remindNumber() {
      return this.teams.find((t) => t.id === this.selectedTeamId)?.leader?.whatsapp || ''
    },
    all() {
      const now = Date.now()
      return this.meetings
        .map((m) => {
          const at = new Date(m.scheduled_at)
          const days = Math.ceil((at - now) / DAY)
          return {
            id: m.id,
            title: m.title,
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
    upcoming() {
      return this.all.filter((m) => !m.past)
    },
    // المنتهية: الأحدث أولًا
    completed() {
      return this.all.filter((m) => m.past).reverse()
    },
    rows() {
      return this.view === 'upcoming' ? this.upcoming : this.completed
    },
    canCreate() {
      return !!this.form.teamId && !!this.form.title && !!this.form.at
    },
    minAt() {
      const d = new Date(Date.now() - new Date().getTimezoneOffset() * 6e4)
      return d.toISOString().slice(0, 16)
    },
    views() {
      return [
        { key: 'upcoming', label: 'القادمة', icon: CalendarDays, count: this.upcoming.length },
        { key: 'completed', label: 'المنتهية', icon: CheckCircle2, count: this.completed.length }
      ]
    }
  },

  async created() {
    try {
      await this.fetchTeams()
    } catch {
      this.$toast?.error('تعذّر تحميل المجموعات')
    } finally {
      this.loading = false
    }
    this.selectedTeamId = this.teamOptions[0]?.value ?? null
    this.loadMeetings()
  },

  methods: {
    ...mapActions(useTeamsStore, ['fetchTeams', 'fetchMeetings', 'createMeeting', 'deleteMeeting']),

    pickTeam(id) {
      if (id === this.selectedTeamId) return
      this.selectedTeamId = id
      this.loadMeetings()
    },

    async loadMeetings() {
      if (!this.selectedTeamId) return
      try {
        await this.fetchMeetings(this.selectedTeamId)
      } catch (err) {
        this.$toast?.error(err.normalized?.message || 'تعذّر تحميل الاجتماعات')
      }
    },

    openCreate() {
      this.form = { teamId: this.selectedTeamId, title: '', at: '', link: '', notes: '' }
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
        this.view = 'upcoming'
        if (f.teamId !== this.selectedTeamId) {
          this.selectedTeamId = f.teamId
          await this.loadMeetings()
        }
      } catch (err) {
        this.$toast?.error(err.normalized?.message || 'تعذّر إنشاء الاجتماع')
      } finally {
        this.saving = false
      }
    },

    async cancel() {
      this.cancelling = true
      try {
        await this.deleteMeeting(this.cancelTarget.id)
        this.cancelTarget = null
        this.$toast?.success('تم إلغاء الاجتماع')
      } catch (err) {
        this.$toast?.error(err.normalized?.message || 'تعذّر إلغاء الاجتماع')
      } finally {
        this.cancelling = false
      }
    },

    sendReminder(m) {
      const text = [`تذكير باجتماع: ${m.title}`, `التاريخ: ${m.date}`, `الوقت: ${m.time}`, m.link && `الرابط: ${m.link}`, m.notes && `الملاحظات: ${m.notes}`].filter(Boolean).join('\n')
      window.open(`https://wa.me/${this.remindNumber}?text=${encodeURIComponent(text)}`, '_blank')
    }
  }
}
</script>
