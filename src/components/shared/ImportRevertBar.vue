<template>
  <!-- شريط «آخر استيراد + تراجع خطوة واحدة» — مشترك بين صفحات استيراد الإكسل (الفرق، المناقشات، الكشف).
       يظهر فقط عند وجود دفعة؛ ويتيح زر التراجع ما دامت الدفعة قابلة للتراجع. -->
  <div v-if="batch" :class="['irb', !batch.can_revert && 'is-done']">
    <div class="irb-info">
      <span class="irb-ic" aria-hidden="true"><History :size="16" /></span>
      <div>
        <b>
          <template v-if="batch.can_revert">آخر استيراد</template>
          <template v-else>تم التراجع عن آخر استيراد</template>
          <template v-if="batch.original_filename">: {{ batch.original_filename }}</template>
        </b>
        <small v-if="batch.applied_at">{{ formatDate(batch.applied_at) }}</small>
      </div>
    </div>

    <div v-if="chips.length" class="irb-chips">
      <span v-for="c in chips" :key="c.key" class="irb-chip">{{ c.value }} {{ c.label }}</span>
    </div>

    <BaseButton
      v-if="batch.can_revert"
      variant="danger"
      size="sm"
      :icon="Undo2"
      :loading="reverting"
      @click="$emit('revert')"
    >
      تراجع عن آخر استيراد
    </BaseButton>
  </div>
</template>

<script>
import { History, Undo2 } from 'lucide-vue-next'
import BaseButton from '@/components/ui/BaseButton.vue'

export default {
  name: 'ImportRevertBar',
  components: { BaseButton, History },
  props: {
    batch: { type: Object, default: null },
    labels: { type: Object, default: () => ({}) }, // { summaryKey: 'تسمية عربية' }
    reverting: { type: Boolean, default: false },
  },
  emits: ['revert'],
  data() {
    return { Undo2 }
  },
  computed: {
    chips() {
      const s = this.batch?.summary || {}
      return Object.entries(this.labels)
        .filter(([key]) => s[key] != null)
        .map(([key, label]) => ({ key, label, value: s[key] }))
    },
  },
  methods: {
    formatDate(iso) {
      try {
        return new Date(iso).toLocaleString('en-GB', { dateStyle: 'medium', timeStyle: 'short' })
      } catch {
        return iso
      }
    },
  },
}
</script>

<style scoped>
.irb {
  display: flex; align-items: center; gap: 14px; flex-wrap: wrap;
  padding: 10px 14px; margin-bottom: 14px; border-radius: 4px;
  background: var(--color-surface); box-shadow: inset 4px 0 0 var(--ucas-blue), 0 0 0 1px var(--color-border);
}
.irb.is-done { opacity: .7; box-shadow: inset 4px 0 0 var(--color-text-400), 0 0 0 1px var(--color-border); }
.irb-info { display: flex; align-items: center; gap: 9px; flex: 1 1 200px; }
.irb-ic { color: var(--ucas-blue); flex: none; }
.irb-info b { display: block; font-size: 13px; color: var(--color-text-900); }
.irb-info small { font-size: 11.5px; color: var(--color-text-600); }
.irb-chips { display: flex; gap: 6px; flex-wrap: wrap; }
.irb-chip { font-size: 11.5px; font-weight: 700; padding: 3px 9px; border-radius: 4px; color: var(--ucas-blue); background: color-mix(in srgb, var(--ucas-blue) 10%, transparent); white-space: nowrap; }
</style>
