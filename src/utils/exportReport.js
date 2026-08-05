function downloadBlob(blob, fileName) {
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = fileName
  link.click()
  setTimeout(() => URL.revokeObjectURL(url), 60000)
}

function escapeHtml(value) {
  return String(value ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]))
}

/**
 * يبني ملف Excel فعلي (.xlsx) بتنسيق احترافي: ترويسة مُلوّنة بهوية مسار، حدود، صفوف متبادلة اللون، اتجاه RTL،
 * ودمج رأسي (merge) للحقول المتكررة على مستوى كل مجموعة عبر rowGroups + mergeKeys — عبر مكتبة exceljs
 * rowGroups: مصفوفة مصفوفات، كل مصفوفة داخلية تمثل صفوف مجموعة واحدة متتالية
 * mergeKeys: مفاتيح الأعمدة التي يجب دمجها رأسيًا داخل كل مجموعة (تتكرر قيمتها في كل صفوف المجموعة)
 */
export async function exportStyledExcel({ fileName, sheetTitle, columns, rowGroups, mergeKeys = [] }) {
  const { default: ExcelJS } = await import('exceljs')

  const wb = new ExcelJS.Workbook()
  wb.creator = 'مسار — منصة إدارة مشاريع التخرج'
  wb.created = new Date()

  const ws = wb.addWorksheet(sheetTitle.slice(0, 31), { views: [{ rightToLeft: true }] })
  ws.columns = columns.map((c) => ({ header: c.label, key: c.key, width: c.width || 22 }))

  const headerRow = ws.getRow(1)
  headerRow.height = 28
  headerRow.eachCell((cell) => {
    cell.font = { bold: true, color: { argb: 'FFFFFFFF' }, size: 12, name: 'Arial' }
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF2563EB' } }
    cell.alignment = { horizontal: 'center', vertical: 'middle' }
    cell.border = { bottom: { style: 'medium', color: { argb: 'FF1D4ED8' } } }
  })

  const rows = rowGroups.flat()
  rows.forEach((r, i) => {
    const row = ws.addRow(r)
    row.height = 22
    row.eachCell((cell) => {
      cell.font = { name: 'Arial', size: 11, color: { argb: 'FF0F172A' } }
      cell.alignment = { horizontal: 'right', vertical: 'middle' }
      cell.border = { bottom: { style: 'thin', color: { argb: 'FFE7ECF3' } } }
      if (i % 2 === 1) cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF6F8FB' } }
    })
  })

  // دمج الحقول المتكررة رأسيًا لكل مجموعة + خط فاصل أوضح بين كل مجموعة والتالية
  let cursor = 2
  rowGroups.forEach((group) => {
    const startRow = cursor
    const endRow = cursor + group.length - 1

    if (group.length > 1) {
      mergeKeys.forEach((key) => {
        const colIndex = columns.findIndex((c) => c.key === key) + 1
        if (colIndex < 1) return
        ws.mergeCells(startRow, colIndex, endRow, colIndex)
        const cell = ws.getCell(startRow, colIndex)
        cell.alignment = { horizontal: 'center', vertical: 'middle' }
      })
    }

    ws.getRow(endRow).eachCell({ includeEmpty: true }, (cell) => {
      cell.border = { ...cell.border, bottom: { style: 'medium', color: { argb: 'FFBFD4F5' } } }
    })

    cursor = endRow + 1
  })

  ws.autoFilter = { from: { row: 1, column: 1 }, to: { row: 1, column: columns.length } }
  ws.views = [{ state: 'frozen', ySplit: 1, rightToLeft: true }]

  const buffer = await wb.xlsx.writeBuffer()
  downloadBlob(
    new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }),
    fileName
  )
}

/** يبني تقرير PDF رسمي كامل (ترويسة بهوية مسار + أقسام لكل مجموعة وجدول أعضائها) عبر html2canvas + jsPDF */
export async function exportGroupsPdf({ fileName, title, subtitle, sections }) {
  const [{ default: jsPDF }, { default: html2canvas }] = await Promise.all([import('jspdf'), import('html2canvas')])

  const wrapper = document.createElement('div')
  wrapper.style.cssText = 'position:fixed; top:0; inset-inline-start:-99999px; width:1050px; background:#F6F8FB; direction:rtl;'
  wrapper.innerHTML = `
    <div style="font-family:'Cairo','Tajawal',sans-serif; color:#0F172A;">
      <div style="background:linear-gradient(120deg,#2563EB,#06B6D4); padding:30px 50px; display:flex; align-items:center; justify-content:space-between;">
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

      <div style="padding:36px 50px 50px;">
        <h1 style="font-size:22px; font-weight:800; margin-bottom:6px;">${escapeHtml(title)}</h1>
        ${subtitle ? `<p style="font-size:13px; color:#475569; margin-bottom:28px;">${escapeHtml(subtitle)}</p>` : '<div style="margin-bottom:20px;"></div>'}

        ${sections.map((sec) => `
          <div style="border:1px solid #E7ECF3; border-radius:14px; overflow:hidden; margin-bottom:20px;">
            <div style="background:#EFF6FF; padding:14px 20px; display:flex; align-items:center; justify-content:space-between; flex-wrap:wrap; gap:8px;">
              <span style="font-size:14.5px; font-weight:800; color:#1D4ED8;">${escapeHtml(sec.heading)}</span>
              <div style="display:flex; gap:16px; flex-wrap:wrap;">
                ${sec.meta.map((m) => `<span style="font-size:11.5px; color:#334155;"><b style="color:#64748B; font-weight:700;">${escapeHtml(m.label)}:</b> ${escapeHtml(m.value)}</span>`).join('')}
              </div>
            </div>
            <table style="width:100%; border-collapse:collapse;">
              <thead>
                <tr style="background:#F8FAFC;">
                  ${sec.tableColumns.map((c) => `<th style="padding:9px 16px; font-size:11px; font-weight:800; color:#475569; text-align:start; border-bottom:1px solid #E7ECF3;">${escapeHtml(c.label)}</th>`).join('')}
                </tr>
              </thead>
              <tbody>
                ${sec.tableRows.map((r, i) => `
                  <tr style="${i % 2 === 1 ? 'background:#FAFBFD;' : ''}">
                    ${sec.tableColumns.map((c) => `<td style="padding:9px 16px; font-size:11.5px; color:#0F172A; border-bottom:1px solid #F0F3F8;">${escapeHtml(r[c.key] ?? '—')}</td>`).join('')}
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        `).join('')}

        <div style="margin-top:30px; padding-top:16px; border-top:1px solid #E7ECF3; display:flex; align-items:center; justify-content:space-between; font-size:10.5px; color:#94A3B8;">
          <span>تم إنشاء هذا التقرير تلقائيًا عبر منصة مسار.</span>
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

    pdf.save(fileName)
  } finally {
    document.body.removeChild(wrapper)
  }
}
