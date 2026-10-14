<template>
  <div class="dash">
    <!-- أرشيف المشاريع للإدارة العامة بهوية البوابة: ستيبر العروض (كل/مميّزة/مؤرشفة/غير مؤرشفة) بأعدادها + أرشفة الكل،
         بحث وفلتر التخصص (قائمة) والدرجة، مجلدات المشاريع، ومجلد المشروع (ملفاته + معاينة تسليماته) — ملفات تجريبية بلا تخزين بعد -->
    <header class="dash-head">
      <h2 class="dash-title">أرشيف المشاريع</h2>
    </header>

    <div class="ev-steps-bar ad-steps-bar">
      <ol class="tk-stepper ev-steps" aria-label="عروض الأرشيف">
        <li v-for="v in views" :key="v.key" :class="[view === v.key && 'is-active']">
          <button type="button" :aria-current="view === v.key && 'page'" @click="setView(v.key)">
            <b>{{ v.count }}</b> <component :is="v.icon" :size="16" /> {{ v.label }}
          </button>
        </li>
      </ol>
    </div>

    <section class="dash-card ad-card">
      <!-- مجلد المشروع -->
      <template v-if="current">
        <div class="ad-back">
          <button type="button" class="pbtn is-cyan" @click="current = null"><ArrowRight :size="16" /> رجوع</button>
        </div>

        <div class="ad-proj-head">
          <span class="ad-sec-badge"><small>شعبة</small><b>{{ current.section }}</b></span>
          <div class="ad-proj-text">
            <h3>{{ current.project }}</h3>
            <span class="ad-proj-meta">
              <span><GraduationCap :size="15" /> {{ current.spec }} · {{ DEGREES[current.degree] }}</span>
              <span><UserRound :size="15" /> {{ current.supName }}</span>
              <span><Users :size="15" /> {{ current.members.map((m) => m.name).join('، ') }}</span>
            </span>
          </div>
          <span class="ad-proj-tools">
            <span class="ad-done">{{ doneCount }} من {{ files.length }} تسليمات</span>
            <span :class="['rv-pill', REVIEW[stageOf(current)].tone]">{{ REVIEW[stageOf(current)].short }}</span>
            <button v-if="!isSup" type="button" :class="['pbtn is-sm ar-feature', current.featured ? 'is-green' : 'is-outline']" :aria-pressed="current.featured" @click="toggleFeatured(current)">
              <Star :size="15" :fill="current.featured ? 'currentColor' : 'none'" /> {{ current.featured ? 'معروض كأفضل مشروع في الرئيسية' : 'تعيين كأفضل مشروع في الرئيسية' }}
            </button>
          </span>
        </div>

        <!-- مسار الاعتماد: رفع التقرير ← موافقة المشرف ← اعتماد لجنة الإشراف ← الأرشفة -->
        <section class="ad-flow" aria-label="مسار اعتماد التقرير النهائي">
          <ol class="ad-flow-steps">
            <li v-for="st in flow" :key="st.key" :class="['ad-flow-step', `is-${st.state}`]">
              <span class="ad-flow-dot"><Check v-if="st.state === 'done'" :size="15" /><X v-else-if="st.state === 'bad'" :size="15" /><span v-else>{{ st.no }}</span></span>
              <b>{{ st.label }}</b>
              <small>{{ st.info }}</small>
            </li>
          </ol>
          <p v-if="report?.review_status === 'rejected'" class="ad-flow-note"><X :size="16" /> سبب الرفض: {{ report.review_note }}</p>
          <div v-if="report?.review_status === waitStage" class="ad-flow-act">
            <span>{{ isSup ? 'رفع الطلاب التقرير النهائي — موافقتك ترسله لاعتماد لجنة الإشراف.' : 'وافق المشرف على التقرير — موافقة لجنة الإشراف تؤرشف المشروع.' }}</span>
            <template v-if="rejecting">
              <input v-model.trim="rejectNote" type="text" class="ev-input" placeholder="سبب الرفض (يظهر للطلاب)" aria-label="سبب الرفض">
              <button type="button" class="pbtn is-outline" @click="rejecting = false">إلغاء</button>
              <button type="button" class="pbtn is-red" :disabled="!rejectNote || reviewing" @click="review(current, false)">تأكيد الرفض</button>
            </template>
            <template v-else>
              <button type="button" class="pbtn is-outline is-red-text" @click="rejecting = true">رفض</button>
              <button type="button" class="pbtn is-green" :disabled="reviewing" @click="review(current, true)"><CheckCircle2 :size="16" /> {{ isSup ? 'موافقة المشرف' : 'موافقة لجنة الإشراف' }}</button>
            </template>
          </div>
        </section>

        <h4 class="ad-sub">ملفات المشروع</h4>
        <div class="ad-files">
          <button
            v-for="file in files" :key="file.key" type="button" :class="['ad-file', `is-${file.kind}`, !file.ok && 'is-missing']"
            :title="file.ok ? 'عرض الملف' : 'لم يُرفع بعد'" @click="file.ok && (viewing = file)"
          >
            <component :is="file.icon" :size="24" class="ad-file-icon" />
            <span class="ad-file-text">
              <span class="ad-file-name">{{ file.name }}</span>
              <small>{{ file.ok ? file.meta : 'لم يُرفع بعد' }}</small>
            </span>
            <span class="ad-file-tag">{{ file.tag }}</span>
          </button>
        </div>

        <h4 class="ad-sub">معاينة تسليمات الطالب</h4>
        <div class="ad-previews">
          <article v-for="c in previews" :key="c.key" :class="['ad-prev', `is-${c.kind}`, !c.ok && 'is-missing']">
            <div class="ad-prev-art">
              <component :is="c.icon" :size="46" />
              <span v-if="c.ok && c.badge" class="ad-prev-badge">{{ c.badge }}</span>
            </div>
            <div class="ad-prev-body">
              <b>{{ c.title }}</b>
              <span :class="c.ok ? 'is-ok' : 'is-bad'"><Check v-if="c.ok" :size="14" /><X v-else :size="14" /> {{ c.ok ? c.okText : c.missText }}</span>
            </div>
          </article>
        </div>
      </template>

      <!-- مجلدات المشاريع -->
      <template v-else>
        <div class="dash-card-head">
          <h3>{{ views.find((v) => v.key === view).label }}</h3>
          <span class="dash-chip">{{ visible.length }} مشروع</span>
        </div>

        <div class="gr-filters" aria-label="تصفية المشاريع">
          <label class="gr-search"><Search :size="16" /><input v-model.trim="q" type="search" placeholder="بحث بالمشروع أو الشعبة أو المشرف أو الطالب…"></label>
          <label class="gr-pick">
            <span>التخصص</span>
            <select v-model="f.spec" class="gr-select">
              <option value="">كل التخصصات</option>
              <option v-for="sp in specs" :key="sp" :value="sp">{{ sp }} ({{ inView.filter((x) => x.spec === sp).length }})</option>
            </select>
          </label>
          <label v-if="!isSup" class="gr-pick">
            <span>الدرجة</span>
            <select v-model="f.degree" class="gr-select">
              <option value="">دبلوم وبكالوريوس</option>
              <option v-for="(l, k) in DEGREES" :key="k" :value="k">{{ l }}</option>
            </select>
          </label>
          <!-- المشرف: فلترا التخصص والجنس فقط -->
          <label v-else class="gr-pick">
            <span>الجنس</span>
            <select v-model="f.gender" class="gr-select">
              <option value="">طلاب وطالبات</option>
              <option value="male">طلاب</option>
              <option value="female">طالبات</option>
            </select>
          </label>
          <button v-if="q || f.spec || f.degree || f.gender" type="button" class="gr-clear" @click="q = ''; f = { spec: '', degree: '', gender: '' }">مسح الفلاتر</button>
        </div>

        <p v-if="loading" class="pt-muted tk-loading">جارٍ التحميل…</p>
        <!-- جدول المشاريع بالسلايدر والشريط الأخضر: موافقة المشرف + موافقة لجنة الإشراف ← أرشفة -->
        <SlideTable v-else :rows="visible" label="المشاريع">
          <template #default="{ rows: pageRows }">
            <div class="pt-wrap">
              <table class="pt ad-table">
                <thead>
                  <tr>
                    <th>الشعبة</th><th>المشروع والطلبة</th><th>المشرف</th><th class="ad-c">موعد التسليم</th>
                    <th class="ad-c">موافقة المشرف</th><th class="ad-c">لجنة الإشراف</th><th class="ad-c">الحالة</th><th v-if="!isSup" class="ad-c">الصفحة الرئيسية</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="p in pageRows" :key="p.id" class="is-link" @click="openProject(p)">
                    <td class="ad-nowrap"><span class="ev-sec">شعبة {{ p.section }}</span><Star v-if="p.featured" :size="14" fill="currentColor" class="ad-row-star" /></td>
                    <td class="ad-proj-cell">
                      <b>{{ p.project }}</b>
                      <span class="pt-muted">{{ p.spec }} · {{ DEGREES[p.degree] }} · {{ p.members.map((m) => m.name).join('، ') }}</span>
                    </td>
                    <td class="ad-nowrap">{{ p.supName }}</td>
                    <td class="ad-c ad-nowrap">{{ p.report ? formatDate(p.report.created_at) : '—' }}</td>
                    <td class="ad-c">
                      <button v-if="isSup && stageOf(p) === 'pending_supervisor'" type="button" class="pbtn is-green is-sm" :disabled="reviewing" @click.stop="review(p, true)">
                        <CheckCircle2 :size="14" /> موافقة
                      </button>
                      <span v-else :class="['ad-check', supState(p).cls]"><component :is="supState(p).icon" :size="15" /> {{ supState(p).text }}</span>
                    </td>
                    <td class="ad-c">
                      <button v-if="!isSup && stageOf(p) === 'pending_committee'" type="button" class="pbtn is-green is-sm" :disabled="reviewing" @click.stop="review(p, true)">
                        <CheckCircle2 :size="14" /> موافقة اللجنة
                      </button>
                      <span v-else :class="['ad-check', comState(p).cls]"><component :is="comState(p).icon" :size="15" /> {{ comState(p).text }}</span>
                    </td>
                    <td class="ad-c"><span :class="['rv-pill', REVIEW[stageOf(p)].tone]">{{ REVIEW[stageOf(p)].short }}</span></td>
                    <!-- أفضل مشاريع التخرج في الصفحة الرئيسية: لجنة الإشراف والإدارة العامة فقط -->
                    <td v-if="!isSup" class="ad-c">
                      <button type="button" :class="['pbtn is-sm ar-feature', p.featured ? 'is-green' : 'is-outline']" :aria-pressed="p.featured" :title="p.featured ? 'إزالة من الصفحة الرئيسية' : 'تعيين كأفضل مشروع في الصفحة الرئيسية'" @click.stop="toggleFeatured(p)">
                        <Star :size="14" :fill="p.featured ? 'currentColor' : 'none'" /> {{ p.featured ? 'في الرئيسية' : 'تعيين' }}
                      </button>
                    </td>
                  </tr>
                  <tr v-if="!visible.length"><td :colspan="isSup ? 7 : 8" class="gr-empty">لا توجد مشاريع مطابقة</td></tr>
                </tbody>
              </table>
            </div>
          </template>
          <template #after>
            <div class="gr-sumbar">
              <span>عدد المشاريع: {{ visible.length }}</span>
              <span v-for="(l, k) in REVIEW" :key="k">{{ l.short }}: {{ visible.filter((p) => stageOf(p) === k).length }}</span>
            </div>
          </template>
        </SlideTable>
      </template>
    </section>

    <FileViewer :file="viewing" @close="viewing = null" />
  </div>
</template>

<script>
import { mapActions, mapState } from 'pinia'
import { useAuthStore } from '@/stores/auth.store'
import { ArrowRight, Check, CheckCircle2, Clock, FileText, FileType2, Folder, FolderOpen, GraduationCap, Hourglass, Minus, PlayCircle, Search, Star, UserRound, Users, X } from 'lucide-vue-next'
import FileViewer from '@/components/shared/FileViewer.vue'
import SlideTable from '@/components/ui/SlideTable.vue'
import api from '@/services/api'
import { DEGREES } from '@/utils/progressData'
import { groupGender } from '@/services/adminData'
import { loadGroups } from '@/services/adminData'
import { useTeamsStore } from '@/stores/teams.store'
import { REVIEW, latestReport, rejectedBy, reviewReport } from '@/utils/finalReport'
import { formatDate } from '@/utils/formatters'

/** عشوائي ثابت لكل مشروع (نفس النتيجة في كل مرة) */
const seeded = (n) => () => { n = (n * 9301 + 49297) % 233280; return n / 233280 }

export default {
  name: 'ArchiveBoard',

  components: { ArrowRight, Check, CheckCircle2, FileViewer, SlideTable, Folder, GraduationCap, Search, Star, UserRound, Users, X },

  data() {
    return {
      DEGREES,
      REVIEW,
      viewing: null,
      reviewing: false,
      rejecting: false,
      rejectNote: '',
      q: '',
      view: 'all',
      f: { spec: '', degree: '', gender: '' },
      current: null,
      loading: true,
      projects: []
    }
  },

  computed: {
    ...mapState(useAuthStore, ['userRole']),
    // المشرف: مشاريعه فقط (loadGroups) ويوافق على التقرير أولًا، ثم تعتمده لجنة الإشراف
    isSup() {
      return this.userRole === 'supervisor'
    },
    waitStage() {
      return this.isSup ? 'pending_supervisor' : 'pending_committee'
    },
    /** تقارير تنتظر موافقة المستخدم الحالي (المشرف أو اللجنة) */
    readyCount() {
      return this.projects.filter((p) => this.stageOf(p) === this.waitStage).length
    },
    report() {
      return this.current?.report || null
    },
    /** مراحل مسار الاعتماد للمشروع المفتوح: done / current / bad / todo */
    flow() {
      const r = this.report
      const st = r?.review_status
      const by = (u, at) => (u ? `${u.name} · ${formatDate(at)}` : '')
      const rejectedAt = (stage) => st === 'rejected' && (stage === 'committee') === !!r.committee_reviewed_at
      return [
        { key: 'up', no: 1, label: 'رفع التقرير النهائي', state: r ? 'done' : 'current', info: r ? formatDate(r.created_at) : 'لم يُرفع بعد' },
        {
          key: 'sup', no: 2, label: 'موافقة المشرف',
          state: rejectedAt('supervisor') ? 'bad' : r?.supervisor_reviewed_at ? 'done' : st === 'pending_supervisor' ? 'current' : 'todo',
          info: rejectedAt('supervisor') ? 'رُفض' : r?.supervisor_reviewed_at ? by(r.supervisor_reviewer, r.supervisor_reviewed_at) : st === 'pending_supervisor' ? `بانتظار ${this.current.supName}` : '—'
        },
        {
          key: 'com', no: 3, label: 'اعتماد لجنة الإشراف',
          state: rejectedAt('committee') ? 'bad' : st === 'approved' ? 'done' : st === 'pending_committee' ? 'current' : 'todo',
          info: rejectedAt('committee') ? 'رُفض' : st === 'approved' ? by(r.committee_reviewer, r.committee_reviewed_at) : st === 'pending_committee' ? 'بانتظار الاعتماد' : '—'
        },
        { key: 'arc', no: 4, label: 'أرشفة المشروع', state: st === 'approved' ? 'done' : 'todo', info: st === 'approved' ? 'مؤرشف' : '—' }
      ]
    },
    views() {
      const n = (fn) => this.projects.filter(fn).length
      return [
        { key: 'all', label: 'كل المشاريع', icon: FolderOpen, count: this.projects.length },
        { key: 'featured', label: 'المميّزة', icon: Star, count: n((p) => p.featured) },
        { key: 'archived', label: 'مؤرشفة', icon: CheckCircle2, count: n((p) => p.archived) },
        { key: 'ready', label: this.isSup ? 'بانتظار موافقتي' : 'بانتظار اللجنة', icon: Hourglass, count: this.readyCount },
        { key: 'pending', label: 'غير مؤرشفة', icon: Clock, count: n((p) => !p.archived) }
      ]
    },
    /** مشاريع العرض الحالي (القائمة الجانبية) والبحث — أساس أعداد الفلتر */
    inView() {
      const q = this.q
      return this.projects.filter((p) =>
        (this.view === 'all' || (this.view === 'featured' && p.featured) || (this.view === 'archived' && p.archived) || (this.view === 'ready' && this.stageOf(p) === this.waitStage) || (this.view === 'pending' && !p.archived)) &&
        (!q || `${p.project} ${p.section} ${p.supName} ${p.members.map((m) => m.name).join(' ')}`.includes(q))
      )
    },
    specs() {
      return [...new Set(this.projects.map((x) => x.spec).filter(Boolean))]
    },
    visible() {
      return this.inView.filter((p) => (!this.f.spec || p.spec === this.f.spec) && (!this.f.degree || p.degree === this.f.degree) && (!this.f.gender || groupGender(p) === this.f.gender))
    },
    /**
     * ملفات مجلد المشروع بنمط الصورة (مجلد · برومو · تقرير · وورد).
     * ponytail: ملفات تجريبية ثابتة لكل مشروع (المؤرشف مكتمل) — تُستبدل بملفات التخزين عند ربطه.
     */
    files() {
      const p = this.current
      if (!p) return []
      const r = p.report
      const rand = seeded(p.id * 131 + 7)
      const extra = () => !!r && (p.archived || rand() > 0.3)
      const mb = (base) => `${(base * (0.7 + rand() * 0.6)).toFixed(1)} MB`
      return [
        {
          key: 'src', kind: 'folder', icon: Folder, tag: 'مجلد', name: 'المشاريع_المفتوحة_Source_Files', ok: extra(), placeholder: true,
          meta: `${12 + Math.round(rand() * 40)} ملف · Figma / Unity / Assets`, contents: ['Figma/', 'Unity_Project/', 'Assets/', 'Database/', 'README.md']
        },
        { key: 'video', kind: 'video', icon: PlayCircle, tag: 'برومو', name: 'فيديو_البرومو_Promo_Video', ok: !!r?.video_url, url: r?.video_url, meta: 'رابط الفيديو · 1080p' },
        {
          key: 'pdf', kind: 'pdf', icon: FileText, tag: 'تقرير', name: 'تقرير_مشروع_التخرج_النهائي.pdf', ok: !!r, reportId: r?.id,
          meta: r ? `رُفع ${formatDate(r.created_at)}` : '', download: r ? () => this.openProtectedFile(`/final-reports/${r.id}/download`) : null
        },
        { key: 'doc', kind: 'doc', icon: FileType2, tag: 'وورد', name: 'تقرير_مشروع_التخرج_النهائي.docx', ok: extra(), placeholder: true, meta: mb(4) }
      ]
    },
    doneCount() {
      return this.files.filter((x) => x.ok).length
    },
    previews() {
      const [src, video, pdf] = this.files
      return [
        { key: 'video', kind: 'video', icon: PlayCircle, title: 'فيديو البرومو — Promo Video', ok: video.ok, badge: '1080p', okText: 'تم رفع الفيديو بنجاح', missText: 'لم يُرفع الفيديو بعد' },
        { key: 'src', kind: 'folder', icon: Folder, title: 'المشاريع المفتوحة — Source Files', ok: src.ok, badge: src.meta.split(' ')[0] + ' ملف', okText: 'يحتوي ملفات Figma/Unity/Assets', missText: 'المجلد فارغ' },
        { key: 'pdf', kind: 'pdf', icon: FileText, title: 'تقرير مشروع التخرج النهائي.pdf', ok: pdf.ok, badge: 'PDF', okText: REVIEW[this.stageOf(this.current)].label, missText: 'لم يُرفع التقرير بعد' }
      ]
    }
  },

  async created() {
    try {
      // مشاريع الفصل الحالي (المجموعات التي لها مشروع) + آخر تقرير نهائي لكل مشروع من GET /teams
      const [groups, teams] = await Promise.all([loadGroups(), api.get('/teams').then(({ data }) => data.data || data).catch(() => [])])
      const reports = Object.fromEntries(teams.filter((t) => t.project).map((t) => [t.project.id, latestReport(t.project)]))
      this.projects = groups.filter((g) => g.projectId).map((g) => ({ ...g, archived: g.projectStatus === 'completed', report: reports[g.projectId] || null }))
    } catch {
      this.$toast?.error('تعذّر تحميل المشاريع')
    } finally {
      this.loading = false
    }
  },

  methods: {
    setView(v) {
      this.view = v
      this.current = null
    },

    openProject(p) {
      this.current = p
      this.rejecting = false
      this.rejectNote = ''
    },

    ...mapActions(useTeamsStore, ['openProtectedFile']),

    stageOf(p) {
      return p.report?.review_status || 'none'
    },

    /** POST /final-reports/{id}/review — اعتماد اللجنة يؤرشف المشروع، والرفض يعيده للطلاب بملاحظة */
    async review(p, approve) {
      this.reviewing = true
      try {
        p.report = { ...p.report, ...(await reviewReport(p.report.id, approve, approve ? null : this.rejectNote)) }
        if (approve && !this.isSup) p.archived = true
        this.rejecting = false
        this.rejectNote = ''
        this.$toast?.success(approve ? (this.isSup ? 'تمت الموافقة — أُرسل التقرير لاعتماد لجنة الإشراف' : 'اعتُمد التقرير وأُرشف المشروع') : 'رُفض التقرير وأُعيد للطلاب')
      } catch (err) {
        this.$toast?.error(err.normalized?.message || 'تعذّرت المراجعة')
      } finally {
        this.reviewing = false
      }
    },

    formatDate,

    /** حالة موافقة المشرف في الجدول */
    supState(p) {
      const r = p.report
      if (!r) return { cls: '', icon: Minus, text: 'لا تقرير' }
      if (r.review_status === 'rejected' && rejectedBy(r) === 'المشرف') return { cls: 'is-bad', icon: X, text: 'رفض' }
      if (r.supervisor_reviewed_at) return { cls: 'is-ok', icon: Check, text: `وافق ${formatDate(r.supervisor_reviewed_at)}` }
      return { cls: 'is-wait', icon: Hourglass, text: 'بانتظاره' }
    },

    /** حالة لجنة الإشراف (حين لا يظهر زر الموافقة) */
    comState(p) {
      const r = p.report
      if (r?.review_status === 'approved') return { cls: 'is-ok', icon: Check, text: `وافقت ${formatDate(r.committee_reviewed_at)}` }
      if (r?.review_status === 'rejected' && rejectedBy(r) === 'لجنة الإشراف') return { cls: 'is-bad', icon: X, text: 'رفضت' }
      return { cls: '', icon: Minus, text: 'بعد موافقة المشرف' }
    },

    /** أفضل مشروع تخرج في الصفحة الرئيسية (PATCH /projects/{id} is_featured — لجنة الإشراف والإدارة العامة) */
    async toggleFeatured(p) {
      p.featured = !p.featured
      try {
        await api.patch(`/projects/${p.projectId}`, { is_featured: p.featured })
        this.$toast?.success(p.featured ? 'عُيّن كأفضل مشروع ويظهر في الصفحة الرئيسية' : 'أُزيل من الصفحة الرئيسية')
      } catch (err) {
        p.featured = !p.featured
        this.$toast?.error(err.normalized?.message || 'تعذّر تحديث التمييز')
      }
    }
  }
}
</script>
