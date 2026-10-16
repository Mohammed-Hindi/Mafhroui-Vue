<template>
  <!-- عارض ملفات المشروع: PDF داخل الصفحة (رابط موقّع مؤقت)، فيديو يوتيوب مضمَّن، ومعاينة وصفية للملفات التجريبية -->
  <BaseModal :model-value="!!file" :title="file?.name || ''" size="xl" @update:model-value="!$event && $emit('close')">
    <div v-if="file" :class="['fv', `is-${file.kind}`]">
      <div class="fv-bar">
        <span class="fv-tag">{{ file.tag }}</span>
        <span class="fv-meta">{{ file.meta }}</span>
        <span v-if="file.placeholder" class="fv-demo">ملف تجريبي</span>
      </div>

      <p v-if="loading" class="pt-muted tk-loading">جارٍ تجهيز المعاينة…</p>

      <iframe v-else-if="pdfUrl" :src="pdfUrl" class="fv-frame" :title="file.name" />

      <div v-else-if="youtubeId" class="fv-video">
        <iframe :src="`https://www.youtube.com/embed/${youtubeId}`" :title="file.name" allow="accelerometer; encrypted-media; picture-in-picture" allowfullscreen />
      </div>

      <!-- معاينة وصفية (لا تخزين للملف بعد) -->
      <div v-else class="fv-empty">
        <component :is="file.icon" :size="64" class="fv-empty-icon" />
        <b>{{ file.name }}</b>
        <span>{{ file.placeholder ? 'معاينة تجريبية — يُعرض الملف الفعلي بعد ربط التخزين.' : (file.download ? 'تعذّر عرض الملف داخل الصفحة — استخدم التنزيل.' : 'تعذّر عرض الملف داخل الصفحة — افتحه في نافذة جديدة.') }}</span>
        <ul v-if="file.contents?.length" class="fv-tree" dir="ltr">
          <li v-for="c in file.contents" :key="c"><component :is="c.endsWith('/') ? Folder : FileText" :size="15" /> {{ c }}</li>
        </ul>
      </div>
    </div>

    <template #footer>
      <!-- التقرير PDF والفيديو: فتح في نافذة جديدة فقط · الملفات التجريبية (المجلد، الوورد): تنزيل + فتح في نافذة جديدة -->
      <button v-if="file && (pdfUrl || file.url || file.reportId || file.placeholder)" type="button" class="pbtn is-outline" @click="openNew"><ExternalLink :size="15" /> فتح في نافذة جديدة</button>
      <button v-if="file?.download || file?.placeholder" type="button" class="pbtn is-cyan" @click="file.download ? file.download() : downloadDemo()"><Download :size="15" /> تنزيل</button>
      <button type="button" class="pbtn is-outline" @click="$emit('close')">إغلاق</button>
    </template>
  </BaseModal>
</template>

<script>
import { Download, ExternalLink, FileText, Folder } from 'lucide-vue-next'
import BaseModal from '@/components/ui/BaseModal.vue'
import api from '@/services/api'
import { openReportInNewTab } from '@/utils/finalReport'

export default {
  name: 'FileViewer',

  components: { BaseModal, Download, ExternalLink },

  props: {
    /** { name, kind, tag, meta, icon, placeholder?, reportId? (PDF عبر رابط موقّع), url? (فيديو), contents?, download? } */
    file: { type: Object, default: null }
  },

  emits: ['close'],

  data() {
    return { Folder, FileText, pdfUrl: '', loading: false }
  },

  computed: {
    youtubeId() {
      const m = String(this.file?.url || '').match(/(?:youtu\.be\/|v=)([\w-]{11})/)
      return m ? m[1] : ''
    }
  },

  watch: {
    file: {
      immediate: true,
      handler(f) {
        this.pdfUrl = ''
        if (f?.reportId) this.loadPdf(f.reportId)
      }
    }
  },

  methods: {
    // GET /final-reports/{id}/download-link — رابط موقّع 5 دقائق؛ نتحقق أن الملف موجود قبل تضمينه
    async loadPdf(id) {
      this.loading = true
      try {
        const { data } = await api.get(`/final-reports/${id}/download-link`)
        const res = await fetch(data.url, { method: 'HEAD' })
        if (res.ok) this.pdfUrl = data.url
      } catch {
        // تبقى المعاينة الوصفية
      } finally {
        this.loading = false
      }
    },

    /** ملف تجريبي (بلا تخزين بعد): صفحة HTML بمحتوياته — تُفتح في نافذة أو تُنزَّل (الوورد بصيغة .doc يفتحها Word) */
    demoBlob() {
      const f = this.file
      const items = (f.contents || []).map((c) => `<li>${c}</li>`).join('')
      const html = `<!doctype html><html dir="rtl" lang="ar"><meta charset="utf-8"><title>${f.name}</title>
<body style="font-family:Tahoma,sans-serif;margin:40px;color:#0B2545"><h2 style="color:#005BAA">${f.name}</h2>
<p style="color:#50A16E">${f.meta || ''}</p><p>ملف تجريبي — يُستبدل بالملف الفعلي بعد ربط التخزين.</p>${items ? `<ul dir="ltr">${items}</ul>` : ''}</body></html>`
      return new Blob([html], { type: 'text/html' })
    },

    downloadDemo() {
      const a = document.createElement('a')
      a.href = URL.createObjectURL(this.demoBlob())
      a.download = this.file.kind === 'folder' ? `${this.file.name}.html` : this.file.name.replace(/\.docx$/, '.doc')
      a.click()
      setTimeout(() => URL.revokeObjectURL(a.href), 1000)
    },

    openNew() {
      if (this.file.placeholder && !this.file.url) window.open(URL.createObjectURL(this.demoBlob()), '_blank', 'noopener')
      else if (this.pdfUrl || this.file.url) window.open(this.pdfUrl || this.file.url, '_blank', 'noopener')
      else openReportInNewTab(this.file.reportId).catch((e) => this.$toast?.error(e.message))
    }
  }
}
</script>
