<template>
  <!-- معرض أفضل مشاريع التخرج (نمط معارض أعمال الجامعات): عنوان بالخطين الجانبيين، فلترا التخصص والدرجة،
       سلايدر بطاقات (تمرير أصلي scroll-snap + أسهم + عدّاد)، وزر "المزيد" المحدّد -->
  <section id="projects" class="us-section scroll-mt-24">
    <div class="us-wrap">
      <h2 class="us-title reveal">أفضل مشاريع التخرج</h2>

      <p v-if="!projects.length" class="us-empty">لم تُعيَّن مشاريع مميزة بعد — تعيّنها لجنة الإشراف من أرشيف المشاريع.</p>
      <template v-else>
        <div class="us-filters" aria-label="تصفية المشاريع">
          <div class="us-chips" role="radiogroup" aria-label="التخصص">
            <span class="us-chips-label">التخصص</span>
            <button v-for="o in specOptions" :key="o.value" type="button" role="radio" :aria-checked="spec === o.value" :class="['us-chip', spec === o.value && 'is-active']" @click="spec = o.value">
              {{ o.label }} <b>{{ o.count }}</b>
            </button>
          </div>
          <div class="us-chips" role="radiogroup" aria-label="الدرجة">
            <span class="us-chips-label">الدرجة</span>
            <button v-for="o in degreeOptions" :key="o.value" type="button" role="radio" :aria-checked="degree === o.value" :class="['us-chip', degree === o.value && 'is-active']" @click="degree = o.value">
              {{ o.label }} <b>{{ o.count }}</b>
            </button>
          </div>
        </div>

        <p v-if="!shown.length" class="us-empty">لا توجد مشاريع مطابقة للفلاتر</p>
        <div v-else class="us-slider">
          <button type="button" class="us-arrow" aria-label="السابق" @click="slide(1)"><ChevronRight :size="24" /></button>
          <div ref="track" class="us-track" @scroll.passive="onScroll">
            <ProjectCard v-for="project in shown" :key="project.id" :project="project" />
          </div>
          <button type="button" class="us-arrow" aria-label="التالي" @click="slide(-1)"><ChevronLeft :size="24" /></button>
        </div>
        <p v-if="shown.length" class="us-slider-count">{{ position }} من {{ shown.length }} مشروعًا</p>
      </template>

      <div class="us-more">
        <router-link :to="{ name: 'projects-archive' }" class="us-btn">المزيد من المشاريع</router-link>
      </div>
    </div>
  </section>
</template>

<script>
import { ChevronLeft, ChevronRight } from 'lucide-vue-next'
import ProjectCard from './ProjectCard.vue'

export default {
  name: 'FeaturedProjects',

  components: { ChevronLeft, ChevronRight, ProjectCard },

  props: {
    projects: { type: Array, default: () => [] }
  },

  data() {
    return { spec: '', degree: '', position: 1 }
  },

  computed: {
    specOptions() {
      const byDegree = this.projects.filter((p) => !this.degree || p.degree === this.degree)
      const names = [...new Set(this.projects.map((p) => p.program_name).filter(Boolean))]
      return [{ value: '', label: 'الكل', count: byDegree.length }, ...names.map((n) => ({ value: n, label: n, count: byDegree.filter((p) => p.program_name === n).length }))]
    },
    degreeOptions() {
      const bySpec = this.projects.filter((p) => !this.spec || p.program_name === this.spec)
      const names = [...new Set(this.projects.map((p) => p.degree).filter(Boolean))]
      return [{ value: '', label: 'الكل', count: bySpec.length }, ...names.map((n) => ({ value: n, label: n, count: bySpec.filter((p) => p.degree === n).length }))]
    },
    shown() {
      return this.projects.filter((p) => (!this.spec || p.program_name === this.spec) && (!this.degree || p.degree === this.degree))
    }
  },

  watch: {
    // فلتر جديد: السلايدر يعود لأول بطاقة
    shown() {
      this.position = 1
      this.$nextTick(() => this.$refs.track?.scrollTo({ left: 0 }))
    }
  },

  methods: {
    /** بطاقة واحدة لكل ضغطة (dir: 1 للسابق، -1 للتالي في اتجاه RTL) */
    slide(dir) {
      const t = this.$refs.track
      const step = (t?.firstElementChild?.offsetWidth || 300) + 28
      t?.scrollBy({ left: dir * step, behavior: 'smooth' })
    },
    onScroll() {
      const t = this.$refs.track
      const step = (t.firstElementChild?.offsetWidth || 300) + 28
      this.position = Math.min(this.shown.length, Math.round(Math.abs(t.scrollLeft) / step) + 1)
    }
  }
}
</script>
