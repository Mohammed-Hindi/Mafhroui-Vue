<template>
  <!-- سلايدر موحّد لجداول الإدارة العامة (نمط سجل المجموعات): المحتوى ينزلق بين الشرائح + أسهم ونقاط وعدّاد.
       الاستخدام: <SlideTable :rows="list" label="المجموعات" v-slot="{ rows }"> …جدول يمرّ على rows… </SlideTable> -->
  <div>
    <Transition :name="dir" mode="out-in">
      <div :key="page">
        <slot :rows="pageRows" />
      </div>
    </Transition>

    <slot name="after" />

    <nav v-if="last > 1" class="gr-slider" :aria-label="`شرائح ${label}`">
      <button type="button" class="gr-slide-btn" :disabled="page === 1" aria-label="الشريحة السابقة" @click="go(page - 1)"><ChevronRight :size="18" /></button>
      <div class="gr-dots">
        <button
          v-for="p in last" :key="p" type="button" :class="p === page && 'is-active'"
          :aria-label="`الشريحة ${p}`" :aria-current="p === page ? 'true' : undefined" @click="go(p)"
        />
      </div>
      <button type="button" class="gr-slide-btn" :disabled="page === last" aria-label="الشريحة التالية" @click="go(page + 1)"><ChevronLeft :size="18" /></button>
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
      this.dir = p > this.page ? 'gr-slide-next' : 'gr-slide-prev'
      this.page = p
    }
  }
}
</script>
