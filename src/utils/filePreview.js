/** رابط فيديو عام (Creative Commons) يُستخدم كمعاينة تجريبية بانتظار الفيديوهات الفعلية */
const SAMPLE_VIDEO_URL = 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4'

/** يبني PDF صالحًا بأقل حجم ممكن ويفتحه بتبويب جديد — بديل مؤقت لملفات حقيقية من الباك إند */
export function openPlaceholderPdf(fileName, heading = '') {
  const text = [heading, fileName, 'Placeholder document -- no real file attached yet']
    .filter(Boolean)
    .map((line) => String(line).replace(/[()\\]/g, ' '))

  const stream = text.map((line, i) => `BT /F1 ${i === 0 ? 14 : 10} Tf 40 ${230 - i * 26} Td (${line}) Tj ET`).join('\n')

  const pdf = `%PDF-1.4
1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj
2 0 obj<</Type/Pages/Kids[3 0 R]/Count 1/MediaBox[0 0 420 300]>>endobj
3 0 obj<</Type/Page/Parent 2 0 R/Resources<</Font<</F1<</Type/Font/Subtype/Type1/BaseFont/Helvetica>>>>>>/Contents 4 0 R>>endobj
4 0 obj<</Length ${stream.length}>>stream
${stream}
endstream endobj
trailer<</Root 1 0 R/Size 5>>
%%EOF`

  const url = URL.createObjectURL(new Blob([pdf], { type: 'application/pdf' }))
  window.open(url, '_blank')
  setTimeout(() => URL.revokeObjectURL(url), 60000)
}

/** يفتح معاينة فيديو تجريبية بتبويب جديد */
export function openPlaceholderVideo() {
  window.open(SAMPLE_VIDEO_URL, '_blank')
}
