<template>
  <!-- رأس الصفحة بهوية الكلية — يظهر للسوبر أدمن فقط (الصفحات المشتركة مع لجنة الإشراف تبقى كما هي لهم) -->
  <div v-if="isSuperAdmin" class="flex flex-wrap items-center justify-between gap-4 mb-6">
    <div class="flex items-center gap-3">
      <span class="page-icon grid place-items-center rounded-md shrink-0" :style="{ '--icon-color': color }">
        <component :is="icon" :size="22" />
      </span>
      <div>
        <h3 class="text-h3 font-bold text-text-900">{{ title }}</h3>
        <p v-if="subtitle" class="text-caption text-text-600">{{ subtitle }}</p>
      </div>
    </div>
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
    icon: { type: [Object, Function], required: true },
    /** لون الأيقونة الخطية — نفس لون عنصر الصفحة في السايد بار (navConfig.js) */
    color: { type: String, required: true },
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
