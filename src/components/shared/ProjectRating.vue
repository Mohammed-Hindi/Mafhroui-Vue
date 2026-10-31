<template>
  <!-- تقييم المشروع للطاقم: نجوم ترشيح المناقشين (placeholder مطفأ بعدد المناقشين، والمُرشِّحة تضوي)
       + تاج «مشروع مميّز» حين تميّزه الإدارة/اللجنة (is_featured) — أرقى وبلون مختلف، أسفل النجوم -->
  <div v-if="discussants || featured" class="pj-rating">
    <span
      v-if="discussants"
      class="pj-rating-stars"
      :aria-label="`ترشيح المناقشين: ${nominations} من ${discussants}`"
      :title="`رشّحه ${nominations} من ${discussants} من المناقشين`"
    >
      <Star v-for="i in discussants" :key="i" :size="size" :class="{ 'is-on': i <= nominations }" :fill="i <= nominations ? 'currentColor' : 'none'" />
      <small>{{ nominations }} من {{ discussants }}</small>
    </span>
    <span v-if="featured" class="pj-rating-crown" title="مشروع مميّز من الإدارة — يظهر في الصفحة الرئيسية">
      <Crown :size="size" /> مشروع مميّز
    </span>
  </div>
</template>

<script>
import { Crown, Star } from 'lucide-vue-next'

export default {
  name: 'ProjectRating',

  components: { Crown, Star },

  props: {
    stars: { type: Object, default: () => ({ nominations: 0, discussants: 0 }) },
    featured: { type: Boolean, default: false },
    size: { type: Number, default: 15 }
  },

  computed: {
    nominations() {
      return Number(this.stars?.nominations) || 0
    },
    discussants() {
      return Number(this.stars?.discussants) || 0
    }
  }
}
</script>
