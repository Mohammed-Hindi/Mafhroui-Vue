<template>
  <!-- اجتماعات الطالب: بلا رأس صفحة — شريط واحد (فلتر الحالة + اجتماع جديد) وجدول يملأ الشاشة برأس ثابت وشريط ملخص أخضر -->
  <div class="dash hd-page stmeet-page">
    <section class="dash-card sup-tall-card">
      <div class="tk-toolbar">
        <div class="gr-filters tk-filters">
          <BaseSelect v-model="view" class="tk-filter" aria-label="حالة الاجتماع" :options="viewOptions" />
        </div>
        <div class="tk-filters-actions">
          <button v-if="myTeam" type="button" class="pbtn is-green" @click="openCreate"><Plus :size="16" /> اجتماع جديد</button>
        </div>
      </div>

      <p v-if="view === 'upcoming' && next" class="palert is-info mt-meet-next">
        <CalendarClock :size="18" />
        <span><b>الاجتماع القادم:</b> {{ next.title }} — {{ next.date }} الساعة {{ next.time }} ({{ next.when }})</span>
      </p>

      <!-- جدول الاجتماعات بنمط سجلات البوابة (gr-table): رأس سماوي + صفوف — يتمرّر داخل البطاقة ورأسه ثابت -->
      <div class="gr-table-wrap">
        <table class="gr-table mt-table">
          <thead><tr><th>#</th><th>اسم الاجتماع</th><th>التاريخ</th><th>الساعة</th><th>الملاحظات</th><th>الحالة</th><th>الرابط</th></tr></thead>
          <tbody>
            <tr v-for="(m, i) in rows" :key="m.id" class="gr-row">
              <td>{{ i + 1 }}</td>
              <td class="pt-strong">{{ m.title }}</td>
              <td class="mono">{{ m.date }}</td>
              <td class="mono">{{ m.time }}</td>
              <td class="pt-muted">{{ m.notes || '—' }}</td>
              <td><span :class="['rv-pill', m.past ? 'is-approved' : 'is-pending']">{{ m.past ? 'منتهٍ' : m.when }}</span></td>
              <td>
                <a v-if="m.link && !m.past" :href="m.link" target="_blank" rel="noopener" class="pbtn is-cyan is-sm"><VideoIcon :size="15" /> انضمام</a>
                <span v-else class="pt-muted">—</span>
              </td>
            </tr>
            <SkeletonLoader v-if="loading" variant="table" :cols="7" :rows="4" />
            <tr v-else-if="!rows.length"><td colspan="7" class="gr-empty">{{ view === 'upcoming' ? 'لا توجد اجتماعات قادمة حاليًا' : 'لا توجد اجتماعات منتهية بعد' }}</td></tr>
          </tbody>
        </table>
      </div>

      <div class="gr-sumbar">
        <span>القادمة: {{ upcoming.length }}</span>
        <span>المنتهية: {{ completed.length }}</span>
        <span>الإجمالي: {{ all.length }}</span>
      </div>
    </section>

    <!-- اجتماع جديد: أي طالب في الفريق (POST /teams/{id}/meetings) — الاسم، الموعد، الرابط، الملاحظات -->
    <BaseModal v-model="createOpen" title="اجتماع جديد" size="md">
      <form id="meeting-form" class="sp-form" @submit.prevent="create">
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
        <span :class="['as-summary', !canCreate && 'is-missing']">{{ canCreate ? 'سيُبلَّغ المشرف بالاجتماع' : 'أدخل اسم الاجتماع وموعده' }}</span>
        <button type="button" class="pbtn is-outline" @click="createOpen = false">إلغاء</button>
        <button type="submit" form="meeting-form" class="pbtn is-green" :disabled="!canCreate || saving"><Plus :size="16" /> {{ saving ? 'جارٍ الإنشاء…' : 'إنشاء الاجتماع' }}</button>
      </template>
    </BaseModal>
  </div>
</template>

<script>
import { mapState, mapActions } from 'pinia'
import { CalendarClock, Plus, Video as VideoIcon } from 'lucide-vue-next'
import BaseModal from '@/components/ui/BaseModal.vue'
import BaseSelect from '@/components/ui/BaseSelect.vue'
import { placeholderMeetings } from '@/utils/studentPlaceholders'
import { useTeamsStore } from '@/stores/teams.store'
import { useAuthStore } from '@/stores/auth.store'

const DAY = 864e5

export default {
  name: 'StudentMeetingsPage',

  components: { BaseModal, BaseSelect, CalendarClock, Plus, VideoIcon },

  data() {
    return {
      loading: true,
      view: 'upcoming',
      viewOptions: [{ value: 'upcoming', label: 'القادمة' }, { value: 'completed', label: 'المنتهية' }],
      createOpen: false,
      saving: false,
      form: { title: '', at: '', link: '', notes: '' }
    }
  },

  computed: {
    ...mapState(useTeamsStore, ['teams', 'meetings']),
    ...mapState(useAuthStore, ['user']),

    myTeam() {
      return this.teams.find((t) => t.members?.some((m) => m.student?.id === this.user?.id))
    },

    /** بلا فريق أو بلا اجتماعات: اجتماعات تجريبية (placeholder) */
    all() {
      const list = this.myTeam && this.meetings.length ? this.meetings : placeholderMeetings()
      const now = Date.now()
      return list
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
    next() {
      return this.upcoming[0] || null
    },
    rows() {
      return this.view === 'upcoming' ? this.upcoming : this.completed
    },
    canCreate() {
      return !!this.form.title && !!this.form.at
    },
    // datetime-local بالتوقيت المحلي: لا مواعيد في الماضي
    minAt() {
      const d = new Date(Date.now() - new Date().getTimezoneOffset() * 6e4)
      return d.toISOString().slice(0, 16)
    }
  },

  async created() {
    await this.fetchTeams().catch(() => {})
    if (this.myTeam) await this.fetchMeetings(this.myTeam.id).catch(() => {})
    this.loading = false
  },

  methods: {
    ...mapActions(useTeamsStore, ['fetchTeams', 'fetchMeetings', 'createMeeting']),

    openCreate() {
      this.form = { title: '', at: '', link: '', notes: '' }
      this.createOpen = true
    },

    /** POST /teams/{id}/meetings — الموعد بالتوقيت المحلي كما يرسله المشرف (YYYY-MM-DD HH:MM:00) */
    async create() {
      if (!this.canCreate) return
      this.saving = true
      try {
        const f = this.form
        await this.createMeeting(this.myTeam.id, { title: f.title, scheduled_at: `${f.at.replace('T', ' ')}:00`, google_meet_link: f.link || null, notes: f.notes || null })
        this.$toast?.success('تم إنشاء الاجتماع')
        this.createOpen = false
        this.view = 'upcoming'
      } catch (err) {
        this.$toast?.error(err.normalized?.message || 'تعذّر إنشاء الاجتماع')
      } finally {
        this.saving = false
      }
    }
  }
}
</script>
