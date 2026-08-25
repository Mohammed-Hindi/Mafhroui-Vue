<template>
  <BaseModal v-model="isOpen" title="تغيير كلمة السر" description="أدخلي كلمة السر الحالية ثم الجديدة لتأكيد التغيير" size="sm">
    <div class="flex flex-col gap-4">
      <BaseInput v-model="form.current" type="password" label="كلمة السر الحالية" placeholder="••••••••" />
      <BaseInput v-model="form.next" type="password" label="كلمة السر الجديدة" placeholder="••••••••" />
      <BaseInput v-model="form.confirm" type="password" label="تأكيد كلمة السر الجديدة" placeholder="••••••••" />
    </div>
    <template #footer>
      <BaseButton variant="ghost" @click="isOpen = false">إلغاء</BaseButton>
      <BaseButton :icon="Check" @click="submit">حفظ التغييرات</BaseButton>
    </template>
  </BaseModal>
</template>

<script>
import { Check } from 'lucide-vue-next'
import BaseModal from '@/components/ui/BaseModal.vue'
import BaseInput from '@/components/ui/BaseInput.vue'
import BaseButton from '@/components/ui/BaseButton.vue'

export default {
  name: 'ChangePasswordModal',

  components: { BaseModal, BaseInput, BaseButton },

  props: {
    modelValue: { type: Boolean, default: false }
  },

  emits: ['update:modelValue'],

  data() {
    return {
      Check,
      form: { current: '', next: '', confirm: '' }
    }
  },

  computed: {
    isOpen: {
      get() { return this.modelValue },
      set(value) { this.$emit('update:modelValue', value) }
    }
  },

  watch: {
    modelValue(open) {
      if (open) this.form = { current: '', next: '', confirm: '' }
    }
  },

  methods: {
    submit() {
      if (!this.form.current || !this.form.next || !this.form.confirm) {
        this.$toast?.error('يرجى تعبئة جميع الحقول')
        return
      }
      if (this.form.next.length < 8) {
        this.$toast?.error('كلمة السر الجديدة يجب ألا تقل عن 8 أحرف')
        return
      }
      if (this.form.next !== this.form.confirm) {
        this.$toast?.error('كلمة السر الجديدة وتأكيدها غير متطابقتين')
        return
      }
      this.isOpen = false
      this.$toast?.success('تم تغيير كلمة السر بنجاح')
    }
  }
}
</script>
