<template>
  <!-- الهيرو: صورة حفل تخرّج الكلية الرسمية كخلفية كاملة، مع طبقة تظليل بتدرّج الهوية
       تُغمّق جهة النص (يمين) وتُبقي الصورة واضحة، ثم شريط الإحصائيات بأرقام بيضاء كبيرة -->
  <section class="us-hero-wrap us-hero-wrap--photo">
    <div class="us-hero-bg" aria-hidden="true" :style="{ backgroundImage: `url(${heroCover})` }"></div>
    <div class="us-hero">
      <div class="us-wrap us-hero-in">
        <div class="us-hero-text reveal">
          <span class="us-hero-eyebrow">الكلية الجامعية للعلوم التطبيقية</span>
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
import { ArrowDown, LogIn } from 'lucide-vue-next'
// صورة الغلاف الرسمية (حفل تخرّج الكلية) — مُجمّعة محليًا بدل مؤثّر مطر البيانات
import heroCover from '@/assets/hero/ucas-cover.jpg'

const landingStore = useLandingStore()
const { bannerStats, statsLoading } = storeToRefs(landingStore)

const withPlus = (n) => `+${formatNumber(n)}`

onMounted(() => {
  landingStore.fetchStats().catch(() => {
    // الأرقام تبقى "—" عند تعذّر التحميل
  })
})
</script>
