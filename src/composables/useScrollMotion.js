// حركة أقسام صفحة الهبوط بمكتبة GSAP (ScrollTrigger + SplitText + DrawSVG):
// تُبنى داخل gsap.matchMedia فتُلغى كاملة عند مغادرة الصفحة، وتُتخطّى لمن فعّل "تقليل الحركة".
import { nextTick, onBeforeUnmount, onMounted, watch } from 'vue'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { SplitText } from 'gsap/SplitText'
import { DrawSVGPlugin } from 'gsap/DrawSVGPlugin'

gsap.registerPlugin(ScrollTrigger, SplitText, DrawSVGPlugin)

/**
 * @param {import('vue').Ref<HTMLElement>} rootRef جذر القسم
 * @param {(root: HTMLElement) => void} build يبني الحركات (gsap/ScrollTrigger) للقسم
 * @param {() => unknown} [deps] مصدر بيانات غير متزامن؛ يُعاد البناء عند تغيّره
 */
export function useScrollMotion(rootRef, build, deps) {
  let mm = null
  const run = () => {
    mm?.revert()
    if (!rootRef.value) return
    // matchMedia يعمل كـ context: كل ما يُنشأ داخله يُلغى مع revert
    mm = gsap.matchMedia()
    mm.add('(prefers-reduced-motion: no-preference)', () => build(rootRef.value), rootRef.value)
    ScrollTrigger.refresh()
  }
  onMounted(() => nextTick(run))
  if (deps) watch(deps, () => nextTick(run))
  onBeforeUnmount(() => mm?.revert())
}

/**
 * عنوان القسم: كلماته تصعد من خلف قناع واحدة تلو الأخرى، ثم يمتد الخطان الجانبيان.
 * التقسيم بالكلمات لا بالحروف حتى لا ينكسر اتصال الحروف العربية.
 */
export function titleIn(tl, el) {
  const split = SplitText.create(el, { type: 'words', mask: 'words' })
  // بعد الظهور يُعاد النص لأصله (أغلفة القناع توسّع المسافات بين الكلمات العربية)
  tl.from(split.words, { yPercent: 110, duration: 0.8, ease: 'power3.out', stagger: 0.07, onComplete: () => split.revert() })
    .fromTo(el, { '--tl': 0 }, { '--tl': 1, duration: 1, ease: 'power2.inOut' }, '<0.2')
  return tl
}

/** رسم خطوط أيقونات lucide (الخطية) كأنها تُرسم باليد */
export const iconParts = (scope) => scope.querySelectorAll('svg path, svg circle, svg rect, svg line, svg polyline')

export { gsap }
