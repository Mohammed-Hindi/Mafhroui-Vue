<template>
  <!-- بطاقة "المعلومات الشخصية" المشتركة (طالب/مشرف): الصورة + الحقول القابلة للتعديل مفتوحة دائمًا،
       وزر الحفظ يتفعّل فقط عند وجود تغيير فعلي. الحقول ذات key تُحفظ عبر PATCH /me، والصورة POST /me/avatar. -->
  <form class="profile-card" @submit.prevent="save">
    <div class="pf-photo">
      <span class="pf-photo-img">
        <img v-if="avatarSrc" :src="avatarSrc" alt="الصورة الشخصية">
        <span v-else aria-hidden="true">{{ (user?.name || '?').charAt(0) }}</span>
      </span>
      <div class="pf-photo-text">
        <h3 class="portal-title">المعلومات الشخصية</h3>
        <small>الصورة PNG أو JPG أو WEBP حتى 2MB</small>
      </div>
      <div class="pf-actions">
        <label class="pbtn is-outline is-sm" :aria-disabled="uploading">
          <Camera :size="15" /> {{ uploading ? 'جارٍ الرفع…' : user?.avatar_url ? 'تغيير الصورة' : 'إضافة صورة' }}
          <input type="file" accept="image/png,image/jpeg,image/webp" hidden :disabled="uploading" @change="onAvatar">
        </label>
        <router-link v-if="changePasswordRoute" :to="{ name: changePasswordRoute }" class="pbtn is-outline is-sm"><Lock :size="15" /> تغيير كلمة المرور</router-link>
      </div>
    </div>

    <div v-for="sec in sections" :key="sec.title" class="pf-row">
      <h4 class="pf-row-title">{{ sec.title }}</h4>
      <div class="pf-row-fields">
        <label v-for="f in sec.fields" :key="f.label" class="profile-field">
          <span class="profile-field-label">{{ f.label }}</span>
          <span v-if="f.key" class="pf-input">
            <b v-if="f.required" class="pf-req" aria-hidden="true">*</b>
            <input v-model.trim="form[f.key]" :type="f.type || 'text'" :required="f.required" :maxlength="f.max || 150" :dir="f.mono ? 'ltr' : undefined" :placeholder="f.placeholder">
          </span>
          <span v-else :class="['profile-field-value', f.mono && 'mono']">{{ f.value ?? '—' }}</span>
        </label>
      </div>
    </div>

    <div class="pf-form-actions">
      <small class="pf-req-note"><b>*</b> تعني أن الحقل مطلوب</small>
      <button type="button" class="pbtn is-outline" :disabled="!isDirty || saving" @click="resetForm">تراجع</button>
      <button type="submit" class="pbtn is-green" :disabled="!isDirty || saving"><Check :size="16" /> {{ saving ? 'جارٍ الحفظ…' : 'حفظ التعديلات' }}</button>
    </div>
  </form>
</template>

<script>
import { mapState, mapActions } from 'pinia'
import { Camera, Check, Lock } from 'lucide-vue-next'
import { useAuthStore } from '@/stores/auth.store'

export default {
  name: 'ProfileInfoCard',

  components: { Camera, Check, Lock },

  props: {
    /** [{ title, fields: [{ label, value, key?, required?, type?, mono?, max?, placeholder? }] }] */
    sections: { type: Array, required: true },
    /** اسم مسار "تغيير كلمة المرور" لهذا الدور (يظهر زرّه في الإجراءات إن مُرِّر) */
    changePasswordRoute: { type: String, default: '' }
  },

  data() {
    return { saving: false, uploading: false, form: {} }
  },

  computed: {
    ...mapState(useAuthStore, ['user', 'avatarSrc']),

    /** مفاتيح الحقول القابلة للتعديل (المستخرجة من الأقسام) */
    editableKeys() {
      return this.sections.flatMap((s) => s.fields).filter((f) => f.key).map((f) => f.key)
    },

    /** الحفظ يتفعّل فقط لو في تغيير فعلي عن البيانات الحالية */
    isDirty() {
      return this.editableKeys.some((k) => (this.form[k] || '') !== (this.user?.[k] || ''))
    }
  },

  watch: {
    // تعبئة النموذج من بيانات المستخدم فور توفّرها/تحديثها (وبعد الحفظ → يُطفأ زر الحفظ)
    user: { handler() { this.resetForm() }, immediate: true }
  },

  methods: {
    ...mapActions(useAuthStore, ['updateProfile', 'uploadAvatar']),

    resetForm() {
      this.form = Object.fromEntries(this.editableKeys.map((k) => [k, this.user?.[k] || '']))
    },

    async save() {
      this.saving = true
      try {
        // الحقول الاختيارية الفارغة تُرسل null (ما عدا الاسم والبريد)
        await this.updateProfile(Object.fromEntries(Object.entries(this.form).map(([k, v]) => [k, v || (k === 'name' || k === 'email' ? v : null)])))
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
