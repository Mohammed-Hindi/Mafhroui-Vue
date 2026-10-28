<template>
  <!-- بياناتي (الطالب) — صفحة واحدة بتمرير: بطاقة المعلومات (تعديل مباشر) ← مجموعتي (الشعبة/المجموعة/المشرف).
       البيانات من GET /students/{me}/profile. اسم المشرف والمجموعة يفتحان نافذة تفاصيل. -->
  <div class="flex flex-col gap-6">
    <ProfileInfoCard :sections="infoSections" change-password-route="student-change-password" />

    <section class="profile-card">
      <h3 class="portal-title pf-title">مجموعتي</h3>
      <SkeletonLoader v-if="!loaded" :rows="5" height="22px" />
      <p v-else-if="!myTeam" class="palert is-warning hd-alert"><span class="hd-ic is-warning">!</span> لم تُنسب لمجموعة بعد</p>
      <div v-for="sec in teamSections" v-else :key="sec.title" class="pf-row">
        <h4 class="pf-row-title">{{ sec.title }}</h4>
        <div class="pf-row-fields">
          <div v-for="f in sec.fields" :key="f.label" class="profile-field">
            <span class="profile-field-label">{{ f.label }}</span>
            <button v-if="f.action" type="button" class="profile-field-value sp-field-link" :disabled="!f.value" @click="f.action">{{ f.value || '—' }}</button>
            <span v-else :class="['profile-field-value', f.mono && 'mono']">{{ f.value || '—' }}</span>
          </div>
        </div>
      </div>
    </section>

    <!-- بروفايل المشرف -->
    <BaseModal v-model="supOpen" :title="`المشرف: ${supervisor?.name || ''}`" size="md">
      <dl class="sv-info st-modal-info">
        <div><dt>الاسم :</dt><dd>{{ supervisor?.name || '—' }}</dd></div>
        <div><dt>رقم الواتساب :</dt><dd dir="ltr"><a v-if="supervisor?.whatsapp" :href="`https://wa.me/${supervisor.whatsapp}`" target="_blank" rel="noopener">{{ supervisor.whatsapp }}</a><template v-else>—</template></dd></div>
        <!-- ponytail: مكان تواجد المشرف placeholder — الخادم لا يعيد region للمشرف في بروفايل الطالب -->
        <div><dt>مكان التواجد :</dt><dd>{{ REGIONS[supervisor?.region] || '—' }}</dd></div>
        <div><dt>رقم الشعبة :</dt><dd>{{ section || '—' }}</dd></div>
      </dl>
    </BaseModal>

    <!-- بيانات المجموعة -->
    <BaseModal v-model="groupOpen" :title="`مجموعتي: ${myTeam?.name || ''}`" size="md">
      <table class="pt st-mates">
        <thead><tr><th>الطالب</th><th>مكان التواجد</th></tr></thead>
        <tbody>
          <tr><td class="pt-strong">{{ user?.name }} <span class="pt-muted">(أنت)</span></td><td>{{ REGIONS[profile?.region] || '—' }}</td></tr>
          <tr v-for="m in profile?.teammates || myTeam?.teammates || []" :key="m.id"><td>{{ m.name }}</td><td>{{ REGIONS[m.region] || '—' }}</td></tr>
        </tbody>
      </table>
    </BaseModal>
  </div>
</template>

<script>
import { mapState, mapActions } from 'pinia'
import BaseModal from '@/components/ui/BaseModal.vue'
import ProfileInfoCard from '@/components/shared/ProfileInfoCard.vue'
import api from '@/services/api'
import { useTeamsStore } from '@/stores/teams.store'
import { useAuthStore } from '@/stores/auth.store'
import { REGIONS } from '@/utils/progressData'
import { placeholderGroup } from '@/utils/studentPlaceholders'

export default {
  name: 'StudentProfilePage',

  components: { BaseModal, ProfileInfoCard },

  data() {
    return {
      REGIONS,
      profile: null,
      supOpen: false,
      groupOpen: false,
      loaded: false
    }
  },

  computed: {
    ...mapState(useTeamsStore, ['teams']),
    ...mapState(useAuthStore, ['user']),

    myTeam() {
      // بلا مجموعة: مجموعة تجريبية (placeholder) حتى يظهر شكل الصفحة
      return this.teams.find((t) => t.members?.some((m) => m.student?.id === this.user?.id)) || (this.loaded ? placeholderGroup() : null)
    },

    supervisor() {
      return this.profile?.supervisor || this.myTeam?.supervisor || null
    },

    section() {
      return this.profile?.section || this.myTeam?.section || ''
    },

    infoSections() {
      const u = this.user || {}
      return [
        { title: 'بيانات الطالب', fields: [
          { label: 'الاسم', value: u.name, key: 'name', required: true },
          { label: 'الرقم الجامعي', value: u.university_number, mono: true },
          { label: 'التخصص', value: u.specialization?.name },
          { label: 'الفصل الدراسي', value: u.academicTerm?.name }
        ] },
        { title: 'بيانات التواصل', fields: [
          { label: 'البريد الإلكتروني', value: u.email, key: 'email', type: 'email', required: true, mono: true },
          { label: 'رقم الواتساب', value: u.whatsapp, key: 'whatsapp', mono: true, placeholder: 'مثال: 970591234567' },
          { label: 'مكان التواجد', value: REGIONS[this.profile?.region] }
        ] }
      ]
    },

    teamSections() {
      return [
        { title: 'المجموعة', fields: [
          { label: 'رقم الشعبة', value: this.section },
          { label: 'اسم المجموعة', value: this.myTeam?.name },
          { label: 'بيانات المجموعة', value: this.myTeam ? `${this.myTeam.members?.length || 0} طلاب — عرض` : '', action: () => { this.groupOpen = true } }
        ] },
        { title: 'المشرف', fields: [
          { label: 'اسم المشرف', value: this.supervisor?.name, action: () => { this.supOpen = true } }
        ] }
      ]
    }
  },

  async created() {
    await this.fetchCurrentUser()
    await this.fetchTeams()
    this.loaded = true
    try {
      const { data } = await api.get(`/students/${this.user?.id}/profile`)
      this.profile = data
    } catch {
      // بيانات الفريق الأساسية تكفي
    }
  },

  methods: {
    ...mapActions(useTeamsStore, ['fetchTeams']),
    ...mapActions(useAuthStore, ['fetchCurrentUser'])
  }
}
</script>
