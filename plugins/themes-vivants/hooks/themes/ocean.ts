import type { LivingTheme } from './types'

import { makeColors } from '../make-colors.js'


const MIN_PLANKTON = 6
const MAX_PLANKTON = 80
// Ligne d'eau : basse à 0 %, haute à 100 %.
const LOW_WATER = 660
const HIGH_WATER = 430

const { theme, problems } = makeColors({
  label: 'Océan nocturne',
  only: 'dark',
  roles: { accent: '#4fd1c5', danger: '#ef7b6b', success: '#5fc28f', warning: '#e3b65c', pro: '#9b8cf0' },
  dark: {
    gray: {
      anchors: {
        'surface-0': '#0b1424',
        'surface-1': '#101b2e',
        'surface-2': '#152238',
        'surface-3': '#1a2941',
        'text-primary': '#e8eef6',
        'text-secondary': '#c3cfdd',
        'text-muted': '#9eacbe',
      },
    },
  },
})


function rand(seed: number): number {
  const x = Math.sin(seed * 12.9898 + 78.233) * 43758.5453

  return x - Math.floor(x)
}

function planktonFor(count: number): number {
  return Math.min(MAX_PLANKTON, MIN_PLANKTON + count)
}

function waterLine(percent: number): number {
  return Math.round(LOW_WATER - (LOW_WATER - HIGH_WATER) * Math.min(1, percent / 100))
}

// Une vague qui se répète tous les 200 unités, assez large pour glisser sans couture.
function wave(amp: number, period: number): string {
  let d = `M-${period} 0`
  for (let x = -period; x < 1600 + period * 2; x += period) {
    d += ` Q${x + period / 4} ${-amp} ${x + period / 2} 0 T${x + period} 0`
  }

  return `${d} V900 H-${period}Z`
}

function plankton(i: number, top: number): string {
  const x = rand(i + 3000) * 1600
  const y = top + 30 + rand(i + 3100) * (880 - top - 30)
  const r = 1.4 + rand(i + 3200) * 1.8
  const pulse = 4 + rand(i + 3300) * 5
  const delay = -(rand(i + 3400) * 12).toFixed(2)
  const style = `animation-duration:${pulse.toFixed(1)}s;animation-delay:${delay}s`

  return `<g class="bob" style="animation-duration:${(pulse * 2.3).toFixed(1)}s;animation-delay:${delay}s">`
    + `<circle class="pk" cx="${x.toFixed(0)}" cy="${y.toFixed(0)}" r="${(r * 5).toFixed(1)}" fill="url(#bio)" style="${style}"/>`
    + `<circle class="pk" cx="${x.toFixed(0)}" cy="${y.toFixed(0)}" r="${r.toFixed(1)}" fill="#c9fff6" style="${style}"/>`
    + `</g>`
}

function scene(percent: number, count: number): string {
  const top = waterLine(percent)
  const stars = Array.from({ length: 70 }, (_, i) =>
    `<circle class="tw" cx="${(rand(i + 10) * 1600).toFixed(0)}" cy="${(rand(i + 20) * (top - 40)).toFixed(0)}" r="${(0.5 + rand(i + 30) * 1.1).toFixed(1)}" fill="#e8eef6" style="animation-duration:${(5 + rand(i + 40) * 6).toFixed(1)}s;animation-delay:-${(rand(i + 50) * 9).toFixed(1)}s"/>`,
  ).join('')
  const glints = Array.from({ length: 22 }, (_, i) => {
    const y = top + 14 + i * ((900 - top) / 24)
    const w = 30 + (i / 22) * 140 * rand(i + 60) + 20
    const x = 1240 - w / 2 + (rand(i + 70) - 0.5) * (20 + i * 6)

    return `<rect class="gl" x="${x.toFixed(0)}" y="${y.toFixed(0)}" width="${w.toFixed(0)}" height="2.4" rx="1.2" fill="#f6efd2" style="animation-duration:${(3.5 + rand(i + 80) * 3).toFixed(1)}s;animation-delay:-${(rand(i + 90) * 6).toFixed(1)}s"/>`
  }).join('')
  const pk = Array.from({ length: planktonFor(count) }, (_, i) => plankton(i, top)).join('')

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1600 900" preserveAspectRatio="xMidYMid slice">
<defs>
<linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
<stop offset="0" stop-color="#060c18"/><stop offset="0.6" stop-color="#0f1e36"/><stop offset="1" stop-color="#1c3352"/>
</linearGradient>
<linearGradient id="sea" x1="0" y1="0" x2="0" y2="1">
<stop offset="0" stop-color="#14304a"/><stop offset="1" stop-color="#050b16"/>
</linearGradient>
<radialGradient id="halo"><stop offset="0" stop-color="#f6efd2" stop-opacity="0.35"/><stop offset="1" stop-color="#f6efd2" stop-opacity="0"/></radialGradient>
<radialGradient id="bio"><stop offset="0" stop-color="#5ff0dc" stop-opacity="0.8"/><stop offset="0.4" stop-color="#2bb8b0" stop-opacity="0.3"/><stop offset="1" stop-color="#2bb8b0" stop-opacity="0"/></radialGradient>
</defs>
<style>
.tw { animation-name: tw; animation-iteration-count: infinite; animation-direction: alternate; animation-timing-function: ease-in-out; opacity: 0.6; }
.gl { animation-name: gl; animation-iteration-count: infinite; animation-direction: alternate; animation-timing-function: ease-in-out; opacity: 0.5; }
.pk { animation-name: pk; animation-iteration-count: infinite; animation-direction: alternate; animation-timing-function: ease-in-out; opacity: 0.6; }
.bob { animation-name: bob; animation-iteration-count: infinite; animation-direction: alternate; animation-timing-function: ease-in-out; }
.w1 { animation: roll 26s linear infinite; }
.w2 { animation: roll 18s linear infinite reverse; }
.w3 { animation: roll2 13s linear infinite; }
.swell { animation: swell 7s ease-in-out infinite alternate; }
@keyframes tw { from { opacity: 0.2; } to { opacity: 0.85; } }
@keyframes gl { from { opacity: 0.15; } to { opacity: 0.7; } }
@keyframes pk { from { opacity: 0.1; } to { opacity: 0.9; } }
@keyframes bob { from { transform: translate(0px, 0px); } to { transform: translate(14px, -10px); } }
@keyframes roll { from { transform: translateX(0px); } to { transform: translateX(-240px); } }
@keyframes roll2 { from { transform: translateX(0px); } to { transform: translateX(-160px); } }
@keyframes swell { from { transform: translateY(-4px); } to { transform: translateY(6px); } }
</style>
<!-- ciel et lune -->
<rect width="1600" height="900" fill="url(#sky)"/>
${stars}
<circle cx="1240" cy="${Math.max(120, top - 300)}" r="170" fill="url(#halo)"/>
<circle cx="1240" cy="${Math.max(120, top - 300)}" r="46" fill="#f6efd2"/>
<circle cx="1226" cy="${Math.max(120, top - 300) - 10}" r="9" fill="#e4dbb8" opacity="0.6"/>
<circle cx="1256" cy="${Math.max(120, top - 300) + 14}" r="6" fill="#e4dbb8" opacity="0.5"/>
<!-- mer -->
<g class="swell"><g transform="translate(0 ${top})">
<g class="w1"><path d="${wave(10, 240)}" fill="#163650"/></g>
</g></g>
<g transform="translate(0 ${top + 18})">
<g class="w2"><path d="${wave(8, 240)}" fill="url(#sea)"/></g>
</g>
${glints}
<g transform="translate(0 ${top + 60})">
<g class="w3"><path d="${wave(6, 160)}" fill="#08121f" opacity="0.7"/></g>
</g>
<!-- plancton -->
${pk}
</svg>`
}

export const ocean: LivingTheme = {
  id: 'ocean',
  label: 'Océan nocturne',
  signal: "la marée monte avec le contexte, le plancton s'allume au fil des outils",
  needs: ['ctx', 'calls'],
  colors: theme,
  problems,
  tint: '#0b1424',
  scene: (s) => scene(s.ctx, s.calls),
  alt: (s) => `Océan sous la lune, marée à ${s.ctx} %, ${planktonFor(s.calls)} points de plancton lumineux`,
}
