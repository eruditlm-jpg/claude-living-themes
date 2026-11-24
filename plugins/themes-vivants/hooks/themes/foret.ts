import type { LivingTheme } from './types'

import { makeColors } from '../make-colors.js'


const MAX_STORM = 10
// Un échec pèse plus lourd qu'une réussite : il faut 3 réussites pour effacer 1 échec.
const FAIL_STEP = 3
const OK_STEP = 1

const { theme, problems } = makeColors({
  label: 'Forêt sous la pluie',
  only: 'dark',
  roles: { accent: '#7fb7d6', danger: '#e07a6a', success: '#7cc47f', warning: '#d9b45a', pro: '#a993d6' },
  dark: {
    gray: {
      anchors: {
        'surface-0': '#0f1714',
        'surface-1': '#141e1a',
        'surface-2': '#192520',
        'surface-3': '#1e2c26',
        'text-primary': '#e6eee8',
        'text-secondary': '#c2cfc6',
        'text-muted': '#9eada3',
      },
    },
  },
})


function rand(seed: number): number {
  const x = Math.sin(seed * 12.9898 + 78.233) * 43758.5453

  return x - Math.floor(x)
}

function dropsFor(level: number): number {
  return 14 + level * 11
}

// Une rangée de sapins : des triangles empilés le long d'une ligne d'horizon.
function treeLine(seed: number, base: number, height: number, count: number, color: string): string {
  let d = ''
  for (let i = 0; i < count; i++) {
    const x = (i / count) * 1700 - 50 + rand(seed + i) * 30
    const h = height * (0.65 + rand(seed + i + 50) * 0.5)
    const w = h * 0.32
    d += `M${x.toFixed(0)} ${(base - h).toFixed(0)} L${(x + w).toFixed(0)} ${base} L${(x - w).toFixed(0)} ${base}Z `
  }

  return `<path d="${d}" fill="${color}"/><rect x="0" y="${base}" width="1600" height="${900 - base}" fill="${color}"/>`
}

function drop(i: number, level: number): string {
  const x = rand(i + 4000) * 1700 - 50
  const len = 14 + rand(i + 4100) * 16 + level
  const dur = 1.5 + rand(i + 4200) * 0.9 - level * 0.04
  const delay = -(rand(i + 4300) * 3).toFixed(2)

  return `<line class="rain" x1="${x.toFixed(0)}" y1="-40" x2="${(x - 4).toFixed(0)}" y2="${(-40 + len).toFixed(0)}" style="animation-duration:${dur.toFixed(2)}s;animation-delay:${delay}s"/>`
}

function ripple(i: number): string {
  const x = 80 + rand(i + 5000) * 1440
  const y = 820 + rand(i + 5100) * 60
  const dur = 2.6 + rand(i + 5200) * 2
  const delay = -(rand(i + 5300) * 4).toFixed(2)

  return `<ellipse class="rip" cx="${x.toFixed(0)}" cy="${y.toFixed(0)}" rx="16" ry="4" style="animation-duration:${dur.toFixed(1)}s;animation-delay:${delay}s"/>`
}

function scene(level: number): string {
  const t = level / MAX_STORM
  // Le ciel s'assombrit et la lueur faiblit avec l'orage.
  const skyTop = t > 0.5 ? '#0a110f' : '#16231f'
  const skyLow = t > 0.5 ? '#1c2a26' : '#2e4640'
  const glow = (0.45 * (1 - t) + 0.05).toFixed(2)
  const mist = (0.18 + t * 0.32).toFixed(2)
  const drops = Array.from({ length: dropsFor(level) }, (_, i) => drop(i, level)).join('')
  const ripples = Array.from({ length: 6 + level * 2 }, (_, i) => ripple(i)).join('')

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1600 900" preserveAspectRatio="xMidYMid slice">
<defs>
<linearGradient id="sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${skyTop}"/><stop offset="1" stop-color="${skyLow}"/></linearGradient>
<radialGradient id="glow"><stop offset="0" stop-color="#dfe9d8" stop-opacity="${glow}"/><stop offset="1" stop-color="#dfe9d8" stop-opacity="0"/></radialGradient>
<linearGradient id="mist" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#9fb5ab" stop-opacity="0"/><stop offset="0.5" stop-color="#9fb5ab" stop-opacity="${mist}"/><stop offset="1" stop-color="#9fb5ab" stop-opacity="0"/></linearGradient>
</defs>
<style>
.rain { stroke: #a9c4d4; stroke-width: 1.4; stroke-linecap: round; opacity: 0.32; animation-name: fall; animation-timing-function: linear; animation-iteration-count: infinite; }
.rip { fill: none; stroke: #a9c4d4; stroke-width: 1; opacity: 0; transform-box: fill-box; transform-origin: center; animation-name: rip; animation-timing-function: ease-out; animation-iteration-count: infinite; }
.m1 { animation: drift 60s ease-in-out infinite alternate; }
.m2 { animation: drift 45s ease-in-out infinite alternate-reverse; }
.sway { transform-box: fill-box; transform-origin: 50% 100%; animation: sway 12s ease-in-out infinite alternate; }
@keyframes fall { from { transform: translate(0px, 0px); } to { transform: translate(-40px, 960px); } }
@keyframes rip { 0% { transform: scale(0.2); opacity: 0.4; } 100% { transform: scale(1.6); opacity: 0; } }
@keyframes drift { from { transform: translateX(-120px); } to { transform: translateX(120px); } }
@keyframes sway { from { transform: rotate(-0.4deg); } to { transform: rotate(0.4deg); } }
</style>
<!-- ciel -->
<rect width="1600" height="900" fill="url(#sky)"/>
<circle cx="300" cy="190" r="260" fill="url(#glow)"/>
<!-- forêt lointaine -->
${treeLine(100, 560, 230, 34, '#1d2e29')}
<rect class="m1" x="-200" y="470" width="2000" height="140" fill="url(#mist)"/>
<!-- forêt moyenne -->
<g class="sway">${treeLine(200, 690, 320, 22, '#14211d')}</g>
<rect class="m2" x="-200" y="620" width="2000" height="120" fill="url(#mist)"/>
<!-- forêt proche et sol -->
${treeLine(300, 820, 460, 12, '#0b1311')}
<!-- flaques -->
${ripples}
<!-- pluie -->
${drops}
</svg>`
}

export const foret: LivingTheme = {
  id: 'foret',
  label: 'Forêt sous la pluie',
  signal: "les outils en échec épaississent l'orage, les réussites l'éclaircissent",
  needs: ['storm'],
  colors: theme,
  problems,
  tint: '#0f1714',
  scene: (s) => scene(s.storm),
  alt: (s) => `Forêt de sapins dans la brume, orage à ${s.storm} sur 10`,
}
