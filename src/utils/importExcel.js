import { downloadBlob } from './exportReport'

/** أعمدة نموذج استيراد الطلاب — نفس الترتيب يُستخدم بالقراءة والتنزيل */
export const IMPORT_COLUMNS = [
  { key: 'num', label: 'رقم المجموعة', width: 14, required: true },
  { key: 'shu', label: 'الشعبة', width: 12 },
  { key: 'spec', label: 'التخصص', width: 32 },
  { key: 'sup', label: 'اسم المشرف', width: 22 },
  { key: 'name', label: 'اسم العضو', width: 24, required: true },
  { key: 'uid', label: 'الرقم الجامعي', width: 16, required: true },
  { key: 'whats', label: 'رقم الواتس', width: 16 },
  { key: 'mail', label: 'البريد الإلكتروني', width: 28 }
]

const EXAMPLE_ROW = {
  num: '31', shu: 'شعبة 1', spec: 'تصميم وتطوير مواقع الويب "دبلوم"', sup: 'د. أحمد الشريف',
  name: 'محمد أحمد العلي', uid: '3175099', whats: '0551234567', mail: 'student99@academy.edu.sa'
}

/** يبني ملف Excel فارغ بتنسيق احترافي (رأس مُلوّن + صف مثال) ليعرف المستخدم شكل البيانات المطلوبة */
export async function downloadImportTemplate() {
  const { default: ExcelJS } = await import('exceljs')

  const wb = new ExcelJS.Workbook()
  wb.creator = 'مسار — منصة إدارة مشاريع التخرج'
  wb.created = new Date()

  const ws = wb.addWorksheet('استيراد الطلاب', { views: [{ rightToLeft: true }] })
  ws.columns = IMPORT_COLUMNS.map((c) => ({ header: c.label, key: c.key, width: c.width }))

  const header = ws.getRow(1)
  header.height = 28
  header.eachCell((cell) => {
    cell.font = { bold: true, color: { argb: 'FFFFFFFF' }, size: 12, name: 'Arial' }
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF2563EB' } }
    cell.alignment = { horizontal: 'center', vertical: 'middle' }
    cell.border = { bottom: { style: 'medium', color: { argb: 'FF1D4ED8' } } }
  })

  const example = ws.addRow(EXAMPLE_ROW)
  example.height = 24
  example.eachCell((cell) => {
    cell.font = { name: 'Arial', size: 11, italic: true, color: { argb: 'FF94A3B8' } }
    cell.alignment = { horizontal: 'right', vertical: 'middle' }
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF6F8FB' } }
  })

  ws.views = [{ state: 'frozen', ySplit: 1, rightToLeft: true }]

  const buffer = await wb.xlsx.writeBuffer()
  downloadBlob(
    new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }),
    'نموذج-استيراد-الطلاب.xlsx'
  )
}

/** يقرأ ملف Excel مرفوع (الورقة الأولى) ويحوّل صفوفه لكائنات حسب تطابق نص رأس العمود مع IMPORT_COLUMNS */
export async function parseStudentsExcel(file) {
  const { default: ExcelJS } = await import('exceljs')

  const wb = new ExcelJS.Workbook()
  const buffer = await file.arrayBuffer()
  await wb.xlsx.load(buffer)

  const ws = wb.worksheets[0]
  if (!ws) return []

  const keyByColumn = {}
  ws.getRow(1).eachCell((cell, colNumber) => {
    const label = String(cell.value ?? '').trim()
    const column = IMPORT_COLUMNS.find((c) => c.label === label)
    if (column) keyByColumn[colNumber] = column.key
  })

  const rows = []
  ws.eachRow((row, rowNumber) => {
    if (rowNumber === 1) return
    const record = {}
    row.eachCell({ includeEmpty: true }, (cell, colNumber) => {
      const key = keyByColumn[colNumber]
      if (key) record[key] = String(cell.value ?? '').trim()
    })
    if (Object.values(record).some(Boolean)) rows.push(record)
  })

  return rows
}

/** صف صالح = تحتوي كل الحقول required (num/name/uid) */
export function isValidImportRow(row) {
  return IMPORT_COLUMNS.filter((c) => c.required).every((c) => Boolean(row[c.key]))
}
