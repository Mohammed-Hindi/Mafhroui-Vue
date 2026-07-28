<template>
  <div class="animate-pulse space-y-3" role="status" aria-label="جارٍ التحميل">
    <div
      v-for="n in rows"
      :key="n"
      class="bg-border-soft rounded-sm"
      :style="{ height: height, width: n === rows && rows > 1 ? '70%' : '100%' }"
    />
  </div>
</template>

<script>
export default {
  name: 'SkeletonLoader',
  props: {
    rows: { type: Number, default: 3 },
    height: { type: String, default: '16px' }
  }
}
</script>
