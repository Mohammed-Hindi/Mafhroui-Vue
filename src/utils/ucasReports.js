// نماذج الكلية الرسمية بصيغة PDF — مطابقة لملفات "نمط التصميم": مجموعات الدبلوم/البكالوريوس (كشف شعبة) وجدول المناقشات
import { escapeHtml as e, exportPagesPdf } from '@/utils/exportReport'
import HEADER from '@/assets/images/ucas-header.png'
import { REGIONS } from '@/utils/progressData'
import { COURSES, activeSemesterName } from '@/services/adminData'

const DEGREE_LABEL = { diploma: 'دبلوم', bachelor: 'بكالوريوس' }


// هوية مسار المطبوعة: ألوان منطفئة مشتقّة من تدرّج الكلية (أخضر←أزرق) بحواف حادة — بديلة عن الأسود/الأحمر الرسمي
const BRAND = { ink: '#15314A', deep: '#0E5A86', line: '#A3B6C7', head: '#E9EFF4', headInk: '#123E5E', meta: '#EEF3F7', zebra: '#F4F7FA', brk: '#E4EDF3', online: '#B23A48' }
// فاصل الهوية: شريط حادّ بتدرّج الكلية بدل الخط الأسود؛ m = الهامش (مع نزف للحواف)
const RULE = (m) => `<div style="height:3px; margin:${m}; background:linear-gradient(90deg,#4C8F3F,#0E699C 55%,#064F86);"></div>`

const FONT = `font-family:Arial,'Cairo',sans-serif; color:${BRAND.ink}; direction:rtl; background:#fff; box-sizing:border-box;`
const CELL = `border:1px solid ${BRAND.line}; padding:6px 8px; font-size:13px;`
const today = () => new Date().toLocaleDateString('en-GB')
const phone = (w) => String(w || '').replace(/^970/, '')

// ترويسة الكلية الرسمية (الشعار + الاسم بالعربي والإنجليزي + رائدة الإبداع) مستخرجة كما هي من نماذج الكلية
const collegeHeader = (h = 76) => `<img src="${HEADER}" style="height:${h}px; display:block;">`

// خط الكشف: Cairo (محمّل في التطبيق) مع بديل، وألوان صريحة بـ !important حتى لا تتسرّب أنماط البوابة (رأس الجدول الأبيض) إلى الطباعة
const RFONT = `font-family:'Cairo',Arial,sans-serif; color:${BRAND.ink}; direction:rtl; background:#fff; box-sizing:border-box; line-height:1.35;`
const RTH = `border:1px solid ${BRAND.line} !important; padding:6px 6px 10px; font-size:13.5px; font-weight:700; background:${BRAND.head} !important; color:${BRAND.headInk} !important; text-align:center;`
const RTD = `border:1px solid ${BRAND.line}; padding:5px 8px 9px; font-size:14px; color:${BRAND.ink}; line-height:1.35;`
const META_L = `border:1px solid ${BRAND.line}; padding:5px 10px 9px; font-size:13.5px; font-weight:700; background:${BRAND.meta} !important; color:${BRAND.ink} !important; width:118px; white-space:nowrap;`
const META_V = `border:1px solid ${BRAND.line}; padding:5px 10px 9px; font-size:14.5px; font-weight:700; color:${BRAND.ink};`

/** كشف بأسماء الطلبة في شعبة — صفحة لكل مجموعة (نموذج "مجموعات الدبلوم/البكالوريوس"); filterLabel = الفلترة المطبّقة */
function rosterPage(g, n, total, filterLabel = '') {
  const course = COURSES[g.degree] || COURSES.diploma
  const blanks = (tag, style) => `<${tag} style="${style} width:22px; padding:0;"></${tag}>`.repeat(8)
  return `
  <div style="${RFONT} width:794px; height:1123px; position:relative; padding:34px 44px;">
    ${collegeHeader(72)}
    <div style="display:flex; justify-content:space-between; align-items:flex-end; margin-top:10px;">
      <b style="font-size:16px;">قسم القبول والتسجيل</b>
      <span style="font-size:13px; color:#444;">التاريخ: <span dir="ltr">${today()}</span></span>
    </div>
    ${RULE('7px -44px 0')}

    <div style="text-align:center; margin:18px 0 14px;">
      <div style="font-size:19px; font-weight:800;">كشف بأسماء طلبة ${DEGREE_LABEL[g.degree] || ''} في شعبة</div>
      <div style="font-size:15px; font-weight:700; margin-top:4px;">${e(activeSemesterName())}</div>
      ${filterLabel ? `<div style="display:inline-block; margin-top:8px; padding:2px 14px 6px; border:1px solid #999; font-size:12.5px; line-height:1.6; color:#333;">${e(filterLabel)}</div>` : ''}
    </div>

    <table style="width:100%; border-collapse:collapse; margin-bottom:14px;">
      <tr><td style="${META_L}">رقم المساق</td><td style="${META_V}" dir="ltr">${e(course.code)}</td><td style="${META_L}">اسم المساق</td><td style="${META_V}">${e(course.name)}</td></tr>
      <tr><td style="${META_L}">الشعبة</td><td style="${META_V}">${e(g.section)}</td><td style="${META_L}">المدرس</td><td style="${META_V}">${e(g.supName)}</td></tr>
      <tr><td style="${META_L}">التخصص</td><td style="${META_V}">${e(g.spec || '')}</td><td style="${META_L}">عدد الطلبة</td><td style="${META_V}">${g.members.length}</td></tr>
    </table>

    <table style="width:100%; border-collapse:collapse;">
      <thead><tr>
        <th style="${RTH} width:34px;">م</th><th style="${RTH} width:108px;">رقم الطالب</th><th style="${RTH}">اسم الطالب</th>
        <th style="${RTH} width:112px;">الجوال</th><th style="${RTH} width:92px;">المحافظة</th>${blanks('th', RTH)}
      </tr></thead>
      <tbody>
        ${g.members.map((m, i) => `<tr style="${i % 2 ? 'background:#F5F5F5;' : ''}">
          <td style="${RTD} text-align:center;">${i + 1}</td>
          <td style="${RTD} text-align:center;" dir="ltr">${e(m.uni)}</td>
          <td style="${RTD} font-weight:600;">${e(m.name)}</td>
          <td style="${RTD} text-align:center;" dir="ltr">${e(phone(m.whatsapp))}</td>
          <td style="${RTD} text-align:center;">${e(REGIONS[m.region] || '—')}</td>${blanks('td', RTD)}
        </tr>`).join('')}
      </tbody>
    </table>

    <div style="position:absolute; bottom:56px; right:44px; left:44px; display:flex; justify-content:space-between; align-items:center; font-size:13px; font-weight:700; border-top:1px solid #000; padding-top:10px; line-height:1.6;">
      <span>توقيع المدرس: ..............................</span>
      <span style="display:flex; align-items:center; gap:8px;"><span>صفحة</span><span style="background:#000; color:#fff !important; padding:2px 12px 6px; line-height:1.5;" dir="ltr">${n} / ${total}</span></span>
    </div>
  </div>`
}

/**
 * جدول مناقشات بنمط الكلية — صفحة أفقية لكل 6 صفوف (نموذج "جدول مناقشات البكالوريوس/الدبلوم")
 * rows: { n, section, sup, members: [{ name, online }], time, examiners: [], note } أو { isBreak: true }
 */
function tablePages(titleHtml, rows) {
  const head = `<thead><tr>
    <th style="${RTH} width:90px;">الرقم</th><th style="${RTH} width:60px;">الشعبة</th><th style="${RTH} width:130px;">اسم المشرف</th>
    <th style="${RTH}">الطلاب</th><th style="${RTH} width:130px;">وقت المناقشة</th><th style="${RTH} width:130px;">المناقشين</th><th style="${RTH} width:200px;">ملاحظات</th>
  </tr></thead>`
  const row = (r, i) => r.isBreak
    ? `<tr><td colspan="7" style="${CELL} background:#DCE6F2; text-align:center; font-weight:700;">Break (30 min)</td></tr>`
    : `<tr style="height:76px; ${i % 2 ? '' : 'background:#F2F2F2;'}">
        <td style="${CELL}">${r.n}</td>
        <td style="${CELL} text-align:center;">${e(r.section)}</td>
        <td style="${CELL} text-align:center;">${e(r.sup)}</td>
        <td style="${CELL} text-align:center; line-height:1.5;">${r.members.map((m) => `${e(m.name)}${m.online ? ' <b style="color:#E00000;">(Online)</b>' : ''}`).join('<br>')}</td>
        <td style="${CELL} text-align:center;" dir="ltr">${e(r.time)}</td>
        <td style="${CELL} text-align:center; line-height:1.5;">${r.examiners.map(e).join('<br>')}</td>
        <td style="${CELL}">${e(r.note)}</td>
      </tr>`
  const pages = []
  const total = Math.ceil(rows.length / 6)
  for (let i = 0; i < rows.length; i += 6) {
    // ترويسة الكلية بالشعار في كل صفحة + العنوان في أول صفحة + رأس الجدول يتكرر
    pages.push(`
      <div style="${FONT} width:1123px; height:794px; padding:26px 60px 30px;">
        <div style="display:flex; justify-content:space-between; align-items:center;">
          ${collegeHeader(58)}
          <div style="text-align:left; font-size:13px; color:#555; line-height:1.7;">
            <b style="color:#000; font-size:15px;">لجنة مشاريع التخرج</b><br>
            التاريخ: <span dir="ltr">${today()}</span> · صفحة <span dir="ltr">${i / 6 + 1} / ${total}</span>
          </div>
        </div>
        ${RULE('8px -60px 16px')}
        ${i ? '' : `<div style="text-align:center; font-weight:700; font-size:18px; margin:0 0 16px;">${titleHtml}</div>`}
        <table style="width:100%; border-collapse:collapse;">${head}<tbody>${rows.slice(i, i + 6).map(row).join('')}</tbody></table>
      </div>`)
  }
  return pages
}

const dayLabel = (iso) => {
  const [, mo, d] = iso.split('-').map(Number)
  return `<span style="color:#E00000;">يوم <span dir="ltr">${d}/${mo}</span></span>`
}

const byDegree = (groups) => ['diploma', 'bachelor'].map((d) => [d, groups.filter((g) => g.degree === d)]).filter(([, list]) => list.length)

/** كشف الشعب حسب الفلترة الحالية: المجموعات المفلترة فقط (بكالوريوس وحده، دبلوم وحده، أو كلاهما مرتّبين) */
export function exportRosterPdf(groups, filterLabel = '') {
  const pages = []
  byDegree(groups).forEach(([, list]) => list.forEach((g) => pages.push(g)))
  const degrees = byDegree(groups).map(([d]) => DEGREE_LABEL[d]).join(' و')
  return exportPagesPdf({
    fileName: `كشف شعب ${degrees}${filterLabel ? ' - ' + filterLabel : ''}.pdf`.replace(/[/:*?"<>|]/g, '-'),
    pages: pages.map((g, i) => rosterPage(g, i + 1, pages.length, filterLabel))
  })
}

/**
 * جدول المناقشات العام من مخطِّط المناقشات — صفحات لكل (يوم × درجة) كنموذج "جدول مناقشات البكالوريوس/الدبلوم"
 * plan: [{ section, sup, members, date, time, room, city, examiners, note, degree, spec }]
 */
export function exportPlanPdf(plan) {
  const blocks = new Map()
  ;[...plan].sort((a, b) => `${a.date}${a.degree}${a.start || a.time}${a.room}`.localeCompare(`${b.date}${b.degree}${b.start || b.time}${b.room}`)).forEach((p) => {
    const key = `${p.date}|${p.degree}`
    if (!blocks.has(key)) blocks.set(key, [])
    blocks.get(key).push(p)
  })
  return exportPagesPdf({
    fileName: 'جدول المناقشات.pdf',
    landscape: true,
    pages: [...blocks.values()].flatMap((list) => {
      const p0 = list[0]
      const specs = [...new Set(list.map((p) => p.spec))]
      const cities = [...new Set(list.map((p) => p.city))].join(' و')
      const title = `جدول مناقشات مشاريع التخرج – ${DEGREE_LABEL[p0.degree]}${specs.length === 1 ? ' ' + e(specs[0]) : ''} (${e(activeSemesterName())}) ${dayLabel(p0.date)} ${e(cities)}`
      return tablePages(title, list.map((p, i) => ({ ...p, n: String(i + 1).padStart(2, '0'), note: [p.room, p.note].filter(Boolean).join(' · ') })))
    })
  })
}

/**
 * جدول المناقشات حسب القاعات — من مخطِّط المناقشات (صفحة لكل قاعة في كل يوم)
 * plan: [{ section, sup, members, date, time, room, city, examiners, note }]
 */
export function exportRoomsPdf(plan) {
  const blocks = new Map()
  ;[...plan].sort((a, b) => `${a.date}${a.room}${a.start || a.time}`.localeCompare(`${b.date}${b.room}${b.start || b.time}`)).forEach((p) => {
    const key = `${p.date}|${p.room}`
    if (!blocks.has(key)) blocks.set(key, [])
    blocks.get(key).push(p)
  })
  return exportPagesPdf({
    fileName: 'جدول المناقشات حسب القاعات.pdf',
    landscape: true,
    pages: [...blocks.values()].flatMap((list) => {
      const p0 = list[0]
      const title = `جدول مناقشات مشاريع التخرج – قاعة <span dir="ltr">${e(p0.room)}</span> (${e(activeSemesterName())}) ${dayLabel(p0.date)} ${e(p0.city)}`
      return tablePages(title, list.map((p, i) => ({ ...p, n: String(i + 1).padStart(2, '0'), note: p.note || '' })))
    })
  })
}

/**
 * تقرير جدولي عام بنمط نماذج الكلية: ترويسة الشعار في كل صفحة، العنوان والفصل والفلترة، جدول برأس رمادي يتكرر، ورقم الصفحة.
 * head: [{ label, width? }] · rows: [[خلية HTML جاهزة (مُهرّبة)]] — perPage صف لكل صفحة
 */
export function exportTablePdf({ fileName, title, filterLabel = '', head, rows, perPage = 18, landscape = false }) {
  const W = landscape ? 1123 : 794
  const H = landscape ? 794 : 1123
  const total = Math.max(1, Math.ceil(rows.length / perPage))
  const pages = []
  for (let n = 0; n < total; n++) {
    const chunk = rows.slice(n * perPage, (n + 1) * perPage)
    pages.push(`
    <div style="${RFONT} width:${W}px; height:${H}px; position:relative; padding:34px 40px;">
      ${collegeHeader(72)}
      <div style="display:flex; justify-content:space-between; align-items:flex-end; margin-top:10px;">
        <b style="font-size:16px;">لجنة مشاريع التخرج</b>
        <span style="font-size:13px; color:#444;">التاريخ: <span dir="ltr">${today()}</span></span>
      </div>
      ${RULE('7px -40px 0')}
      <div style="text-align:center; margin:16px 0 12px;">
        <div style="font-size:19px; font-weight:800;">${e(title)}</div>
        <div style="font-size:15px; font-weight:700; margin-top:4px;">${e(activeSemesterName())}</div>
        ${filterLabel ? `<div style="display:inline-block; margin-top:8px; padding:2px 14px 6px; border:1px solid #999; font-size:12.5px; line-height:1.6; color:#333;">${e(filterLabel)}</div>` : ''}
      </div>
      <table style="width:100%; border-collapse:collapse;">
        <thead><tr><th style="${RTH} width:30px;">م</th>${head.map((h) => `<th style="${RTH}${h.width ? ` width:${h.width}px;` : ''}">${e(h.label)}</th>`).join('')}</tr></thead>
        <tbody>${chunk.map((r, i) => `<tr style="${i % 2 ? 'background:#F5F5F5;' : ''}"><td style="${RTD} text-align:center;">${n * perPage + i + 1}</td>${r.map((c) => `<td style="${RTD} text-align:center;">${c}</td>`).join('')}</tr>`).join('')}</tbody>
      </table>
      <div style="position:absolute; bottom:56px; right:40px; left:40px; display:flex; justify-content:space-between; align-items:center; font-size:13px; font-weight:700; border-top:1px solid #000; padding-top:10px; line-height:1.6;">
        <span>توقيع رئيس اللجنة: ..............................</span>
        <span style="display:flex; align-items:center; gap:8px;"><span>صفحة</span><span style="background:#000; color:#fff !important; padding:2px 12px 6px; line-height:1.5;" dir="ltr">${n + 1} / ${total}</span></span>
      </div>
    </div>`)
  }
  return exportPagesPdf({ fileName: fileName.replace(/[/:*?"<>|]/g, '-'), landscape, pages })
}

/** تقرير المشرفين: كل مشرف مع أسماء مجموعاته ونوع المشروع والدرجة وطلاب/طالبات ومكان التواجد — صفحة لكل مشرف؛ filterLabel = الفلترة المطبّقة */
export function exportSupervisorsPdf(groups, supervisors = [], filterLabel = '') {
  // المشرفون من المجموعات نفسها؛ التخصص من قائمة المشرفين إن مُرّرت وإلا تخصص أول مجموعة
  const ids = [...new Set(groups.map((g) => g.supId))]
  const sups = ids.map((id) => {
    const list = groups.filter((g) => g.supId === id)
    const known = supervisors.find((s) => s.id === id)
    return { s: { name: list[0].supName, spec: known?.spec || list[0].spec }, list }
  })
  const uniq = (g, key, labels) => [...new Set(g.members.map((m) => m[key]).filter(Boolean))].map((v) => labels[v] || v)
  const gender = (g) => { const v = uniq(g, 'gender', { male: 'طلاب', female: 'طالبات' }); return v.length > 1 ? 'مختلط' : v[0] || '—' }
  const regions = (g) => uniq(g, 'region', REGIONS).join('، ') || '—'
  const types = (g) => (g.types?.length ? g.types : [g.type].filter(Boolean)).map(e).join('<br>') || '—'
  const pages = sups.map(({ s, list }, i) => `
    <div style="${RFONT} width:794px; height:1123px; position:relative; padding:34px 40px;">
      ${collegeHeader(72)}
      <div style="display:flex; justify-content:space-between; align-items:flex-end; margin-top:10px;">
        <b style="font-size:16px;">لجنة مشاريع التخرج</b>
        <span style="font-size:13px; color:#444;">التاريخ: <span dir="ltr">${today()}</span></span>
      </div>
      ${RULE('7px -40px 0')}
      <div style="text-align:center; margin:18px 0 14px;">
        <div style="font-size:19px; font-weight:800;">تقرير المشرف ومجموعاته</div>
        <div style="font-size:15px; font-weight:700; margin-top:4px;">${e(activeSemesterName())}</div>
        ${filterLabel ? `<div style="display:inline-block; margin-top:8px; padding:2px 14px 6px; border:1px solid #999; font-size:12.5px; line-height:1.6; color:#333;">${e(filterLabel)}</div>` : ''}
      </div>
      <table style="width:100%; border-collapse:collapse; margin-bottom:14px;">
        <tr><td style="${META_L}">المشرف</td><td style="${META_V}">${e(s.name)}</td><td style="${META_L}">التخصص</td><td style="${META_V}">${e(s.spec || '')}</td></tr>
        <tr><td style="${META_L}">عدد المجموعات</td><td style="${META_V}">${list.length}</td><td style="${META_L}">عدد الطلاب</td><td style="${META_V}">${list.reduce((n, g) => n + g.members.length, 0)}</td></tr>
      </table>
      <table style="width:100%; border-collapse:collapse;">
        <thead><tr>
          <th style="${RTH} width:28px;">م</th><th style="${RTH} width:60px;">رقم المجموعة</th><th style="${RTH}">المجموعة والمشروع</th><th style="${RTH} width:100px;">نوع المشروع</th>
          <th style="${RTH} width:70px;">الدرجة</th><th style="${RTH} width:58px;">الفئة</th><th style="${RTH} width:74px;">مكان التواجد</th><th style="${RTH} width:120px;">الطلاب</th>
        </tr></thead>
        <tbody>${list.map((g, n) => `<tr style="${n % 2 ? 'background:#F5F5F5;' : ''}">
          <td style="${RTD} text-align:center;">${n + 1}</td>
          <td style="${RTD} text-align:center; font-weight:700;">${e(g.section)}</td>
          <td style="${RTD}"><b>${e(g.teamName || '')}</b><br><span style="font-size:12px; color:#444;">${e(g.project)}</span></td>
          <td style="${RTD} text-align:center; font-size:12.5px;">${types(g)}</td>
          <td style="${RTD} text-align:center;">${DEGREE_LABEL[g.degree] || '—'}</td>
          <td style="${RTD} text-align:center;">${gender(g)}</td>
          <td style="${RTD} text-align:center; font-size:12.5px;">${e(regions(g))}</td>
          <td style="${RTD} font-size:12.5px;">${g.members.map((m) => e(m.name)).join('<br>')}</td>
        </tr>`).join('')}</tbody>
      </table>
      <div style="position:absolute; bottom:56px; right:40px; left:40px; display:flex; justify-content:space-between; align-items:center; font-size:13px; font-weight:700; border-top:1px solid #000; padding-top:10px; line-height:1.6;">
        <span>توقيع رئيس اللجنة: ..............................</span>
        <span style="display:flex; align-items:center; gap:8px;"><span>صفحة</span><span style="background:#000; color:#fff !important; padding:2px 12px 6px; line-height:1.5;" dir="ltr">${i + 1} / ${sups.length}</span></span>
      </div>
    </div>`)
  return exportPagesPdf({ fileName: `تقرير المشرفين ومجموعاتهم${filterLabel ? ' - ' + filterLabel : ''}.pdf`.replace(/[/:*?"<>|]/g, '-'), pages })
}

/** الترويسة كـ data URI حتى تُضمَّن داخل ملف Word نفسه */
async function headerDataUri() {
  const blob = await (await fetch(HEADER)).blob()
  return new Promise((resolve) => { const r = new FileReader(); r.onload = () => resolve(r.result); r.readAsDataURL(blob) })
}

/**
 * جدول المناقشات بصيغة Word (.doc بصيغة HTML يفتحها Word مباشرة، أفقي) — نسخة طبق الأصل من PDF (tablePages):
 * ترويسة الشعار + "لجنة مشاريع التخرج" والتاريخ ورقم الصفحة في كل صفحة، خط فاصل، العنوان أول كل كتلة، 6 صفوف لكل صفحة
 * بنفس الأعمدة والحدود والتظليل. صفحة لكل (يوم × درجة)، أو لكل (يوم × قاعة) مع byRoom؛ والقاعة في عمود الملاحظات كالنموذج.
 * ponytail: HTML-as-doc بلا مكتبة docx؛ يكفي للطباعة والتعديل في Word، ويُستبدل بمكتبة docx إن احتجنا أنماط Word أصلية
 */
export async function exportDiscussionsDoc(plan, { byRoom = false } = {}) {
  const blocks = new Map()
  const key = (p) => (byRoom ? `${p.date}|${p.room}` : `${p.date}|${p.degree}`)
  ;[...plan].sort((a, b) => `${key(a)}|${a.start || a.time}`.localeCompare(`${key(b)}|${b.start || b.time}`)).forEach((p) => {
    if (!blocks.has(key(p))) blocks.set(key(p), [])
    blocks.get(key(p)).push(p)
  })
  const logo = await headerDataUri()
  // نفس أنماط PDF (RTH/CELL) بوحدات Word
  const th = 'border:1px solid #000; background:#D9D9D9; padding:4pt 4pt 7pt; font-size:10.5pt; font-weight:bold; text-align:center; color:#000;'
  const td = 'border:1px solid #000; padding:4pt 6pt; font-size:10pt; vertical-align:middle;'
  const head = `<tr><th style="${th} width:62pt;">الرقم</th><th style="${th} width:42pt;">الشعبة</th><th style="${th} width:90pt;">اسم المشرف</th>
    <th style="${th}">الطلاب</th><th style="${th} width:90pt;">وقت المناقشة</th><th style="${th} width:90pt;">المناقشين</th><th style="${th} width:140pt;">ملاحظات</th></tr>`
  const row = (r, n, i) => r.isBreak
    ? `<tr><td colspan="7" style="${td} background:#DCE6F2; text-align:center; font-weight:bold;">Break (30 min)</td></tr>`
    : `<tr style="height:57pt;${i % 2 ? '' : ' background:#F2F2F2;'}">
      <td style="${td}">${String(n).padStart(2, '0')}</td>
      <td style="${td} text-align:center;">${e(r.section)}</td>
      <td style="${td} text-align:center;">${e(r.sup)}</td>
      <td style="${td} text-align:center; line-height:1.5;">${r.members.map((m) => `${e(m.name)}${m.online ? ' <b style="color:#E00000;">(Online)</b>' : ''}`).join('<br>')}</td>
      <td style="${td} text-align:center;" dir="ltr">${e(r.time)}</td>
      <td style="${td} text-align:center; line-height:1.5;">${r.examiners.map(e).join('<br>')}</td>
      <td style="${td}">${e([byRoom ? '' : r.room, r.note].filter(Boolean).join(' · '))}</td>
    </tr>`
  const pageHead = (n, total) => `<table style="width:100%; border-collapse:collapse;"><tr>
      <td style="vertical-align:middle;"><img src="${logo}" style="height:44pt;"></td>
      <td style="vertical-align:middle; text-align:left; font-size:10pt; color:#555; line-height:1.7;">
        <b style="color:#000; font-size:11.5pt;">لجنة مشاريع التخرج</b><br>التاريخ: <span dir="ltr">${today()}</span> · صفحة <span dir="ltr">${n} / ${total}</span>
      </td></tr></table>
    <div style="border-top:1.5pt solid #000; margin:6pt 0 12pt;"></div>`

  const pages = []
  ;[...blocks.values()].forEach((list) => {
    const p0 = list[0]
    const specs = [...new Set(list.map((p) => p.spec))]
    const cities = [...new Set(list.map((p) => p.city))].join(' و')
    const title = byRoom
      ? `جدول مناقشات مشاريع التخرج – قاعة <span dir="ltr">${e(p0.room)}</span> (${e(activeSemesterName())}) ${dayLabel(p0.date)} ${e(cities)}`
      : `جدول مناقشات مشاريع التخرج – ${DEGREE_LABEL[p0.degree] || ''}${specs.length === 1 ? ' ' + e(specs[0]) : ''} (${e(activeSemesterName())}) ${dayLabel(p0.date)} ${e(cities)}`
    const total = Math.ceil(list.length / 6)
    for (let k = 0; k < list.length; k += 6) {
      pages.push(`${pageHead(k / 6 + 1, total)}
        ${k ? '' : `<p style="text-align:center; font-weight:bold; font-size:13.5pt; margin:0 0 12pt;">${title}</p>`}
        <table style="width:100%; border-collapse:collapse;" dir="rtl"><thead>${head}</thead><tbody>${list.slice(k, k + 6).map((r, j) => row(r, k + j + 1, j)).join('')}</tbody></table>`)
    }
  })
  const html = `<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word" xmlns="http://www.w3.org/TR/REC-html40">
<head><meta charset="utf-8"><title>جدول المناقشات</title>
<!--[if gte mso 9]><xml><w:WordDocument><w:View>Print</w:View><w:Zoom>100</w:Zoom></w:WordDocument></xml><![endif]-->
<style>@page Section1 { size: 841.9pt 595.3pt; mso-page-orientation: landscape; margin: 20pt 45pt 22pt; } div.Section1 { page: Section1; }
body { font-family: Arial, 'Cairo', sans-serif; direction: rtl; color: #000; } thead { display: table-header-group; } tr { page-break-inside: avoid; }</style></head>
<body dir="rtl"><div class="Section1">${pages.join('<br clear="all" style="mso-special-character:line-break; page-break-before:always">')}</div></body></html>`
  const a = document.createElement('a')
  a.href = URL.createObjectURL(new Blob(['\ufeff', html], { type: 'application/msword' }))
  a.download = byRoom ? 'جدول المناقشات حسب القاعات.doc' : 'جدول المناقشات.doc'
  a.click()
  setTimeout(() => URL.revokeObjectURL(a.href), 1000)
}

/** المقترح من النموذج كملف PDF (حين لا يرفع الطالب ملفًا): رأس الكلية + بيانات المشروع + أقسام الفكرة — يعيد File جاهزًا للإرسال */
export async function proposalPdfFile(p, teamLabel = '') {
  const rows = [['اسم المشروع', p.name], ['نوع المشروع', p.types.join('، ')], ['الفريق', teamLabel]].filter(([, v]) => v)
  const sections = [['وصف المشروع', p.description], ['المشكلة', p.problems], ['الحل المقترح', p.solutions], ['المميزات والقيمة', p.features_value]].filter(([, v]) => v)
  const page = `
    <div style="${RFONT} width:794px; height:1123px; position:relative; padding:34px 40px;">
      ${collegeHeader(72)}
      <div style="display:flex; justify-content:space-between; align-items:flex-end; margin-top:10px;">
        <b style="font-size:16px;">لجنة مشاريع التخرج</b>
        <span style="font-size:13px; color:#444;">التاريخ: <span dir="ltr">${today()}</span></span>
      </div>
      ${RULE('7px -40px 0')}
      <div style="text-align:center; margin:16px 0 14px; font-size:19px; font-weight:800;">مقترح مشروع تخرج</div>
      <table style="width:100%; border-collapse:collapse; margin-bottom:16px;">
        ${rows.map(([k, v]) => `<tr><td style="${META_L}">${e(k)}</td><td style="${META_V}">${e(v)}</td></tr>`).join('')}
      </table>
      ${sections.map(([k, v]) => `
        <div style="margin-bottom:12px;">
          <div style="${RTH} text-align:right;">${e(k)}</div>
          <div style="${RTD} border-top:0; white-space:pre-line; min-height:40px;">${e(v)}</div>
        </div>`).join('')}
    </div>`
  const blob = await exportPagesPdf({ fileName: 'proposal.pdf', pages: [page], asBlob: true })
  return new File([blob], `مقترح-${(p.name || 'مشروع').replace(/[/:*?"<>|]/g, '-')}.pdf`, { type: 'application/pdf' })
}
