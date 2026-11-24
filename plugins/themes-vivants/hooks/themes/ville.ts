import type { LivingTheme } from './types'

import { makeColors } from '../make-colors.js'


// Coût (en dollars) auquel toute la ville est allumée.
const FULL_CITY_USD = 10
const MIN_LIT = 6

const { theme, problems } = makeColors({
  label: 'Ville néon',
  only: 'dark',
  roles: { accent: '#4fd8f0', danger: '#ff6b6b', success: '#5fe0a0', warning: '#ffc04d', pro: '#e46cf0' },
  dark: {
    gray: {
      anchors: {
        'surface-0': '#120f1e',
        'surface-1': '#171327',
        'surface-2': '#1c1730',
        'surface-3': '#211b38',
        'text-primary': '#eee9f8',
        'text-secondary': '#cbc3dd',
        'text-muted': '#a79ebc',
      },
    },
  },
})


function rand(seed: number): number {
  const x = Math.sin(seed * 12.9898 + 78.233) * 43758.5453

  return x - Math.floor(x)
}

// Racine carrée : les premiers centimes allument vite, puis la ville se remplit plus lentement.
export function litFor(usd: number): number {
  const share = Math.sqrt(Math.min(1, Math.max(0, usd) / FULL_CITY_USD))

  return Math.round((MIN_LIT + (100 - MIN_LIT) * share) / 5) * 5
}

type Building = { x: number; w: number; h: number }

function buildings(seed: number, count: number, minH: number, maxH: number): Building[] {
  const list: Building[] = []
  let x = -30
  for (let i = 0; i < count && x < 1630; i++) {
    const w = 90 + rand(seed + i) * 110
    list.push({ x, w, h: minH + rand(seed + i + 40) * (maxH - minH) })
    x += w + 6 + rand(seed + i + 80) * 14
  }

  return list
}

// Les fenêtres allumées, en quatre tracés (chaud ou froid, vif ou tamisé) pour rester légères.
type Panes = [string, string, string, string]

function windows(b: Building, idx: number, ground: number, share: number, panes: Panes): void {
  const cols = Math.max(2, Math.floor((b.w - 16) / 18))
  const rows = Math.floor((b.h - 30) / 24)
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const seed = idx * 1000 + r * 37 + c
      // Chaque fenêtre a son seuil : une fenêtre allumée le reste quand la ville grandit.
      if (rand(seed) * 100 >= share) {
        continue
      }
      const slot = (rand(seed + 7) > 0.35 ? 0 : 2) + (rand(seed + 9) > 0.5 ? 0 : 1)
      panes[slot] += `M${(b.x + 10 + c * 18).toFixed(0)} ${(ground - b.h + 18 + r * 24).toFixed(0)}h9v13h-9z`
    }
  }
}

function paneLayer(panes: Panes): string {
  const look = [['#ffc978', 0.9], ['#ffc978', 0.55], ['#8fd8ff', 0.9], ['#8fd8ff', 0.55]] as const

  return panes.map((d, i) => {
    const [fill, opacity] = look[i] ?? look[0]

    return d === '' ? '' : `<path d="${d}" fill="${fill}" opacity="${opacity}"/>`
  }).join('')
}

function neon(x: number, y: number, kind: number, color: string, delay: number): string {
  const shapes = [
    `<circle cx="${x}" cy="${y}" r="34"/><path d="M${x - 16} ${y}H${x + 16}"/>`,
    `<path d="M${x - 10} ${y - 40}V${y + 40}M${x + 10} ${y - 40}V${y + 40}"/>`,
    `<path d="M${x - 38} ${y + 22}L${x} ${y - 28}L${x + 38} ${y + 22}Z"/>`,
    `<rect x="${x - 40}" y="${y - 20}" width="80" height="40" rx="20"/>`,
  ]
  const shape = shapes[kind % shapes.length]

  return `<rect x="${x - 50}" y="${y - 50}" width="100" height="100" rx="8" fill="#0c0a16"/><g class="neon" style="animation-delay:-${delay.toFixed(1)}s" fill="none" stroke="${color}" stroke-linecap="round" stroke-linejoin="round">`
    + `<g stroke-width="14" opacity="0.18">${shape}</g><g stroke-width="7" opacity="0.35">${shape}</g><g stroke-width="2.5">${shape}</g></g>`
}

function scene(share: number): string {
  const ground = 700
  const far = buildings(10, 30, 220, 430)
  const near = buildings(500, 16, 160, 360)
  const farD = far.map(b => `M${b.x.toFixed(0)} ${ground}V${(ground - b.h).toFixed(0)}H${(b.x + b.w).toFixed(0)}V${ground}Z`).join(' ')
  const farPanes: Panes = ['', '', '', '']
  far.forEach((b, i) => windows(b, i + 100, ground, share * 0.8, farPanes))
  const nearBody = near.map(b => `<rect x="${b.x.toFixed(0)}" y="${(ground - b.h).toFixed(0)}" width="${b.w.toFixed(0)}" height="${b.h.toFixed(0)}" fill="#0c0a16"/>`).join('')
  const nearPanes: Panes = ['', '', '', '']
  near.forEach((b, i) => windows(b, i, ground, share, nearPanes))
  const colors = ['#ff4fa3', '#4fd8f0', '#c46cff', '#ff9f4f']
  const signs = near
    .filter((_, i) => i % 2 === 1)
    .map((b, i) => neon(Math.round(b.x + b.w / 2), Math.round(ground - b.h + 80), i, colors[i % colors.length] ?? '#ff4fa3', rand(i + 700) * 6))
    .join('')
  const reflections = near
    .filter((_, i) => i % 2 === 1)
    .map((b, i) => `<rect class="refl" x="${(b.x + b.w / 2 - 30).toFixed(0)}" y="${ground + 6}" width="60" height="190" fill="url(#r${i % colors.length})" style="animation-delay:-${(rand(i + 800) * 5).toFixed(1)}s"/>`)
    .join('')
  const drops = Array.from({ length: 50 }, (_, i) => {
    const x = rand(i + 900) * 1700 - 50

    return `<line class="rain" x1="${x.toFixed(0)}" y1="-30" x2="${(x - 3).toFixed(0)}" y2="-6" style="animation-duration:${(1.6 + rand(i + 950) * 0.8).toFixed(2)}s;animation-delay:-${(rand(i + 990) * 3).toFixed(2)}s"/>`
  }).join('')
  const reflGrad = colors.map((c, i) => `<linearGradient id="r${i}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${c}" stop-opacity="0.45"/><stop offset="1" stop-color="${c}" stop-opacity="0"/></linearGradient>`).join('')

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1600 900" preserveAspectRatio="xMidYMid slice">
<defs>
<linearGradient id="sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#0b0916"/><stop offset="0.65" stop-color="#261a40"/><stop offset="1" stop-color="#4a2350"/></linearGradient>
<linearGradient id="street" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#1a1428"/><stop offset="1" stop-color="#07060d"/></linearGradient>
${reflGrad}
</defs>
<style>
.neon { animation: hum 6s ease-in-out infinite alternate; }
.refl { animation: shimmer 5s ease-in-out infinite alternate; opacity: 0.8; }
.rain { stroke: #b9b0d6; stroke-width: 1.2; stroke-linecap: round; opacity: 0.25; animation-name: fall; animation-timing-function: linear; animation-iteration-count: infinite; }
@keyframes hum { from { opacity: 0.78; } to { opacity: 1; } }
@keyframes shimmer { from { opacity: 0.55; transform: translateX(-3px); } to { opacity: 0.9; transform: translateX(3px); } }
@keyframes fall { from { transform: translate(0px, 0px); } to { transform: translate(-36px, 960px); } }
</style>
<!-- ciel -->
<rect width="1600" height="900" fill="url(#sky)"/>
<!-- ville lointaine -->
<path d="${farD}" fill="#1a1430"/>
${paneLayer(farPanes)}
<!-- ville proche -->
${nearBody}
${paneLayer(nearPanes)}
${signs}
<!-- rue mouillée -->
<rect y="${ground}" width="1600" height="${900 - ground}" fill="url(#street)"/>
${reflections}
<!-- pluie -->
${drops}
</svg>`
}

export const ville: LivingTheme = {
  id: 'ville',
  label: 'Ville néon',
  signal: "les fenêtres s'allument avec le coût de la session",
  needs: ['lit'],
  colors: theme,
  problems,
  tint: '#120f1e',
  scene: (s) => scene(s.lit),
  alt: (s) => `Ville de nuit sous la pluie, enseignes néon, ${s.lit} % des fenêtres allumées`,
}
