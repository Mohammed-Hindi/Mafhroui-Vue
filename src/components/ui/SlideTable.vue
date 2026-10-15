<template>
  <!-- سلايدر موحّد للجداول والمعارض (أكثر من size عنصر): المحتوى ينزلق بين الشرائح، وشريط تنقّل بأرقام الشرائح
       (مع اختصار … عند كثرتها) + السابق/التالي + شريط تقدّم وعدّاد. الأسهم ← → من لوحة المفاتيح تعمل عند التركيز عليه.
       الاستخدام: <SlideTable :rows="list" label="المجموعات" v-slot="{ rows }"> …يمرّ على rows… </SlideTable> -->
  <div>
    <Transition :name="dir" mode="out-in">
      <div :key="page">
        <slot :rows="pageRows" />
      </div>
    </Transition>

    <slot name="after" />

    <nav v-if="last > 1" class="gr-slider" :aria-label="`شرائح ${label}`" @keydown.left.prevent="go(page + 1)" @keydown.right.prevent="go(page - 1)">
      <div class="gr-pager">
        <button type="button" class="gr-slide-btn is-text" :disabled="page === 1" aria-label="الشريحة السابقة" @click="go(page - 1)"><ChevronRight :size="17" /> السابق</button>
        <div class="gr-pages">
          <template v-for="(p, i) in pages" :key="i">
            <span v-if="p === '…'" class="gr-gap">…</span>
            <button
              v-else type="button" :class="['gr-page', p === page && 'is-active']"
              :aria-label="`الشريحة ${p}`" :aria-current="p === page ? 'true' : undefined" @click="go(p)"
            >{{ p }}</button>
          </template>
        </div>
        <button type="button" class="gr-slide-btn is-text" :disabled="page === last" aria-label="الشريحة التالية" @click="go(page + 1)">التالي <ChevronLeft :size="17" /></button>
      </div>
      <div class="gr-progressline" aria-hidden="true"><span :style="{ width: `${(page / last) * 100}%` }" /></div>
      <span class="gr-slide-info">{{ label }} {{ (page - 1) * size + 1 }}–{{ Math.min(page * size, rows.length) }} من {{ rows.length }}</span>
    </nav>
  </div>
</template>

<script>
import { ChevronLeft, ChevronRight } from 'lucide-vue-next'

export default {
  name: 'SlideTable',

  components: { ChevronLeft, ChevronRight },

  props: {
    rows: { type: Array, default: () => [] },
    /** عدد الصفوف في كل شريحة */
    size: { type: Number, default: 6 },
    /** اسم العناصر في العدّاد: "المجموعات 1–6 من 20" */
    label: { type: String, default: 'العناصر' }
  },

  data() {
    return { page: 1, dir: 'gr-slide-next' }
  },

  computed: {
    last() {
      return Math.max(1, Math.ceil(this.rows.length / this.size))
    },
    /** أرقام الشرائح: كلها حتى 7، وإلا الأولى والأخيرة وما حول الحالية مع … */
    pages() {
      const n = this.last
      const p = this.page
      if (n <= 7) return Array.from({ length: n }, (_, i) => i + 1)
      const set = [...new Set([1, p - 1, p, p + 1, n].filter((x) => x >= 1 && x <= n))].sort((a, b) => a - b)
      return set.flatMap((x, i) => (i && x - set[i - 1] > 1 ? ['…', x] : [x]))
    },
    pageRows() {
      return this.rows.slice((this.page - 1) * this.size, this.page * this.size)
    }
  },

  watch: {
    // تغيّر عدد النتائج (فلتر/بحث) يعيد لأول شريحة
    'rows.length'() {
      this.page = 1
    }
  },

  methods: {
    go(p) {
      if (p < 1 || p > this.last || p === this.page) return
      this.dir = p > this.page ? 'gr-slide-next' : 'gr-slide-prev'
      this.page = p
    }
  }
}
</script>
