<template>
  <footer class="bg-primary-900 dark:bg-[#070C17] text-white/70 pt-14">
    <div class="max-w-content mx-auto px-6 grid lg:grid-cols-[1.3fr_1fr_1fr] gap-10 pb-10 border-b border-white/10">
      <div>
        <router-link to="/" class="flex items-center gap-2.5 mb-3.5">
          <span class="grid place-items-center w-[34px] h-[34px] rounded-sm bg-gradient-to-bl from-primary-500 to-accent-500 text-white">
            <AppIcon name="graduation" :size="17" :stroke-width="2.2" />
          </span>
          <span class="font-cairo font-extrabold text-[14.5px] text-white">{{ APP_NAME }}</span>
        </router-link>
        <p class="max-w-[300px] text-[12.5px] leading-[1.9]">
          {{ APP_DESCRIPTION }}
        </p>
      </div>

      <div>
        <h2 class="font-cairo text-white text-[13.5px] font-bold mb-4">روابط سريعة</h2>
        <ul class="flex flex-col gap-[11px] text-[12.5px]">
          <li>
            <router-link :to="{ name: 'login' }" class="hover:text-white transition-colors duration-fast">تسجيل الدخول</router-link>
          </li>
          <li>
            <router-link :to="{ name: 'projects-archive' }" class="hover:text-white transition-colors duration-fast">المشاريع</router-link>
          </li>
          <li>
            <router-link :to="{ name: 'landing', hash: '#features' }" class="hover:text-white transition-colors duration-fast">الميزات</router-link>
          </li>
          <li>
            <router-link :to="{ name: 'landing', hash: '#departments' }" class="hover:text-white transition-colors duration-fast">الأقسام</router-link>
          </li>
        </ul>
      </div>

      <div>
        <h2 class="font-cairo text-white text-[13.5px] font-bold mb-4">تواصل معنا</h2>
        <ul class="flex flex-col gap-[11px] text-[12.5px]">
          <li>
            <a :href="`mailto:${contact.EMAIL}`" class="flex items-center gap-2 hover:text-white transition-colors duration-fast">
              <AppIcon name="mail" :size="14" class="shrink-0" />
              {{ contact.EMAIL }}
            </a>
          </li>
          <li>
            <a :href="`tel:${contact.PHONE_RAW}`" class="flex items-center gap-2 hover:text-white transition-colors duration-fast">
              <AppIcon name="phone" :size="14" class="shrink-0" />
              <span dir="ltr">{{ contact.PHONE }}</span>
            </a>
          </li>
          <li class="flex items-center gap-2">
            <AppIcon name="mapPin" :size="14" class="shrink-0" />
            {{ contact.ADDRESS }}
          </li>
        </ul>
      </div>
    </div>

    <p class="text-center py-5 text-label text-white/50">
      © {{ year }} {{ APP_NAME }} — جميع الحقوق محفوظة
    </p>
  </footer>
</template>

<script setup>
import { computed } from 'vue'
import AppIcon from '@/components/icons/AppIcon.vue'
import { CONTACT, APP_NAME, APP_DESCRIPTION } from '@/utils/constants'

const contact = CONTACT
const year = computed(() => new Date().getFullYear())
</script>
