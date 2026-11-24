import type { LivingTheme } from './types'

import { makeColors } from '../make-colors.js'


const MIN_FLIES = 10
const MAX_FLIES = 90

// Palette du crépuscule : indigo profond, lavande, ambre des lucioles.
const { theme, problems } = makeColors({
  label: 'Prairie crépusculaire',
  only: 'dark',
  roles: { accent: '#f2b54a', danger: '#e0675a', success: '#8fbf6a', warning: '#e8a33c', pro: '#b394e0' },
  dark: {
    gray: {
      anchors: {
        'surface-0': '#16132a',
        'surface-1': '#1d1934',
        'surface-2': '#24203d',
        'surface-3': '#2b2646',
        'text-primary': '#f4ead8',
        'text-secondary': '#d6cbb8',
        'text-muted': '#b2a795',
      },
    },
  },
})


// Générateur pseudo-aléatoire stable : chaque luciole garde sa place d'un rendu à l'autre.
function rand(seed: number): number {
  const x = Math.sin(seed * 12.9898 + 78.233) * 43758.5453

  return x - Math.floor(x)
}

function fliesFor(percent: number): number {
  return Math.round(MIN_FLIES + (MAX_FLIES - MIN_FLIES) * Math.min(1, percent / 100))
}

function firefly(i: number): string {
  const x = 40 + rand(i) * 1520
  const y = 330 + rand(i + 101) * 520
  const r = 2 + rand(i + 202) * 2.2
  const drift = 14 + rand(i + 303) * 12
  const blink = 3.5 + rand(i + 404) * 4
  const delay = -(rand(i + 505) * 20).toFixed(2)
  const path = i % 3

  return `<g class="fly d${path}" style="animation-duration:${drift.toFixed(1)}s;animation-delay:${delay}s">`
    + `<g transform="translate(${x.toFixed(0)} ${y.toFixed(0)})">`
    + `<circle class="halo" r="${(r * 6).toFixed(1)}" fill="url(#glow)" style="animation-duration:${blink.toFixed(1)}s;animation-delay:${delay}s"/>`
    + `<circle class="core" r="${r.toFixed(1)}" fill="#fff1b8" style="animation-duration:${blink.toFixed(1)}s;animation-delay:${delay}s"/>`
    + `</g></g>`
}

function grass(i: number): string {
  const x = (i / 140) * 1640 - 20 + rand(i + 900) * 8
  const h = 50 + rand(i + 950) * 110
  const lean = (rand(i + 990) - 0.5) * 40
  const shade = i % 2 === 0 ? '#0f0d1d' : '#141127'

  return `<path class="blade s${i % 2}" d="M${x.toFixed(0)} 900 Q${(x + lean / 2).toFixed(0)} ${(900 - h / 2).toFixed(0)} ${(x + lean).toFixed(0)} ${(900 - h).toFixed(0)} L${(x + 5).toFixed(0)} 900Z" fill="${shade}"/>`
}

function scene(percent: number): string {
  const count = fliesFor(percent)
  const flies = Array.from({ length: count }, (_, i) => firefly(i)).join('')
  const blades = Array.from({ length: 140 }, (_, i) => grass(i)).join('')
  const stars = Array.from({ length: 50 }, (_, i) =>
    `<circle cx="${(rand(i + 2000) * 1600).toFixed(0)}" cy="${(rand(i + 2100) * 380).toFixed(0)}" r="${(0.6 + rand(i + 2200)).toFixed(1)}" fill="#f4ead8" opacity="${(0.25 + rand(i + 2300) * 0.5).toFixed(2)}"/>`,
  ).join('')

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1600 900" preserveAspectRatio="xMidYMid slice">
<defs>
<linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
<stop offset="0" stop-color="#16132a"/><stop offset="0.45" stop-color="#2c2148"/><stop offset="0.72" stop-color="#6b3b55"/><stop offset="0.86" stop-color="#c06a4a"/><stop offset="1" stop-color="#e8a05a"/>
</linearGradient>
<radialGradient id="glow"><stop offset="0" stop-color="#ffd76a" stop-opacity="0.9"/><stop offset="0.35" stop-color="#f2b54a" stop-opacity="0.35"/><stop offset="1" stop-color="#f2b54a" stop-opacity="0"/></radialGradient>
</defs>
<style>
.fly { animation-name: drift0; animation-iteration-count: infinite; animation-timing-function: ease-in-out; animation-direction: alternate; }
.d1 { animation-name: drift1; }
.d2 { animation-name: drift2; }
.halo, .core { animation-name: glow; animation-iteration-count: infinite; animation-timing-function: ease-in-out; animation-direction: alternate; opacity: 0.7; }
.blade { transform-box: fill-box; transform-origin: 50% 100%; animation: sway 9s ease-in-out infinite alternate; }
.s1 { animation-duration: 11s; }
@keyframes drift0 { from { transform: translate(0px, 0px); } to { transform: translate(60px, -40px); } }
@keyframes drift1 { from { transform: translate(0px, 0px); } to { transform: translate(-50px, -55px); } }
@keyframes drift2 { from { transform: translate(0px, 0px); } to { transform: translate(35px, 30px); } }
@keyframes glow { from { opacity: 0.15; } to { opacity: 0.95; } }
@keyframes sway { from { transform: rotate(-2deg); } to { transform: rotate(2deg); } }
</style>
<!-- ciel -->
<rect width="1600" height="900" fill="url(#sky)"/>
${stars}
<!-- collines -->
<path d="M0 720 Q300 640 640 700 T1300 680 T1600 700 V900 H0Z" fill="#241b36"/>
<path d="M0 790 Q400 730 820 780 T1600 770 V900 H0Z" fill="#1a1529"/>
<!-- herbes -->
${blades}
<!-- lucioles -->
${flies}
</svg>`
}

export const lucioles: LivingTheme = {
  id: 'lucioles',
  label: 'Lucioles',
  signal: "le remplissage du contexte fait naître des lucioles",
  needs: ['ctx'],
  colors: theme,
  problems,
  tint: '#16132a',
  scene: (s) => scene(s.ctx),
  alt: (s) => `Prairie au crépuscule, ${fliesFor(s.ctx)} lucioles`,
}
