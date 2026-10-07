<template>
  <!-- شريط الإحصائيات بنمط هيرو موقع الكلية (195704): تدرج أخضر←أزرق، أرقام بيضاء كبيرة تعدّ تصاعديًا، وتسمية تحتها -->
  <div class="ucas-stats-band">
    <div v-for="item in items" :key="item.label" class="ucas-stat">
      <span class="ucas-stat-value">
        <template v-if="item.value !== null && item.value !== undefined">{{ item.prefix || '' }}<CountUp :value="Number(item.value)" :duration="2000" />{{ item.suffix || '' }}</template>
        <template v-else>—</template>
      </span>
      <span class="ucas-stat-label">{{ item.label }}</span>
    </div>
  </div>
</template>

<script>
import CountUp from '@/components/ui/CountUp.vue'

export default {
  name: 'UcasStatsBand',
  components: { CountUp },
  props: {
    /** [{ label, value, prefix?, suffix? }] — value: null يعرض "—" أثناء التحميل */
    items: { type: Array, required: true }
  }
}
</script>
