<template>
  <!-- قوالب دائمة لنافذة الإرسال (إعلان/ملف/تكليف): بطاقات معاينة (العنوان + مقتطف النص + صاحب القالب)،
       الضغط على "استخدام" يعبّئ العنوان والنص، و"حفظ كقالب" يحفظ المكتوب حاليًا -->
  <section class="tp">
    <header class="tp-head">
      <span class="tp-title"><LayoutTemplate :size="17" /> القوالب الدائمة <b v-if="templates.length" class="rv-count">{{ templates.length }}</b></span>
      <span class="tp-head-acts">
        <button type="button" class="pbtn is-outline is-sm" :disabled="saving || (!title && !body)" :title="!title && !body ? 'اكتب العنوان أو النص أولًا' : ''" @click="save()">
          <Save :size="14" /> {{ saving && !adding ? 'جارٍ الحفظ…' : 'حفظ المكتوب كقالب' }}
        </button>
        <button type="button" :class="['pbtn is-green is-sm tp-add-btn', adding && 'is-open']" :aria-expanded="adding" @click="adding = !adding">
          <Plus :size="15" /> إضافة قالب
        </button>
      </span>
    </header>

    <!-- إضافة قالب جديد مباشرة: عنوان ونص ثم حفظ — تنزلق النافذة بحركة الهوية -->
    <transition name="tp-add">
      <form v-if="adding" class="tp-add" @submit.prevent="save(draft)">
        <label class="pfield"><span>عنوان القالب <b class="as-req">*</b></span><input v-model.trim="draft.title" type="text" maxlength="200" :placeholder="`مثال: ${KIND[kind].label.replace('قالب ', '')} …`" required></label>
        <label class="pfield"><span>نص القالب</span><textarea v-model.trim="draft.body" rows="3" placeholder="النص الذي يُعبّأ عند استخدام القالب" /></label>
        <div class="tp-add-acts">
          <button type="button" class="pbtn is-outline is-sm" @click="adding = false">إلغاء</button>
          <button type="submit" class="pbtn is-green is-sm" :disabled="saving || !draft.title"><Check :size="14" /> {{ saving ? 'جارٍ الحفظ…' : 'حفظ القالب' }}</button>
        </div>
      </form>
    </transition>

    <div v-if="templates.length" class="tp-grid">
      <article v-for="t in templates" :key="t.id" :class="['tp-card', t.id === lastSaved && 'is-new', t.id === picked && 'is-picked']">
        <div class="tp-card-top">
          <span class="tp-kind"><component :is="KIND[kind].icon" :size="14" /> {{ KIND[kind].label }}</span>
          <button v-if="canDelete(t)" type="button" class="tp-del" :aria-label="`حذف القالب ${t.title || ''}`" @click="remove(t)"><Trash2 :size="14" /></button>
        </div>
        <h5 class="tp-card-title">{{ t.title || 'بلا عنوان' }}</h5>
        <p class="tp-card-body">{{ t.body || 'لا يوجد نص — القالب يعبّئ العنوان فقط.' }}</p>
        <footer class="tp-card-foot">
          <span class="pt-muted">{{ t.created_by?.name || '—' }} · {{ formatDate(t.created_at) }}</span>
          <button type="button" class="pbtn is-cyan is-sm" @click="pick(t)"><Check v-if="t.id === picked" :size="14" /> {{ t.id === picked ? 'تم الاختيار' : 'استخدام' }}</button>
        </footer>
      </article>
    </div>

    <!-- أثناء التحميل أو عند عدم وجود قوالب: بطاقات وهمية بنفس شكل القالب (الشارة، العنوان، سطرا النص، التذييل والزر) -->
    <div v-else :class="['tp-grid tp-ph', loading && 'is-loading']" :aria-busy="loading" :aria-label="loading ? 'جارٍ تحميل القوالب' : 'لا توجد قوالب محفوظة بعد'">
      <div v-for="n in 3" :key="n" class="tp-card is-ph" aria-hidden="true">
        <span class="tp-ph-chip" />
        <span class="tp-ph-line is-title" />
        <span class="tp-ph-line" />
        <span class="tp-ph-line is-short" />
        <span class="tp-ph-foot"><span class="tp-ph-line is-meta" /><span class="tp-ph-btn" /></span>
      </div>
    </div>
  </section>
</template>

<script>
import { markRaw } from 'vue'
import { Check, ClipboardList, FileText, LayoutTemplate, Megaphone, Plus, Save, Trash2 } from 'lucide-vue-next'
import { mapState } from 'pinia'
import api from '@/services/api'
import { useAuthStore } from '@/stores/auth.store'
import { formatDate } from '@/utils/formatters'

const KIND = {
  announcement: { label: 'قالب إعلان', icon: markRaw(Megaphone) },
  file: { label: 'قالب ملف', icon: markRaw(FileText) },
  task: { label: 'قالب تكليف', icon: markRaw(ClipboardList) }
}

export default {
  name: 'TemplatePicker',

  components: { Check, LayoutTemplate, Plus, Save, Trash2 },

  props: {
    /** announcement | file | task */
    kind: { type: String, required: true },
    title: { type: String, default: '' },
    body: { type: String, default: '' }
  },

  emits: ['apply'],

  data() {
    return { KIND, templates: [], loading: true, saving: false, lastSaved: null, picked: null, adding: false, draft: { title: '', body: '' } }
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
    } finally {
      this.loading = false
    }
  },

  methods: {
    formatDate,

    /** اختيار قالب: البطاقة تتوهّج بتدرّج الهوية ويظهر "تم الاختيار"، ثم يُطبَّق بعد لحظة قصيرة لتُرى الحركة */
    pick(t) {
      if (this.picked) return
      this.picked = t.id
      setTimeout(() => { this.$emit('apply', t); this.picked = null }, 420)
    },

    /** الإدارة العامة تحذف أي قالب، ولجنة الإشراف قوالبها فقط */
    canDelete(t) {
      return this.userRole === 'super_admin' || t.created_by?.id === this.user?.id
    },

    /** حفظ قالب: المكتوب حاليًا في النافذة، أو مسودة "إضافة قالب" */
    async save(src = { title: this.title, body: this.body }) {
      this.saving = true
      try {
        const { data } = await api.post('/compose-templates', { kind: this.kind, title: src.title || null, body: src.body || null })
        this.templates = [data, ...this.templates]
        this.lastSaved = data.id
        this.adding = false
        this.draft = { title: '', body: '' }
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
