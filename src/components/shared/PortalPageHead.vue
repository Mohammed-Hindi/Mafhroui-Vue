<template>
  <!-- رأس الصفحة بنمط بطاقات البوابة ("طلب إفادة  الفصل الدراسي…" — 201350): بطاقة بيضاء، عنوان ≡ + وصف رمادي بجانبه.
       يظهر للسوبر أدمن فقط (الصفحات المشتركة مع لجنة الإشراف تبقى كما هي لهم) -->
  <div v-if="isSuperAdmin" class="portal-head mb-6">
    <h3 class="portal-title">{{ title }}</h3>
    <p v-if="subtitle" class="portal-head-sub">{{ subtitle }}</p>
    <slot />
  </div>
</template>

<script>
import { mapState } from 'pinia'
import { useAuthStore } from '@/stores/auth.store'
import { ROLES } from '@/utils/constants'

export default {
  name: 'PortalPageHead',

  props: {
    // icon/color لم يعودا يُرسمان (البوابة بلا مربعات أيقونات ملوّنة) — باقيان حتى لا تنكسر الصفحات التي تمرّرهما
    icon: { type: [Object, Function], default: null },
    color: { type: String, default: '' },
    title: { type: String, required: true },
    subtitle: { type: String, default: '' }
  },

  computed: {
    ...mapState(useAuthStore, ['userRole']),
    isSuperAdmin() {
      return this.userRole === ROLES.SUPER_ADMIN
    }
  }
}
</script>
