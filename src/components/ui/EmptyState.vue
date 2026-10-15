<template>
  <!-- حالة فارغة بهوية مسار: بطاقة بخلفية تدرّج خفيفة، أيقونة داخل دائرة متدرّجة بهالة، عنوان أزرق وخط تدرّج تحته -->
  <div class="es">
    <span class="es-icon">
      <component :is="icon" :size="30" :stroke-width="1.8" />
    </span>
    <h3 class="es-title">{{ title }}</h3>
    <p v-if="description" class="es-desc">{{ description }}</p>
    <div v-if="$slots.action" class="es-action">
      <slot name="action" />
    </div>
  </div>
</template>

<script>
import { Inbox } from 'lucide-vue-next'

export default {
  name: 'EmptyState',
  props: {
    title: { type: String, default: 'لا توجد بيانات بعد' },
    description: { type: String, default: '' },
    icon: { type: [Object, Function], default: () => Inbox }
  }
}
</script>

<style scoped>
.es {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  padding: 48px 24px;
  border-radius: 18px;
  background: linear-gradient(270deg, rgba(98, 187, 70, .06), rgba(0, 91, 170, .04)), var(--color-surface);
  box-shadow: 0 10px 30px rgba(4, 40, 80, .08);
  animation: esIn .5s ease backwards;
}
.es-icon {
  display: grid;
  place-items: center;
  width: 76px;
  height: 76px;
  margin-bottom: 18px;
  border-radius: 50%;
  color: #FFFFFF;
  background: linear-gradient(270deg, #62BB46, #0E699C 55%, #025DA9);
  box-shadow: 0 0 0 10px rgba(0, 91, 170, .07), 0 0 0 20px rgba(98, 187, 70, .05), 0 10px 24px rgba(4, 40, 80, .2);
}
.es-title {
  position: relative;
  padding-bottom: 10px;
  font-family: Cairo, sans-serif;
  font-weight: 800;
  font-size: 18px;
  color: var(--ucas-blue, #005BAA);
}
.es-title::after {
  content: '';
  position: absolute;
  inset-inline: 30%;
  bottom: 0;
  height: 3px;
  border-radius: 999px;
  background: linear-gradient(270deg, #62BB46, #005BAA);
}
.es-desc { margin-top: 12px; max-width: 380px; font-size: 14px; line-height: 1.8; color: var(--color-text-600); }
.es-action { margin-top: 22px; }
:root[data-theme="dark"] .es-title { color: #4FA3E8; }
@keyframes esIn { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: none; } }
@media (prefers-reduced-motion: reduce) { .es { animation: none; } }
</style>
