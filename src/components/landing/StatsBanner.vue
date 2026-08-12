<template>
  <div class="relative overflow-hidden py-[52px] bg-gradient-to-l from-primary-900 via-primary-700 to-accent-600 dark:from-[#0B1220] dark:via-primary-900 dark:to-accent-600">
    <span aria-hidden="true" data-parallax="0.07" class="animate-blob pointer-events-none absolute rounded-pill w-[260px] h-[260px] bg-white/10 -top-20 -start-16" />
    <span aria-hidden="true" data-parallax="-0.09" class="animate-blob pointer-events-none absolute rounded-pill w-[200px] h-[200px] bg-white/10 -bottom-16 -end-12" style="animation-delay:2s" />
    <div class="relative max-w-content mx-auto px-6 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-5 gap-y-7 text-center">
      <div v-for="(stat, index) in bannerStats" :key="stat.key" class="reveal" :style="{ transitionDelay: `${index * 70}ms` }">
        <span class="grid place-items-center w-11 h-11 rounded-md bg-white/15 text-white mx-auto mb-3">
          <AppIcon :name="stat.icon" :size="19" />
        </span>

        <p class="font-cairo font-extrabold text-[26px] text-white leading-none">
          <span v-if="statsLoading" class="inline-block w-14 h-6 rounded-sm bg-white/20 animate-pulse align-middle" />
          <CountUp v-else-if="stat.value !== null" :value="stat.value" :formatter="withPlus" />
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
import { storeToRefs } from 'pinia'
import { useLandingStore } from '@/stores/landing.store'
import { formatNumber } from '@/utils/formatters'
import AppIcon from '@/components/icons/AppIcon.vue'
import CountUp from '@/components/ui/CountUp.vue'

const landingStore = useLandingStore()
const { bannerStats, statsLoading, statsError } = storeToRefs(landingStore)

const withPlus = (n) => `+${formatNumber(n)}`

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
