<template>
  <!-- الملف الشخصي للمشرف — بنمط "ملف الطالب" في بوابة الكلية (201300) كملف الإدارة العامة:
       شريط تبويبات أزرق بأيقونات بيضاء ← بطاقة الهوية ← بيانات (تسمية + قيمة) ← التفاعل الكلي والجزئي لكل مجموعة.
       البيانات (عرض فقط): GET /me + GET /supervisors/{me}/profile -->
  <div class="flex flex-col gap-6">
    <nav class="profile-tabs" aria-label="أقسام الملف الشخصي">
      <button
        v-for="t in tabs" :key="t.key" type="button"
        :class="['profile-tab', tab === t.key && 'is-active']" :aria-current="tab === t.key ? 'page' : undefined"
        @click="tab = t.key"
      >
        <component :is="t.icon" :size="34" />
        <span>{{ t.label }}</span>
      </button>
      <router-link :to="{ name: 'supervisor-change-password' }" class="profile-tab">
        <Lock :size="34" />
        <span>تغيير كلمة المرور</span>
      </router-link>
    </nav>


    <!-- المعلومات الشخصية -->
    <ProfileInfoCard v-if="tab === 'info'" :sections="infoSections" />

    <!-- التفاعل الكلي: صفوف "التسمية : القيمة" كبطاقة "بيانات أكاديمية" (200515) + مقياس عام -->
    <section v-else-if="tab === 'activity'" class="profile-card">
      <h3 class="portal-title mb-4">التفاعل الكلي <span class="profile-card-sub">{{ activeSemesterName }}</span></h3>
      <div class="sp-meter">
        <span class="gr-progress"><span :class="level(overall)" :style="{ width: overall + '%' }" /></span>
        <b>{{ overall }}%</b>
        <span class="pt-muted">متوسط التفاعل مع كل المجموعات</span>
      </div>
      <dl class="profile-stats">
        <div v-for="s in totals" :key="s.label"><dt>{{ s.label }}</dt><dd>{{ s.value }}</dd></div>
      </dl>
    </section>

    <!-- التفاعل الجزئي: بطاقة لكل مجموعة باسمها ورقم شعبتها -->
    <section v-else class="profile-card">
      <h3 class="portal-title mb-4">التفاعل مع كل مجموعة <span class="profile-card-sub">{{ teams.length }} مجموعة</span></h3>
      <SkeletonLoader v-if="loading" :rows="4" height="40px" />
      <p v-else-if="!teams.length" class="palert is-warning hd-alert"><span class="hd-ic is-warning">!</span> لا توجد مجموعات مسندة لك</p>
      <div v-else class="sp-groups">
        <article
          v-for="t in teams" :key="t.team.id" class="sp-group is-link" tabindex="0" role="button"
          :aria-label="`تفاصيل ${t.team.name}`" @click="openGroup(t)" @keydown.enter="openGroup(t)"
        >
          <header>
            <b>{{ t.team.section ? `شعبة ${t.team.section}` : `#${t.team.id}` }}</b>
            <span :class="['sp-score', level(t.interaction.activity_score)]">{{ Math.round(t.interaction.activity_score) }}%</span>
          </header>
          <p class="sp-group-name">{{ t.team.name }}</p>
          <p class="pt-muted">{{ t.project?.name || 'بلا مشروع' }} · {{ t.team.members_count }} طلاب</p>
          <span class="gr-progress is-sm"><span :class="level(t.interaction.activity_score)" :style="{ width: t.interaction.activity_score + '%' }" /></span>
          <dl>
            <div><dt>المهام</dt><dd class="mono">{{ t.interaction.tasks_done }}/{{ t.interaction.tasks_total }}</dd></div>
            <div><dt>الملاحظات</dt><dd>{{ t.interaction.notes_count }}</dd></div>
            <div><dt>الملفات</dt><dd>{{ t.interaction.files_count }}</dd></div>
            <div><dt>الاجتماعات</dt><dd>{{ t.interaction.meetings_count }}</dd></div>
          </dl>
        </article>
      </div>
    </section>

    <!-- تفاصيل تعريفية بالمجموعة: الشعبة والمشروع والطلاب وأماكن تواجدهم وتفاعل المشرف (GET /progress عند أول فتح) -->
    <BaseModal v-model="groupOpen" :title="group ? `${group.team.section ? 'شعبة ' + group.team.section + ' — ' : ''}${group.team.name}` : ''" size="lg">
      <template v-if="group">
        <dl class="sv-info sp-modal-info">
          <div><dt>الشعبة :</dt><dd>{{ group.team.section || '—' }}</dd></div>
          <div><dt>المشروع :</dt><dd>{{ group.project?.name || 'بلا مشروع' }}</dd></div>
          <div><dt>حالة المشروع :</dt><dd>{{ PROJECT_STATUS[group.project?.status] || '—' }}</dd></div>
          <div><dt>التخصص :</dt><dd>{{ detail?.spec || '—' }}</dd></div>
          <div><dt>الدرجة :</dt><dd>{{ DEGREES[detail?.degree] || '—' }}</dd></div>
          <div><dt>نوع المشروع :</dt><dd>{{ detail?.type || '—' }}</dd></div>
          <div><dt>إنجاز المجموعة :</dt><dd>{{ detail ? detail.percentage + '%' : '—' }}</dd></div>
          <div><dt>المهام :</dt><dd>{{ group.interaction.tasks_done }}/{{ group.interaction.tasks_total }}</dd></div>
          <div><dt>تفاعل المشرف :</dt><dd>{{ Math.round(group.interaction.activity_score) }}%</dd></div>
        </dl>

        <h4 class="portal-title hd-props-title sp-modal-sub">طلاب المجموعة</h4>
        <SkeletonLoader v-if="groupsLoading" :rows="3" height="40px" />
        <div v-else class="pt-wrap">
          <table class="pt">
            <thead><tr><th>الطالب</th><th>الرقم الجامعي</th><th>الجنس</th><th>مكان التواجد</th><th>المهام</th><th>الإنجاز</th></tr></thead>
            <tbody>
              <tr v-for="m in detail?.members || []" :key="m.id">
                <td class="pt-strong">{{ m.name }}</td>
                <td class="mono">{{ m.uni || '—' }}</td>
                <td>{{ GENDERS[m.gender] || '—' }}</td>
                <td>{{ REGIONS[m.region] || '—' }}</td>
                <td class="mono">{{ m.done }}/{{ m.total }}</td>
                <td>
                  <span class="gr-progress is-sm"><span :class="level(m.percentage)" :style="{ width: m.percentage + '%' }" /></span>
                  <span class="gr-pct">{{ m.percentage }}%</span>
                </td>
              </tr>
              <tr v-if="!detail?.members?.length"><td colspan="6" class="pt-muted">لا يوجد طلاب في هذه المجموعة</td></tr>
            </tbody>
          </table>
        </div>
      </template>
    </BaseModal>
  </div>
</template>

<script>
import { mapState, mapActions } from 'pinia'
import { Lock, IdCard, Activity, Users } from 'lucide-vue-next'
import api from '@/services/api'
import BaseModal from '@/components/ui/BaseModal.vue'
import ProfileInfoCard from '@/components/shared/ProfileInfoCard.vue'
import { loadGroups } from '@/services/adminData'
import { useAuthStore } from '@/stores/auth.store'
import { useUiStore } from '@/stores/ui.store'
import { formatDate } from '@/utils/formatters'
import { DEGREES, GENDERS, PROJECT_STATUS, REGIONS, level } from '@/utils/progressData'

export default {
  name: 'SupervisorPortalProfile',

  components: { Lock, BaseModal, ProfileInfoCard },

  data() {
    return {
      DEGREES, GENDERS, PROJECT_STATUS, REGIONS,
      tab: 'info',
      group: null,
      groupOpen: false,
      groups: null,
      groupsLoading: false,
      interaction: null,
      loading: true,
      tabs: [
        { key: 'info', label: 'المعلومات الشخصية', icon: IdCard },
        { key: 'activity', label: 'التفاعل الكلي', icon: Activity },
        { key: 'groups', label: 'التفاعل مع المجموعات', icon: Users }
      ]
    }
  },

  computed: {
    ...mapState(useAuthStore, ['user', 'avatarSrc']),
    ...mapState(useUiStore, ['semesters', 'activeSemesterId']),

    activeSemesterName() {
      return this.semesters.find((s) => String(s.id) === String(this.activeSemesterId))?.name || ''
    },

    teams() {
      return this.interaction?.teams || []
    },

    /** بيانات المجموعة المفتوحة من /progress (التخصص، الدرجة، نوع المشروع، الطلاب) */
    detail() {
      return this.groups?.find((g) => g.id === this.group?.team.id) || null
    },

    overall() {
      return Math.round(this.interaction?.average_activity || 0)
    },

    totals() {
      const sum = (k) => this.teams.reduce((n, t) => n + (t.interaction[k] || 0), 0)
      return [
        { label: 'المجموعات', value: this.interaction?.teams_count ?? 0 },
        { label: 'الطلاب', value: this.interaction?.students_count ?? 0 },
        { label: 'المهام المنجزة', value: `${sum('tasks_done')} / ${sum('tasks_total')}` },
        { label: 'ملاحظات المشرف', value: sum('notes_count') },
        { label: 'الملفات المرفوعة', value: sum('files_count') },
        { label: 'الاجتماعات', value: sum('meetings_count') }
      ]
    },

    /** صفوف الملف (عرض فقط) */
    infoSections() {
      const u = this.user || {}
      return [
        { title: 'بيانات الحساب', fields: [
          { label: 'الاسم', value: u.name, key: 'name', required: true },
          { label: 'الرقم الوظيفي', value: u.employee_number, key: 'employee_number', mono: true, max: 30 }
        ] },
        { title: 'بيانات التواصل', fields: [
          { label: 'البريد الإلكتروني', value: u.email, key: 'email', type: 'email', required: true, mono: true },
          { label: 'رقم الواتساب', value: u.whatsapp, key: 'whatsapp', mono: true, placeholder: 'مثال: 970591234567' }
        ] },
        { title: 'بيانات الإشراف', fields: [
          { label: 'المجموعات', value: this.interaction?.teams_count },
          { label: 'الطلاب', value: this.interaction?.students_count },
          { label: 'الفصل الحالي', value: this.activeSemesterName },
          { label: 'تاريخ إنشاء الحساب', value: u.created_at ? formatDate(u.created_at) : '' }
        ] }
      ]
    }
  },

  async created() {
    this.fetchCurrentUser().catch(() => {})
    try {
      const { data } = await api.get(`/supervisors/${this.user?.id}/profile`)
      this.interaction = data.interaction
    } catch (err) {
      this.$toast?.error(err.normalized?.message || 'تعذّر تحميل بيانات التفاعل')
    } finally {
      this.loading = false
    }
  },

  methods: {
    ...mapActions(useAuthStore, ['fetchCurrentUser']),
    level,

    async openGroup(t) {
      this.group = t
      this.groupOpen = true
      if (this.groups || this.groupsLoading) return
      this.groupsLoading = true
      try {
        this.groups = await loadGroups()
      } catch {
        this.groups = []
      } finally {
        this.groupsLoading = false
      }
    },

  }
}
</script>
