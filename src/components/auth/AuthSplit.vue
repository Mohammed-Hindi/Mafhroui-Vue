<template>
  <!-- قالب صفحات الدخول بهوية صفحة الهبوط، شاشة كاملة من قسمين:
       يمينًا الفورم (الشعار، العنوان والوصف، محتوى الصفحة، خط فاصل ثم رابط العودة)،
       ويسارًا لوحة التدرّج بمطر البيانات وشعار كلمة مسار المتحرك وعنوان المنصة.
       تستخدمه: تسجيل الدخول، استرجاع كلمة المرور، تغيير/تعيين كلمة المرور -->
  <div class="us-page au-split">
    <section class="au-split-form">
      <div class="au-split-in">
        <router-link :to="{ name: 'landing' }" class="au-split-brand">
          <UcasLogo :size="46" />
          <span>
            <strong>الكلية الجامعية للعلوم التطبيقية</strong>
            <small>{{ APP_NAME }} — {{ APP_DESCRIPTION }}</small>
          </span>
        </router-link>

        <h1 class="au-split-title">{{ title }}</h1>
        <p v-if="subtitle" class="au-split-sub">{{ subtitle }}</p>

        <slot />

        <div class="au-split-back">
          <router-link :to="back.to"><ArrowRight :size="17" /> {{ back.label }}</router-link>
        </div>
      </div>
    </section>

    <aside class="au-split-art" aria-hidden="true">
      <div class="au-split-art-bg" :style="{ backgroundImage: `url(${heroCover})` }" />
      <div class="au-split-art-brand">
        <UcasLogo :size="42" />
        <span>{{ APP_NAME }}</span>
      </div>
    </aside>
  </div>
</template>

<script setup>
import { ArrowRight } from 'lucide-vue-next'
import UcasLogo from '@/components/icons/UcasLogo.vue'
import { APP_NAME, APP_DESCRIPTION } from '@/utils/constants'
// صورة حفل التخرّج الرسمية: خلفية هادئة للوحة بدل مؤثّر مطر البيانات
import heroCover from '@/assets/hero/ucas-cover.jpg'
import '@/styles/ucas-site.css'

defineProps({
  title: { type: String, required: true },
  subtitle: { type: String, default: '' },
  /** رابط العودة أسفل الفورم بعد الخط الفاصل */
  back: { type: Object, default: () => ({ to: { name: 'landing' }, label: 'العودة إلى الصفحة الرئيسية' }) }
})
</script>
