<template>
  <!-- خلفية "مطر البيانات" (منقولة من مكوّن DataRain إلى Vue): آلاف الخطوط تنساب للأسفل في حقل سريان،
       وتلتف حول المؤشر كأسطوانة مع دوامات خلفه. في البداية تلتف حول عنصر focus (كلمة مسار) أثناء ظهوره،
       ثم تتبع المؤشر أو مسارًا آليًا. الألوان بهوية المنصة، وتتوقف عند خروج القسم من الشاشة. -->
  <div ref="root" class="dr-root" aria-hidden="true">
    <canvas ref="bloom" class="dr-bloom" />
    <canvas ref="main" class="dr-main" />
  </div>
</template>

<script>
const MAX = 7000 // سعة الجسيمات
const L = 19 // نقاط الأثر لكل جسيم
const STEP = 1 / 60 // خطوة فيزياء ثابتة
const PUFFS = 32 // مجمّع الدوامات
const TAU = Math.PI * 2
const AGE_BUCKETS = 6
const SEGS_PER_BUCKET = 3

const BASE_ALPHA = [0.2, 0.32, 0.48]
const BASE_WIDTH = [0.7, 0.9, 1.2]
const ALPHA_GAIN = 1.3
const HEAD_WIDTH = 1.4

const K_RELAX = 1 - Math.exp(-STEP / 0.12)
const K_Q = 1 - Math.exp(-STEP * 8)
const K_CURSOR = 1 - Math.exp(-STEP * 18)
const K_VEL = 1 - Math.exp(-STEP * 10)
const K_IN = 1 - Math.exp(-STEP / 0.06)
const K_OUT = 1 - Math.exp(-STEP / 0.2)
const FIRE_P = 0.03 * STEP
const FIRE_DECAY = Math.exp(-STEP / 0.45)
const PUFF_DECAY = Math.exp(-STEP / 1.1)

const clamp = (v, lo, hi) => (v < lo ? lo : v > hi ? hi : v)

function mulberry32(seed) {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

function parseHex(input, fallback) {
  if (!input) return fallback
  let s = input.trim().replace(/^#/, '')
  if (s.length === 3) s = s[0] + s[0] + s[1] + s[1] + s[2] + s[2]
  if (!/^[0-9a-fA-F]{6}$/.test(s)) return fallback
  const n = parseInt(s, 16)
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255]
}

/** حد واحد من حقل التمايل عديم التباعد ψ = A/|k|·sin(k·x + ωt + φ) */
function makeWave(lambda, angle, omega, phase, amp) {
  const k = TAU / lambda
  return { kx: k * Math.cos(angle), ky: k * Math.sin(angle), om: omega, ph: phase, au: amp * Math.sin(angle), av: -amp * Math.cos(angle) }
}

const WAVE_0 = makeWave(380, 0.35, 0.18, 0.7, 16)
const WAVE_1 = makeWave(620, 1.9, 0.27, 2.1, 13)
const WAVE_2 = makeWave(900, 3.4, 0.35, 4.2, 10)

export default {
  name: 'DataRain',

  props: {
    count: { type: Number, default: undefined },
    flowSpeed: { type: Number, default: 1 },
    obstacleRadius: { type: Number, default: 64 },
    autopilot: { type: Boolean, default: true },
    /** ألوان الخطوط: هادئ/متوسط/سريع + لون رؤوس الشرر */
    palette: { type: Object, default: () => ({ calm: '#FFFFFF', mid: '#C8F0B4', hot: '#FFFFFF', core: '#FFFFFF' }) },
    /** عنصر تلتف حوله الخطوط في البداية (يُعاد مستطيله نسبةً للجذر) */
    focus: { type: Function, default: null },
    /** مدة الالتفاف حول focus بالثواني */
    introSeconds: { type: Number, default: 4.5 },
    /** مضاعف شفافية الخطوط (الخلفية الملوّنة تحتاج خطوطًا أوضح من الأصل الداكن) */
    gain: { type: Number, default: 1 }
  },

  mounted() {
    this.stop = this.run()
  },

  beforeUnmount() {
    this.stop?.()
  },

  methods: {
    // ponytail: المحرّك كما هو في الأصل (مصفوفات ثابتة + حلقة rAF)، مُغلق في دالة واحدة؛ لا حاجة لتجزئته
    run() {
      const props = this.$props
      const root = this.$refs.root
      const main = this.$refs.main
      const bloom = this.$refs.bloom
      const ctx = main.getContext('2d')
      const bctx = bloom.getContext('2d')
      if (!ctx || !bctx) return null

      const reduced = typeof window.matchMedia === 'function' && window.matchMedia('(prefers-reduced-motion: reduce)').matches
      const rand = mulberry32(7)

      let disposed = false
      let initialised = false
      let live = false
      let visible = true

      let w = 0, h = 0, dpr = 1, bw = 1, bh = 1

      const px = new Float32Array(MAX), py = new Float32Array(MAX)
      const vx = new Float32Array(MAX), vy = new Float32Array(MAX)
      const pz = new Float32Array(MAX), v0 = new Float32Array(MAX)
      const qv = new Float32Array(MAX), fire = new Float32Array(MAX)
      const len = new Uint8Array(MAX)
      const hx = new Float32Array(MAX * L), hy = new Float32Array(MAX * L)
      let head = 0

      const groupList = []
      for (let g = 0; g < 6; g++) groupList.push(new Int32Array(MAX))
      const groupCount = new Int32Array(6)

      const strokeStyles = new Array(6 * AGE_BUCKETS).fill('')
      const strokeWidths = new Float32Array(6 * AGE_BUCKETS)
      const headStyles = ['', '']
      let haloGradient = null

      const pX = new Float32Array(PUFFS), pY = new Float32Array(PUFFS)
      const pGamma = new Float32Array(PUFFS), pAge = new Float32Array(PUFFS)
      const pAlive = new Uint8Array(PUFFS)
      const aX = new Float32Array(PUFFS), aY = new Float32Array(PUFFS)
      const aG = new Float32Array(PUFFS), aC2 = new Float32Array(PUFFS), aR2 = new Float32Array(PUFFS)
      let aCount = 0, puffCursor = 0, shedSign = 1, shedAcc = 0

      let simTime = 0, liveTime = 0, active = 0, targetCount = 0, quality = 1

      let pointerActive = false, pointerX = 0, pointerY = 0
      let idleSince = 0, idleDelay = 1.2, prevSrc = 0
      let tgtX = 0, tgtY = 0, cx = 0, cy = 0, pcx = 0, pcy = 0, vcx = 0, vcy = 0
      let influence = 0, curA = 64
      let focusRect = null

      let raf = 0, last = 0, acc = 0, frameEma = 16.7, workEma = 4, slowFrames = 0, fastFrames = 0

      const buildStyles = () => {
        const pal = props.palette || {}
        const calm = parseHex(pal.calm, [255, 255, 255])
        const mid = parseHex(pal.mid, [200, 240, 180])
        const hot = parseHex(pal.hot, [255, 255, 255])
        const core = parseHex(pal.core, [255, 255, 255])
        const colours = [calm, mid, hot]
        for (let g = 0; g < 6; g++) {
          const depth = g < 3 ? 0 : 1
          const bucket = g % 3
          const c = colours[bucket]
          for (let ab = 0; ab < AGE_BUCKETS; ab++) {
            const falloff = Math.pow(1 - (ab + 0.5) / AGE_BUCKETS, 1.5)
            const alpha = Math.min(0.95, BASE_ALPHA[bucket] * (depth === 0 ? 0.55 : 1) * falloff * ALPHA_GAIN * props.gain)
            strokeStyles[g * AGE_BUCKETS + ab] = `rgba(${c[0]},${c[1]},${c[2]},${alpha.toFixed(3)})`
            const width = BASE_WIDTH[bucket] * (depth === 0 ? 0.75 : 1) * (1 - (0.45 * ab) / AGE_BUCKETS)
            strokeWidths[g * AGE_BUCKETS + ab] = clamp(width, 0.6, 1.3)
          }
        }
        headStyles[0] = `rgba(${core[0]},${core[1]},${core[2]},0.5)`
        headStyles[1] = `rgba(${core[0]},${core[1]},${core[2]},0.85)`
        const grad = ctx.createRadialGradient(0, 0, 0, 0, 0, 1)
        grad.addColorStop(0, `rgba(${hot[0]},${hot[1]},${hot[2]},1)`)
        grad.addColorStop(0.45, `rgba(${hot[0]},${hot[1]},${hot[2]},0.32)`)
        grad.addColorStop(1, `rgba(${hot[0]},${hot[1]},${hot[2]},0)`)
        haloGradient = grad
      }

      const seedParticle = (i, uniform) => {
        let x, y
        if (uniform) { x = rand() * w; y = rand() * h } else { x = -40 + rand() * (w + 80); y = -40 - rand() * 80 }
        const z = 0.35 + 0.65 * rand()
        const nominal = 70 + 90 * z * z
        const flow = clamp(props.flowSpeed ?? 1, 0.05, 5)
        pz[i] = z; v0[i] = nominal; len[i] = 9 + Math.floor(rand() * 11)
        px[i] = x; py[i] = y; vx[i] = 0; vy[i] = nominal * flow; qv[i] = 1; fire[i] = 0
        const base = i * L
        for (let k = 0; k < L; k++) { hx[base + k] = x; hy[base + k] = y }
      }

      const seedAll = () => { for (let i = 0; i < MAX; i++) seedParticle(i, true) }

      const setActive = (n, uniform) => {
        const next = clamp(Math.round(n), 1, MAX)
        for (let i = active; i < next; i++) seedParticle(i, uniform)
        active = next
      }

      const applyCount = (uniform) => {
        const auto = clamp(Math.round((w * h) / 520), 1200, 5200)
        targetCount = clamp(Math.round(props.count !== undefined ? props.count : auto), 1, MAX)
        setActive(targetCount * quality, uniform)
      }

      const spawnPuff = (a, speed) => {
        const dxn = vcx / speed, dyn = vcy / speed
        const sign = shedSign
        shedSign = -shedSign
        const j = puffCursor
        puffCursor = (puffCursor + 1) % PUFFS
        pX[j] = cx - dxn * 0.6 * a - dyn * sign * 0.7 * a
        pY[j] = cy - dyn * 0.6 * a + dxn * sign * 0.7 * a
        pGamma[j] = clamp(sign * Math.min(speed, 1200) * a * 1.5, -105000, 105000)
        pAge[j] = 0
        pAlive[j] = 1
      }

      const readFocus = () => {
        const r = props.focus?.()
        if (!r) return null
        const o = root.getBoundingClientRect()
        return { x: r.left - o.left + r.width / 2, y: r.top - o.top + r.height / 2, r: Math.max(r.width, r.height) * 0.42 }
      }

      const simulate = () => {
        const flow = clamp(props.flowSpeed ?? 1, 0.05, 5)
        const intro = !reduced && focusRect && liveTime < props.introSeconds
        const obsR = intro ? focusRect.r : props.obstacleRadius ?? 64
        const autopilotOn = props.autopilot ?? true

        head = (head + 1) % L
        simTime += STEP
        if (live) liveTime += STEP

        // مصدر العائق: كلمة مسار أثناء الظهور > المؤشر > المسار الآلي > لا شيء
        const ghostOn = !reduced && autopilotOn && !pointerActive && live && liveTime - idleSince >= idleDelay
        const src = intro ? 2 : pointerActive ? 2 : ghostOn ? 1 : 0
        if (intro) { tgtX = focusRect.x; tgtY = focusRect.y } else if (src === 1) {
          tgtX = w * (0.5 + 0.32 * Math.sin(0.37 * liveTime))
          tgtY = h * (0.5 + 0.28 * Math.sin(0.53 * liveTime + 1.2))
        } else if (src === 2) { tgtX = pointerX; tgtY = pointerY }
        const snap = src !== 0 && prevSrc === 0 && influence < 0.05
        prevSrc = src

        if (snap) { cx = tgtX; cy = tgtY; pcx = cx; pcy = cy; vcx = 0; vcy = 0 } else {
          pcx = cx; pcy = cy
          cx += (tgtX - cx) * K_CURSOR
          cy += (tgtY - cy) * K_CURSOR
          vcx += ((cx - pcx) / STEP - vcx) * K_VEL
          vcy += ((cy - pcy) / STEP - vcy) * K_VEL
        }

        influence += ((src !== 0 ? 1 : 0) - influence) * (src !== 0 ? K_IN : K_OUT)
        const infl = influence

        const vcMag = Math.sqrt(vcx * vcx + vcy * vcy)
        const a = obsR + Math.min(vcMag * 0.025, 36)
        curA = a

        if (infl > 0.3 && vcMag > 60) {
          const dxm = cx - pcx, dym = cy - pcy
          shedAcc += Math.sqrt(dxm * dxm + dym * dym)
          let guard = 0
          while (shedAcc >= 28 && guard < 4) { shedAcc -= 28; guard++; spawnPuff(a, vcMag) }
          if (shedAcc >= 28) shedAcc = 0
        } else shedAcc = 0

        aCount = 0
        const puffDrift = 0.5 * 115 * flow * STEP
        for (let j = 0; j < PUFFS; j++) {
          if (pAlive[j] === 0) continue
          const age = pAge[j] + STEP
          if (age > 2.4) { pAlive[j] = 0; continue }
          pAge[j] = age
          pGamma[j] *= PUFF_DECAY
          pY[j] += puffDrift
          const c2 = 676 + 90 * age
          aX[aCount] = pX[j]; aY[aCount] = pY[j]; aG[aCount] = pGamma[j] / TAU; aC2[aCount] = c2; aR2[aCount] = 36 * c2
          aCount++
        }

        const ph0 = WAVE_0.om * simTime + WAVE_0.ph
        const ph1 = WAVE_1.om * simTime + WAVE_1.ph
        const ph2 = WAVE_2.om * simTime + WAVE_2.ph
        const obsOn = infl > 0.002
        const projectOn = infl > 0.05
        const projScale = Math.min(1, infl * 1.5)
        const respawnBottom = h + 40
        const respawnRight = w + 120

        for (let i = 0; i < active; i++) {
          const x0 = px[i], y0 = py[i], z = pz[i]
          const v0e = v0[i] * flow
          const c0 = Math.cos(WAVE_0.kx * x0 + WAVE_0.ky * y0 + ph0)
          const c1 = Math.cos(WAVE_1.kx * x0 + WAVE_1.ky * y0 + ph1)
          const c2 = Math.cos(WAVE_2.kx * x0 + WAVE_2.ky * y0 + ph2)
          let tx = (WAVE_0.au * c0 + WAVE_1.au * c1 + WAVE_2.au * c2) * z
          let ty = v0e + (WAVE_0.av * c0 + WAVE_1.av * c1 + WAVE_2.av * c2) * z

          const zf = 0.55 + 0.45 * z
          const aE = a * zf
          const rx = x0 - cx, ry = y0 - cy
          let pertX = 0, pertY = 0, deficit = 0

          if (obsOn) {
            const d2 = rx * rx + ry * ry
            let Ux = -vcx, Uy = v0e - vcy
            let U = Math.sqrt(Ux * Ux + Uy * Uy)
            if (U > 1e-3) {
              if (U > 900) { const sc = 900 / U; Ux *= sc; Uy *= sc; U = 900 }
              const ex = Ux / U, ey = Uy / U
              const s = rx * ex + ry * ey
              const n = -rx * ey + ry * ex
              if (s > 0 && s < 12 * aE) {
                const wd = 0.9 * aE + 0.2 * s
                const nn = n / wd
                deficit = 0.55 * Math.exp(-s / (3 * aE)) * Math.exp(-nn * nn)
              }
              const near = 9 * aE
              if (d2 < near * near) {
                const rho2 = Math.max(s * s + n * n, aE * aE * 0.64)
                const k = (aE * aE) / (rho2 * rho2)
                const ds = -U * k * (s * s - n * n)
                const dn = -U * k * 2 * s * n
                let win = 1
                const inner = 5 * aE
                if (d2 > inner * inner) { const t = (Math.sqrt(d2) - inner) / (4 * aE); win = 1 - t * t * (3 - 2 * t) }
                pertX = (ds * ex - dn * ey) * win
                pertY = (ds * ey + dn * ex) * win
              }
            }
          }

          let vorX = 0, vorY = 0
          for (let j = 0; j < aCount; j++) {
            const dx = x0 - aX[j], dy = y0 - aY[j]
            const d2p = dx * dx + dy * dy + 1e-3
            const r2 = aR2[j]
            if (d2p < r2) {
              const f = (aG[j] * (1 - Math.exp(-d2p / aC2[j]))) / d2p
              const wnd = 1 - d2p / r2
              const fw = f * wnd * wnd * zf
              vorX += -dy * fw
              vorY += dx * fw
            }
          }

          const keep = 1 - deficit * infl
          tx = tx * keep + pertX * infl + vorX
          ty = ty * keep + pertY * infl + vorY

          let ux = vx[i] + (tx - vx[i]) * K_RELAX
          let uy = vy[i] + (ty - vy[i]) * K_RELAX
          const sp2 = ux * ux + uy * uy
          if (sp2 > 810000) { const sc = 900 / Math.sqrt(sp2); ux *= sc; uy *= sc }
          let x = x0 + ux * STEP
          let y = y0 + uy * STEP

          if (projectOn) {
            const aP = aE * projScale
            const qx = x - cx, qy = y - cy
            const q2 = qx * qx + qy * qy
            const lim = 0.98 * aP
            if (q2 < lim * lim) {
              const rr = Math.sqrt(q2)
              const nx = rr < 1e-3 ? 0 : qx / rr
              const ny = rr < 1e-3 ? 1 : qy / rr
              x = cx + nx * aP; y = cy + ny * aP
              const vn = (ux - vcx) * nx + (uy - vcy) * ny
              if (vn < 0) { ux -= vn * nx; uy -= vn * ny }
            }
          }

          vx[i] = ux; vy[i] = uy; px[i] = x; py[i] = y

          if (y > respawnBottom || x < -120 || x > respawnRight || y < -600) { seedParticle(i, false); continue }

          qv[i] += (Math.sqrt(ux * ux + uy * uy) / v0e - qv[i]) * K_Q
          if (rand() < FIRE_P) fire[i] = 1
          else { const f = fire[i] * FIRE_DECAY; fire[i] = f < 0.01 ? 0 : f }

          const slot = i * L + head
          hx[slot] = x; hy[slot] = y
        }
      }

      const render = () => {
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
        ctx.clearRect(0, 0, w, h)
        ctx.globalCompositeOperation = 'lighter'
        ctx.lineCap = 'round'
        ctx.lineJoin = 'round'

        if (influence > 0.02 && haloGradient) {
          const speed = Math.sqrt(vcx * vcx + vcy * vcy)
          const r = 1.5 * curA
          ctx.globalAlpha = Math.min(1, (0.05 + Math.min(speed / 4000, 0.07)) * influence)
          ctx.setTransform(dpr * r, 0, 0, dpr * r, dpr * cx, dpr * cy)
          ctx.fillStyle = haloGradient
          ctx.fillRect(-1, -1, 2, 2)
          ctx.globalAlpha = 1
          ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
        }

        groupCount.fill(0)
        for (let i = 0; i < active; i++) {
          const qq = qv[i]
          let b = qq < 1.25 ? 0 : qq < 1.85 ? 1 : 2
          if (fire[i] > 0.35 && b < 2) b++
          const g = (pz[i] < 0.62 ? 0 : 3) + b
          groupList[g][groupCount[g]++] = i
        }

        for (let g = 0; g < 6; g++) {
          const cnt = groupCount[g]
          if (cnt === 0) continue
          const list = groupList[g]
          for (let ab = 0; ab < AGE_BUCKETS; ab++) {
            const k0 = ab * SEGS_PER_BUCKET
            const k1 = k0 + SEGS_PER_BUCKET
            ctx.strokeStyle = strokeStyles[g * AGE_BUCKETS + ab]
            ctx.lineWidth = strokeWidths[g * AGE_BUCKETS + ab]
            ctx.beginPath()
            for (let j = 0; j < cnt; j++) {
              const i = list[j]
              const segs = len[i] - 1
              if (k0 >= segs) continue
              const base = i * L
              const kEnd = Math.min(k1, segs)
              let idx = (head - k0 + L) % L
              ctx.moveTo(hx[base + idx], hy[base + idx])
              for (let k = k0; k < kEnd; k++) {
                idx = idx === 0 ? L - 1 : idx - 1
                ctx.lineTo(hx[base + idx], hy[base + idx])
              }
            }
            ctx.stroke()
          }
        }

        const prevHead = head === 0 ? L - 1 : head - 1
        ctx.lineWidth = HEAD_WIDTH
        for (let depth = 0; depth < 2; depth++) {
          ctx.strokeStyle = headStyles[depth]
          ctx.beginPath()
          for (let b = 1; b < 3; b++) {
            const g = depth * 3 + b
            const cnt = groupCount[g]
            const list = groupList[g]
            for (let j = 0; j < cnt; j++) {
              const i = list[j]
              if (b === 1 && fire[i] <= 0.5) continue
              const base = i * L
              ctx.moveTo(hx[base + head], hy[base + head])
              ctx.lineTo(hx[base + prevHead], hy[base + prevHead])
            }
          }
          ctx.stroke()
        }

        bctx.clearRect(0, 0, bw, bh)
        bctx.drawImage(main, 0, 0, bw, bh)
      }

      const presim = (seconds) => { const n = Math.round(seconds / STEP); for (let s = 0; s < n; s++) simulate() }

      const rebuildStatic = () => {
        seedAll()
        active = 0
        applyCount(true)
        const f = readFocus()
        pointerActive = true
        pointerX = f ? f.x : w * 0.4
        pointerY = f ? f.y : h * 0.45
        tgtX = pointerX; tgtY = pointerY
        cx = pcx = pointerX; cy = pcy = pointerY
        vcx = 0; vcy = 0; influence = 1; prevSrc = 2; aCount = 0
        pAlive.fill(0)
        presim(3)
        render()
      }

      const resize = () => {
        const rect = root.getBoundingClientRect()
        const nw = Math.max(1, rect.width || window.innerWidth)
        const nh = Math.max(1, rect.height || window.innerHeight)
        let d = Math.min(window.devicePixelRatio || 1, 2)
        if (nw * nh * d * d > 4.5e6) d = Math.sqrt(4.5e6 / (nw * nh))
        focusRect = readFocus()
        if (nw === w && nh === h && d === dpr) return
        w = nw; h = nh; dpr = d
        main.width = Math.max(1, Math.round(w * dpr))
        main.height = Math.max(1, Math.round(h * dpr))
        bw = Math.max(1, Math.ceil(w / 4))
        bh = Math.max(1, Math.ceil(h / 4))
        bloom.width = bw
        bloom.height = bh
        bctx.imageSmoothingEnabled = true
        bctx.imageSmoothingQuality = 'medium'
        if (!initialised) return
        if (reduced) { rebuildStatic(); return }
        for (let i = 0; i < active; i++) if (px[i] < -120 || px[i] > w + 120 || py[i] > h + 40) seedParticle(i, false)
        applyCount(true)
        render()
      }

      // المؤشر يؤثر فقط وهو فوق القسم
      const onMove = (e) => {
        const r = root.getBoundingClientRect()
        const inside = e.clientX >= r.left && e.clientX <= r.right && e.clientY >= r.top && e.clientY <= r.bottom
        if (!inside) { onLeave(); return }
        pointerX = e.clientX - r.left
        pointerY = e.clientY - r.top
        pointerActive = true
      }
      const onLeave = () => {
        if (!pointerActive) return
        pointerActive = false
        idleSince = liveTime
        idleDelay = 4
      }
      const onUp = (e) => { if (e.pointerType !== 'mouse') onLeave() }

      const frame = (now) => {
        if (disposed) return
        const dtRaw = Math.max(0, now - last)
        last = now
        acc += Math.min(0.05, dtRaw / 1000)
        const t0 = performance.now()
        let n = 0
        while (acc >= STEP && n < 3) { simulate(); acc -= STEP; n++ }
        if (n === 3) acc = 0
        if (n > 0) render()
        const work = performance.now() - t0

        // جودة متكيّفة: تقليل عدد الخطوط عند بطء الإطارات
        if (dtRaw > 0 && dtRaw < 100) { frameEma += (dtRaw - frameEma) * 0.05; workEma += (work - workEma) * 0.05 }
        if (frameEma > 20) { slowFrames++; fastFrames = 0 } else if (frameEma < 18.5 && workEma < 12) { fastFrames++; slowFrames = 0 } else { slowFrames = 0; fastFrames = 0 }
        if (slowFrames >= 60 && quality > 0.4) { quality = Math.max(0.4, quality - 0.1); slowFrames = 0; applyCount(false) } else if (fastFrames >= 180 && quality < 1) { quality = Math.min(1, quality + 0.05); fastFrames = 0; applyCount(false) }

        raf = requestAnimationFrame(frame)
      }

      const start = () => {
        cancelAnimationFrame(raf)
        last = performance.now()
        acc = 0
        raf = requestAnimationFrame(frame)
      }
      const pause = () => { cancelAnimationFrame(raf); raf = 0 }
      const sync = () => { if (live && !disposed && visible && !document.hidden) start(); else pause() }

      resize()
      buildStyles()
      seedAll()
      applyCount(true)
      cx = pcx = tgtX = w * 0.5
      cy = pcy = tgtY = h * 0.5

      const ro = new ResizeObserver(() => resize())
      ro.observe(root)
      const io = new IntersectionObserver(([e]) => { visible = e.isIntersecting; sync() })
      io.observe(root)

      if (reduced) {
        initialised = true
        rebuildStatic()
      } else {
        presim(1)
        render()
        initialised = true
        live = true
        window.addEventListener('pointermove', onMove, { passive: true })
        window.addEventListener('pointerdown', onMove, { passive: true })
        window.addEventListener('pointerup', onUp, { passive: true })
        window.addEventListener('pointercancel', onLeave, { passive: true })
        window.addEventListener('blur', onLeave)
        document.addEventListener('visibilitychange', sync)
        start()
      }

      return () => {
        disposed = true
        live = false
        pause()
        window.removeEventListener('pointermove', onMove)
        window.removeEventListener('pointerdown', onMove)
        window.removeEventListener('pointerup', onUp)
        window.removeEventListener('pointercancel', onLeave)
        window.removeEventListener('blur', onLeave)
        document.removeEventListener('visibilitychange', sync)
        ro.disconnect()
        io.disconnect()
        haloGradient = null
      }
    }
  }
}
</script>

<style scoped>
.dr-root { position: absolute; inset: 0; overflow: hidden; pointer-events: none; opacity: 0; animation: dr-fade-in 1.6s ease .2s forwards; }
.dr-root canvas { position: absolute; inset: 0; width: 100%; height: 100%; }
.dr-bloom { filter: blur(10px); opacity: .7; }
@keyframes dr-fade-in { to { opacity: 1; } }
@media (prefers-reduced-motion: reduce) { .dr-root { animation: none; opacity: 1; } }
</style>
