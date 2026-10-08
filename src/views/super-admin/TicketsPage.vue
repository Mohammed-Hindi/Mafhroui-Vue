<template>
  <!-- الشكاوى والملاحظات — صندوق تذاكر (نمط أنظمة الدعم): قائمة + محادثة + رد / إغلاق / إعادة فتح -->
  <div class="dash">
    <header class="dash-head">
      <div>
        <h2 class="dash-title">الشكاوى والملاحظات</h2>
        <p class="dash-sub">تذاكر الطلاب والمشرفين الموجّهة للإدارة العامة — الرد يصل لصاحب التذكرة على المنصة</p>
      </div>
      <button type="button" class="pbtn is-outline is-sm" :disabled="loading" @click="load">تحديث</button>
    </header>

    <div class="rv-toolbar">
      <nav class="rv-tabs" aria-label="حالة التذكرة">
        <button v-for="t in tabs" :key="t.value" type="button" :class="['rv-tab', tab === t.value && 'is-active']" @click="tab = t.value">
          {{ t.label }} <span class="rv-count">{{ count(t.value) }}</span>
        </button>
      </nav>
      <label class="rv-search">
        <Search :size="16" />
        <input v-model.trim="q" type="search" placeholder="بحث بالموضوع أو اسم المرسل…">
      </label>
      <select v-model="roleFilter" class="gr-select" aria-label="المرسل">
        <option value="">كل المرسلين</option>
        <option value="student">الطلاب</option>
        <option value="supervisor">المشرفون</option>
        <option value="committee">لجنة الإشراف</option>
      </select>
    </div>

    <div class="rv-layout">
      <section class="rv-list" aria-label="التذاكر">
        <p v-if="loading" class="dash-empty">جارٍ التحميل…</p>
        <p v-else-if="!filtered.length" class="dash-empty">لا توجد تذاكر {{ tab === 'open' ? 'مفتوحة' : '' }}</p>
        <button
          v-for="t in filtered" :key="t.id" type="button"
          :class="['rv-item', current?.id === t.id && 'is-selected']" @click="open(t)"
        >
          <span :class="['rv-status-dot', t.status === 'open' ? 'is-pending' : 'is-approved']" />
          <span class="rv-item-body">
            <span class="rv-item-title">{{ t.subject }}</span>
            <span class="rv-item-meta">{{ t.user?.name || '—' }} · {{ ROLE_NAMES[t.user?.role] || '' }} · {{ t.replies_count }} رد</span>
          </span>
          <span class="rv-item-side">
            <span :class="['rv-pill', t.status === 'open' ? 'is-pending' : 'is-approved']">{{ t.status === 'open' ? 'مفتوحة' : 'مغلقة' }}</span>
            <span class="rv-item-note pt-muted">{{ when(t.last_reply_at || t.created_at) }}</span>
          </span>
        </button>
      </section>

      <section v-if="current" :class="['rv-detail', mobileOpen && 'is-open']">
        <div class="rv-detail-scroll">
          <button type="button" class="rv-back" @click="mobileOpen = false"><ArrowRight :size="18" /> رجوع للقائمة</button>
          <div class="rv-detail-head">
            <span :class="['rv-pill', current.status === 'open' ? 'is-pending' : 'is-approved']">{{ current.status === 'open' ? 'مفتوحة' : 'مغلقة' }}</span>
            <h3>{{ current.subject }}</h3>
            <p class="pt-muted">من {{ current.user?.name }} · {{ when(current.created_at) }}</p>
          </div>

          <p v-if="threadLoading" class="pt-muted">جارٍ تحميل المحادثة…</p>
          <ol v-else class="tk-thread">
            <li v-for="r in thread" :key="r.id" :class="['tk-msg', r.user?.id === current.user_id ? 'is-sender' : 'is-staff']">
              <div class="tk-msg-head"><b>{{ r.user?.name || '—' }}</b><span class="pt-muted">{{ when(r.created_at) }}</span></div>
              <p>{{ r.body }}</p>
            </li>
          </ol>
          <p v-if="current.status === 'closed'" class="palert is-success">أُغلقت التذكرة{{ current.closed_by ? ' بواسطة ' + current.closed_by.name : '' }}.</p>
        </div>

        <footer class="rv-actions tk-reply">
          <template v-if="current.status === 'open'">
            <textarea v-model.trim="reply" rows="2" maxlength="4000" placeholder="اكتب ردك…" />
            <button type="button" class="rv-reject" :disabled="busy" @click="setStatus('close')">إغلاق</button>
            <button type="button" class="rv-approve" :disabled="!reply || busy" @click="sendReply"><Send :size="16" /> إرسال الرد</button>
          </template>
          <template v-else>
            <span class="rv-decided">التذكرة مغلقة</span>
            <button type="button" class="rv-file" :disabled="busy" @click="setStatus('reopen')">إعادة فتح</button>
          </template>
        </footer>
      </section>
    </div>
  </div>
</template>

<script>
import { Search, Send, ArrowRight } from 'lucide-vue-next'
import api from '@/services/api'

const ROLE_NAMES = { student: 'طالب', supervisor: 'مشرف', committee: 'لجنة الإشراف', super_admin: 'الإدارة العامة' }

export default {
  name: 'TicketsPage',

  components: { Search, Send, ArrowRight },

  data() {
    return {
      ROLE_NAMES,
      tickets: [],
      loading: true,
      tab: 'open',
      q: '',
      roleFilter: '',
      tabs: [{ value: 'open', label: 'المفتوحة' }, { value: 'closed', label: 'المغلقة' }, { value: 'all', label: 'الكل' }],
      current: null,
      thread: [],
      threadLoading: false,
      reply: '',
      busy: false,
      mobileOpen: false
    }
  },

  computed: {
    filtered() {
      return this.tickets.filter((t) => (this.tab === 'all' || t.status === this.tab) && (!this.roleFilter || t.user?.role === this.roleFilter) && (!this.q || `${t.subject} ${t.user?.name || ''}`.includes(this.q)))
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
      } catch {
        this.tickets = []
      } finally {
        this.loading = false
      }
    },

    count(v) {
      return v === 'all' ? this.tickets.length : this.tickets.filter((t) => t.status === v).length
    },

    async open(t) {
      this.current = t
      this.mobileOpen = true
      this.threadLoading = true
      try {
        const { data } = await api.get(`/tickets/${t.id}`)
        this.current = data
        this.thread = data.replies || []
      } finally {
        this.threadLoading = false
      }
    },

    async sendReply() {
      this.busy = true
      try {
        const { data } = await api.post(`/tickets/${this.current.id}/replies`, { body: this.reply })
        this.thread.push(data)
        this.reply = ''
        this.$toast?.success('تم إرسال الرد')
        this.load()
      } catch (err) {
        this.$toast?.error(err.normalized?.message || 'تعذّر إرسال الرد')
      } finally {
        this.busy = false
      }
    },

    async setStatus(action) {
      this.busy = true
      try {
        await api.post(`/tickets/${this.current.id}/${action}`)
        await this.load()
        await this.open(this.tickets.find((t) => t.id === this.current.id) || this.current)
      } catch (err) {
        this.$toast?.error(err.normalized?.message || 'تعذّر تنفيذ العملية')
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
