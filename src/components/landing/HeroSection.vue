<template>
  <!-- الهيرو بنمط موقع الكلية (195704): خلفية التدرج بشبكة نقاط، شريط تبويبات متدرّج بزوايا علوية، ثم شريط الإحصائيات بأرقام بيضاء كبيرة -->
  <section>
    <div class="us-hero">
      <div class="us-wrap us-hero-in">
        <div class="reveal">
          <h1>منصة {{ APP_NAME }} لمشاريع التخرج</h1>
          <p>
            منصة موحّدة تربط الطلاب بالمشرفين ولجنة الإشراف لإدارة المقترحات والمهام والاجتماعات
            والمناقشات وأرشفة أفضل مشاريع التخرج في الكلية الجامعية للعلوم التطبيقية.
          </p>
          <div class="us-hero-actions">
            <router-link :to="{ name: 'login' }" class="us-btn is-white is-solid">تسجيل الدخول</router-link>
            <a href="#projects" class="us-btn is-white">أفضل مشاريع التخرج</a>
          </div>
        </div>
        <div class="us-hero-mark reveal reveal-delay-2" aria-hidden="true"><UcasLogo :size="190" /></div>
      </div>

      <div class="us-tabs">
        <nav aria-label="أقسام الصفحة">
          <a href="#projects">أفضل المشاريع</a>
          <a href="#features">ميزات المنصة</a>
          <a href="#how">كيف تعمل</a>
          <a href="#departments">الأقسام</a>
        </nav>
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
import UcasLogo from '@/components/icons/UcasLogo.vue'
import CountUp from '@/components/ui/CountUp.vue'

const landingStore = useLandingStore()
const { bannerStats, statsLoading } = storeToRefs(landingStore)

const withPlus = (n) => `+${formatNumber(n)}`

onMounted(() => {
  landingStore.fetchStats().catch(() => {
    // الأرقام تبقى "—" عند تعذّر التحميل
  })
})
</script>
