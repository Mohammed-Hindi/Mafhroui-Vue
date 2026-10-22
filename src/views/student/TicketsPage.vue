<template>
  <!-- الشكاوى والملاحظات للطالب بنمط البريد (لا محادثة ولا أرقام تذاكر): رسالة جديدة بـ"إلى/الموضوع/الرسالة"،
       صندوق رسائلي، وقراءة المراسلة كرسائل بريد متتالية مع "رد". الخادم يعيد للطالب مراسلاته فقط:
       GET/POST /tickets · GET /tickets/{id} · POST /tickets/{id}/replies · POST /tickets/{id}/close
       بلا رأس صفحة وبلا سكشن تواصل — نظام التيكتس فقط، وزر الرسالة الجديدة داخل رأس صندوق الرسائل -->
  <div class="dash hd-page sttickets-page">

    <div class="rv-layout hd-layout">
      <!-- صندوق الرسائل -->
      <section class="rv-list hd-list" aria-label="رسائلي">
        <header class="hd-card-head">
          <h3 class="portal-title">رسائلي</h3>
          <span class="hd-card-sub">{{ tickets.length }}</span>
          <button type="button" class="pbtn is-green is-sm" @click="compose"><PenSquare :size="15" /> رسالة جديدة</button>
        </header>
        <SkeletonLoader v-if="loading" variant="cards" :rows="4" />
        <p v-else-if="!tickets.length" class="palert is-warning hd-alert"><span class="hd-ic is-warning">!</span> لم ترسل أي رسالة بعد</p>
        <button
          v-for="t in tickets" :key="t.id" type="button"
          :class="['em-item', current?.id === t.id && !composing && 'is-selected']" @click="open(t)"
        >
          <span class="em-item-top">
            <b class="em-subject">{{ t.subject }}</b>
            <time class="em-date">{{ short(t.last_reply_at || t.created_at) }}</time>
          </span>
          <span class="em-item-meta">
            <span>إلى: الإدارة العامة</span>
            <span v-if="t.replies_count > 1" class="em-count"><Mail :size="13" /> {{ t.replies_count }}</span>
            <span v-if="t.status !== 'open'" class="em-closed">مغلقة</span>
          </span>
        </button>
      </section>

      <!-- رسالة جديدة -->
      <section v-if="composing" class="rv-detail hd-detail is-open">
        <header class="hd-detail-head">
          <button type="button" class="rv-back" @click="composing = false"><ArrowRight :size="18" /> رجوع</button>
          <div class="hd-detail-title"><h3 class="portal-title">رسالة جديدة</h3></div>
        </header>
        <div class="rv-detail-scroll em-compose">
          <div class="em-field"><span>إلى</span><b>الإدارة العامة — منصة مسار</b></div>
          <label class="em-field"><span>الموضوع</span><input v-model.trim="draft.subject" type="text" maxlength="200" placeholder="مثال: تعذّر رفع ملف المقترح"></label>
          <textarea v-model.trim="draft.body" class="em-text" rows="10" maxlength="4000" placeholder="اكتب رسالتك بوضوح…" />
          <div class="hd-composer-bar">
            <button type="button" class="pbtn is-outline is-sm" @click="composing = false">إلغاء</button>
            <button type="button" class="pbtn is-green is-sm" :disabled="!draft.subject || !draft.body || busy" @click="create"><Send :size="15" /> إرسال</button>
          </div>
        </div>
      </section>

      <!-- قراءة المراسلة: رسائل بريد متتالية -->
      <section v-else-if="current" :class="['rv-detail hd-detail', mobileOpen && 'is-open']">
        <header class="hd-detail-head">
          <button type="button" class="rv-back" @click="mobileOpen = false"><ArrowRight :size="18" /> رجوع للقائمة</button>
          <div class="hd-detail-title">
            <h3 class="portal-title">{{ current.subject }}</h3>
            <span v-if="current.status !== 'open'" class="hd-card-sub">مغلقة</span>
          </div>
          <div v-if="current.status === 'open'" class="hd-tools">
            <button type="button" class="pbtn is-outline is-sm" :disabled="busy" @click="close"><CheckCircle2 :size="15" /> إغلاق</button>
          </div>
        </header>
        <div class="rv-detail-scroll em-read">
          <article v-for="r in thread" :key="r.id" class="em-mail">
            <header class="em-mail-head">
              <span :class="['em-avatar', mine(r) && 'is-me']" aria-hidden="true"><UcasLogo v-if="!mine(r)" :size="20" /><template v-else>أنا</template></span>
              <span class="em-mail-who">
                <b>{{ mine(r) ? 'أنت' : r.user?.name }}</b>
                <small class="pt-muted">إلى: {{ mine(r) ? 'الإدارة العامة' : 'أنت' }}</small>
              </span>
              <time class="em-date">{{ when(r.created_at) }}</time>
            </header>
            <p class="em-mail-body">{{ r.body }}</p>
          </article>

          <!-- رد (بريد): زر يفتح نموذج الرد أسفل الرسائل -->
          <template v-if="current.status === 'open'">
            <button v-if="!replying" type="button" class="pbtn is-outline em-reply-btn" @click="replying = true"><Reply :size="16" /> رد</button>
            <div v-else class="em-reply">
              <div class="em-field"><span>إلى</span><b>الإدارة العامة</b></div>
              <textarea v-model.trim="reply" class="em-text" rows="6" maxlength="4000" placeholder="اكتب ردك…" />
              <div class="hd-composer-bar">
                <button type="button" class="pbtn is-outline is-sm" @click="replying = false">إلغاء</button>
                <button type="button" class="pbtn is-green is-sm" :disabled="!reply || busy" @click="sendReply"><Send :size="15" /> إرسال</button>
              </div>
            </div>
          </template>
          <p v-else class="palert is-success hd-alert hd-note"><span class="hd-ic is-success">✓</span> أُغلقت هذه المراسلة.</p>
        </div>
      </section>

      <section v-else class="rv-detail hd-detail hd-empty">
        <Inbox :size="40" />
        <p>اختر رسالة لقراءتها، أو اكتب رسالة جديدة</p>
      </section>
    </div>
  </div>
</template>


<script>
import { ArrowRight, CheckCircle2, Inbox, Mail, PenSquare, Reply, Send } from 'lucide-vue-next'
import UcasLogo from '@/components/icons/UcasLogo.vue'
import api from '@/services/api'
import { isPlaceholder, placeholderTickets } from '@/utils/studentPlaceholders'

export default {
  name: 'StudentTicketsPage',

  components: { ArrowRight, CheckCircle2, Inbox, Mail, PenSquare, Reply, Send, UcasLogo },

  data() {
    return { tickets: [], loading: true, current: null, thread: [], composing: false, mobileOpen: false, draft: { subject: '', body: '' }, reply: '', replying: false, busy: false }
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
        // بلا رسائل بعد: مراسلة تجريبية (placeholder) توضّح الشكل
        if (!this.tickets.length) this.tickets = placeholderTickets()
      } catch {
        this.tickets = []
      } finally {
        this.loading = false
      }
    },

    async open(t) {
      this.composing = false
      this.replying = false
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
        this.$toast?.error(err.normalized?.message || 'تعذّر تحميل الرسالة')
      }
    },

    async create() {
      this.busy = true
      try {
        const { data } = await api.post('/tickets', this.draft)
        this.$toast?.success('تم إرسال الرسالة')
        this.draft = { subject: '', body: '' }
        await this.load()
        await this.open(this.tickets.find((x) => x.id === data.id) || data)
      } catch (err) {
        this.$toast?.error(err.normalized?.message || 'تعذّر إرسال الرسالة')
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
        this.replying = false
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
        this.$toast?.error(err.normalized?.message || 'تعذّر إغلاق المراسلة')
      } finally {
        this.busy = false
      }
    },

    compose() {
      this.composing = true
      this.current = null
    },

    /** رسالة الطالب نفسه (المرسِل الأصلي للمراسلة) */
    mine(r) {
      return r.user?.id === this.current.user_id
    },

    /** تاريخ مختصر لقائمة الرسائل: الوقت لليوم، وإلا اليوم والشهر */
    short(d) {
      if (!d) return ''
      const x = new Date(d)
      return x.toDateString() === new Date().toDateString() ? x.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }) : x.toLocaleDateString('ar-EG', { day: 'numeric', month: 'short' })
    },

    when(d) {
      return d ? new Date(d).toLocaleString('ar-EG', { dateStyle: 'medium', timeStyle: 'short' }) : ''
    }
  }
}
</script>
