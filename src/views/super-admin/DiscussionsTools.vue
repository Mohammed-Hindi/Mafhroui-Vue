<template>
  <!-- مواعيد المناقشات للإدارة العامة — بيانات تجريبية (placeholder) بلا ربط بالخادم:
       إعدادات (المدة، الساعات، الاستراحة، يوم الطالبات/الطلاب، قاعات كل منطقة) ← توليد تلقائي بالقيود
       ← تعديل كل الجدول مع كشف التعارضات ← طباعة حسب القاعات / Excel وإعادة رفعه ← نشر لكل مشرف جدوله -->
  <div class="dash">
    <header class="dash-head">
      <h2 class="dash-title">مواعيد المناقشات</h2>
    </header>

    <!-- الإعدادات -->
    <section class="dash-card">
      <div class="dash-card-head">
        <h3>إعدادات الجدولة</h3>
        <span class="dash-chip">{{ loading ? 'جارٍ التحميل…' : `${groups.length} مجموعة لها مشروع` }}</span>
      </div>
      <div class="dp-form">
        <label class="pfield"><span>مدة المناقشة (دقيقة)</span><input v-model.number="s.duration" type="number" min="10" step="5"></label>
        <label class="pfield"><span>بداية اليوم</span><input v-model="s.start" type="time"></label>
        <label class="pfield"><span>نهاية اليوم</span><input v-model="s.end" type="time"></label>
        <label class="pfield"><span>بداية الاستراحة</span><input v-model="s.breakAt" type="time"></label>
        <label class="pfield"><span>مدة الاستراحة (دقيقة)</span><input v-model.number="s.breakMin" type="number" min="0" step="5"></label>
        <label class="pfield"><span>يوم مناقشات الطالبات</span><input v-model="s.femaleDay" type="date"></label>
        <label class="pfield"><span>يوم مناقشات الطلاب</span><input v-model="s.maleDay" type="date"></label>
        <label v-for="(label, key) in REGIONS" :key="key" class="pfield dp-wide">
          <span>قاعات {{ label }} (افصل بفاصلة)</span><input v-model="s.rooms[key]" type="text">
        </label>
      </div>
      <p class="pt-muted dp-hint">القيود: الطالبات في يوم والطلاب في يوم آخر · المشرف لا يناقش مجموعته · لا يُكلَّف أي شخص بمناقشتين في نفس الوقت ولو بقاعتين مختلفتين · كل مجموعة في قاعات منطقتها.</p>
      <button type="button" class="pbtn is-cyan" @click="generate"><CalendarPlus :size="17" /> {{ plan.length ? 'إعادة توليد الجدول' : 'توليد الجدول' }}</button>
    </section>

    <!-- الجدول -->
    <section v-if="plan.length" class="dash-card">
      <div class="dash-card-head">
        <h3>جدول المناقشات</h3>
        <span :class="['dash-chip', conflictCount && 'is-bad']">{{ conflictCount ? `${conflictCount} تعارض` : 'بلا تعارضات' }}</span>
      </div>

      <div class="dp-toolbar">
        <div class="hm-tabs">
          <button v-for="t in dayTabs" :key="t.value" type="button" :class="day === t.value && 'is-active'" @click="day = t.value">{{ t.label }}</button>
        </div>
        <select v-model="roomFilter" class="gr-select" aria-label="القاعة">
          <option value="">كل القاعات</option>
          <option v-for="r in allRooms" :key="r" :value="r">{{ r }}</option>
        </select>
        <div class="gr-tools">
          <button type="button" class="gr-tool" :disabled="busy" @click="printPlan"><Printer :size="16" /> طباعة جدول المناقشات</button>
          <button type="button" class="gr-tool" :disabled="busy" @click="printRooms"><Printer :size="16" /> طباعة حسب القاعات</button>
          <button type="button" class="gr-tool" :disabled="busy" @click="downloadExcel"><FileSpreadsheet :size="16" /> تنزيل Excel</button>
          <label class="gr-tool"><Upload :size="16" /> إعادة رفع Excel<input type="file" accept=".xlsx" hidden @change="reupload"></label>
          <button type="button" class="gr-tool" :disabled="saving" @click="saveDraft"><Save :size="16" /> {{ saving ? 'جارٍ الحفظ…' : 'حفظ الجدول' }}</button>
          <button type="button" class="gr-tool is-primary" :disabled="!!conflictCount || saving" :title="conflictCount ? 'عالج التعارضات أولًا' : ''" @click="publish"><Send :size="16" /> نشر للمشرفين</button>
        </div>
      </div>

      <div v-if="conflictCount" class="palert is-warning dp-alert">
        <b>تعارضات يجب معالجتها قبل النشر:</b>
        <ul><li v-for="(c, i) in conflictList" :key="i">شعبة {{ c.section }}: {{ c.msg }}</li></ul>
      </div>

      <div class="pt-wrap">
        <table class="pt dp-table">
          <thead>
            <tr><th>الشعبة</th><th>المجموعة</th><th>المكان</th><th>المشرف</th><th>التاريخ</th><th>الوقت</th><th>القاعة</th><th>المناقش الأول</th><th>المناقش الثاني</th><th>ملاحظات</th></tr>
          </thead>
          <tbody>
            <tr v-for="r in visiblePlan" :key="r.id" :class="conflicts[r.id] && 'is-conflict'" :title="(conflicts[r.id] || []).join(' · ')">
              <td class="pt-strong">{{ r.g.section }}</td>
              <td><span class="d-block">{{ DEGREES[r.g.degree] }} · {{ r.gender === 'female' ? 'طالبات' : 'طلاب' }}</span><span class="pt-muted">{{ r.g.members.length }} طلاب</span></td>
              <td>{{ REGIONS[r.region] }}</td>
              <td>{{ supName(r.g.supId) }}</td>
              <td><input v-model="r.date" type="date" class="ev-input"></td>
              <td><input v-model="r.time" type="time" class="ev-input"></td>
              <td>
                <select v-model="r.room" class="ev-input">
                  <option v-for="room in roomsOf(r.region)" :key="room" :value="room">{{ room }}</option>
                </select>
              </td>
              <td v-for="k in [0, 1]" :key="k">
                <select v-model="r.examiners[k]" class="ev-input">
                  <option :value="null">—</option>
                  <option v-for="sp in supList" :key="sp.id" :value="sp.id" :disabled="sp.id === r.g.supId">{{ sp.name }}</option>
                </select>
              </td>
              <td><input v-model.trim="r.note" type="text" class="ev-input" placeholder="مثال: Online"></td>
            </tr>
          </tbody>
        </table>
      </div>
      <p class="pt-muted dp-hint">الصفوف الحمراء فيها تعارض — مرّر المؤشر فوقها لمعرفة السبب. التعديلات تُفحص فورًا.</p>
    </section>

    <!-- جدول كل مشرف بعد النشر -->
    <section class="dash-card">
      <div class="dash-card-head">
        <h3>جدول مناقشات المشرف</h3>
        <span class="dash-chip">{{ published ? `آخر نشر: ${published.at}` : 'لم يُنشر بعد' }}</span>
      </div>
      <template v-if="published">
        <select v-model="supView" class="gr-select dp-sup" aria-label="المشرف">
          <option v-for="sp in supList" :key="sp.id" :value="sp.id">{{ sp.name }}</option>
        </select>
        <div class="pt-wrap">
          <table class="pt">
            <thead><tr><th>التاريخ</th><th>الوقت</th><th>القاعة</th><th>الشعبة</th><th>الدور</th><th>المشرف / المناقشون</th></tr></thead>
            <tbody>
              <tr v-for="r in supSchedule" :key="r.id">
                <td><span class="mono">{{ r.date }}</span></td>
                <td><span class="mono">{{ r.time }}</span></td>
                <td>{{ r.room }}</td>
                <td class="pt-strong">{{ r.section }}</td>
                <td><span :class="['rv-pill', r.role === 'مشرف' ? 'is-approved' : 'is-pending']">{{ r.role }}</span></td>
                <td class="pt-muted">{{ r.people }}</td>
              </tr>
              <tr v-if="!supSchedule.length"><td colspan="6" class="gr-empty">لا توجد مناقشات لهذا المشرف</td></tr>
            </tbody>
          </table>
        </div>
      </template>
      <p v-else class="pt-muted">بعد توليد الجدول ومعالجة التعارضات اضغط "نشر للمشرفين" ليظهر لكل مشرف جدول مناقشاته ومواعيده.</p>
    </section>
  </div>
</template>

<script>
import { CalendarPlus, Printer, FileSpreadsheet, Upload, Send, Save } from 'lucide-vue-next'
import { exportStyledExcel } from '@/utils/exportReport'
import { exportPlanPdf, exportRoomsPdf } from '@/utils/ucasReports'
import { DEGREES, REGIONS } from '@/utils/progressData'
import api from '@/services/api'
import { loadGroups, loadSupervisors, loadDiscussions, groupGender, groupRegion } from '@/services/adminData'

const toMin = (hhmm) => {
  const [h, m] = String(hhmm || '0:0').split(':').map(Number)
  return h * 60 + m
}
const pad = (n) => String(n).padStart(2, '0')
const fromMin = (m) => `${pad(Math.floor(m / 60))}:${pad(m % 60)}`
const h12 = (m) => `${pad(Math.floor(m / 60) % 12 || 12)}:${pad(m % 60)}`
const CITY = { gaza: 'غزة', south: 'خانيونس' }

export default {
  name: 'DiscussionsTools',

  components: { CalendarPlus, Printer, FileSpreadsheet, Upload, Send, Save },

  data() {
    return {
      DEGREES, REGIONS,
      loading: true,
      saving: false,
      groups: [],
      supList: [],
      s: {
        duration: 30, start: '09:00', end: '14:00', breakAt: '12:30', breakMin: 30,
        femaleDay: '2027-01-24', maleDay: '2027-01-25',
        rooms: { gaza: 'E504, E506, E304', south: 'S101, S102' }
      },
      plan: [],
      day: '',
      roomFilter: '',
      busy: false,
      published: null,
      supView: null
    }
  },

  async created() {
    try {
      // المناقشة تُسجَّل على مشروع، فالمجموعات بلا مشروع لا تدخل الجدول
      this.groups = (await loadGroups()).filter((g) => g.projectId)
    } catch {
      this.$toast?.error('تعذّر تحميل المجموعات')
    }
    this.supList = await loadSupervisors(this.groups)
    this.supView = this.supList[0]?.id ?? null
    try {
      this.fromDiscussions(await loadDiscussions())
    } catch {
      // لا مواعيد محفوظة بعد
    }
    this.loading = false
  },

  computed: {
    dayTabs() {
      return [
        { value: '', label: 'كل الأيام' },
        { value: this.s.femaleDay, label: `الطالبات ${this.s.femaleDay}` },
        { value: this.s.maleDay, label: `الطلاب ${this.s.maleDay}` }
      ]
    },

    allRooms() {
      return [...new Set(this.plan.map((r) => r.room).filter(Boolean))]
    },

    visiblePlan() {
      return this.plan.filter((r) => (!this.day || r.date === this.day) && (!this.roomFilter || r.room === this.roomFilter))
    },

    /** التعارضات لكل صف: { rowId: [رسائل] } */
    conflicts() {
      const out = {}
      const add = (r, msg) => (out[r.id] = [...(out[r.id] || []), msg])
      const people = new Map()
      const rooms = new Map()
      this.plan.forEach((r) => {
        if (!r.date || !r.time || !r.room) return add(r, 'لم يُحدَّد له موعد أو قاعة')
        const [a, b] = r.examiners
        if (!a || !b) add(r, 'يلزم مناقشان')
        if (a && a === b) add(r, 'المناقشان نفس الشخص')
        if (r.examiners.includes(r.g.supId)) add(r, 'المشرف لا يناقش مجموعته')
        const expected = r.gender === 'female' ? this.s.femaleDay : this.s.maleDay
        if (r.date !== expected) add(r, `موعد ${r.gender === 'female' ? 'الطالبات' : 'الطلاب'} يجب أن يكون يوم ${expected}`)
        // كل شخص (مشرف المجموعة + المناقشون) في مكان واحد بنفس الفترة
        const start = toMin(r.time)
        ;[r.g.supId, a, b].filter(Boolean).forEach((pid) => {
          const list = people.get(pid) || []
          list.forEach((o) => {
            if (o !== r && o.date === r.date && start < toMin(o.time) + this.s.duration && toMin(o.time) < start + this.s.duration) {
              const msg = `${this.supName(pid)} مرتبط بمناقشة أخرى بنفس الوقت (شعبة ${o.g.section})`
              add(r, msg)
              add(o, `${this.supName(pid)} مرتبط بمناقشة أخرى بنفس الوقت (شعبة ${r.g.section})`)
            }
          })
          people.set(pid, [...list, r])
        })
        const key = `${r.date}|${r.time}|${r.room}`
        if (rooms.has(key)) {
          add(r, `القاعة ${r.room} محجوزة لشعبة ${rooms.get(key).g.section}`)
          add(rooms.get(key), `القاعة ${r.room} محجوزة لشعبة ${r.g.section}`)
        } else rooms.set(key, r)
      })
      Object.keys(out).forEach((k) => (out[k] = [...new Set(out[k])]))
      return out
    },

    conflictCount() {
      return Object.keys(this.conflicts).length
    },

    conflictList() {
      return this.plan.flatMap((r) => (this.conflicts[r.id] || []).map((msg) => ({ section: r.g.section, msg })))
    },

    supSchedule() {
      if (!this.published) return []
      const id = this.supView
      return this.published.rows
        .filter((r) => r.supId === id || r.examiners.includes(id))
        .map((r) => ({
          ...r,
          role: r.supId === id ? 'مشرف' : 'مناقش',
          people: r.supId === id ? `المناقشون: ${r.examiners.map(this.supName).join('، ')}` : `المشرف: ${this.supName(r.supId)}`
        }))
        .sort((a, b) => `${a.date}${a.time}`.localeCompare(`${b.date}${b.time}`))
    }
  },

  methods: {
    supName(id) {
      return this.supList.find((x) => x.id === id)?.name || '—'
    },

    roomsOf(region) {
      return String(this.s.rooms[region] || '').split(/[،,]/).map((r) => r.trim()).filter(Boolean)
    },

    /** الفترات المتاحة في اليوم مع تخطّي الاستراحة */
    slots() {
      const dur = Math.max(10, Number(this.s.duration) || 30)
      const end = toMin(this.s.end)
      const bFrom = toMin(this.s.breakAt)
      const bTo = bFrom + (Number(this.s.breakMin) || 0)
      const out = []
      let t = toMin(this.s.start)
      while (t + dur <= end) {
        if (bTo > bFrom && t < bTo && t + dur > bFrom) {
          t = bTo
          continue
        }
        out.push(t)
        t += dur
      }
      return out
    },

    /**
     * توليد جشِع: لكل مجموعة أول فترة + قاعة (من قاعات منطقتها) يكون فيها مشرفها متاحًا ومناقشان متاحان ليسا مشرفيها،
     * مع تفضيل الأقل تحميلًا — ponytail: جشِع بلا تراجع؛ يكفي لعشرات المجموعات، ويُستبدل بحلّال قيود إن كبر العدد
     */
    generate() {
      const slots = this.slots()
      const busy = new Set() // `${date}|${t}|${personId}` و `${date}|${t}|room:${room}`
      const load = Object.fromEntries(this.supList.map((x) => [x.id, 0]))
      const sorted = [...this.groups].sort((a, b) => a.degree.localeCompare(b.degree) || a.section.localeCompare(b.section, 'en', { numeric: true }))
      this.plan = sorted.map((g) => {
        const gender = groupGender(g)
        const region = groupRegion(g)
        const date = gender === 'female' ? this.s.femaleDay : this.s.maleDay
        // إعادة التوليد تحتفظ بمعرّف الموعد المحفوظ لتحديثه بدل إنشاء موعد مكرر
        const discussionId = this.plan.find((p) => p.id === g.id)?.discussionId ?? null
        const row = { id: g.id, g, gender, region, date, time: '', room: '', examiners: [null, null], note: '', discussionId }
        for (const t of slots) {
          if (busy.has(`${date}|${t}|${g.supId}`)) continue
          const free = this.supList.filter((x) => x.id !== g.supId && !busy.has(`${date}|${t}|${x.id}`)).sort((a, b) => load[a.id] - load[b.id])
          const room = this.roomsOf(region).find((r) => !busy.has(`${date}|${t}|room:${r}`))
          if (free.length < 2 || !room) continue
          const ex = free.slice(0, 2).map((x) => x.id)
          ;[g.supId, ...ex].forEach((pid) => busy.add(`${date}|${t}|${pid}`))
          busy.add(`${date}|${t}|room:${room}`)
          ex.forEach((id) => (load[id] += 1))
          Object.assign(row, { time: fromMin(t), room, examiners: ex })
          break
        }
        return row
      })
      this.published = null
      const missing = this.plan.filter((r) => !r.time).length
      missing ? this.$toast?.error(`تعذّر جدولة ${missing} مجموعة — زد القاعات أو الساعات`) : this.$toast?.success(`جُدولت ${this.plan.length} مناقشة بلا تعارضات`)
    },

    pdfRows() {
      return this.plan.filter((r) => r.time).map((r) => ({
        section: r.g.section,
        sup: this.supName(r.g.supId),
        members: r.g.members,
        date: r.date,
        time: `${h12(toMin(r.time))} – ${h12(toMin(r.time) + this.s.duration)}`,
        room: r.room,
        city: CITY[r.region],
        examiners: r.examiners.filter(Boolean).map(this.supName),
        note: r.note,
        degree: r.g.degree,
        spec: r.g.spec
      }))
    },

    async printPlan() {
      this.busy = true
      try {
        await exportPlanPdf(this.pdfRows())
      } finally {
        this.busy = false
      }
    },

    async printRooms() {
      this.busy = true
      try {
        await exportRoomsPdf(this.pdfRows())
      } finally {
        this.busy = false
      }
    },

    async downloadExcel() {
      this.busy = true
      try {
        await exportStyledExcel({
          fileName: 'جدول-المناقشات.xlsx',
          sheetTitle: 'جدول المناقشات',
          columns: [
            { key: 'section', label: 'الشعبة', width: 12 },
            { key: 'sup', label: 'المشرف', width: 24 },
            { key: 'date', label: 'التاريخ', width: 14 },
            { key: 'time', label: 'الوقت', width: 10 },
            { key: 'room', label: 'القاعة', width: 10 },
            { key: 'ex1', label: 'المناقش الأول', width: 24 },
            { key: 'ex2', label: 'المناقش الثاني', width: 24 },
            { key: 'note', label: 'ملاحظات', width: 24 }
          ],
          rowGroups: this.plan.map((r) => [{
            section: r.g.section, sup: this.supName(r.g.supId), date: r.date, time: r.time, room: r.room,
            ex1: this.supName(r.examiners[0]), ex2: this.supName(r.examiners[1]), note: r.note
          }])
        })
      } finally {
        this.busy = false
      }
    },

    /** إعادة رفع ملف Excel بعد تعديله: يُطابَق كل صف برقم الشعبة وتُحدَّث الحقول ثم يُعاد فحص التعارضات */
    async reupload(ev) {
      const file = ev.target.files[0]
      ev.target.value = ''
      if (!file) return
      try {
        const { default: ExcelJS } = await import('exceljs')
        const wb = new ExcelJS.Workbook()
        await wb.xlsx.load(await file.arrayBuffer())
        const ws = wb.worksheets[0]
        const col = {}
        ws.getRow(1).eachCell((c, i) => (col[String(c.value).trim()] = i))
        const text = (row, label) => {
          const v = row.getCell(col[label]).value
          if (v instanceof Date) return v.toISOString().slice(0, 10)
          return String(v?.text ?? v ?? '').trim()
        }
        const byName = (n) => this.supList.find((x) => x.name === n)?.id ?? null
        let updated = 0
        ws.eachRow((row, i) => {
          if (i === 1) return
          const r = this.plan.find((p) => p.g.section === text(row, 'الشعبة'))
          if (!r) return
          Object.assign(r, {
            date: text(row, 'التاريخ') || r.date,
            time: text(row, 'الوقت').slice(0, 5) || r.time,
            room: text(row, 'القاعة') || r.room,
            examiners: [byName(text(row, 'المناقش الأول')), byName(text(row, 'المناقش الثاني'))],
            note: text(row, 'ملاحظات')
          })
          updated += 1
        })
        this.published = null
        this.$toast?.success(`حُدّث ${updated} موعدًا من الملف${this.conflictCount ? ` — ${this.conflictCount} تعارض يحتاج معالجة` : ''}`)
      } catch {
        this.$toast?.error('تعذّر قراءة الملف — استخدم ملف "تنزيل Excel" نفسه بعد تعديله')
      }
    },

    /** يحفظ صفوف الجدول في الخادم: PUT للموجود و POST للجديد (لجنة المناقشة = أسماء المناقشَين) */
    async save(status) {
      this.saving = true
      let ok = 0
      const rows = this.plan.filter((r) => r.time && r.room)
      for (const r of rows) {
        const body = {
          place: r.room,
          discussion_date: r.date,
          discussion_time: r.time,
          committee: [...r.examiners.filter(Boolean).map(this.supName), r.note].filter(Boolean).join('، ') || '—',
          status
        }
        try {
          if (r.discussionId) {
            await api.put(`/discussions/${r.discussionId}`, body)
          } else {
            const { data } = await api.post('/discussions', { ...body, project_id: r.g.projectId, supervisor_id: r.g.supId })
            r.discussionId = data.id
          }
          r.status = status
          ok += 1
        } catch {
          // يُحسب ضمن غير المحفوظ
        }
      }
      this.saving = false
      return { ok, total: rows.length }
    },

    async saveDraft() {
      const { ok, total } = await this.save('pending')
      this.$toast?.[ok === total ? 'success' : 'error'](`حُفظ ${ok} من ${total} موعدًا (بانتظار النشر)`)
    },

    /** النشر = حفظ كل المواعيد كمؤكَّدة، فيصل لكل مشرف وطلابه موعدهم من الخادم */
    async publish() {
      if (this.conflictCount) return
      const { ok, total } = await this.save('confirmed')
      this.snapshot()
      this.$toast?.[ok === total ? 'success' : 'error'](`نُشر ${ok} من ${total} موعدًا — يظهر لكل مشرف جدول مناقشاته`)
    },

    snapshot() {
      this.published = {
        at: new Date().toLocaleString('ar-EG', { dateStyle: 'medium', timeStyle: 'short' }),
        rows: this.plan.map((r) => ({ id: r.id, section: r.g.section, supId: r.g.supId, date: r.date, time: r.time, room: r.room, examiners: [...r.examiners] }))
      }
    },

    /** يبني الجدول من مواعيد المناقشات المحفوظة في الخادم */
    fromDiscussions(list) {
      const byProject = Object.fromEntries(list.map((d) => [d.project_id, d]))
      const byName = (n) => this.supList.find((x) => x.name === n)?.id ?? null
      const rows = this.groups.filter((g) => byProject[g.projectId]).map((g) => {
        const d = byProject[g.projectId]
        const names = String(d.committee || '').split(/[،,]/).map((s) => s.trim()).filter(Boolean)
        const ids = names.map(byName)
        return {
          id: g.id, g, gender: groupGender(g), region: groupRegion(g),
          date: String(d.discussion_date || '').slice(0, 10),
          time: String(d.discussion_time || '').slice(0, 5),
          room: d.place,
          examiners: [ids.find(Boolean) ?? null, ids.filter(Boolean)[1] ?? null],
          note: names.filter((n, i) => !ids[i]).join('، '),
          discussionId: d.id,
          status: d.status
        }
      })
      if (!rows.length) return
      this.plan = rows
      if (rows.every((r) => r.status === 'confirmed')) this.snapshot()
    }
  }
}
</script>
