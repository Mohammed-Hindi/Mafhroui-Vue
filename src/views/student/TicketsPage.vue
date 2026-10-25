<template>
  <!-- الشكاوى والملاحظات للطالب: نفس مكتب الدعم تبع الإدارة العامة (tk2) — ريل طوابير بعدّادات،
       قائمة رسائلي، ومحادثة بفقاعات مع محرّر أسفلها وبيانات الرسالة جانبًا.
       الخادم يعيد للطالب مراسلاته فقط: GET/POST /tickets · GET /tickets/{id} ·
       POST /tickets/{id}/replies · POST /tickets/{id}/close -->
  <div class="dash hd-page tk2 sttickets-page">
    <!-- شريط الفلاتر: بحث + الحالة (بديل الريل) + ترتيب، وزر الرسالة الجديدة بأقصى اليسار بجانبهن -->
    <div class="tk-toolbar">
      <div class="gr-filters tk2-filters">
        <label class="rv-search">
          <Search :size="16" />
          <input v-model.trim="q" type="search" placeholder="بحث بالموضوع…">
        </label>
        <BaseSelect v-model="view" class="tk-filter" aria-label="الحالة" :options="viewOptions" />
        <BaseSelect v-model="sort" class="tk-filter" aria-label="الترتيب" :options="sortOptions" />
      </div>
      <div class="tk-filters-actions">
        <button type="button" class="pbtn is-green" @click="compose"><PenSquare :size="16" /> رسالة جديدة</button>
      </div>
    </div>

    <div class="tk2-shell">
      <section class="rv-list hd-list tk2-list" aria-label="رسائلي">
        <header class="tk2-list-head">
          <h3 class="portal-title">{{ viewLabel }}</h3>
          <span class="hd-card-sub">{{ filtered.length }} رسالة</span>
        </header>
        <SkeletonLoader v-if="loading" variant="cards" :rows="4" />
        <p v-else-if="!filtered.length" class="palert is-warning hd-alert"><span class="hd-ic is-warning">!</span> لا توجد رسائل في «{{ viewLabel }}»</p>
        <button
          v-for="t in filtered" v-else :key="t.id" type="button"
          :class="['rv-item hd-item', current?.id === t.id && !composing && 'is-selected']" @click="open(t)"
        >
          <span class="rv-item-body">
            <span class="hd-item-top">
              <span class="rv-item-title">{{ t.subject }}</span>
              <span class="hd-time">{{ ago(t.last_reply_at || t.created_at) }}</span>
            </span>
            <span class="hd-snippet">{{ snippet(t) }}</span>
            <span class="hd-item-meta">
              <span>إلى: الإدارة العامة</span>
              <span v-if="t.id > 0" class="hd-num">#{{ t.id }}</span>
              <span class="hd-replies"><MessageSquare :size="13" /> {{ t.replies_count }}</span>
              <span :class="['hd-state', stateOf(t).cls]">{{ stateOf(t).label }}</span>
            </span>
          </span>
        </button>
      </section>

      <!-- رسالة جديدة: نفس هيكل التفاصيل — محرّر أسفل مساحة القراءة -->
      <section v-if="composing" class="rv-detail hd-detail is-open">
        <header class="hd-detail-head">
          <button type="button" class="rv-back" @click="composing = false"><ArrowRight :size="18" /> رجوع للقائمة</button>
          <div class="hd-detail-title"><h3 class="portal-title">رسالة جديدة</h3></div>
        </header>
        <div class="hd-conv">
          <div class="rv-detail-scroll">
            <p class="palert is-info hd-alert"><span class="hd-ic is-info">!</span> اكتب موضوع رسالتك ونصّها بالمحرّر أسفل — تصلك الإدارة العامة مباشرة.</p>
          </div>
          <footer class="hd-composer">
            <input v-model.trim="draft.subject" type="text" maxlength="200" placeholder="الموضوع — مثال: تعذّر رفع ملف المقترح">
            <textarea v-model.trim="draft.body" rows="4" maxlength="4000" placeholder="اكتب رسالتك بوضوح… (Ctrl + Enter للإرسال)" aria-label="نص الرسالة" @keydown.ctrl.enter.prevent="create"></textarea>
            <div class="hd-composer-bar">
              <span class="pt-muted">{{ draft.body.length }} / 4000</span>
              <button type="button" class="pbtn is-outline is-sm" @click="composing = false">إلغاء</button>
              <button type="button" class="pbtn is-green is-sm" :disabled="!draft.subject || !draft.body || busy" @click="create"><Send :size="15" /> إرسال</button>
            </div>
          </footer>
        </div>
      </section>

      <!-- قراءة المراسلة: محادثة بفقاعات + محرّر رد + لوحة بيانات الرسالة -->
      <section v-else-if="current" :class="['rv-detail hd-detail', mobileOpen && 'is-open']">
        <header class="hd-detail-head">
          <button type="button" class="rv-back" @click="mobileOpen = false"><ArrowRight :size="18" /> رجوع للقائمة</button>
          <div class="hd-detail-title">
            <h3 class="portal-title">{{ current.subject }}</h3>
            <span class="hd-detail-meta">
              <span :class="['hd-state', stateOf(current).cls]">{{ stateOf(current).label }}</span>
              <span class="hd-card-sub">رسالة <bdi>#{{ current.id }}</bdi></span>
            </span>
          </div>
          <div v-if="current.status === 'open'" class="hd-tools">
            <button type="button" class="pbtn is-outline is-sm" :disabled="busy" @click="close"><CheckCircle2 :size="15" /> إغلاق</button>
          </div>
        </header>

        <div class="hd-body">
          <div class="hd-conv">
            <div ref="scroller" class="rv-detail-scroll">
              <SkeletonLoader v-if="threadLoading" :rows="3" height="36px" />
              <ol v-else class="hd-thread">
                <li v-for="r in thread" :key="r.id" :class="['hd-msg', mine(r) ? 'is-sender' : 'is-staff']">
                  <!-- فريق الدعم بشعار الكلية في دائرة بيضاء كما في باقي صفحات البوابة -->
                  <span v-if="!mine(r)" class="hd-avatar is-staff" aria-hidden="true"><UcasLogo :size="22" /></span>
                  <span v-else class="hd-avatar" aria-hidden="true">{{ initials(user?.name) }}</span>
                  <div class="hd-bubble">
                    <div class="hd-msg-head">
                      <b>{{ mine(r) ? 'أنت' : (r.user?.name || 'الإدارة العامة') }}</b>
                      <span class="hd-role">{{ mine(r) ? 'طالب' : 'فريق الدعم' }}</span>
                      <time class="pt-muted" :datetime="r.created_at">{{ when(r.created_at) }}</time>
                    </div>
                    <p>{{ r.body }}</p>
                  </div>
                </li>
              </ol>
              <p v-if="current.status !== 'open'" class="palert is-success hd-alert hd-note"><span class="hd-ic is-success">✓</span> أُغلقت هذه المراسلة.</p>
            </div>

            <footer v-if="current.status === 'open'" class="hd-composer">
              <textarea v-model.trim="reply" rows="3" maxlength="4000" placeholder="اكتب ردك… (Ctrl + Enter للإرسال)" aria-label="الرد" @keydown.ctrl.enter.prevent="sendReply()"></textarea>
              <div class="hd-composer-bar">
                <span class="pt-muted">{{ reply.length }} / 4000</span>
                <button type="button" class="pbtn is-green is-sm" :disabled="!reply || busy" @click="sendReply()"><Send :size="15" /> إرسال الرد</button>
              </div>
            </footer>
          </div>

          <aside class="hd-props" aria-label="بيانات الرسالة">
            <div class="hd-requester">
              <span class="hd-avatar is-staff is-lg" aria-hidden="true"><UcasLogo :size="26" /></span>
              <div><b>الإدارة العامة</b><span class="pt-muted">منصة مسار</span></div>
            </div>
            <h4 class="portal-title hd-props-title">بيانات الرسالة</h4>
            <dl class="hd-data">
              <div><dt>الرقم</dt><dd><bdi>#{{ current.id }}</bdi></dd></div>
              <div><dt>الحالة</dt><dd>{{ stateOf(current).label }}</dd></div>
              <div><dt>أُرسلت</dt><dd>{{ when(current.created_at) }}</dd></div>
              <div><dt>آخر نشاط</dt><dd>{{ when(current.last_reply_at || current.created_at) }}</dd></div>
              <div><dt>الرسائل</dt><dd>{{ thread.length }}</dd></div>
            </dl>
          </aside>
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
import { mapState } from 'pinia'
import { ArrowRight, CheckCircle2, Inbox, MessageSquare, PenSquare, Search, Send } from 'lucide-vue-next'
import UcasLogo from '@/components/icons/UcasLogo.vue'
import BaseSelect from '@/components/ui/BaseSelect.vue'
import api from '@/services/api'
import { isPlaceholder, placeholderTickets } from '@/utils/studentPlaceholders'
import { useAuthStore } from '@/stores/auth.store'

const rtf = new Intl.RelativeTimeFormat('ar-u-nu-latn', { numeric: 'auto' })

export default {
  name: 'StudentTicketsPage',

  components: { ArrowRight, CheckCircle2, Inbox, MessageSquare, PenSquare, Search, Send, UcasLogo, BaseSelect },

  data() {
    return {
      view: 'all',
      viewOptions: [
        { value: 'all', label: 'كل الرسائل' },
        { value: 'open', label: 'مفتوحة' },
        { value: 'closed', label: 'مغلقة' }
      ],
      q: '',
      sort: 'activity',
      sortOptions: [
        { value: 'activity', label: 'آخر نشاط' },
        { value: 'newest', label: 'الأحدث' },
        { value: 'oldest', label: 'الأقدم' }
      ],
      tickets: [],
      loading: true,
      current: null,
      thread: [],
      threadLoading: false,
      composing: false,
      mobileOpen: false,
      draft: { subject: '', body: '' },
      reply: '',
      busy: false
    }
  },

  computed: {
    ...mapState(useAuthStore, ['user']),

    viewLabel() {
      return this.viewOptions.find((v) => v.value === this.view)?.label
    },
    filtered() {
      const q = this.q.replace(/^#/, '')
      const key = { activity: (t) => t.last_reply_at || t.created_at, newest: (t) => t.created_at, oldest: (t) => t.created_at }[this.sort]
      return this.tickets
        .filter((t) => this.inView(t, this.view) && (!q || `${t.id} ${t.subject}`.includes(q)))
        .sort((a, b) => (this.sort === 'oldest' ? 1 : -1) * (new Date(key(a)) - new Date(key(b))))
    }
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

    inView(t, v) {
      if (v === 'open') return t.status === 'open'
      if (v === 'closed') return t.status !== 'open'
      return true
    },

    /** بانتظار الرد = مفتوحة وآخر رسالة من صاحبها (الطالب) */
    awaiting(t) {
      return t.status === 'open' && t.last_reply_user_id === t.user_id
    },

    stateOf(t) {
      if (t.status === 'closed') return { label: 'مغلقة', cls: 'is-closed' }
      return this.awaiting(t) ? { label: 'بانتظار الرد', cls: 'is-awaiting' } : { label: 'تم الرد', cls: 'is-answered' }
    },

    snippet(t) {
      return t.last_reply_body || t.replies?.[t.replies.length - 1]?.body || '—'
    },

    async open(t) {
      this.composing = false
      this.reply = ''
      this.current = t
      this.mobileOpen = true
      if (isPlaceholder(t)) {
        this.thread = t.replies
        return
      }
      this.threadLoading = true
      try {
        const { data } = await api.get(`/tickets/${t.id}`)
        this.current = { ...t, ...data }
        this.thread = data.replies || []
        this.$nextTick(() => this.$refs.scroller?.scrollTo({ top: this.$refs.scroller.scrollHeight }))
      } catch (err) {
        this.$toast?.error(err.normalized?.message || 'تعذّر تحميل الرسالة')
      } finally {
        this.threadLoading = false
      }
    },

    /** يعيد تحميل القائمة والرسالة المفتوحة بعد أي إجراء */
    async refresh() {
      await this.load()
      const t = this.tickets.find((x) => x.id === this.current?.id)
      if (t) await this.open(t)
      else this.current = null
    },

    async create() {
      if (!this.draft.subject || !this.draft.body || this.busy) return
      this.busy = true
      try {
        const { data } = await api.post('/tickets', this.draft)
        this.$toast?.success('تم إرسال الرسالة')
        this.draft = { subject: '', body: '' }
        this.composing = false
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
        this.$toast?.success('تم إرسال الرد')
        await this.refresh()
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
        this.$toast?.success('أُغلقت المراسلة')
        await this.refresh()
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

    initials(name) {
      return (name || '؟').replace(/^(م|د|أ)\.\s*/, '').trim().split(/\s+/).slice(0, 2).map((w) => w[0]).join(' ')
    },

    when(d) {
      return d ? new Date(d).toLocaleString('ar-EG-u-nu-latn', { dateStyle: 'medium', timeStyle: 'short' }) : ''
    },

    ago(d) {
      if (!d) return ''
      const mins = Math.round((new Date(d) - Date.now()) / 60000)
      if (Math.abs(mins) < 60) return rtf.format(mins, 'minute')
      if (Math.abs(mins) < 1440) return rtf.format(Math.round(mins / 60), 'hour')
      if (Math.abs(mins) < 10080) return rtf.format(Math.round(mins / 1440), 'day')
      return new Date(d).toLocaleDateString('ar-EG-u-nu-latn', { day: 'numeric', month: 'short' })
    }
  }
}
</script>
