<template>
  <!-- شعار كلمة مسار: تُكتب بالحبر من اليمين لليسار، تعبرها لمعة، يمتد خط تحتها، وتنزل قبعة التخرج ويتأرجح شرّابها.
       يُستخدم في الهيرو وصفحة تسجيل الدخول (الأنماط في ucas-site.css تحت hw-*) -->
  <svg class="us-hero-word" viewBox="0 0 420 260" role="img" :aria-label="APP_NAME">
    <defs>
      <linearGradient id="hw-fill" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#FFFFFF" /><stop offset="1" stop-color="#E4F4DC" /></linearGradient>
      <linearGradient id="hw-line" x1="0" x2="1"><stop offset="0" stop-color="#62BB46" stop-opacity="0" /><stop offset=".5" stop-color="#62BB46" /><stop offset="1" stop-color="#FFFFFF" /></linearGradient>
      <!-- حبر يكتب من اليمين لليسار: قناع بحافة ناعمة ينزلق عبر الكلمة -->
      <linearGradient id="hw-ink" x1="0" x2="1"><stop offset=".42" stop-color="#000" /><stop offset=".56" stop-color="#FFF" /></linearGradient>
      <mask id="hw-mask" maskUnits="userSpaceOnUse" x="-40" y="0" width="500" height="260"><rect class="hw-wipe" x="0" y="0" width="1400" height="260" fill="url(#hw-ink)" /></mask>
      <linearGradient id="hw-shine" x1="0" x2="1"><stop offset="0" stop-color="#FFF" stop-opacity="0" /><stop offset=".5" stop-color="#FFF" stop-opacity=".85" /><stop offset="1" stop-color="#FFF" stop-opacity="0" /></linearGradient>
      <clipPath id="hw-clip"><text x="210" y="200" text-anchor="middle" class="hw-glyphs">{{ APP_NAME }}</text></clipPath>
      <linearGradient id="hw-board" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#1B4F86" /><stop offset="1" stop-color="#0B2545" /></linearGradient>
      <linearGradient id="hw-skull" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#0E2A47" /><stop offset="1" stop-color="#071A30" /></linearGradient>
    </defs>
    <g mask="url(#hw-mask)">
      <text class="hw-text hw-glyphs" x="210" y="200" text-anchor="middle">{{ APP_NAME }}</text>
    </g>
    <!-- لمعة تعبر الكلمة مرة واحدة بعد اكتمال الكتابة -->
    <g clip-path="url(#hw-clip)"><rect class="hw-shine" x="-120" y="0" width="90" height="260" fill="url(#hw-shine)" transform="skewX(-18)" /></g>
    <rect class="hw-line" x="70" y="226" width="280" height="5" rx="2.5" fill="url(#hw-line)" />
    <!-- قبعة التخرج: لوح علوي بسماكة، قاعدة، زر، وشرّاب بخيوط -->
    <g class="hw-cap">
      <g transform="translate(292 60) rotate(-12)">
        <path d="M-36 8 v18 c0 12 72 12 72 0 v-18 Z" fill="url(#hw-skull)" />
        <path d="M0 -24 L74 2 L0 28 L-74 2 Z" fill="#0A2240" />
        <path d="M0 -28 L74 -2 L0 24 L-74 -2 Z" fill="url(#hw-board)" stroke="rgba(255,255,255,.55)" stroke-width="1.5" stroke-linejoin="round" />
        <circle cx="0" cy="-2" r="4.5" fill="#62BB46" />
        <g class="hw-tassel">
          <path d="M0 -2 Q30 2 50 8 L50 40" fill="none" stroke="#62BB46" stroke-width="2.5" stroke-linecap="round" />
          <path d="M44 40 h12 l2.5 4 v14 l-2 3 h-13 l-2 -3 v-14 Z" fill="#62BB46" />
          <path d="M46 47 v12 M50 47 v13 M54 47 v12" stroke="#3E8E2A" stroke-width="1" />
        </g>
      </g>
    </g>
  </svg>
</template>

<script setup>
import { APP_NAME } from '@/utils/constants'
</script>
