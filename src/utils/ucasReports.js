// نماذج الكلية الرسمية بصيغة PDF — مطابقة لملفات "نمط التصميم": مجموعات الدبلوم/البكالوريوس (كشف شعبة) وجدول المناقشات
import { escapeHtml as e, exportPagesPdf, UCAS_LOGO as LOGO } from '@/utils/exportReport'
import { REGIONS } from '@/utils/progressData'
import { COURSES, activeSemesterName } from '@/services/adminData'

const DEGREE_LABEL = { diploma: 'دبلوم', bachelor: 'بكالوريوس' }


const FONT = "font-family:Arial,'Cairo',sans-serif; color:#000; direction:rtl; background:#fff; box-sizing:border-box;"
const CELL = 'border:1px solid #000; padding:6px 8px; font-size:13px;'
const today = () => new Date().toLocaleDateString('en-GB')
const phone = (w) => String(w || '').replace(/^970/, '')

const collegeHeader = (h = 76) => `
  <div style="display:flex; align-items:center; gap:12px;">
    <img src="${LOGO}" style="height:${h}px;">
    <div>
      <div style="font-size:20px; font-weight:700; color:#1660AB;">الكلية الجامعية للعلوم التطبيقية</div>
      <div style="font-size:13.5px; color:#1660AB; direction:ltr; text-align:right; letter-spacing:.3px;">University College of Applied Sciences</div>
      <div style="font-size:9px; color:#1660AB; border-top:1px solid #1660AB; margin-top:3px; padding-top:2px;">رائـــدة الإبـــداع &nbsp; <b dir="ltr">Leader of Innovation</b></div>
    </div>
  </div>`

/** كشف بأسماء الطلبة في شعبة — صفحة لكل مجموعة (نموذج "مجموعات الدبلوم/البكالوريوس") */
function rosterPage(g, n, total) {
  const course = COURSES[g.degree] || COURSES.diploma
  const blanks = '<td style="border:1px solid #000; width:18px;"></td>'.repeat(10)
  return `
  <div style="${FONT} width:794px; height:1123px; position:relative; padding:36px 46px;">
    ${collegeHeader()}
    <div style="display:flex; justify-content:space-between; align-items:flex-end; margin-top:10px;">
      <b style="font-size:16px;">قسم القبول والتسجيل</b>
      <span style="font-size:13px; color:#555;">التاريخ: <span dir="ltr">${today()}</span></span>
    </div>
    <div style="border-top:2px solid #000; margin:6px -46px 0;"></div>

    <div style="text-align:center; font-weight:700; font-size:17px; line-height:1.6; margin:16px 0 18px;">
      كشف بأسماء الطلبة في شعبة<br>${e(activeSemesterName())}
    </div>

    <div style="display:flex; justify-content:space-between; font-size:14.5px; font-weight:700; margin-bottom:4px;">
      <div>رقم المساق: <span dir="ltr">${e(course.code)}</span><br>الشعبة: ${e(g.section)}</div>
      <div><span style="background:#C8C8C8; padding:0 4px;">اسم المساق: ${e(course.name)}</span><br><span style="background:#C8C8C8; padding:0 4px;">المدرس: ${e(g.supName)}</span></div>
    </div>

    <table style="width:100%; border-collapse:collapse;">
      <thead><tr style="background:#D9D9D9; font-weight:700;">
        <th style="${CELL} width:30px;">م</th><th style="${CELL} width:105px;">رقم الطالب</th><th style="${CELL}">اسم الطالب</th>
        <th style="${CELL} width:120px;">الجوال</th><th style="${CELL} width:120px;">المحافظة</th>${blanks}
      </tr></thead>
      <tbody>
        ${g.members.map((m, i) => `<tr>
          <td style="${CELL} text-align:center;">${i + 1}</td>
          <td style="${CELL} text-align:center;">${e(m.uni)}</td>
          <td style="${CELL}">${e(m.name)}</td>
          <td style="${CELL} text-align:center;">${e(phone(m.whatsapp))}</td>
          <td style="${CELL} text-align:center;">${e(REGIONS[m.region] || '')}</td>${blanks}
        </tr>`).join('')}
      </tbody>
    </table>

    <div style="position:absolute; bottom:60px; left:60px; display:flex; align-items:center; gap:10px; font-size:13px; font-weight:700;">
      <span style="background:#000; color:#fff; padding:2px 14px;" dir="ltr">${n} / ${total}</span><span>صفحات</span>
    </div>
  </div>`
}

/**
 * جدول مناقشات بنمط الكلية — صفحة أفقية لكل 6 صفوف (نموذج "جدول مناقشات البكالوريوس/الدبلوم")
 * rows: { n, section, sup, members: [{ name, online }], time, examiners: [], note } أو { isBreak: true }
 */
function tablePages(titleHtml, rows) {
  const head = `<thead><tr style="background:#D9D9D9; font-weight:700;">
    <th style="${CELL} width:90px;">الرقم</th><th style="${CELL} width:60px;">الشعبة</th><th style="${CELL} width:130px;">اسم المشرف</th>
    <th style="${CELL}">الطلاب</th><th style="${CELL} width:130px;">وقت المناقشة</th><th style="${CELL} width:130px;">المناقشين</th><th style="${CELL} width:200px;">ملاحظات</th>
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
        <div style="border-top:2px solid #000; margin:8px -60px 16px;"></div>
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

export function exportRosterPdf(groups) {
  const pages = []
  byDegree(groups).forEach(([, list]) => list.forEach((g) => pages.push(g)))
  const degrees = byDegree(groups).map(([d]) => DEGREE_LABEL[d]).join(' و')
  return exportPagesPdf({
    fileName: `مجموعات ${degrees}.pdf`,
    pages: pages.map((g, i) => rosterPage(g, i + 1, pages.length))
  })
}

/**
 * جدول المناقشات العام من مخطِّط المناقشات — صفحات لكل (يوم × درجة) كنموذج "جدول مناقشات البكالوريوس/الدبلوم"
 * plan: [{ section, sup, members, date, time, room, city, examiners, note, degree, spec }]
 */
export function exportPlanPdf(plan) {
  const blocks = new Map()
  ;[...plan].sort((a, b) => `${a.date}${a.degree}${a.time}${a.room}`.localeCompare(`${b.date}${b.degree}${b.time}${b.room}`)).forEach((p) => {
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
  ;[...plan].sort((a, b) => `${a.date}${a.room}${a.time}`.localeCompare(`${b.date}${b.room}${b.time}`)).forEach((p) => {
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

/** تقرير المشرفين: كل مشرف مع مجموعاته ونوع المشروع والدرجة وطلاب/طالبات ومكان التواجد — صفحة لكل مشرف */
export function exportSupervisorsPdf(groups, supervisors = []) {
  // المشرفون من المجموعات نفسها؛ التخصص من قائمة المشرفين إن مُرّرت وإلا تخصص أول مجموعة
  const ids = [...new Set(groups.map((g) => g.supId))]
  const sups = ids.map((id) => {
    const list = groups.filter((g) => g.supId === id)
    const known = supervisors.find((s) => s.id === id)
    return { s: { name: list[0].supName, spec: known?.spec || list[0].spec }, list }
  })
  const GENDER = { male: 'طلاب', female: 'طالبات' }
  const regions = (g) => [...new Set(g.members.map((m) => REGIONS[m.region]))].join('، ')
  const pages = sups.map(({ s, list }, i) => `
    <div style="${FONT} width:794px; height:1123px; position:relative; padding:36px 46px;">
      ${collegeHeader()}
      <div style="display:flex; justify-content:space-between; align-items:flex-end; margin-top:10px;">
        <b style="font-size:16px;">لجنة مشاريع التخرج</b>
        <span style="font-size:13px; color:#555;">التاريخ: <span dir="ltr">${today()}</span></span>
      </div>
      <div style="border-top:2px solid #000; margin:6px -46px 0;"></div>
      <div style="text-align:center; font-weight:700; font-size:17px; line-height:1.6; margin:16px 0 18px;">
        تقرير المشرف ومجموعاته<br>${e(activeSemesterName())}
      </div>
      <div style="display:flex; justify-content:space-between; font-size:14.5px; font-weight:700; margin-bottom:6px;">
        <div><span style="background:#C8C8C8; padding:0 4px;">المشرف: ${e(s.name)}</span><br>التخصص: ${e(s.spec)}</div>
        <div>عدد المجموعات: ${list.length}<br>عدد الطلاب: ${list.reduce((n, g) => n + g.members.length, 0)}</div>
      </div>
      <table style="width:100%; border-collapse:collapse;">
        <thead><tr style="background:#D9D9D9; font-weight:700;">
          <th style="${CELL} width:30px;">م</th><th style="${CELL} width:62px;">الشعبة</th><th style="${CELL}">المشروع</th><th style="${CELL} width:96px;">نوع المشروع</th>
          <th style="${CELL} width:74px;">الدرجة</th><th style="${CELL} width:62px;">الفئة</th><th style="${CELL} width:90px;">مكان التواجد</th><th style="${CELL} width:150px;">الطلاب</th>
        </tr></thead>
        <tbody>${list.map((g, n) => `<tr>
          <td style="${CELL} text-align:center;">${n + 1}</td>
          <td style="${CELL} text-align:center;">${e(g.section)}</td>
          <td style="${CELL}">${e(g.project)}</td>
          <td style="${CELL} text-align:center;">${e(g.type || '')}</td>
          <td style="${CELL} text-align:center;">${DEGREE_LABEL[g.degree]}</td>
          <td style="${CELL} text-align:center;">${GENDER[g.members[0]?.gender] || ''}</td>
          <td style="${CELL} text-align:center;">${e(regions(g))}</td>
          <td style="${CELL} font-size:12px; line-height:1.5;">${g.members.map((m) => e(m.name)).join('<br>')}</td>
        </tr>`).join('')}</tbody>
      </table>
      <div style="position:absolute; bottom:60px; left:60px; display:flex; align-items:center; gap:10px; font-size:13px; font-weight:700;">
        <span style="background:#000; color:#fff; padding:2px 14px;" dir="ltr">${i + 1} / ${sups.length}</span><span>صفحات</span>
      </div>
    </div>`)
  return exportPagesPdf({ fileName: 'تقرير المشرفين ومجموعاتهم.pdf', pages })
}
