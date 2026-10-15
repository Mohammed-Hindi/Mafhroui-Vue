<template>
  <!-- الهيرو بنمط موقع الكلية (195704): خلفية التدرج بشبكة نقاط ومطر البيانات، النص وكلمة مسار، ثم شريط الإحصائيات بأرقام بيضاء كبيرة -->
  <!-- مطر البيانات على مستوى القسم كله فيصل إلى شريط الإحصائيات -->
  <section class="us-hero-wrap">
    <DataRain :focus="wordRect" :gain="2.6" />
    <div class="us-hero">
      <div class="us-wrap us-hero-in">
        <div class="us-hero-text reveal">
          <h1>منصة {{ APP_NAME }} لمشاريع التخرج</h1>
          <p>
            منصة موحّدة تربط الطلاب بالمشرفين ولجنة الإشراف لإدارة المقترحات والمهام والاجتماعات
            والمناقشات وأرشفة أفضل مشاريع التخرج في الكلية الجامعية للعلوم التطبيقية.
          </p>
          <div class="us-hero-actions">
            <router-link :to="{ name: 'login' }" class="us-btn us-glow-btn">تسجيل الدخول <LogIn :size="19" class="us-flip" /></router-link>
            <a href="#projects" class="us-btn is-glass">أفضل مشاريع التخرج <ArrowDown :size="18" /></a>
          </div>
        </div>
        <MasarWordmark ref="word" />
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
import { onMounted, ref } from 'vue'
import { storeToRefs } from 'pinia'
import { useLandingStore } from '@/stores/landing.store'
import { formatNumber } from '@/utils/formatters'
import { APP_NAME } from '@/utils/constants'
import CountUp from '@/components/ui/CountUp.vue'
import DataRain from './DataRain.vue'
import MasarWordmark from './MasarWordmark.vue'
import { ArrowDown, LogIn } from 'lucide-vue-next'

// مطر البيانات يلتف حول كلمة مسار أثناء ظهورها
const word = ref(null)
const wordRect = () => word.value?.$el?.getBoundingClientRect() ?? null

const landingStore = useLandingStore()
const { bannerStats, statsLoading } = storeToRefs(landingStore)

const withPlus = (n) => `+${formatNumber(n)}`

onMounted(() => {
  landingStore.fetchStats().catch(() => {
    // الأرقام تبقى "—" عند تعذّر التحميل
  })
})
</script>
