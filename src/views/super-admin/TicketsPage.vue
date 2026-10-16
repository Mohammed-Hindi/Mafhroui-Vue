<template>
  <!-- الشكاوى والملاحظات — مكتب دعم بنمط الأنظمة العالمية (Zendesk / Freshdesk): طوابير بعدّادات + قائمة + محادثة وخصائص -->
  <div class="dash hd-page">
    <header class="dash-head">
      <h2 class="dash-title">الشكاوى والملاحظات</h2>
    </header>

    <nav class="rv-tabs" aria-label="طوابير التذاكر">
      <button v-for="v in views" :key="v.value" type="button" :class="['rv-tab', view === v.value && 'is-active']" @click="view = v.value">
        {{ v.label }} <span class="rv-count">{{ counts[v.value] }}</span>
      </button>
    </nav>

    <div class="gr-filters hd-filters">
      <label class="rv-search">
        <Search :size="16" />
        <input v-model.trim="q" type="search" placeholder="بحث بالموضوع أو المرسل أو رقم التذكرة…">
      </label>
      <select v-model="roleFilter" class="gr-select" aria-label="المرسل">
        <option value="">كل المرسلين</option>
        <option value="student">الطلاب</option>
        <option value="supervisor">المشرفون</option>
        <option value="committee">لجنة الإشراف</option>
      </select>
      <select v-model="sort" class="gr-select" aria-label="الترتيب">
        <option value="activity">آخر نشاط</option>
        <option value="newest">الأحدث فتحًا</option>
        <option value="oldest">الأقدم فتحًا</option>
      </select>
    </div>

    <div class="rv-layout hd-layout">
      <section class="rv-list hd-list" aria-label="التذاكر">
        <!-- بطاقة بوابة: عنوان ≡ + وسم سماوي بالزاوية كـ"أرشيف الإفادات" (201350) -->
        <header class="hd-card-head">
          <h3 class="portal-title">{{ viewLabel }}</h3>
          <span class="hd-card-sub">{{ filtered.length }} تذكرة</span>
          <button v-if="view !== 'archived'" type="button" class="hd-corner" @click="view = 'archived'"><Archive :size="16" /> أرشيف التذاكر</button>
          <button v-else type="button" class="hd-corner" @click="view = 'awaiting'"><Inbox :size="16" /> صندوق الوارد</button>
        </header>
        <SkeletonLoader v-if="loading" variant="cards" :rows="4" />
        <p v-else-if="!filtered.length" class="palert is-warning hd-alert"><span class="hd-ic is-warning">!</span> لا توجد تذاكر في «{{ viewLabel }}»</p>
        <button
          v-for="t in filtered" :key="t.id" type="button"
          :class="['rv-item hd-item', current?.id === t.id && 'is-selected', awaiting(t) && 'is-unread']" @click="open(t)"
        >
          <span class="hd-avatar" aria-hidden="true">{{ initials(t.user?.name) }}</span>
          <span class="rv-item-body">
            <span class="hd-item-top">
              <span class="rv-item-title">{{ t.subject }}</span>
              <span class="hd-time">{{ ago(t.last_reply_at || t.created_at) }}</span>
            </span>
            <span class="hd-snippet">{{ t.last_reply_body || '—' }}</span>
            <span class="hd-item-meta">
              <span>{{ t.user?.name || '—' }} · {{ ROLE_NAMES[t.user?.role] || '' }}</span>
              <span class="hd-num">#{{ t.id }}</span>
              <span class="hd-replies"><MessageSquare :size="13" /> {{ t.replies_count }}</span>
              <span :class="['hd-state', stateOf(t).cls]">{{ stateOf(t).label }}</span>
            </span>
          </span>
        </button>
      </section>

      <section v-if="current" :class="['rv-detail hd-detail', mobileOpen && 'is-open']">
        <header class="hd-detail-head">
          <button type="button" class="rv-back" @click="mobileOpen = false"><ArrowRight :size="18" /> رجوع للقائمة</button>
          <div class="hd-detail-title">
            <h3 class="portal-title">{{ current.subject }}</h3>
            <span class="hd-detail-meta">
              <span :class="['hd-state', stateOf(current).cls]">{{ stateOf(current).label }}</span>
              <span class="hd-card-sub">تذكرة <bdi>#{{ current.id }}</bdi> · {{ current.user?.name }}</span>
            </span>
          </div>
          <!-- ألوان أزرار البوابة حصرًا (الدليل 6.8): محدد سماوي · سماوي · أحمر -->
          <div class="hd-tools">
            <button v-if="!current.archived_at && current.status === 'open'" type="button" class="pbtn is-outline is-sm" :disabled="busy" @click="act('close')"><CheckCircle2 :size="15" /> إغلاق</button>
            <button v-if="current.status === 'closed'" type="button" class="pbtn is-outline is-sm" :disabled="busy" @click="act('reopen')"><RotateCcw :size="15" /> إعادة فتح</button>
            <button
              v-if="!current.archived_at" type="button" class="pbtn is-cyan is-sm"
              :disabled="busy || !staffReplied" :title="staffReplied ? 'أرشفة التذكرة' : 'تتاح الأرشفة بعد الرد على التذكرة'" @click="act('archive')"
            >
              <Archive :size="15" /> أرشفة
            </button>
            <button v-else type="button" class="pbtn is-outline is-sm" :disabled="busy" @click="act('unarchive')"><ArchiveRestore :size="15" /> استرجاع من الأرشيف</button>
            <button type="button" class="pbtn is-red is-sm" :disabled="busy" @click="deleteOpen = true"><Trash2 :size="15" /> حذف</button>
          </div>
        </header>

        <div class="hd-body">
          <div class="hd-conv">
            <div ref="scroller" class="rv-detail-scroll">
              <SkeletonLoader v-if="threadLoading" :rows="3" height="36px" />
              <ol v-else class="hd-thread">
                <li v-for="r in thread" :key="r.id" :class="['hd-msg', r.user?.id === current.user_id ? 'is-sender' : 'is-staff']">
                  <!-- فريق الدعم بشعار الكلية في دائرة بيضاء كما في الشريط العلوي للبوابة -->
                  <span v-if="r.user?.id !== current.user_id" class="hd-avatar is-staff" aria-hidden="true"><UcasLogo :size="22" /></span>
                  <span v-else class="hd-avatar" aria-hidden="true">{{ initials(r.user?.name) }}</span>
                  <div class="hd-bubble">
                    <div class="hd-msg-head">
                      <b>{{ r.user?.name || '—' }}</b>
                      <span class="hd-role">{{ r.user?.id === current.user_id ? (ROLE_NAMES[r.user?.role] || 'المرسل') : 'فريق الدعم' }}</span>
                      <time class="pt-muted" :datetime="r.created_at">{{ when(r.created_at) }}</time>
                    </div>
                    <p>{{ r.body }}</p>
                  </div>
                </li>
              </ol>
              <p v-if="current.archived_at" class="palert is-info hd-alert hd-note"><span class="hd-ic is-info">!</span> التذكرة في الأرشيف{{ current.archived_by_user ? ' — أرشفها ' + current.archived_by_user : '' }} · {{ when(current.archived_at) }}</p>
              <p v-else-if="current.status === 'closed'" class="palert is-success hd-alert hd-note"><span class="hd-ic is-success">✓</span> أُغلقت التذكرة{{ current.closed_by?.name ? ' بواسطة ' + current.closed_by.name : '' }}.</p>
            </div>

            <footer v-if="current.status === 'open'" class="hd-composer">
              <textarea v-model.trim="reply" rows="3" maxlength="4000" placeholder="اكتب ردك… (Ctrl + Enter للإرسال)" aria-label="الرد" @keydown.ctrl.enter.prevent="sendReply()" />
              <div class="hd-composer-bar">
                <span class="pt-muted">{{ reply.length }} / 4000</span>
                <button type="button" class="pbtn is-cyan is-sm" :disabled="!reply || busy" @click="sendReply(true)"><Archive :size="15" /> إرسال وأرشفة</button>
                <button type="button" class="pbtn is-green is-sm" :disabled="!reply || busy" @click="sendReply()"><Send :size="15" /> إرسال الرد</button>
              </div>
            </footer>
          </div>

          <aside class="hd-props" aria-label="خصائص التذكرة">
            <div class="hd-requester">
              <span class="hd-avatar is-lg" aria-hidden="true">{{ initials(current.user?.name) }}</span>
              <div><b>{{ current.user?.name || '—' }}</b><span class="pt-muted">{{ ROLE_NAMES[current.user?.role] || '' }}</span></div>
            </div>
            <h4 class="portal-title hd-props-title">بيانات التذكرة</h4>
            <!-- "التسمية : القيمة" سماوية كبطاقة "بيانات المرشد" (201350) -->
            <dl class="hd-data">
              <div><dt>رقم التذكرة</dt><dd><bdi>#{{ current.id }}</bdi></dd></div>
              <div><dt>الحالة</dt><dd>{{ stateOf(current).label }}</dd></div>
              <div><dt>تاريخ الفتح</dt><dd>{{ when(current.created_at) }}</dd></div>
              <div><dt>آخر نشاط</dt><dd>{{ when(current.last_reply_at || current.created_at) }}</dd></div>
              <div><dt>الرسائل</dt><dd>{{ thread.length }}</dd></div>
              <div v-if="current.closed_by?.name"><dt>أغلقها</dt><dd>{{ current.closed_by.name }}</dd></div>
              <div v-if="current.archived_at"><dt>أرشفها</dt><dd>{{ current.archived_by_user || '—' }}</dd></div>
            </dl>
          </aside>
        </div>
      </section>

      <section v-else class="rv-detail hd-detail hd-empty">
        <Inbox :size="40" />
        <p>اختر تذكرة من القائمة لعرض المحادثة</p>
      </section>
    </div>

    <BaseModal v-model="deleteOpen" title="حذف التذكرة" size="sm">
      <p v-if="current" class="palert is-error"><span>ستُحذف التذكرة <b>#{{ current.id }} «{{ current.subject }}»</b> وكل ردودها نهائيًا، ولا يمكن التراجع عن هذا الإجراء.</span></p>
      <template #footer>
        <BaseButton variant="ghost" @click="deleteOpen = false">إلغاء</BaseButton>
        <BaseButton variant="danger" :icon="Trash2Icon" :loading="busy" @click="remove">تأكيد الحذف</BaseButton>
      </template>
    </BaseModal>
  </div>
</template>

<script>
import { markRaw } from 'vue'
import { Search, Send, ArrowRight, MessageSquare, CheckCircle2, RotateCcw, Archive, ArchiveRestore, Trash2, Inbox, MessageSquareReply, Layers } from 'lucide-vue-next'
import UcasLogo from '@/components/icons/UcasLogo.vue'
import BaseModal from '@/components/ui/BaseModal.vue'
import BaseButton from '@/components/ui/BaseButton.vue'
import api from '@/services/api'

const ROLE_NAMES = { student: 'طالب', supervisor: 'مشرف', committee: 'لجنة الإشراف', super_admin: 'الإدارة العامة' }
const rtf = new Intl.RelativeTimeFormat('ar', { numeric: 'auto' })

export default {
  name: 'TicketsPage',

  components: { Search, Send, ArrowRight, MessageSquare, CheckCircle2, RotateCcw, Archive, ArchiveRestore, Trash2, Inbox, UcasLogo, BaseModal, BaseButton },

  data() {
    return {
      ROLE_NAMES,
      Trash2Icon: markRaw(Trash2),
      deleteOpen: false,
      tickets: [],
      loading: true,
      view: 'awaiting',
      q: '',
      roleFilter: '',
      sort: 'activity',
      views: [
        { value: 'awaiting', label: 'بانتظار الرد', icon: markRaw(Inbox) },
        { value: 'answered', label: 'تم الرد', icon: markRaw(MessageSquareReply) },
        { value: 'closed', label: 'مغلقة', icon: markRaw(CheckCircle2) },
        { value: 'archived', label: 'الأرشيف', icon: markRaw(Archive) },
        { value: 'all', label: 'كل النشطة', icon: markRaw(Layers) }
      ],
      current: null,
      thread: [],
      threadLoading: false,
      reply: '',
      busy: false,
      mobileOpen: false
    }
  },

  computed: {
    counts() {
      return Object.fromEntries(this.views.map((v) => [v.value, this.tickets.filter((t) => this.inView(t, v.value)).length]))
    },
    viewLabel() {
      return this.views.find((v) => v.value === this.view)?.label
    },
    filtered() {
      const q = this.q.replace(/^#/, '')
      const key = { activity: (t) => t.last_reply_at || t.created_at, newest: (t) => t.created_at, oldest: (t) => t.created_at }[this.sort]
      return this.tickets
        .filter((t) => this.inView(t, this.view) && (!this.roleFilter || t.user?.role === this.roleFilter) && (!q || `${t.id} ${t.subject} ${t.user?.name || ''}`.includes(q)))
        .sort((a, b) => (this.sort === 'oldest' ? 1 : -1) * (new Date(key(a)) - new Date(key(b))))
    },
    /** الأرشفة بعد الرد فقط: وجود رسالة من غير صاحب التذكرة */
    staffReplied() {
      return this.thread.some((r) => r.user?.id !== this.current?.user_id)
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

    /** بانتظار الرد = مفتوحة وآخر رسالة من صاحبها */
    awaiting(t) {
      return t.status === 'open' && !t.archived_at && t.last_reply_user_id === t.user_id
    },

    inView(t, v) {
      if (v === 'archived') return !!t.archived_at
      if (t.archived_at) return false
      if (v === 'awaiting') return this.awaiting(t)
      if (v === 'answered') return t.status === 'open' && !this.awaiting(t)
      if (v === 'closed') return t.status === 'closed'
      return true
    },

    stateOf(t) {
      if (t.archived_at) return { label: 'مؤرشفة', cls: 'is-archived' }
      if (t.status === 'closed') return { label: 'مغلقة', cls: 'is-closed' }
      return this.awaiting(t) ? { label: 'بانتظار الرد', cls: 'is-awaiting' } : { label: 'تم الرد', cls: 'is-answered' }
    },

    async open(t) {
      this.current = t
      this.mobileOpen = true
      this.reply = ''
      this.threadLoading = true
      try {
        const { data } = await api.get(`/tickets/${t.id}`)
        this.current = { ...t, ...data, archived_by_user: data.archived_by?.name ?? data.archived_by_user }
        this.thread = data.replies || []
        this.$nextTick(() => this.$refs.scroller?.scrollTo({ top: this.$refs.scroller.scrollHeight }))
      } catch (err) {
        this.$toast?.error(err.normalized?.message || 'تعذّر تحميل التذكرة')
      } finally {
        this.threadLoading = false
      }
    },

    /** يعيد تحميل القائمة والتذكرة المفتوحة بعد أي إجراء */
    async refresh() {
      await this.load()
      const t = this.tickets.find((x) => x.id === this.current?.id)
      if (t) await this.open(t)
      else this.current = null
    },

    async sendReply(thenArchive = false) {
      if (!this.reply || this.busy) return
      this.busy = true
      try {
        await api.post(`/tickets/${this.current.id}/replies`, { body: this.reply })
        if (thenArchive) await api.post(`/tickets/${this.current.id}/archive`)
        this.reply = ''
        this.$toast?.success(thenArchive ? 'تم إرسال الرد وأرشفة التذكرة' : 'تم إرسال الرد')
        await this.refresh()
      } catch (err) {
        this.$toast?.error(err.normalized?.message || 'تعذّر إرسال الرد')
      } finally {
        this.busy = false
      }
    },

    async act(action) {
      const done = { close: 'أُغلقت التذكرة', reopen: 'أُعيد فتح التذكرة', archive: 'نُقلت التذكرة إلى الأرشيف', unarchive: 'استُرجعت التذكرة من الأرشيف' }
      this.busy = true
      try {
        await api.post(`/tickets/${this.current.id}/${action}`)
        this.$toast?.success(done[action])
        await this.refresh()
      } catch (err) {
        this.$toast?.error(err.normalized?.message || 'تعذّر تنفيذ العملية')
      } finally {
        this.busy = false
      }
    },

    async remove() {
      this.busy = true
      try {
        await api.delete(`/tickets/${this.current.id}`)
        this.$toast?.success('تم حذف التذكرة')
        this.deleteOpen = false
        this.current = null
        this.mobileOpen = false
        await this.load()
      } catch (err) {
        this.$toast?.error(err.normalized?.message || 'تعذّر حذف التذكرة')
      } finally {
        this.busy = false
      }
    },

    initials(name) {
      return (name || '؟').replace(/^(م|د|أ)\.\s*/, '').trim().split(/\s+/).slice(0, 2).map((w) => w[0]).join(' ')
    },

    when(d) {
      return d ? new Date(d).toLocaleString('ar-EG', { dateStyle: 'medium', timeStyle: 'short' }) : ''
    },

    ago(d) {
      if (!d) return ''
      const mins = Math.round((new Date(d) - Date.now()) / 60000)
      if (Math.abs(mins) < 60) return rtf.format(mins, 'minute')
      if (Math.abs(mins) < 1440) return rtf.format(Math.round(mins / 60), 'hour')
      if (Math.abs(mins) < 10080) return rtf.format(Math.round(mins / 1440), 'day')
      return new Date(d).toLocaleDateString('ar-EG', { day: 'numeric', month: 'short' })
    }
  }
}
</script>
