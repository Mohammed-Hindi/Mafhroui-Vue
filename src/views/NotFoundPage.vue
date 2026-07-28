<template>
  <div class="min-h-screen grid place-items-center bg-bg px-6">
    <div class="text-center max-w-md">
      <p class="font-cairo font-black text-[64px] text-primary-600 leading-none">404</p>
      <h1 class="mt-4 font-cairo font-bold text-h1 text-text-900">الصفحة غير موجودة</h1>
      <p class="mt-2 text-body text-text-600">الرابط الذي فتحته غير صحيح أو أن الصفحة نُقلت.</p>
      <BaseButton to="/" variant="primary" class="mt-6">العودة للرئيسية</BaseButton>
    </div>
  </div>
</template>

<script>
import BaseButton from '@/components/ui/BaseButton.vue'

export default {
  name: 'NotFoundPage',
  components: { BaseButton }
}
</script>
