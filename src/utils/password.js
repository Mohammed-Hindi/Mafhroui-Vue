const PASS_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!#'

/** كلمة سر عشوائية لحسابات جديدة — تُستخدم بكل نماذج "إضافة عضو" */
export function genPass() {
  let out = ''
  for (let i = 0; i < 10; i++) out += PASS_CHARS[Math.floor(Math.random() * PASS_CHARS.length)]
  return out
}
