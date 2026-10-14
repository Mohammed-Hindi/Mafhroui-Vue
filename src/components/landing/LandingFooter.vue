<template>
  <!-- فوتر موقع الكلية (200153): كحلي بأربعة أعمدة، عناوين بيضاء تحتها خط تدرج قصير، وخط تدرج فوق الحقوق -->
  <footer class="us-footer">
    <div class="us-wrap us-footer-cols">
      <div>
        <div class="us-footer-brand">
          <UcasLogo :size="58" />
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
          <li><router-link :to="{ name: 'login' }">تسجيل الدخول</router-link></li>
          <li><router-link :to="{ name: 'landing', hash: '#projects' }">أفضل المشاريع</router-link></li>
          <li><router-link :to="{ name: 'projects-archive' }">أرشيف المشاريع</router-link></li>
          <li><router-link :to="{ name: 'landing', hash: '#how' }">كيف تعمل المنصة</router-link></li>
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
          <li><Phone :size="17" /><a :href="`tel:${CONTACT.PHONE_RAW}`" dir="ltr">{{ CONTACT.PHONE }}</a></li>
          <li><Mail :size="17" /><a :href="`mailto:${CONTACT.EMAIL}`">{{ CONTACT.EMAIL }}</a></li>
          <li><MapPin :size="17" />{{ CONTACT.ADDRESS }}</li>
        </ul>
      </div>
    </div>

    <p class="us-wrap us-footer-copy">جميع الحقوق محفوظة © {{ year }}</p>
  </footer>
</template>

<script setup>
import { storeToRefs } from 'pinia'
import { Mail, MapPin, Phone } from 'lucide-vue-next'
import UcasLogo from '@/components/icons/UcasLogo.vue'
import { useLandingStore } from '@/stores/landing.store'
import { CONTACT, APP_NAME, APP_DESCRIPTION } from '@/utils/constants'

const landingStore = useLandingStore()
const { departments } = storeToRefs(landingStore)
// الأقسام لعمود الفوتر (تُجلب مرة واحدة حتى خارج الصفحة الرئيسية)
if (!departments.value.length) landingStore.fetchDepartments().catch(() => {})
const year = new Date().getFullYear()
</script>
