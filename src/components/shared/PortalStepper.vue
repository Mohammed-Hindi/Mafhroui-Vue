<template>
  <!-- شريط العروض بأعدادها بنمط "أرشيف المشاريع" (عدد + أيقونة + اسم، والنشط بخط سماوي سفلي) — موحّد لصفحات الإدارة العامة واللجنة -->
  <div class="ev-steps-bar ad-steps-bar">
    <ol class="tk-stepper ev-steps" :aria-label="label">
      <li v-for="it in items" :key="it.key" :class="[modelValue === it.key && 'is-active']">
        <button type="button" :aria-current="modelValue === it.key ? 'page' : undefined" @click="$emit('update:modelValue', it.key)">
          <b v-if="it.count != null">{{ it.count }}</b> <component :is="it.icon" v-if="it.icon" :size="16" /> {{ it.label }}
        </button>
      </li>
    </ol>
    <slot />
  </div>
</template>

<script>
export default {
  name: 'PortalStepper',

  props: {
    /** [{ key, label, icon?, count }] */
    items: { type: Array, required: true },
    modelValue: { type: [String, Number], default: '' },
    label: { type: String, default: 'العروض' }
  },

  emits: ['update:modelValue']
}
</script>
