<template>
  <!-- بطاقة "المعلومات الشخصية" بنمط ملف الطالب (201300) مع الصورة الشخصية وتعديل البيانات في نفس المكان:
       الحقول ذات key قابلة للتعديل (PATCH /me)، والصورة POST /me/avatar -->
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
        <button v-if="!editing" type="button" class="pbtn is-cyan is-sm" @click="startEdit"><Pencil :size="15" /> تعديل البيانات</button>
      </div>
    </div>

    <div v-for="sec in sections" :key="sec.title" class="pf-row">
      <h4 class="pf-row-title">{{ sec.title }}</h4>
      <div class="pf-row-fields">
        <label v-for="f in sec.fields" :key="f.label" class="profile-field">
          <span class="profile-field-label">{{ f.label }}</span>
          <span v-if="editing && f.key" class="pf-input">
            <b v-if="f.required" class="pf-req" aria-hidden="true">*</b>
            <input v-model.trim="form[f.key]" :type="f.type || 'text'" :required="f.required" :maxlength="f.max || 150" :dir="f.mono ? 'ltr' : undefined" :placeholder="f.placeholder">
          </span>
          <span v-else :class="['profile-field-value', f.mono && 'mono']">{{ f.value ?? '—' }}</span>
        </label>
      </div>
    </div>

    <div v-if="editing" class="pf-form-actions">
      <small class="pf-req-note"><b>*</b> تعني أن الحقل مطلوب</small>
      <button type="button" class="pbtn is-outline" :disabled="saving" @click="editing = false">إلغاء</button>
      <button type="submit" class="pbtn is-green" :disabled="saving"><Check :size="16" /> {{ saving ? 'جارٍ الحفظ…' : 'حفظ التعديلات' }}</button>
    </div>
  </form>
</template>

<script>
import { mapState, mapActions } from 'pinia'
import { Camera, Check, Pencil } from 'lucide-vue-next'
import { useAuthStore } from '@/stores/auth.store'

export default {
  name: 'ProfileInfoCard',

  components: { Camera, Check, Pencil },

  props: {
    /** [{ title, fields: [{ label, value, key?, required?, type?, mono?, max?, placeholder? }] }] */
    sections: { type: Array, required: true }
  },

  data() {
    return { editing: false, saving: false, uploading: false, form: {} }
  },

  computed: {
    ...mapState(useAuthStore, ['user', 'avatarSrc'])
  },

  methods: {
    ...mapActions(useAuthStore, ['updateProfile', 'uploadAvatar']),

    startEdit() {
      const keys = this.sections.flatMap((s) => s.fields).filter((f) => f.key)
      this.form = Object.fromEntries(keys.map((f) => [f.key, this.user?.[f.key] || '']))
      this.editing = true
    },

    async save() {
      this.saving = true
      try {
        // الحقول الاختيارية الفارغة تُرسل null
        await this.updateProfile(Object.fromEntries(Object.entries(this.form).map(([k, v]) => [k, v || (k === 'name' || k === 'email' ? v : null)])))
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
