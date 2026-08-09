<template>
  <div class="min-h-screen grid place-items-center bg-bg px-6">
    <div class="text-center max-w-md">
      <p class="font-cairo font-black text-[64px] text-primary-600 leading-none">403</p>
      <h1 class="mt-4 font-cairo font-bold text-h1 text-text-900">صلاحية غير كافية</h1>
      <p class="mt-2 text-body text-text-600">حسابك لا يملك صلاحية الوصول إلى هذه الصفحة.</p>
      <BaseButton :to="homeRoute" variant="primary" class="mt-6">العودة إلى لوحتي</BaseButton>
    </div>
  </div>
</template>

<script>
import { mapState } from 'pinia'
import { useAuthStore } from '@/stores/auth.store'
import BaseButton from '@/components/ui/BaseButton.vue'

export default {
  name: 'ForbiddenPage',
  components: { BaseButton },
  computed: {
    ...mapState(useAuthStore, ['homeRoute'])
  }
}
</script>
