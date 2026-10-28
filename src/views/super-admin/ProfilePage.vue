<template>
  <!-- بياناتي (الإدارة العامة) — صفحة واحدة بتمرير بهوية مسار:
       بطاقة الهوية + إجراءات الحساب (صورة/تعديل/كلمة مرور) ← المعلومات الشخصية (تعديل في المكان) ← إحصائيات المنصة.
       أُزيل تبويب "أدوات الإدارة" لأنه كان يكرّر روابط السايدبار حرفيًا. -->
  <div class="flex flex-col gap-6">
    <!-- بطاقة الهوية: الصورة والاسم والصلاحية + إجراءات الحساب المهمة -->
    <section class="pf-avatar">
      <img v-if="avatarSrc" :src="avatarSrc" alt="الصورة الشخصية">
      <span v-else aria-hidden="true">{{ (user?.name || '?').charAt(0) }}</span>
      <div class="pf-id">
        <strong>{{ user?.name || '—' }}</strong>
        <span class="pf-role">{{ roleLabel }}</span>
        <small class="mono">{{ user?.email }}</small>
      </div>
      <div class="pf-actions">
        <label class="pbtn is-outline is-sm" :aria-disabled="uploading" title="PNG أو JPG أو WEBP حتى 2MB">
          <Camera :size="15" /> {{ uploading ? 'جارٍ الرفع…' : user?.avatar_url ? 'تغيير الصورة' : 'إضافة صورة' }}
          <input type="file" accept="image/png,image/jpeg,image/webp" hidden :disabled="uploading" @change="onAvatar">
        </label>
        <router-link :to="{ name: `${portalPrefix}-change-password` }" class="pbtn is-outline is-sm"><Lock :size="15" /> تغيير كلمة المرور</router-link>
      </div>
    </section>

    <!-- الحقول بنمط "ملف الطالب": عنوان الصف يمينًا ثم أزواج تسمية/قيمة؛ التعديل في نفس المكان -->
    <form class="profile-card" @submit.prevent="saveEdit">
      <h3 class="portal-title pf-title">المعلومات الشخصية</h3>
      <div v-for="sec in infoSections" :key="sec.title" class="pf-row">
        <h4 class="pf-row-title">{{ sec.title }}</h4>
        <div class="pf-row-fields">
          <label v-for="f in sec.fields" :key="f.label" class="profile-field">
            <span class="profile-field-label">{{ f.label }}</span>
            <span v-if="f.key" class="pf-input">
              <b v-if="f.required" class="pf-req" aria-hidden="true">*</b>
              <input v-model.trim="form[f.key]" :type="f.type || 'text'" :required="f.required" :maxlength="f.max || 150" :dir="f.mono ? 'ltr' : undefined" :placeholder="f.placeholder">
            </span>
            <span v-else :class="['profile-field-value', f.mono && 'mono']">{{ f.value || '—' }}</span>
          </label>
        </div>
      </div>
      <div class="pf-form-actions">
        <small class="pf-req-note"><b>*</b> تعني أن الحقل مطلوب</small>
        <button type="button" class="pbtn is-outline" :disabled="!isDirty || saving" @click="resetForm">تراجع</button>
        <button type="submit" class="pbtn is-green" :disabled="!isDirty || saving"><Check :size="16" /> {{ saving ? 'جارٍ الحفظ…' : 'حفظ التعديلات' }}</button>
      </div>
    </form>

    <!-- إحصائيات المنصة بهوية مسار: أيقونة، رقم يعدّ، تسمية، ومتوسط الإنجاز بشريط تقدّم -->
    <section class="profile-card pf-stats-card">
      <h3 class="portal-title pf-title">إحصائيات المنصة <span class="profile-card-sub">{{ activeSemesterName }}</span></h3>
      <dl class="pf-stats">
        <div v-for="(s, i) in platformStats" :key="s.label" :style="{ animationDelay: `${i * 60}ms` }">
          <span class="pf-stat-ic"><component :is="s.icon" :size="22" /></span>
          <dt>{{ s.label }}</dt>
          <dd>
            <CountUp v-if="s.value != null" :value="s.value" />
            <template v-else>—</template><small v-if="s.value != null && s.suffix">{{ s.suffix }}</small>
          </dd>
          <span v-if="s.suffix === '%'" class="gr-progress"><span :class="level(s.value || 0)" :style="{ width: `${s.value || 0}%` }" /></span>
        </div>
      </dl>
    </section>
  </div>
</template>

<script>
import { mapState, mapActions } from 'pinia'
import { Lock, Camera, Check, Building2, UsersRound, FolderKanban, UserRound, GraduationCap, TrendingUp } from 'lucide-vue-next'
import CountUp from '@/components/ui/CountUp.vue'
import { level } from '@/utils/progressData'
import { useAuthStore } from '@/stores/auth.store'
import { useUiStore } from '@/stores/ui.store'
import { useLandingStore } from '@/stores/landing.store'
import { ROLE_LABELS } from '@/utils/constants'
import { formatDate } from '@/utils/formatters'

export default {
  name: 'SuperAdminProfilePage',

  components: { Lock, Camera, Check, CountUp },

  data() {
    return {
      saving: false,
      uploading: false,
      form: { name: '', email: '', whatsapp: '', employee_number: '' }
    }
  },

  computed: {
    ...mapState(useAuthStore, ['user', 'avatarSrc', 'portalPrefix']),
    ...mapState(useUiStore, ['semesters', 'activeSemesterId']),
    ...mapState(useLandingStore, ['stats']),

    roleLabel() {
      return ROLE_LABELS[this.user?.role] || ''
    },

    /** الحفظ يتفعّل فقط لو في تغيير فعلي عن البيانات الحالية */
    isDirty() {
      const u = this.user || {}
      return ['name', 'email', 'whatsapp', 'employee_number'].some((k) => (this.form[k] || '') !== (u[k] || ''))
    },

    activeSemesterName() {
      return this.semesters.find((s) => String(s.id) === String(this.activeSemesterId))?.name || ''
    },

    platformStats() {
      const s = this.stats || {}
      return [
        { label: 'الأقسام الأكاديمية', value: s.departments ?? null, icon: Building2 },
        { label: 'فرق المشاريع', value: s.teams ?? null, icon: UsersRound },
        { label: 'مشاريع التخرج', value: s.projects ?? null, icon: FolderKanban },
        { label: 'المشرفون', value: s.supervisors ?? null, icon: UserRound },
        { label: 'الطلاب', value: s.students ?? null, icon: GraduationCap },
        { label: 'متوسط الإنجاز', value: s.avg_completion != null ? Math.round(s.avg_completion) : null, suffix: '%', icon: TrendingUp }
      ]
    },

    /** صفوف الملف: key = حقل قابل للتعديل (PATCH /me)، والباقي للعرض فقط */
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
        { title: 'بيانات النظام', fields: [
          { label: 'الفصل الحالي', value: this.activeSemesterName },
          { label: 'تاريخ إنشاء الحساب', value: u.created_at ? formatDate(u.created_at) : '' }
        ] }
      ]
    }
  },

  watch: {
    // تعبئة النموذج من بيانات المستخدم فور توفّرها/تحديثها (وبعد الحفظ → يُطفأ زر الحفظ)
    user: { handler() { this.resetForm() }, immediate: true }
  },

  created() {
    this.fetchCurrentUser().catch(() => {})
    this.fetchStats().catch(() => {})
  },

  methods: {
    level,

    ...mapActions(useAuthStore, ['fetchCurrentUser', 'updateProfile', 'uploadAvatar']),
    ...mapActions(useLandingStore, ['fetchStats']),

    resetForm() {
      const u = this.user || {}
      this.form = { name: u.name || '', email: u.email || '', whatsapp: u.whatsapp || '', employee_number: u.employee_number || '' }
    },

    async saveEdit() {
      this.saving = true
      try {
        await this.updateProfile({ ...this.form, whatsapp: this.form.whatsapp || null, employee_number: this.form.employee_number || null })
        this.$toast?.success('تم حفظ بياناتك')
      } catch (err) {
        this.$toast?.error(err.normalized?.message || 'تعذّر حفظ البيانات')
      } finally {
        this.saving = false
      }
    },

    async onAvatar(ev) {
      const file = ev.target.files[0]
      ev.target.value = ''
      if (!file) return
      if (file.size > 2 * 1024 * 1024) return this.$toast?.error('حجم الصورة أكبر من 2MB')
      this.uploading = true
      try {
        await this.uploadAvatar(file)
        this.$toast?.success('تم تحديث الصورة')
      } catch (err) {
        this.$toast?.error(err.normalized?.message || 'تعذّر رفع الصورة')
      } finally {
        this.uploading = false
      }
    }
  }
}
</script>
