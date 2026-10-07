<template>
  <!-- عنوان القسم بنمط موقع الكلية (195731 / 195801): نص أزرق في الوسط وخطّان جانبيان بتدرج أخضر←أزرق -->
  <div class="ucas-section-title">
    <div class="ucas-section-title-row">
      <span class="ucas-section-line" aria-hidden="true" />
      <h2>{{ title }}</h2>
      <span class="ucas-section-line" aria-hidden="true" />
    </div>
    <p v-if="subtitle">{{ subtitle }}</p>
  </div>
</template>

<script>
export default {
  name: 'UcasSectionTitle',
  props: {
    title: { type: String, required: true },
    subtitle: { type: String, default: '' }
  }
}
</script>
