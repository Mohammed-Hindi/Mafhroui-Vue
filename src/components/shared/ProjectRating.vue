<template>
  <!-- تقييم المشروع للطاقم — طبقتان:
       (1) مميّز: نجوم ترشيح المناقشين (مطفأة بعدد المناقشين، والمُرشِّحة تضوي) — «X من N»
       (2) مرموق: تاج تصنيف الإدارة/لجنة الإشراف (is_featured) — يظهر في المعرض، أرقى وبلون مختلف -->
  <div v-if="discussants || featured" class="pj-rating">
    <span
      v-if="discussants"
      class="pj-rating-stars"
      :aria-label="`مميّز — ترشيح المناقشين: ${nominations} من ${discussants}`"
      :title="`مميّز: رشّحه ${nominations} من ${discussants} من المناقشين`"
    >
      <Star v-for="i in discussants" :key="i" :size="size" :class="{ 'is-on': i <= nominations }" :fill="i <= nominations ? 'currentColor' : 'none'" />
      <small>{{ nominations }} من {{ discussants }}</small>
    </span>
    <span v-if="featured" class="pj-rating-crown" :title="crownTitle">
      <Crown :size="size" /> مشروع مرموق
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
    // مَن صنّف المشروع كمرموق ومتى (#30) — يظهران في تلميح التاج
    featuredBy: { type: String, default: '' },
    featuredAt: { type: String, default: '' },
    size: { type: Number, default: 15 }
  },

  computed: {
    nominations() {
      return Number(this.stars?.nominations) || 0
    },
    discussants() {
      return Number(this.stars?.discussants) || 0
    },
    crownTitle() {
      const base = 'مشروع مرموق من الإدارة/لجنة الإشراف — يظهر في المعرض'
      if (!this.featuredBy) return base
      const when = this.featuredAt ? ` (${String(this.featuredAt).slice(0, 10)})` : ''
      return `${base} · صنّفه ${this.featuredBy}${when}`
    }
  }
}
</script>
