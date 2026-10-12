<template>
  <!-- قوالب دائمة لنافذة الإرسال (إعلان/ملف/تكليف): بطاقات معاينة (العنوان + مقتطف النص + صاحب القالب)،
       الضغط على "استخدام" يعبّئ العنوان والنص، و"حفظ كقالب" يحفظ المكتوب حاليًا -->
  <section class="tp">
    <header class="tp-head">
      <span class="tp-title"><LayoutTemplate :size="17" /> القوالب الدائمة <b v-if="templates.length" class="rv-count">{{ templates.length }}</b></span>
      <button type="button" class="pbtn is-outline is-sm" :disabled="saving || (!title && !body)" :title="!title && !body ? 'اكتب العنوان أو النص أولًا' : ''" @click="save">
        <Save :size="14" /> {{ saving ? 'جارٍ الحفظ…' : 'حفظ المكتوب كقالب' }}
      </button>
    </header>

    <div v-if="templates.length" class="tp-grid">
      <article v-for="t in templates" :key="t.id" :class="['tp-card', t.id === lastSaved && 'is-new']">
        <div class="tp-card-top">
          <span class="tp-kind"><component :is="KIND[kind].icon" :size="14" /> {{ KIND[kind].label }}</span>
          <button v-if="canDelete(t)" type="button" class="tp-del" :aria-label="`حذف القالب ${t.title || ''}`" @click="remove(t)"><Trash2 :size="14" /></button>
        </div>
        <h5 class="tp-card-title">{{ t.title || 'بلا عنوان' }}</h5>
        <p class="tp-card-body">{{ t.body || 'لا يوجد نص — القالب يعبّئ العنوان فقط.' }}</p>
        <footer class="tp-card-foot">
          <span class="pt-muted">{{ t.created_by?.name || '—' }} · {{ formatDate(t.created_at) }}</span>
          <button type="button" class="pbtn is-cyan is-sm" @click="$emit('apply', t)">استخدام</button>
        </footer>
      </article>
    </div>

    <!-- placeholder: شكل القالب قبل حفظ أول واحد -->
    <div v-else class="tp-empty">
      <article class="tp-card is-ghost" aria-hidden="true">
        <div class="tp-card-top"><span class="tp-kind"><component :is="KIND[kind].icon" :size="14" /> {{ KIND[kind].label }}</span></div>
        <h5 class="tp-card-title">{{ title || KIND[kind].sampleTitle }}</h5>
        <p class="tp-card-body">{{ body || KIND[kind].sampleBody }}</p>
        <footer class="tp-card-foot"><span class="pt-muted">معاينة</span><span class="pbtn is-cyan is-sm">استخدام</span></footer>
      </article>
      <p class="pt-muted">لا توجد قوالب محفوظة بعد. اكتب العنوان والنص ثم اضغط "حفظ المكتوب كقالب" ليظهر هنا بهذا الشكل، ويصبح متاحًا للإدارة العامة ولجنة الإشراف في كل إرسال.</p>
    </div>
  </section>
</template>

<script>
import { markRaw } from 'vue'
import { ClipboardList, FileText, LayoutTemplate, Megaphone, Save, Trash2 } from 'lucide-vue-next'
import { mapState } from 'pinia'
import api from '@/services/api'
import { useAuthStore } from '@/stores/auth.store'
import { formatDate } from '@/utils/formatters'

const KIND = {
  announcement: { label: 'قالب إعلان', icon: markRaw(Megaphone), sampleTitle: 'تنبيه بخصوص موعد المناقشات', sampleBody: 'نود إعلامكم بأن مناقشات مشاريع التخرج ستبدأ يوم … في القاعة …، يرجى الالتزام بالموعد.' },
  file: { label: 'قالب ملف', icon: markRaw(FileText), sampleTitle: 'نموذج التقرير النهائي', sampleBody: 'مرفق نموذج التقرير النهائي المعتمد، يرجى الالتزام بالتنسيق عند التسليم.' },
  task: { label: 'قالب تكليف', icon: markRaw(ClipboardList), sampleTitle: 'تسليم الفصل الثاني من التقرير', sampleBody: 'المطلوب: رفع الفصل الثاني بصيغة PDF، مع مراجعة المشرف قبل التسليم.' }
}

export default {
  name: 'TemplatePicker',

  components: { LayoutTemplate, Save, Trash2 },

  props: {
    /** announcement | file | task */
    kind: { type: String, required: true },
    title: { type: String, default: '' },
    body: { type: String, default: '' }
  },

  emits: ['apply'],

  data() {
    return { KIND, templates: [], saving: false, lastSaved: null }
  },

  computed: {
    ...mapState(useAuthStore, ['userRole', 'user'])
  },

  async created() {
    try {
      const { data } = await api.get('/compose-templates', { params: { kind: this.kind } })
      this.templates = data
    } catch {
      this.templates = []
    }
  },

  methods: {
    formatDate,

    /** الإدارة العامة تحذف أي قالب، ولجنة الإشراف قوالبها فقط */
    canDelete(t) {
      return this.userRole === 'super_admin' || t.created_by?.id === this.user?.id
    },

    async save() {
      this.saving = true
      try {
        const { data } = await api.post('/compose-templates', { kind: this.kind, title: this.title || null, body: this.body || null })
        this.templates = [data, ...this.templates]
        this.lastSaved = data.id
        this.$toast?.success('تم حفظ القالب')
      } catch (err) {
        this.$toast?.error(err.normalized?.message || 'تعذّر حفظ القالب')
      } finally {
        this.saving = false
      }
    },

    async remove(t) {
      if (!window.confirm('حذف هذا القالب؟')) return
      try {
        await api.delete(`/compose-templates/${t.id}`)
        this.templates = this.templates.filter((x) => x.id !== t.id)
      } catch (err) {
        this.$toast?.error(err.normalized?.message || 'تعذّر حذف القالب')
      }
    }
  }
}
</script>
