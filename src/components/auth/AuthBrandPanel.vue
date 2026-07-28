<template>
  <aside class="hidden lg:flex order-1 flex-1 relative overflow-hidden flex-col justify-between p-14 text-white bg-gradient-to-bl from-primary-700 via-primary-600 to-accent-500">
    <span class="animate-blob absolute rounded-pill w-[280px] h-[280px] bg-white/10 -top-20 -end-16" />
    <span class="animate-blob absolute rounded-pill w-[200px] h-[200px] bg-accent-500/35 -bottom-16 -start-12" style="animation-delay:2s" />
    <span class="animate-blob absolute rounded-pill w-[140px] h-[140px] bg-white/10 bottom-28 end-16" style="animation-delay:4s" />

    <div class="relative z-10 flex items-center gap-3.5">
      <span class="grid place-items-center w-12 h-12 rounded-md bg-white/15 backdrop-blur-sm shrink-0">
        <AppIcon name="graduation" :size="24" :stroke-width="2.2" />
      </span>
      <h1 class="font-cairo font-extrabold text-[16px] text-white">منصة إدارة مشاريع التخرج</h1>
    </div>

    <div class="relative z-10 max-w-[460px]">
      <h2 class="font-cairo font-extrabold text-[32px] leading-[1.35] text-white mb-4">
        إدارة مشاريع التخرج بكفاءة، من فكرة المقترح حتى الأرشفة النهائية.
      </h2>
      <p class="text-[14.5px] leading-[1.9] text-white/80">
        منصة موحّدة تتيح للجنة الإشراف متابعة الفرق والمشرفين، مراجعة المقترحات واعتمادها،
        وتتبّع نسبة إنجاز كل مشروع لحظة بلحظة — في مكان واحد.
      </p>

      <div class="flex flex-col gap-4 mt-9">
        <div v-for="feature in features" :key="feature.text" class="flex items-center gap-3.5">
          <span class="grid place-items-center w-[38px] h-[38px] rounded-md bg-white/15 backdrop-blur-sm shrink-0">
            <AppIcon :name="feature.icon" :size="18" :stroke-width="2.2" />
          </span>
          <span class="text-[13.5px] font-semibold text-white/90">{{ feature.text }}</span>
        </div>
      </div>
    </div>

    <div class="relative z-10 flex gap-10">
      <div v-for="stat in authBrandStats" :key="stat.key">
        <p class="font-cairo font-extrabold text-[24px] text-white leading-none">
          <span v-if="statsLoading" class="inline-block w-10 h-5 rounded-sm bg-white/20 animate-pulse align-middle" />
          <template v-else-if="stat.value !== null">{{ formatNumber(stat.value) }}{{ stat.suffix }}</template>
          <template v-else>—</template>
        </p>
        <p class="text-[11px] text-white/60 mt-0.5">{{ stat.label }}</p>
      </div>
    </div>
  </aside>
</template>

<script>
import { mapState, mapActions } from 'pinia'
import { useLandingStore } from '@/stores/landing.store'
import { formatNumber } from '@/utils/formatters'
import AppIcon from '@/components/icons/AppIcon.vue'

export default {
  name: 'AuthBrandPanel',

  components: { AppIcon },

  data() {
    return {
      /* محتوى تسويقي ثابت — لا يُجلب من الـ API */
      features: [
        { icon: 'teams', text: 'إدارة الفرق والمشرفين والطلاب في مكان واحد' },
        { icon: 'checkSquare', text: 'مراجعة المقترحات واعتمادها بضغطة واحدة' },
        { icon: 'barChart', text: 'متابعة نسبة تقدّم المشاريع أولًا بأول' }
      ]
    }
  },

  computed: {
    ...mapState(useLandingStore, ['authBrandStats', 'statsLoading'])
  },

  created() {
    // فجوة باك إند: لا يوجد GET /stats عام — القيم تظهر "—" (راجعي API_REFERENCE.md)
    this.fetchStats().catch(() => {})
  },

  methods: {
    ...mapActions(useLandingStore, ['fetchStats']),
    formatNumber
  }
}
</script>
