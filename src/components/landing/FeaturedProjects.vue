<template>
  <!-- معرض مشاريع التخرج المميّزة: عنوان بالخطين الجانبيين، فلترا التخصص والدرجة، ثم شريط بطاقات منحنٍ متحرك
       (TiltedGallery) — الوقوف يوقفه، السحب/العجلة/الأسهم تحرّكه يمينًا ويسارًا، والضغط يفتح المشروع، مع قائمة روابط مخفية بصريًا لقارئات الشاشة ولوحة المفاتيح -->
  <section id="projects" class="us-section us-projects scroll-mt-24">
    <div class="us-wrap">
      <!-- قبل أول تمرير: العنوان يلمع وخطاه ينسابان وسهم يدعو للنزول، لجذب الزائر لبداية القسم -->
      <a v-if="beckon" href="#projects" class="us-beckon-cue" aria-label="انزل إلى المشاريع المميّزة"><ChevronsDown :size="22" /></a>
      <h2 :class="['us-title reveal', beckon && 'is-beckon']">المشاريع المميّزة</h2>

      <p v-if="!projects.length" class="us-empty">ستظهر هنا المشاريع المميّزة فور اعتمادها من إدارة الكلية.</p>
      <template v-else>
        <div class="us-filterbar is-center is-compact" aria-label="تصفية المشاريع">
          <label class="us-field">
            <span>التخصص</span>
            <select v-model="spec" class="us-select">
              <option v-for="o in specOptions" :key="o.value" :value="o.value">{{ o.value ? o.label : 'كل التخصصات' }}</option>
            </select>
          </label>
          <label class="us-field">
            <span>الدرجة</span>
            <select v-model="degree" class="us-select">
              <option v-for="o in degreeOptions" :key="o.value" :value="o.value">{{ o.value ? o.label : 'دبلوم وبكالوريوس' }}</option>
            </select>
          </label>
        </div>

        <p v-if="!shown.length" class="us-empty">لا توجد مشاريع مطابقة للفلاتر</p>
        <template v-else>
          <TiltedGallery class="us-gallery" :items="shown" :tile-height="66" :curve="50" :axis="50" :speed="3.5" @select="openProject">
            <template #default="{ item }">
              <div v-if="item" :class="['us-tg-card', item.cover && 'has-cover']" :style="item.cover ? { backgroundImage: `linear-gradient(to top, rgba(4,30,60,.85), rgba(4,30,60,.15) 65%), url(${item.cover})` } : null">
                <span v-if="item.program_name" class="us-tg-tag">{{ item.program_name }}</span>
                <span class="us-tg-mark"><UcasLogo :size="40" /></span>
                <strong>{{ item.title }}</strong>
                <small>{{ [item.degree, item.supervisor_name].filter(Boolean).join(' · ') }}</small>
                <span v-if="item.members" class="us-tg-team"><Users :size="13" /> {{ item.members }}</span>
              </div>
            </template>
          </TiltedGallery>
          <ul class="sr-only">
            <li v-for="p in shown" :key="p.id"><router-link :to="{ name: 'project-showcase', params: { id: p.id } }">{{ p.title }}</router-link></li>
          </ul>
        </template>
      </template>

      <div class="us-more">
        <router-link :to="{ name: 'projects-archive' }" class="us-btn">المزيد من المشاريع</router-link>
      </div>
    </div>
  </section>
</template>

<script>
import { ChevronsDown, Users } from 'lucide-vue-next'
import UcasLogo from '@/components/icons/UcasLogo.vue'
import TiltedGallery from './TiltedGallery.vue'

export default {
  name: 'FeaturedProjects',

  components: { ChevronsDown, TiltedGallery, UcasLogo, Users },

  props: {
    projects: { type: Array, default: () => [] }
  },

  data() {
    return { spec: '', degree: '', beckon: window.scrollY < 40 }
  },

  computed: {
    specOptions() {
      return [{ value: '' }, ...[...new Set(this.projects.map((p) => p.program_name).filter(Boolean))].map((n) => ({ value: n, label: n }))]
    },
    degreeOptions() {
      return [{ value: '' }, ...[...new Set(this.projects.map((p) => p.degree).filter(Boolean))].map((n) => ({ value: n, label: n }))]
    },
    shown() {
      return this.projects.filter((p) => (!this.spec || p.program_name === this.spec) && (!this.degree || p.degree === this.degree))
    }
  },

  mounted() {
    if (this.beckon) window.addEventListener('scroll', this.stopBeckon, { passive: true })
  },

  beforeUnmount() {
    window.removeEventListener('scroll', this.stopBeckon)
  },

  methods: {
    stopBeckon() {
      if (window.scrollY < 40) return
      this.beckon = false
      window.removeEventListener('scroll', this.stopBeckon)
    },

    openProject(p) {
      this.$router.push({ name: 'project-showcase', params: { id: p.id } })
    }
  }
}
</script>
