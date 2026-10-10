<template>
  <!-- قنوات الإرسال: المنصة دائمًا، وواتساب/البريد للأشخاص فقط (أعضاء اللجنة والمشرفون) — مقيّدتان عند الإرسال للمجموعات -->
  <div class="pfield">
    <span>قنوات الإرسال</span>
    <div class="bc-channel-pick">
      <label
        v-for="c in options" :key="c.value"
        :class="['bc-channel-opt', modelValue.includes(c.value) && 'is-on', isLocked(c) && 'is-locked']"
        :title="c.value !== 'platform' && restricted ? 'متاح عند الإرسال للمشرفين أو لجنة الإشراف فقط' : ''"
      >
        <input type="checkbox" :checked="modelValue.includes(c.value)" :disabled="isLocked(c)" @change="toggle(c.value)">
        <component :is="c.icon" :size="18" />
        <span><b>{{ c.label }}</b><small>{{ c.value !== 'platform' && restricted ? 'غير متاح للمجموعات' : c.hint }}</small></span>
      </label>
    </div>
  </div>
</template>

<script>
import { Mail, MessageCircle, MonitorSmartphone } from 'lucide-vue-next'

export default {
  name: 'ChannelPicker',

  props: {
    modelValue: { type: Array, default: () => ['platform'] },
    /** الإرسال للمجموعات: واتساب والبريد مقيّدان */
    restricted: { type: Boolean, default: false }
  },

  emits: ['update:modelValue'],

  data() {
    return {
      options: [
        { value: 'platform', label: 'المنصة', hint: 'إشعار داخل المنصة', icon: MonitorSmartphone },
        { value: 'whatsapp', label: 'واتساب', hint: 'رسالة لكل مستلم', icon: MessageCircle },
        { value: 'email', label: 'البريد الإلكتروني', hint: 'بريد لكل مستلم', icon: Mail }
      ]
    }
  },

  watch: {
    // التحويل للمجموعات يلغي القناتين المقيّدتين
    restricted: {
      immediate: true,
      handler(r) {
        if (r && this.modelValue.some((c) => c !== 'platform')) this.$emit('update:modelValue', ['platform'])
      }
    }
  },

  methods: {
    isLocked(c) {
      return c.value === 'platform' || (this.restricted && c.value !== 'platform')
    },
    toggle(v) {
      this.$emit('update:modelValue', this.modelValue.includes(v) ? this.modelValue.filter((c) => c !== v) : [...this.modelValue, v])
    }
  }
}
</script>
