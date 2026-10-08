<template>
  <!-- الملف التعريفي للإدارة العامة — بنمط "ملف الطالب" في بوابة الكلية (201300):
       شريط تبويبات أزرق بأيقونات بيضاء ← بطاقة بيانات (تسمية + حقل للقراءة) ← بطاقات البوابة -->
  <div class="flex flex-col gap-6">
    <nav class="profile-tabs" aria-label="أقسام الملف التعريفي">
      <button
        v-for="t in tabs" :key="t.key" type="button"
        :class="['profile-tab', tab === t.key && 'is-active']"
        :aria-current="tab === t.key ? 'page' : undefined"
        @click="tab = t.key"
      >
        <component :is="t.icon" :size="34" />
        <span>{{ t.label }}</span>
      </button>
      <router-link :to="{ name: 'super-admin-change-password' }" class="profile-tab">
        <Lock :size="34" />
        <span>تغيير كلمة المرور</span>
      </router-link>
    </nav>

    <!-- المعلومات الشخصية -->
    <section v-if="tab === 'info'" class="profile-card">
      <div class="pf-head">
        <h3 class="portal-title">المعلومات الشخصية</h3>
        <button v-if="!editing" type="button" class="pbtn is-cyan is-sm" @click="startEdit"><Pencil :size="15" /> تعديل البيانات</button>
      </div>

      <!-- الصورة الشخصية -->
      <div class="pf-avatar">
        <img v-if="user?.avatar_url" :src="user.avatar_url" alt="الصورة الشخصية">
        <span v-else aria-hidden="true">{{ (user?.name || '?').charAt(0) }}</span>
        <label class="pbtn is-outline is-sm" :aria-disabled="uploading">
          <Camera :size="15" /> {{ uploading ? 'جارٍ الرفع…' : user?.avatar_url ? 'تغيير الصورة' : 'إضافة صورة' }}
          <input type="file" accept="image/png,image/jpeg,image/webp" hidden :disabled="uploading" @change="onAvatar">
        </label>
        <small class="pt-muted">PNG أو JPG أو WEBP حتى 2MB</small>
      </div>

      <!-- تعديل البيانات -->
      <form v-if="editing" class="pf-form" @submit.prevent="saveEdit">
        <label class="pfield"><span>الاسم</span><input v-model.trim="form.name" required maxlength="150"></label>
        <label class="pfield"><span>البريد الإلكتروني</span><input v-model.trim="form.email" type="email" required maxlength="150" dir="ltr"></label>
        <label class="pfield"><span>رقم الواتساب</span><input v-model.trim="form.whatsapp" dir="ltr" placeholder="مثال: 970591234567"></label>
        <label class="pfield"><span>الرقم الوظيفي</span><input v-model.trim="form.employee_number" maxlength="30" dir="ltr"></label>
        <div class="pf-form-actions">
          <button type="submit" class="pbtn is-green" :disabled="saving"><Check :size="16" /> {{ saving ? 'جارٍ الحفظ…' : 'حفظ التعديلات' }}</button>
          <button type="button" class="pbtn is-outline" :disabled="saving" @click="editing = false">إلغاء</button>
        </div>
      </form>

      <div v-else class="profile-fields">
        <div v-for="info in accountInfo" :key="info.label" class="profile-field">
          <span class="profile-field-label">{{ info.label }}</span>
          <span :class="['profile-field-value', info.mono && 'mono']">{{ info.value || '—' }}</span>
        </div>
      </div>
    </section>

    <!-- إحصائيات المنصة — صفوف "التسمية: القيمة" كبطاقة "بيانات أكاديمية" (200515) -->
    <section v-else-if="tab === 'stats'" class="profile-card">
      <h3 class="portal-title mb-4">إحصائيات المنصة <span class="profile-card-sub">{{ activeSemesterName }}</span></h3>
      <dl class="profile-stats">
        <div v-for="s in platformStats" :key="s.label">
          <dt>{{ s.label }} :</dt>
          <dd>{{ s.value ?? '—' }}<template v-if="s.value != null && s.suffix">{{ s.suffix }}</template></dd>
        </div>
      </dl>
    </section>

    <!-- أدوات الإدارة — أزرار البوابة المسطّحة كأزرار الخدمات في الرئيسية (200515) -->
    <section v-else class="profile-card">
      <h3 class="portal-title mb-6">أدوات الإدارة العامة</h3>
      <div class="profile-tools">
        <router-link v-for="tool in tools" :key="tool.to" :to="tool.to" class="profile-tool">
          <component :is="tool.icon" :size="20" />
          <span>{{ tool.label }}</span>
        </router-link>
      </div>
    </section>
  </div>
</template>

<script>
import { mapState, mapActions } from 'pinia'
import { Lock, IdCard, BarChart3, LayoutGrid, Pencil, Camera, Check } from 'lucide-vue-next'
import { useAuthStore } from '@/stores/auth.store'
import { useUiStore } from '@/stores/ui.store'
import { useLandingStore } from '@/stores/landing.store'
import { NAV_ITEMS_BY_ROLE } from '@/utils/navConfig'
import { ROLES, ROLE_LABELS } from '@/utils/constants'
import { formatDate } from '@/utils/formatters'

export default {
  name: 'SuperAdminProfilePage',

  components: { Lock, Pencil, Camera, Check },

  data() {
    return {
      tab: 'info',
      editing: false,
      saving: false,
      uploading: false,
      form: { name: '', email: '', whatsapp: '', employee_number: '' },
      tabs: [
        { key: 'info', label: 'المعلومات الشخصية', icon: IdCard },
        { key: 'stats', label: 'إحصائيات المنصة', icon: BarChart3 },
        { key: 'tools', label: 'أدوات الإدارة', icon: LayoutGrid }
      ]
    }
  },

  computed: {
    ...mapState(useAuthStore, ['user']),
    ...mapState(useUiStore, ['semesters', 'activeSemesterId']),
    ...mapState(useLandingStore, ['stats']),

    roleLabel() {
      return ROLE_LABELS[ROLES.SUPER_ADMIN]
    },

    activeSemesterName() {
      return this.semesters.find((s) => String(s.id) === String(this.activeSemesterId))?.name || ''
    },

    platformStats() {
      const s = this.stats || {}
      return [
        { label: 'الأقسام الأكاديمية', value: s.departments ?? null },
        { label: 'فرق المشاريع', value: s.teams ?? null },
        { label: 'مشاريع التخرج', value: s.projects ?? null },
        { label: 'المشرفون', value: s.supervisors ?? null },
        { label: 'الطلاب', value: s.students ?? null },
        { label: 'متوسط الإنجاز', value: s.avg_completion != null ? Math.round(s.avg_completion) : null, suffix: '%' }
      ]
    },

    accountInfo() {
      const u = this.user || {}
      return [
        { label: 'الاسم', value: u.name },
        { label: 'البريد الإلكتروني', value: u.email, mono: true },
        { label: 'رقم الواتساب', value: u.whatsapp, mono: true },
        { label: 'الرقم الوظيفي', value: u.employee_number, mono: true },
        { label: 'الصلاحية', value: this.roleLabel },
        { label: 'الفصل الدراسي الحالي', value: this.activeSemesterName },
        { label: 'تاريخ إنشاء الحساب', value: u.created_at ? formatDate(u.created_at) : '' }
      ]
    },

    tools() {
      return NAV_ITEMS_BY_ROLE[ROLES.SUPER_ADMIN]
        .flatMap((group) => group.items)
        .filter((item) => item.to !== this.$route.path)
    }
  },

  created() {
    this.fetchCurrentUser().catch(() => {})
    this.fetchStats().catch(() => {})
  },

  methods: {
    ...mapActions(useAuthStore, ['fetchCurrentUser', 'updateProfile', 'uploadAvatar']),
    ...mapActions(useLandingStore, ['fetchStats']),

    startEdit() {
      const u = this.user || {}
      this.form = { name: u.name || '', email: u.email || '', whatsapp: u.whatsapp || '', employee_number: u.employee_number || '' }
      this.editing = true
    },

    async saveEdit() {
      this.saving = true
      try {
        await this.updateProfile({ ...this.form, whatsapp: this.form.whatsapp || null, employee_number: this.form.employee_number || null })
        this.editing = false
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
