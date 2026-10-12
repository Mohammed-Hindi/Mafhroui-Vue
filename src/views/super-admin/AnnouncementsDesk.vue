<template>
  <!-- الإعلانات والملفات للجنة الإشراف — صندوق وارد بنمط الأنظمة العالمية (Outlook / Gmail) بهوية البوابة:
       تبويبات الملف (201300) + بطاقة بعنوان ≡ ووسم سماوي بالزاوية (201350) + بيانات "التسمية :" سماوية. نفس نظام صفحة الشكاوى (hd-*) -->
  <div class="dash hd-page">
    <header class="dash-head">
      <h2 class="dash-title">الإعلانات والملفات</h2>
    </header>

    <nav class="rv-tabs" aria-label="نوع المراسلة">
      <button v-for="t in tabs" :key="t.value" type="button" :class="['rv-tab', tab === t.value && 'is-active']" @click="tab = t.value">
        {{ t.label }} <span class="rv-count">{{ count(t.value) }}</span>
      </button>
    </nav>

    <div class="gr-filters hd-filters">
      <label class="rv-search">
        <Search :size="16" />
        <input v-model.trim="q" type="search" placeholder="بحث بالعنوان أو النص أو المرسل أو اسم الملف…">
      </label>
      <select v-model="sender" class="gr-select" aria-label="المرسل">
        <option value="">كل المرسلين</option>
        <option v-for="s in senders" :key="s" :value="s">{{ s }}</option>
      </select>
      <select v-model="sort" class="gr-select" aria-label="الترتيب">
        <option value="newest">الأحدث أولًا</option>
        <option value="oldest">الأقدم أولًا</option>
      </select>
      <button v-if="q || sender" type="button" class="pbtn is-outline is-sm" @click="q = ''; sender = ''">مسح الفلاتر</button>
      <button type="button" class="hd-refresh" :disabled="loading" title="تحديث" aria-label="تحديث" @click="load"><RefreshCw :size="16" /></button>
    </div>

    <div class="rv-layout hd-layout">
      <section class="rv-list hd-list" aria-label="المراسلات">
        <header class="hd-card-head">
          <h3 class="portal-title">{{ tabLabel }}</h3>
          <span class="hd-card-sub">{{ shown.length }}</span>
          <button v-if="tab !== 'file'" type="button" class="hd-corner" @click="tab = 'file'"><Paperclip :size="16" /> الملفات</button>
          <button v-else type="button" class="hd-corner" @click="tab = ''"><Inbox :size="16" /> كل الوارد</button>
        </header>
        <p v-if="loading" class="dash-empty">جارٍ التحميل…</p>
        <p v-else-if="!shown.length" class="palert is-warning hd-alert"><span class="hd-ic is-warning">!</span> لا توجد مراسلات في «{{ tabLabel }}»</p>
        <button
          v-for="a in shown" :key="a.id" type="button"
          :class="['rv-item hd-item', current?.id === a.id && 'is-selected']" @click="open(a)"
        >
          <span :class="['an-icon', `is-${kind(a)}`]" aria-hidden="true"><component :is="TYPE[kind(a)].icon" :size="16" /></span>
          <span class="rv-item-body">
            <span class="hd-item-top">
              <span class="rv-item-title">{{ titleOf(a) }}</span>
              <span class="hd-time">{{ ago(a.created_at) }}</span>
            </span>
            <span class="hd-snippet">{{ a.body || (a.attachments?.length ? a.attachments.map((f) => f.name).join('، ') : '—') }}</span>
            <span class="hd-item-meta">
              <span>{{ a.author?.name || '—' }}</span>
              <span v-if="a.attachments?.length" class="hd-replies"><Paperclip :size="13" /> {{ a.attachments.length }}</span>
              <span :class="['hd-state', TYPE[kind(a)].cls]">{{ TYPE[kind(a)].label }}</span>
            </span>
          </span>
        </button>
      </section>

      <section v-if="current" :class="['rv-detail hd-detail', mobileOpen && 'is-open']">
        <header class="hd-detail-head">
          <button type="button" class="rv-back" @click="mobileOpen = false"><ArrowRight :size="18" /> رجوع للقائمة</button>
          <div class="hd-detail-title">
            <h3 class="portal-title">{{ titleOf(current) }}</h3>
            <span class="hd-detail-meta">
              <span :class="['hd-state', TYPE[kind(current)].cls]">{{ TYPE[kind(current)].label }}</span>
              <span class="hd-card-sub">من {{ current.author?.name || '—' }} · {{ when(current.created_at) }}</span>
            </span>
          </div>
          <div v-if="current.attachments?.length > 1" class="hd-tools">
            <button type="button" class="pbtn is-cyan is-sm" @click="downloadAll"><Download :size="15" /> تنزيل الكل ({{ current.attachments.length }})</button>
          </div>
        </header>

        <div class="hd-body">
          <div class="hd-conv">
            <div class="rv-detail-scroll">
              <div v-if="current.rating" class="an-rating" :aria-label="`${current.rating} من 5`">
                <Star v-for="n in 5" :key="n" :size="20" :fill="n <= current.rating ? 'currentColor' : 'none'" :class="n > current.rating && 'is-off'" />
                <b>{{ current.rating }} من 5</b>
              </div>
              <article class="an-body">
                <p v-if="current.body">{{ current.body }}</p>
                <p v-else class="pt-muted">بلا نص مرفق.</p>
              </article>

              <section v-if="current.attachments?.length" class="an-files" aria-label="المرفقات">
                <h4 class="portal-title hd-props-title">المرفقات</h4>
                <ul>
                  <li v-for="f in current.attachments" :key="f.id">
                    <span class="an-file-ic" aria-hidden="true"><FileText :size="18" /></span>
                    <span class="an-file-main"><b><bdi>{{ f.name }}</bdi></b><span class="pt-muted">{{ formatFileSize(f.size) }}</span></span>
                    <button type="button" class="pbtn is-outline is-sm" :title="`تنزيل ${f.name}`" @click="download(f)"><Download :size="15" /> تنزيل</button>
                  </li>
                </ul>
              </section>
            </div>
          </div>

          <aside class="hd-props" aria-label="بيانات المراسلة">
            <div class="hd-requester">
              <span class="hd-avatar is-lg is-staff" aria-hidden="true"><UcasLogo :size="24" /></span>
              <div><b>{{ current.author?.name || '—' }}</b><span class="pt-muted">{{ ROLE_LABELS[current.author?.role] || '' }}</span></div>
            </div>
            <h4 class="portal-title hd-props-title">بيانات المراسلة</h4>
            <dl class="hd-data">
              <div><dt>النوع :</dt><dd>{{ TYPE[kind(current)].label }}</dd></div>
              <div><dt>التاريخ :</dt><dd>{{ when(current.created_at) }}</dd></div>
              <div v-if="current.team"><dt>المجموعة :</dt><dd>{{ current.team.section ? `شعبة ${current.team.section}` : current.team.name }}</dd></div>
              <div><dt>المرفقات :</dt><dd>{{ current.attachments?.length || 0 }}</dd></div>
            </dl>
          </aside>
        </div>
      </section>

      <section v-else class="rv-detail hd-detail hd-empty">
        <Inbox :size="40" />
        <p>اختر إعلانًا أو ملفًا من القائمة لعرضه</p>
      </section>
    </div>
  </div>
</template>

<script>
import { markRaw } from 'vue'
import { ArrowRight, Download, FileText, Inbox, Layers, Megaphone, Paperclip, RefreshCw, Search, Star } from 'lucide-vue-next'
import UcasLogo from '@/components/icons/UcasLogo.vue'
import api from '@/services/api'
import { downloadAttachment } from '@/services/announcements'
import { ROLE_LABELS } from '@/utils/constants'
import { formatFileSize } from '@/utils/formatters'
import { isPlaceholder, placeholderAnnouncements } from '@/utils/studentPlaceholders'
import { mapState } from 'pinia'
import { useAuthStore } from '@/stores/auth.store'

const TYPE = {
  announcement: { label: 'إعلان', cls: 'is-answered', icon: markRaw(Megaphone) },
  file: { label: 'ملف', cls: 'is-closed', icon: markRaw(FileText) },
  rating: { label: 'تقييم', cls: 'is-awaiting', icon: markRaw(Star) }
}
const rtf = new Intl.RelativeTimeFormat('ar', { numeric: 'auto' })

export default {
  name: 'AnnouncementsDesk',

  components: { ArrowRight, Download, FileText, Inbox, Paperclip, RefreshCw, Search, Star, UcasLogo },

  data() {
    return {
      ROLE_LABELS,
      TYPE,
      tabs: [
        { value: '', label: 'كل الوارد', icon: markRaw(Layers) },
        { value: 'announcement', label: 'الإعلانات', icon: markRaw(Megaphone) },
        { value: 'file', label: 'الملفات', icon: markRaw(FileText) },
        { value: 'rating', label: 'التقييمات', icon: markRaw(Star) }
      ],
      tab: '',
      q: '',
      sender: '',
      sort: 'newest',
      items: [],
      loading: true,
      current: null,
      mobileOpen: false
    }
  },

  computed: {
    ...mapState(useAuthStore, ['userRole']),
    tabLabel() {
      return this.tabs.find((t) => t.value === this.tab)?.label
    },
    senders() {
      return [...new Set(this.items.map((a) => a.author?.name).filter(Boolean))]
    },
    shown() {
      const q = this.q
      return this.items
        .filter((a) => (!this.tab || this.kind(a) === this.tab) && (!this.sender || a.author?.name === this.sender) &&
          (!q || `${a.title || ''} ${a.body || ''} ${a.author?.name || ''} ${(a.attachments || []).map((f) => f.name).join(' ')}`.includes(q)))
        .sort((x, y) => (this.sort === 'oldest' ? 1 : -1) * (new Date(x.created_at) - new Date(y.created_at)))
    }
  },

  created() {
    this.load()
  },

  methods: {
    formatFileSize,

    // GET /announcements — ما وُجّه للمستخدم أو لفرقه (الإرسال الواحد يظهر مرة واحدة)
    async load() {
      this.loading = true
      try {
        const { data } = await api.get('/announcements')
        this.items = data.data || data
        // الطالب بلا إعلانات بعد: بيانات تجريبية (placeholder)
        if (!this.items.length && this.userRole === 'student') this.items = placeholderAnnouncements()
        // على الشاشات العريضة يُفتح أول عنصر تلقائيًا (كصناديق البريد)؛ على الجوال التفاصيل صفحة كاملة فلا تُفتح وحدها
        this.current = this.items.find((a) => a.id === this.current?.id) || (window.innerWidth >= 1024 ? this.shown[0] : null) || null
      } catch (err) {
        this.$toast?.error(err.normalized?.message || 'تعذّر تحميل الإعلانات')
      } finally {
        this.loading = false
      }
    },

    kind(a) {
      return a.type === 'file' || a.type === 'rating' ? a.type : a.rating ? 'rating' : 'announcement'
    },

    titleOf(a) {
      return a.title || TYPE[this.kind(a)].label
    },

    count(type) {
      return type ? this.items.filter((a) => this.kind(a) === type).length : this.items.length
    },

    open(a) {
      this.current = a
      this.mobileOpen = true
    },

    async download(f) {
      if (isPlaceholder(f)) return this.$toast?.info(`${f.name} — ملف تجريبي`)
      try {
        await downloadAttachment(f)
      } catch {
        this.$toast?.error('تعذّر تنزيل الملف')
      }
    },

    async downloadAll() {
      for (const f of this.current.attachments) await this.download(f)
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
