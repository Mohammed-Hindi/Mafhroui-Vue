<template>
  <!-- الملف التعريفي للطالب — بنمط "ملف الطالب" في بوابة الكلية (201300) كملف الإدارة العامة:
       شريط تبويبات أزرق ← بطاقة الهوية ← صفوف (تسمية + قيمة). المطلوب: اسم المشرف (الضغط ← بروفايله: الاسم، الواتساب،
       مكان التواجد، الشعبة) وبيانات المجموعة كنافذة منبثقة مع أماكن تواجد الطلاب. البيانات من GET /students/{me}/profile -->
  <div class="flex flex-col gap-6">
    <nav class="profile-tabs" aria-label="أقسام الملف التعريفي">
      <button
        v-for="t in tabs" :key="t.key" type="button"
        :class="['profile-tab', tab === t.key && 'is-active']" :aria-current="tab === t.key ? 'page' : undefined"
        @click="tab = t.key"
      >
        <component :is="t.icon" :size="34" />
        <span>{{ t.label }}</span>
      </button>
      <router-link :to="{ name: 'student-change-password' }" class="profile-tab">
        <Lock :size="34" />
        <span>تغيير كلمة المرور</span>
      </router-link>
    </nav>

    <section class="pf-avatar">
      <img v-if="avatarSrc" :src="avatarSrc" alt="الصورة الشخصية">
      <span v-else aria-hidden="true">{{ (user?.name || '?').charAt(0) }}</span>
      <div class="pf-id">
        <strong>{{ user?.name || '—' }}</strong>
        <span class="pf-role">طالب</span>
        <small class="mono">{{ user?.email }}</small>
      </div>
    </section>

    <section class="profile-card">
      <h3 class="portal-title pf-title">{{ tab === 'info' ? 'المعلومات الشخصية' : 'مجموعتي' }}</h3>
      <p v-if="tab === 'team' && !myTeam" class="palert is-warning hd-alert"><span class="hd-ic is-warning">!</span> لم تُنسب لمجموعة بعد</p>
      <div v-for="sec in sections" v-else :key="sec.title" class="pf-row">
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

    <!-- تعديل مكان التواجد -->
    <BaseModal v-model="regionEditOpen" title="تعديل مكان التواجد" size="sm">
      <div class="flex flex-col gap-4">
        <label class="text-label font-semibold text-text-600">اختر مكان تواجدك الجديد</label>
        <select v-model="selectedRegion" class="w-full h-10 px-3 border border-border bg-bg text-body text-text-900 focus:border-primary-600 transition-colors duration-fast">
          <option value="">-- اختر المنطقة --</option>
          <option v-for="(label, key) in REGIONS" :key="key" :value="key">{{ label }}</option>
        </select>
      </div>
      <template #footer>
        <BaseButton variant="ghost" @click="regionEditOpen = false">إلغاء</BaseButton>
        <BaseButton variant="primary" :loading="savingRegion" @click="saveRegion">حفظ التغيير</BaseButton>
      </template>
    </BaseModal>
  </div>
</template>

<script>
import { mapState, mapActions } from 'pinia'
import { IdCard, Lock, Users } from 'lucide-vue-next'
import BaseModal from '@/components/ui/BaseModal.vue'
import BaseButton from '@/components/ui/BaseButton.vue'
import api from '@/services/api'
import { useTeamsStore } from '@/stores/teams.store'
import { useAuthStore } from '@/stores/auth.store'
import { REGIONS } from '@/utils/progressData'
import { placeholderGroup } from '@/utils/studentPlaceholders'

export default {
  name: 'StudentProfilePage',

  components: { Lock, BaseModal, BaseButton },

  data() {
    return {
      REGIONS,
      tab: 'info',
      profile: null,
      supOpen: false,
      groupOpen: false,
      loaded: false,
      regionEditOpen: false,
      selectedRegion: '',
      savingRegion: false,
      tabs: [
        { key: 'info', label: 'المعلومات الشخصية', icon: IdCard },
        { key: 'team', label: 'مجموعتي', icon: Users }
      ]
    }
  },

  computed: {
    ...mapState(useTeamsStore, ['teams']),
    ...mapState(useAuthStore, ['user', 'avatarSrc']),

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

    sections() {
      const u = this.user || {}
      if (this.tab === 'info') {
        return [
          { title: 'بيانات الطالب', fields: [
            { label: 'الاسم', value: u.name },
            { label: 'الرقم الجامعي', value: u.university_number, mono: true },
            { label: 'التخصص', value: u.specialization?.name },
            { label: 'الفصل الدراسي', value: u.academicTerm?.name }
          ] },
          { title: 'بيانات التواصل', fields: [
            { label: 'البريد الإلكتروني', value: u.email, mono: true },
            { label: 'مكان التواجد', value: REGIONS[this.profile?.region] || '—', action: () => { this.openRegionEdit() } }
          ] }
        ]
      }
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
    ...mapActions(useAuthStore, ['fetchCurrentUser']),

    openRegionEdit() {
      this.selectedRegion = this.profile?.region || ''
      this.regionEditOpen = true
    },

    async saveRegion() {
      if (!this.selectedRegion) {
        this.$toast?.error('يرجى اختيار مكان التواجد')
        return
      }

      this.savingRegion = true
      try {
        await api.patch(`/students/${this.user?.id}`, { region: this.selectedRegion })
        if (this.profile) {
          this.profile.region = this.selectedRegion
        }
        if (this.user) {
          this.user.region = this.selectedRegion
        }
        this.regionEditOpen = false
        this.$toast?.success('تم تحديث مكان التواجد بنجاح')
      } catch (err) {
        this.$toast?.error(err.normalized?.message || 'تعذّر تحديث مكان التواجد')
      } finally {
        this.savingRegion = false
      }
    }
  }
}
</script>
