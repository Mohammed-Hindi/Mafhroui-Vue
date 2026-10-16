<template>
  <!-- صفحة المشروع بنمط موقع الكلية: شريط عنوان متدرّج (مسار التنقل + التخصص + العنوان)،
       ثم عمودان: نبذة المشروع وفيديو العرض، وبطاقة بيانات المشروع والفريق -->
  <div class="us-proj">
    <header class="us-pagehead">
      <DataRain :gain="2.4" />
      <div class="us-wrap">
        <span v-if="project?.spec" class="us-pagehead-tag">{{ project.spec }}</span>
        <h1>{{ loading ? 'جارٍ التحميل…' : project?.title || 'لم يتم العثور على المشروع' }}</h1>
        <p v-if="project">{{ [project.dept_name, project.semester].filter(Boolean).join(' · ') }}</p>
        <nav class="us-crumbs" aria-label="مسار التنقل">
          <router-link :to="{ name: 'landing' }">الرئيسية</router-link><span>/</span>
          <router-link :to="{ name: 'projects-archive' }">أرشيف المشاريع</router-link>
        </nav>
      </div>
    </header>

    <section class="us-section">
      <div class="us-wrap">
        <p v-if="!loading && !project" class="us-empty">ربما حُذف هذا المشروع أو الرابط غير صحيح.</p>

        <div v-else-if="project" class="us-detail">
          <div class="us-detail-main">
            <!-- صورة المشروع هي غلاف الفيديو: الضغط على التشغيل يخفيها ويشغّل الفيديو مكانها (يوتيوب مضمّن، وغيره في تبويب جديد) -->
            <figure class="us-detail-cover us-pf-media">
              <iframe
                v-if="playing && embedUrl" :src="embedUrl" :title="`فيديو ${project.title}`"
                allow="autoplay; encrypted-media; picture-in-picture; fullscreen" allowfullscreen
              />
              <template v-else>
                <img v-if="project.cover" :src="project.cover" :alt="project.title">
                <span v-else class="us-pf-fallback" aria-hidden="true"><b>{{ project.title?.charAt(0) }}</b></span>
                <button v-if="project.video_url" type="button" class="us-cover-play" aria-label="تشغيل فيديو المشروع" @click="play">
                  <span class="us-play"><Play :size="30" /></span>
                  <span>تشغيل فيديو العرض</span>
                </button>
              </template>
            </figure>

            <article class="us-card">
              <h3>نبذة عن المشروع</h3>
              <p class="us-detail-text">{{ project.description || 'لا يوجد وصف لهذا المشروع.' }}</p>
            </article>
          </div>

          <aside class="us-card us-detail-side">
            <h3>بيانات المشروع</h3>
            <dl class="us-data">
              <div v-for="row in infoRows" :key="row.label"><dt>{{ row.label }}</dt><dd>{{ row.value || '—' }}</dd></div>
            </dl>
            <h3 class="us-detail-sub">فريق المشروع</h3>
            <ul class="us-team">
              <li v-for="m in team" :key="m"><span>{{ m.charAt(0) }}</span>{{ m }}</li>
              <li v-if="!team.length" class="pt-muted">—</li>
            </ul>
          </aside>
        </div>

        <div class="us-more">
          <router-link :to="{ name: 'projects-archive' }" class="us-btn">العودة إلى أرشيف المشاريع</router-link>
        </div>
      </div>
    </section>
  </div>
</template>

<script>
import DataRain from '@/components/landing/DataRain.vue'
import { mapState, mapActions } from 'pinia'
import { Play } from 'lucide-vue-next'
import { useLandingStore } from '@/stores/landing.store'

export default {
  name: 'ProjectShowcasePage',

  components: { DataRain, Play },

  props: {
    id: { type: [String, Number], required: true }
  },

  data() {
    return { playing: false }
  },

  computed: {
    /** رابط التضمين ليوتيوب (watch / youtu.be / shorts) */
    embedUrl() {
      const m = (this.project?.video_url || '').match(/(?:youtu\.be\/|v=|shorts\/|embed\/)([\w-]{11})/)
      return m ? `https://www.youtube.com/embed/${m[1]}?autoplay=1&rel=0` : ''
    },

    ...mapState(useLandingStore, ['currentProject', 'currentProjectLoading']),

    project() {
      return this.currentProject
    },
    loading() {
      return this.currentProjectLoading
    },
    team() {
      return (this.project?.members || '').split('، ').filter(Boolean)
    },
    infoRows() {
      const p = this.project
      return [
        { label: 'التخصص', value: p.program_name },
        { label: 'الدرجة', value: p.degree },
        { label: 'القسم', value: p.dept_name },
        { label: 'المشرف', value: p.supervisor_name },
        { label: 'تاريخ الإنجاز', value: p.date },
        { label: 'الفصل الدراسي', value: p.semester }
      ]
    }
  },

  watch: {
    id: { immediate: true, async handler(id) {
        this.playing = false
        await this.fetchProjectById(id).catch(() => {})
        // قادم من معرض المشاريع بزر التشغيل: الفيديو يعمل مباشرة مكان الصورة
        if (this.$route.query.play && this.embedUrl) this.playing = true
      } }
  },

  methods: {
    ...mapActions(useLandingStore, ['fetchProjectById']),

    play() {
      if (this.embedUrl) this.playing = true
      else window.open(this.project.video_url, '_blank', 'noopener')
    }
  }
}
</script>
