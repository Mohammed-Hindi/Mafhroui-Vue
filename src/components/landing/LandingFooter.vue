<template>
  <!-- فوتر موقع الكلية (200153): كحلي بأربعة أعمدة، عناوين بيضاء تحتها خط تدرج قصير، وخط تدرج فوق الحقوق -->
  <footer class="us-footer">
    <div class="us-wrap us-footer-cols">
      <div>
        <div class="us-footer-brand">
          <UcasLogo :size="46" />
          <span>
            <strong>الكلية الجامعية للعلوم التطبيقية</strong>
            <small>{{ APP_NAME }} — {{ APP_DESCRIPTION }}</small>
          </span>
        </div>
        <p>منصة موحّدة لإدارة مشاريع التخرج من المقترح حتى المناقشة والأرشفة.</p>
      </div>

      <div>
        <h2>روابط سريعة</h2>
        <ul>
          <li v-for="l in LANDING_LINKS" :key="l.label"><router-link :to="l.to">{{ l.label }}</router-link></li>
        </ul>
      </div>

      <div>
        <h2>الأقسام</h2>
        <ul>
          <li v-for="d in departments" :key="d.id"><router-link :to="{ name: 'landing', hash: '#departments' }">{{ d.name }}</router-link></li>
          <li v-if="!departments.length">—</li>
        </ul>
      </div>

      <div>
        <h2>اتصل بنا</h2>
        <ul class="us-footer-contact">
          <li><Phone :size="16" /><a :href="`tel:${CONTACT.PHONE_RAW}`" dir="ltr">{{ CONTACT.PHONE }}</a></li>
          <li><Mail :size="16" /><a :href="`mailto:${CONTACT.EMAIL}`">{{ CONTACT.EMAIL }}</a></li>
          <li><MapPin :size="16" />{{ CONTACT.ADDRESS }}</li>
        </ul>
      </div>
    </div>

    <!-- شريط الحقوق السفلي؛ السنة من تاريخ الجهاز -->
    <div class="us-footer-bar">
      <!-- الحقوق في المنتصف؛ الضغط على "منصة مسار" يُظهر أسماء المطورين بحركة لمدة 10 ثوانٍ ثم تختفي -->
      <div class="us-wrap us-footer-copy">
        <p>{{ year }} © جميع الحقوق محفوظة لـ <button type="button" class="us-credit-btn" :aria-expanded="showDevs" @click="revealDevs">منصة {{ APP_NAME }}</button></p>
        <Transition name="us-devs">
          <p v-if="showDevs" :key="devsKey" class="us-devs" role="status">
            <span class="us-devs-label">تطوير</span>
            <span v-for="(d, i) in DEVELOPERS" :key="d.name" class="us-dev" :style="{ animationDelay: `${0.25 + i * 0.25}s` }">
              <span class="us-devs-name">{{ d.name }}</span>
              <a :href="`tel:${d.phone}`" class="us-dev-phone" dir="ltr"><Phone :size="13" /> {{ d.phone }}</a>
            </span>
            <span class="us-devs-timer" />
          </p>
        </Transition>
      </div>
    </div>
  </footer>
</template>

<script setup>
import { nextTick, onBeforeUnmount, ref } from 'vue'
import { storeToRefs } from 'pinia'
import { Mail, MapPin, Phone } from 'lucide-vue-next'
import UcasLogo from '@/components/icons/UcasLogo.vue'
import { useLandingStore } from '@/stores/landing.store'
import { CONTACT, APP_NAME, APP_DESCRIPTION, LANDING_LINKS } from '@/utils/constants'

const landingStore = useLandingStore()
const { departments } = storeToRefs(landingStore)
// الأقسام لعمود الفوتر (تُجلب مرة واحدة حتى خارج الصفحة الرئيسية)
if (!departments.value.length) landingStore.fetchDepartments().catch(() => {})
const year = new Date().getFullYear()

const DEVELOPERS = [
  { name: 'انس محمد الشنطي', phone: '0597302452' },
  { name: 'محمد زياد الغول', phone: '0568482999' }
]
const DEVS_MS = 10000
const showDevs = ref(false)
const devsKey = ref(0)
let devsTimer = 0
/** إظهار أسماء المطورين 10 ثوانٍ؛ ضغطة جديدة تعيد الحركة والعدّاد من البداية */
const revealDevs = () => {
  clearTimeout(devsTimer)
  devsKey.value++
  showDevs.value = true
  // نزول تلقائي لأسفل الصفحة حتى تظهر الأسماء كاملة
  nextTick(() => window.scrollTo({ top: document.documentElement.scrollHeight, behavior: 'smooth' }))
  devsTimer = setTimeout(() => { showDevs.value = false }, DEVS_MS)
}
onBeforeUnmount(() => clearTimeout(devsTimer))
</script>
