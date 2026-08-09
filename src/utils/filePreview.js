/** رابط فيديو عام (Creative Commons) يُستخدم كمعاينة تجريبية بانتظار الفيديوهات الفعلية */
const SAMPLE_VIDEO_URL = 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4'

/** يبني Blob لملف PDF صالح بأقل حجم ممكن من مجموعة أسطر نصية — بديلjs مؤقت لملفات حقيقية من الباك إند */
function buildPlaceholderPdfBlob(lines) {
  const clean = lines.filter(Boolean).map((line) => String(line).replace(/[()\\]/g, ' '))
  const height = Math.max(300, 80 + clean.length * 24)

  const stream = clean.map((line, i) => `BT /F1 ${i === 0 ? 14 : 10} Tf 40 ${height - 70 - i * 22} Td (${line}) Tj ET`).join('\n')

  const pdf = `%PDF-1.4
1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj
2 0 obj<</Type/Pages/Kids[3 0 R]/Count 1/MediaBox[0 0 420 ${height}]>>endobj
3 0 obj<</Type/Page/Parent 2 0 R/Resources<</Font<</F1<</Type/Font/Subtype/Type1/BaseFont/Helvetica>>>>>>/Contents 4 0 R>>endobj
4 0 obj<</Length ${stream.length}>>stream
${stream}
endstream endobj
trailer<</Root 1 0 R/Size 5>>
%%EOF`

  return new Blob([pdf], { type: 'application/pdf' })
}

/** يبني PDF ويفتحه بتبويب جديد مباشرة */
export function openPlaceholderPdf(fileName, heading = '') {
  const blob = buildPlaceholderPdfBlob([heading, fileName, 'Placeholder document -- no real file attached yet'])
  const url = URL.createObjectURL(blob)
  window.open(url, '_blank')
  setTimeout(() => URL.revokeObjectURL(url), 60000)
}

function escapeHtml(value) {
  return String(value ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]))
}

/** يبني مستند HTML رسمي بهوية مسار البصرية (ترويسة متدرّجة + شعار + أقسام مبطّنة لكل حقل) ويحوّله إلى PDF فعلي عبر html2canvas + jsPDF — يحافظ على العربية دون الحاجة لتضمين خط داخل مكتبة الـPDF */
export async function generateOfficialPdf(title, subtitle, fields) {
  const [{ default: jsPDF }, { default: html2canvas }] = await Promise.all([import('jspdf'), import('html2canvas')])

  const wrapper = document.createElement('div')
  wrapper.style.cssText = 'position:fixed; top:0; inset-inline-start:-99999px; width:794px; background:#F6F8FB; direction:rtl;'
  wrapper.innerHTML = `
    <div style="font-family:'Cairo','Tajawal',sans-serif; color:#0F172A;">
      <div style="background:linear-gradient(120deg,#2563EB,#06B6D4); padding:32px 56px; display:flex; align-items:center; justify-content:space-between;">
        <div style="display:flex; align-items:center; gap:14px;">
          <span style="display:inline-flex; align-items:center; justify-content:center; width:44px; height:44px; border-radius:13px; background:rgba(255,255,255,.18);">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2.2"><path d="M22 10 12 5 2 10l10 5 10-5Z"/><path d="M6 12v5c0 1.5 2.7 3 6 3s6-1.5 6-3v-5"/></svg>
          </span>
          <div>
            <div style="font-size:19px; font-weight:800; color:#fff;">مسار</div>
            <div style="font-size:11.5px; color:rgba(255,255,255,.85); margin-top:1px;">منصة إدارة مشاريع التخرج</div>
          </div>
        </div>
        <div style="font-size:11px; color:rgba(255,255,255,.9); text-align:end;">
          <div>تاريخ الإصدار</div>
          <div style="font-weight:700; margin-top:2px;">${escapeHtml(new Date().toLocaleDateString('ar-EG', { year: 'numeric', month: 'long', day: 'numeric' }))}</div>
        </div>
      </div>

      <div style="padding:40px 56px 56px;">
        <h1 style="font-size:23px; font-weight:800; margin-bottom:6px;">${escapeHtml(title)}</h1>
        ${subtitle ? `<p style="font-size:13.5px; color:#475569; margin-bottom:30px;">${escapeHtml(subtitle)}</p>` : '<div style="margin-bottom:22px;"></div>'}

        ${fields.map((f, i) => `
          <div style="background:#fff; border:1px solid #E7ECF3; border-radius:14px; padding:18px 20px; margin-bottom:16px;">
            <div style="display:flex; align-items:center; gap:9px; margin-bottom:8px;">
              <span style="display:inline-flex; align-items:center; justify-content:center; width:24px; height:24px; border-radius:8px; background:#EFF6FF; color:#2563EB; font-size:12px; font-weight:800; flex-shrink:0;">${i + 1}</span>
              <span style="font-size:14px; font-weight:800;">${escapeHtml(f.label)}</span>
            </div>
            <p style="font-size:12.5px; color:#334155; line-height:1.95; margin-inline-start:33px; white-space:pre-wrap;">${escapeHtml(f.value?.trim() ? f.value : '—')}</p>
          </div>
        `).join('')}

        <div style="margin-top:30px; padding-top:16px; border-top:1px solid #E7ECF3; display:flex; align-items:center; justify-content:space-between; font-size:10.5px; color:#94A3B8;">
          <span>تم إنشاء هذا المستند تلقائيًا عبر منصة مسار.</span>
          <span>مسار © ${new Date().getFullYear()}</span>
        </div>
      </div>
    </div>
  `
  document.body.appendChild(wrapper)

  try {
    const canvas = await html2canvas(wrapper, { scale: 2, backgroundColor: '#ffffff' })
    const pdf = new jsPDF({ unit: 'pt', format: 'a4' })
    const pageWidth = pdf.internal.pageSize.getWidth()
    const pageHeight = pdf.internal.pageSize.getHeight()
    const imgWidth = pageWidth
    const imgHeight = (canvas.height * imgWidth) / canvas.width
    const imgData = canvas.toDataURL('image/png')

    let heightLeft = imgHeight
    let position = 0
    pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight)
    heightLeft -= pageHeight

    while (heightLeft > 0) {
      position -= pageHeight
      pdf.addPage()
      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight)
      heightLeft -= pageHeight
    }

    return pdf.output('bloburl')
  } finally {
    document.body.removeChild(wrapper)
  }
}

/** يفتح معاينة فيديو تجريبية بتبويب جديد */
export function openPlaceholderVideo() {
  window.open(SAMPLE_VIDEO_URL, '_blank')
}
