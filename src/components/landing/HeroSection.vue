<template>
  <header class="relative pt-16 pb-10 overflow-hidden">
    <span aria-hidden="true" data-parallax="0.1" class="animate-blob pointer-events-none absolute rounded-pill w-[320px] h-[320px] bg-primary-500/[0.07] -top-24 -start-20" />
    <span aria-hidden="true" data-parallax="-0.06" class="animate-blob pointer-events-none absolute rounded-pill w-[260px] h-[260px] bg-accent-500/[0.06] top-1/3 -end-24" style="animation-delay:2.2s" />
    <div class="relative max-w-content mx-auto px-6 grid lg:grid-cols-2 gap-14 items-center">
      <!-- النص — يظهر أولًا على الموبايل -->
      <div class="reveal order-1">
        <span class="inline-flex items-center gap-2 mb-5 px-4 py-1.5 rounded-pill bg-surface border border-border shadow-card text-caption font-bold text-primary-700">
          <AppIcon name="graduation" :size="13" :stroke-width="2.2" />
          {{ APP_NAME }} — الأكاديمية
        </span>

        <h1 class="font-cairo font-extrabold text-hero-sm sm:text-hero leading-[1.28] mb-5 text-text-900">
          رحلة تخرجك<br>الأكاديمية<br>
          <span class="bg-gradient-to-l from-primary-600 to-accent-500 bg-clip-text text-transparent">
            بأداء احترافي
          </span>
        </h1>

        <p class="max-w-[480px] mb-8 text-[15px] leading-[1.9] text-text-600">
          منصة موحّدة تربط الطلاب بالمشرفين ولجنة الإشراف — لإدارة المقترحات، المهام،
          الاجتماعات، والمناقشات في مكان واحد.
        </p>

        <div class="flex flex-wrap gap-3.5 mb-9">
          <router-link
            v-magnetic
            :to="{ name: 'login' }"
            class="flex items-center gap-2.5 h-[52px] px-6 rounded-md bg-gradient-to-bl from-primary-600 to-primary-700 text-white font-cairo font-extrabold text-[14.5px] shadow-[0_12px_26px_-10px_rgba(37,99,235,.55)] transition-shadow duration-fast"
          >
            <AppIcon name="login" :size="16" :stroke-width="2.4" />
            تسجيل الدخول
          </router-link>

          <a
            v-magnetic
            href="#projects"
            class="flex items-center gap-2.5 h-[52px] px-6 rounded-md bg-surface border border-border text-text-900 font-cairo font-bold text-[14.5px] hover:border-primary-200 hover:text-primary-700 transition-colors duration-fast"
          >
            استكشاف المشاريع
            <AppIcon name="chevronStart" :size="16" :stroke-width="2.2" />
          </a>
        </div>

        <!-- إحصائيات سريعة — من الـ API -->
        <div class="flex flex-wrap items-center gap-4 text-body-sm font-bold text-text-700">
          <template v-for="(stat, index) in heroStats" :key="stat.key">
            <span v-if="index > 0" class="w-[5px] h-[5px] rounded-pill bg-primary-500" />
            <span v-if="statsLoading" class="inline-block w-20 h-4 rounded-sm bg-border-soft animate-pulse" />
            <span v-else-if="stat.value !== null"><CountUp :value="stat.value" :formatter="withPlus" /> {{ stat.label }}</span>
            <span v-else class="text-text-400">— {{ stat.label }}</span>
          </template>
        </div>
      </div>

      <!-- المعاينة البصرية — تظهر ثانيًا على الموبايل، بعد النص -->
      <div class="reveal reveal-delay-2 order-2">
        <div class="relative">
          <button
            type="button"
            class="block w-full text-start bg-surface border border-border rounded-lg shadow-card-hover overflow-hidden animate-float"
            aria-label="تشغيل فيديو تعريفي عن مشاريع التخرج"
            @click="openPlaceholderVideo"
          >
            <div class="flex items-center gap-2 px-4 py-3 border-b border-border-soft bg-bg">
              <span class="w-[9px] h-[9px] rounded-pill bg-error" />
              <span class="w-[9px] h-[9px] rounded-pill bg-warning" />
              <span class="w-[9px] h-[9px] rounded-pill bg-success" />
              <span class="ms-3 text-[11px] text-text-400">مسار / معاينة المشاريع</span>
            </div>

            <div class="relative aspect-[16/10] grid place-items-center overflow-hidden group bg-gradient-to-bl from-primary-900 via-primary-600 to-accent-500">
              <span class="absolute inset-0 opacity-[0.12] pointer-events-none" style="background-image:radial-gradient(#fff 1px, transparent 1px); background-size:22px 22px;" />
              <span class="grid place-items-center w-16 h-16 rounded-pill bg-white text-primary-600 shadow-[0_10px_26px_rgba(0,0,0,.25)] animate-pulse-glow transition-transform duration-fast group-hover:scale-110">
                <AppIcon name="play" :size="24" class="ms-[3px]" />
              </span>
              <div class="absolute bottom-4 start-4 text-white">
                <p class="text-body-sm font-bold">فيديو تعريفي عن مشاريع التخرج</p>
                <p class="text-[11px] opacity-75 mt-0.5">جولة سريعة على أفضل المشاريع المؤرشفة</p>
              </div>
              <span class="absolute top-4 end-4 grid place-items-center w-9 h-9 rounded-pill bg-white/15 text-white backdrop-blur-sm">
                <AppIcon name="graduation" :size="16" />
              </span>
            </div>
          </button>

          <div class="absolute -bottom-[22px] start-6 flex items-center gap-3 px-[18px] py-3 rounded-md bg-surface border border-border shadow-card-hover animate-float-delayed">
            <span class="grid place-items-center w-9 h-9 rounded-sm bg-secondary-50 text-secondary-600">
              <AppIcon name="check" :size="17" :stroke-width="2.4" />
            </span>
            <span>
              <span class="block text-[12.5px] font-bold text-text-900">تجربة موحّدة</span>
              <span class="block text-[10.5px] text-text-400">لكل مستخدمي المنصة</span>
            </span>
          </div>
        </div>
      </div>
    </div>
  </header>
</template>

<script setup>
import { storeToRefs } from 'pinia'
import { useLandingStore } from '@/stores/landing.store'
import { formatNumber } from '@/utils/formatters'
import { APP_NAME } from '@/utils/constants'
import AppIcon from '@/components/icons/AppIcon.vue'
import CountUp from '@/components/ui/CountUp.vue'
import { openPlaceholderVideo } from '@/utils/filePreview'

const landingStore = useLandingStore()
// استخدام storeToRefs يمنع مشاكل الـ Re-render الشديدة بالـ Store
const { heroStats, statsLoading } = storeToRefs(landingStore)

const withPlus = (n) => `+${formatNumber(n)}`
</script>
