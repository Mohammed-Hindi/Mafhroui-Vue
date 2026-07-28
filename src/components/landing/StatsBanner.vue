<template>
  <div class="py-[52px] bg-gradient-to-l from-primary-900 via-primary-700 to-accent-600 dark:from-[#0B1220] dark:via-primary-900 dark:to-accent-600">
    <div class="max-w-content mx-auto px-6 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-5 gap-y-7 text-center">
      <div v-for="(stat, index) in bannerStats" :key="stat.key" class="reveal" :style="{ transitionDelay: `${index * 70}ms` }">
        <span class="grid place-items-center w-11 h-11 rounded-md bg-white/15 text-white mx-auto mb-3">
          <AppIcon :name="stat.icon" :size="19" />
        </span>

        <p class="font-cairo font-extrabold text-[26px] text-white leading-none">
          <span v-if="statsLoading" class="inline-block w-14 h-6 rounded-sm bg-white/20 animate-pulse align-middle" />
          <template v-else-if="stat.value !== null">+{{ formatNumber(stat.value) }}</template>
          <template v-else>—</template>
        </p>
        <p class="text-label text-white/70 mt-1">{{ stat.label }}</p>
      </div>
    </div>

    <p v-if="statsError" class="max-w-content mx-auto px-6 mt-6 text-center text-caption text-white/70">
      {{ statsError }}
      <button type="button" class="underline underline-offset-4 font-bold hover:text-white transition-colors duration-fast" @click="loadStats">
        إعادة المحاولة
      </button>
    </p>
  </div>
</template>

<script setup>
import { onMounted } from 'vue'
import { useLandingStore } from '@/stores/landing.store'
import { formatNumber } from '@/utils/formatters'
import AppIcon from '@/components/icons/AppIcon.vue'

const landingStore = useLandingStore()
const { bannerStats, statsLoading, statsError } = landingStore

// فجوة باك إند: لا يوجد GET /stats عام — fetchStats تضبط statsError فورًا (راجعي API_REFERENCE.md)
const loadStats = async () => {
  try {
    await landingStore.fetchStats()
  } catch (_) {
    // الخطأ يُعرض بالواجهة عبر statsError
  }
}

onMounted(() => {
  loadStats()
})
</script>
