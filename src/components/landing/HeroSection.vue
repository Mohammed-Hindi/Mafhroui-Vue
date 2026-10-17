<template>
  <!-- الهيرو بنمط موقع الكلية: صورة رسمية من موقع UCAS كخلفية مع طبقة تدرّج الهوية فوقها، النص وكلمة مسار، ثم شريط الإحصائيات بأرقام بيضاء كبيرة -->
  <section class="us-hero-wrap us-hero-wrap--photo">
    <div class="us-hero-bg" aria-hidden="true" :style="{ backgroundImage: `url(${HERO_IMAGE})` }"></div>
    <div class="us-hero">
      <div class="us-wrap us-hero-in">
        <div class="us-hero-text reveal">
          <h1>منصة {{ APP_NAME }} لمشاريع التخرج</h1>
          <p>
            منصة موحّدة تربط الطلاب بالمشرفين ولجنة الإشراف لإدارة المقترحات والمهام والاجتماعات
            والمناقشات وأرشفة أفضل مشاريع التخرج في الكلية الجامعية للعلوم التطبيقية.
          </p>
          <div class="us-hero-actions">
            <router-link :to="{ name: 'login' }" class="us-btn is-solid is-white">تسجيل الدخول <LogIn :size="19" class="us-flip" /></router-link>
            <a href="#projects" class="us-btn is-glass">أفضل مشاريع التخرج <ArrowDown :size="18" /></a>
          </div>
        </div>
        <MasarWordmark />
      </div>
    </div>

    <div class="us-stats">
      <div class="us-wrap us-stats-in">
        <div v-for="stat in bannerStats" :key="stat.key">
          <b>
            <template v-if="statsLoading">…</template>
            <CountUp v-else-if="stat.value !== null" :value="stat.value" :formatter="withPlus" />
            <template v-else>—</template>
          </b>
          <span>{{ stat.label }}</span>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup>
import { onMounted } from 'vue'
import { storeToRefs } from 'pinia'
import { useLandingStore } from '@/stores/landing.store'
import { formatNumber } from '@/utils/formatters'
import { APP_NAME } from '@/utils/constants'
import CountUp from '@/components/ui/CountUp.vue'
import MasarWordmark from './MasarWordmark.vue'
import { ArrowDown, LogIn } from 'lucide-vue-next'

// صورة الغلاف الرسمية من موقع الكلية (خلفية الهيرو بدل مؤثّر مطر البيانات)
const HERO_IMAGE = 'https://www.ucas.edu.ps/Gallery/site_images/slider/2026/09/22/coverc%20(3).jpg'

const landingStore = useLandingStore()
const { bannerStats, statsLoading } = storeToRefs(landingStore)

const withPlus = (n) => `+${formatNumber(n)}`

onMounted(() => {
  landingStore.fetchStats().catch(() => {
    // الأرقام تبقى "—" عند تعذّر التحميل
  })
})
</script>
