<template>
  <!-- الشكاوى والملاحظات للطالب — نظام تذاكر بنمط البريد: بيانات التواصل مع المشرف العام + تذكرة جديدة + تذاكري ومحادثتها.
       الخادم يعيد للطالب تذاكره فقط: GET/POST /tickets · GET /tickets/{id} · POST /tickets/{id}/replies · POST /tickets/{id}/close -->
  <div class="dash hd-page">
    <header class="dash-head">
      <h2 class="dash-title">الشكاوى والملاحظات</h2>
      <button type="button" class="pbtn is-green" @click="composing = true; current = null"><Plus :size="16" /> تذكرة جديدة</button>
    </header>

    <!-- ponytail: بيانات المشرف العام ثابتة (placeholder) — الطالب لا يملك صلاحية قراءة المستخدمين؛ تُجلب من الخادم عند توفير endpoint عام -->
    <section class="dash-card st-contact">
      <div class="dash-card-head"><h3 class="portal-title">التواصل مع المشرف العام</h3></div>
      <dl class="sv-info">
        <div><dt>المشرف العام :</dt><dd>{{ ADMIN.name }}</dd></div>
        <div><dt>واتساب :</dt><dd dir="ltr"><a :href="`https://wa.me/${ADMIN.whatsapp}`" target="_blank" rel="noopener">{{ ADMIN.whatsapp }}</a></dd></div>
        <div><dt>البريد :</dt><dd dir="ltr">{{ ADMIN.email }}</dd></div>
      </dl>
    </section>

    <div class="rv-layout hd-layout">
      <section class="rv-list hd-list" aria-label="تذاكري">
        <header class="hd-card-head">
          <h3 class="portal-title">تذاكري</h3>
          <span class="hd-card-sub">{{ tickets.length }}</span>
        </header>
        <p v-if="loading" class="dash-empty">جارٍ التحميل…</p>
        <p v-else-if="!tickets.length" class="palert is-warning hd-alert"><span class="hd-ic is-warning">!</span> لم تفتح أي تذكرة بعد</p>
        <button
          v-for="t in tickets" :key="t.id" type="button"
          :class="['rv-item hd-item', current?.id === t.id && 'is-selected']" @click="open(t)"
        >
          <span class="rv-item-body">
            <span class="hd-item-top">
              <span class="rv-item-title">{{ t.subject }}</span>
              <span class="hd-time">{{ when(t.last_reply_at || t.created_at) }}</span>
            </span>
            <span class="hd-item-meta">
              <span class="hd-num">#{{ t.id }}</span>
              <span class="hd-replies"><MessageSquare :size="13" /> {{ t.replies_count }}</span>
              <span :class="['hd-state', t.status === 'open' ? 'is-answered' : 'is-closed']">{{ t.status === 'open' ? 'مفتوحة' : 'مغلقة' }}</span>
            </span>
          </span>
        </button>
      </section>

      <!-- تذكرة جديدة -->
      <section v-if="composing" class="rv-detail hd-detail is-open st-compose">
        <header class="hd-detail-head">
          <button type="button" class="rv-back" @click="composing = false"><ArrowRight :size="18" /> رجوع</button>
          <div class="hd-detail-title"><h3 class="portal-title">تذكرة جديدة</h3></div>
        </header>
        <div class="rv-detail-scroll st-form">
          <label class="pfield"><span>الموضوع *</span><input v-model.trim="draft.subject" type="text" maxlength="200" placeholder="مثال: تعذّر رفع ملف المقترح"></label>
          <label class="pfield"><span>التفاصيل *</span><textarea v-model.trim="draft.body" rows="6" maxlength="4000" placeholder="اشرح المشكلة أو الملاحظة بوضوح…" /></label>
          <div class="hd-composer-bar">
            <button type="button" class="pbtn is-outline is-sm" @click="composing = false">إلغاء</button>
            <button type="button" class="pbtn is-green is-sm" :disabled="!draft.subject || !draft.body || busy" @click="create"><Send :size="15" /> إرسال التذكرة</button>
          </div>
        </div>
      </section>

      <section v-else-if="current" :class="['rv-detail hd-detail', mobileOpen && 'is-open']">
        <header class="hd-detail-head">
          <button type="button" class="rv-back" @click="mobileOpen = false"><ArrowRight :size="18" /> رجوع للقائمة</button>
          <div class="hd-detail-title">
            <h3 class="portal-title">{{ current.subject }}</h3>
            <span class="hd-detail-meta">
              <span :class="['hd-state', current.status === 'open' ? 'is-answered' : 'is-closed']">{{ current.status === 'open' ? 'مفتوحة' : 'مغلقة' }}</span>
              <span class="hd-card-sub">تذكرة <bdi>#{{ current.id }}</bdi></span>
            </span>
          </div>
          <div v-if="current.status === 'open'" class="hd-tools">
            <button type="button" class="pbtn is-outline is-sm" :disabled="busy" @click="close"><CheckCircle2 :size="15" /> إغلاق التذكرة</button>
          </div>
        </header>
        <div class="hd-conv">
          <div class="rv-detail-scroll">
            <ol class="hd-thread">
              <li v-for="r in thread" :key="r.id" :class="['hd-msg', r.user?.id === current.user_id ? 'is-sender' : 'is-staff']">
                <span v-if="r.user?.id !== current.user_id" class="hd-avatar is-staff" aria-hidden="true"><UcasLogo :size="22" /></span>
                <span v-else class="hd-avatar" aria-hidden="true">أنا</span>
                <div class="hd-bubble">
                  <div class="hd-msg-head"><b>{{ r.user?.id === current.user_id ? 'أنت' : r.user?.name }}</b><span class="hd-role">{{ r.user?.id === current.user_id ? '' : 'فريق الدعم' }}</span><time class="pt-muted">{{ when(r.created_at) }}</time></div>
                  <p>{{ r.body }}</p>
                </div>
              </li>
            </ol>
            <p v-if="current.status === 'closed'" class="palert is-success hd-alert hd-note"><span class="hd-ic is-success">✓</span> أُغلقت التذكرة.</p>
          </div>
          <footer v-if="current.status === 'open'" class="hd-composer">
            <textarea v-model.trim="reply" rows="3" maxlength="4000" placeholder="اكتب ردك… (Ctrl + Enter للإرسال)" @keydown.ctrl.enter.prevent="sendReply" />
            <div class="hd-composer-bar"><button type="button" class="pbtn is-green is-sm" :disabled="!reply || busy" @click="sendReply"><Send :size="15" /> إرسال الرد</button></div>
          </footer>
        </div>
      </section>

      <section v-else class="rv-detail hd-detail hd-empty">
        <Inbox :size="40" />
        <p>اختر تذكرة لعرض المحادثة، أو افتح تذكرة جديدة</p>
      </section>
    </div>
  </div>
</template>

<script>
import { ArrowRight, CheckCircle2, Inbox, MessageSquare, Plus, Send } from 'lucide-vue-next'
import UcasLogo from '@/components/icons/UcasLogo.vue'
import api from '@/services/api'
import { isPlaceholder, placeholderTickets } from '@/utils/studentPlaceholders'

const ADMIN = { name: 'الإدارة العامة — منصة مسار', whatsapp: '972597302452', email: 'admin@mashroui.local' }

export default {
  name: 'StudentTicketsPage',

  components: { ArrowRight, CheckCircle2, Inbox, MessageSquare, Plus, Send, UcasLogo },

  data() {
    return { ADMIN, tickets: [], loading: true, current: null, thread: [], composing: false, mobileOpen: false, draft: { subject: '', body: '' }, reply: '', busy: false }
  },

  created() {
    this.load()
  },

  methods: {
    async load() {
      this.loading = true
      try {
        const { data } = await api.get('/tickets')
        this.tickets = data.data || data
        // بلا تذاكر بعد: تذكرة تجريبية (placeholder) توضّح شكل المحادثة
        if (!this.tickets.length) this.tickets = placeholderTickets()
      } catch {
        this.tickets = []
      } finally {
        this.loading = false
      }
    },

    async open(t) {
      this.composing = false
      this.current = t
      this.mobileOpen = true
      if (isPlaceholder(t)) {
        this.thread = t.replies
        return
      }
      try {
        const { data } = await api.get(`/tickets/${t.id}`)
        this.current = { ...t, ...data }
        this.thread = data.replies || []
      } catch (err) {
        this.$toast?.error(err.normalized?.message || 'تعذّر تحميل التذكرة')
      }
    },

    async create() {
      this.busy = true
      try {
        const { data } = await api.post('/tickets', this.draft)
        this.$toast?.success('تم إرسال التذكرة')
        this.draft = { subject: '', body: '' }
        await this.load()
        await this.open(this.tickets.find((x) => x.id === data.id) || data)
      } catch (err) {
        this.$toast?.error(err.normalized?.message || 'تعذّر إرسال التذكرة')
      } finally {
        this.busy = false
      }
    },

    async sendReply() {
      if (!this.reply || this.busy) return
      this.busy = true
      try {
        await api.post(`/tickets/${this.current.id}/replies`, { body: this.reply })
        this.reply = ''
        await this.open(this.current)
        this.load()
      } catch (err) {
        this.$toast?.error(err.normalized?.message || 'تعذّر إرسال الرد')
      } finally {
        this.busy = false
      }
    },

    async close() {
      this.busy = true
      try {
        await api.post(`/tickets/${this.current.id}/close`)
        await this.load()
        await this.open(this.tickets.find((x) => x.id === this.current.id) || this.current)
      } catch (err) {
        this.$toast?.error(err.normalized?.message || 'تعذّر إغلاق التذكرة')
      } finally {
        this.busy = false
      }
    },

    when(d) {
      return d ? new Date(d).toLocaleString('ar-EG', { dateStyle: 'medium', timeStyle: 'short' }) : ''
    }
  }
}
</script>
