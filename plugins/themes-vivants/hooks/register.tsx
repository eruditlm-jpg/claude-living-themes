import { atom, read, update } from 'claude-code'
import type { Register, EngineInterface } from 'claude-code'

import { foret } from './themes/foret'
import { lucioles } from './themes/lucioles'
import { ocean } from './themes/ocean'
import type { LivingTheme, SignalName, Signals } from './themes/types'
import { litFor, ville } from './themes/ville'

const PLUGIN = 'themes-vivants'
const STORE_KEY = 'theme'
const DEFAULT_THEME = 'lucioles'

const THEMES: readonly LivingTheme[] = [lucioles, ocean, foret, ville]

// Noms acceptés après /ambiance, en plus de l'identifiant de chaque thème.
const ALIASES: Record<string, string> = {
  luciole: 'lucioles',
  prairie: 'lucioles',
  'ocean-nocturne': 'ocean',
  océan: 'ocean',
  mer: 'ocean',
  forêt: 'foret',
  'foret-sous-la-pluie': 'foret',
  pluie: 'foret',
  'ville-neon': 'ville',
  néon: 'ville',
  neon: 'ville',
}
const OFF_WORDS = ['aucun', 'aucune', 'off', 'rien', 'stop']

const MAX_CALLS = 74
const MAX_STORM = 10
const FAIL_STEP = 3
const OK_STEP = 1

const chosen = atom({ plugin: 'themes-vivants', key: 'theme' } as const, DEFAULT_THEME)
const ctx = atom({ plugin: 'themes-vivants', key: 'ctx' } as const, 0)
const calls = atom({ plugin: 'themes-vivants', key: 'calls' } as const, 0)
const storm = atom({ plugin: 'themes-vivants', key: 'storm' } as const, 0)
const lit = atom({ plugin: 'themes-vivants', key: 'lit' } as const, litFor(0))

function themeById(id: string | undefined): LivingTheme | undefined {
  if (id === undefined) {
    return undefined
  }
  const key = id.trim().toLowerCase()
  const resolved = ALIASES[key] ?? key

  return THEMES.find(t => t.id === resolved)
}

function bucket(percent: number | undefined): number {
  return Math.round((percent ?? 0) / 5) * 5
}

async function apply($: EngineInterface, theme: LivingTheme): Promise<void> {
  const unpainted = theme.problems.find(line => line.startsWith("Desktop won't paint"))

  if (unpainted !== undefined) {
    $.ui.toast(unpainted)
  }
  const set = await $.theme.set({
    colors: theme.colors,
    backdrop: { scene: theme.id, glass: { blur: 18, tint: theme.tint, opacity: 0.55 } },
  })

  if (!set.isDrawn) {
    $.ui.status(set.reason)
  }
}

function listing(current: string): string {
  const rows = THEMES.map(t => `${t.id === current ? '▸' : ' '} ${t.id.padEnd(9)} ${t.label} : ${t.signal}`)

  return [
    `Thème actuel : ${themeById(current)?.label ?? current}`,
    '',
    ...rows,
    '',
    'Change avec /ambiance <nom>, par exemple /ambiance ocean. /ambiance aucun retire le fond.',
  ].join('\n')
}

export const register: Register = on => {
  on('session.start', async ($, e, next) => {
    await $.command.register({
      name: 'ambiance',
      description: 'Choisir le thème vivant : lucioles, ocean, foret ou ville',
    })
    // Le choix fait dans une session précédente vaut pour celle-ci.
    const stored = await $.store.get(STORE_KEY)
    const theme = themeById(typeof stored === 'string' ? stored : undefined)

    if (stored === 'aucun') {
      await update($, chosen, () => 'aucun')
    } else {
      const pick = theme ?? lucioles
      await update($, chosen, () => pick.id)
      const usage = await $.session.usage()
      await update($, ctx, () => bucket(usage.context.percent))
      await update($, lit, () => litFor(usage.cost?.usd ?? 0))
      await apply($, pick)
    }

    return next(e)
  })

  on('command.run', { command: 'ambiance' }, async ($, e) => {
    const asked = e.args.trim()
    const current = await read($, chosen)

    if (asked === '') {
      return { text: listing(current), isTextDisplayOnly: true }
    }
    if (OFF_WORDS.includes(asked.toLowerCase())) {
      await update($, chosen, () => 'aucun')
      await $.store.set(STORE_KEY, 'aucun')
      await $.theme.clear()

      return { text: "Fond retiré. /ambiance <nom> en remet un.", isTextDisplayOnly: true }
    }
    const theme = themeById(asked)

    if (theme === undefined) {
      return { text: `Je ne connais pas « ${asked} ».\n\n${listing(current)}`, isTextDisplayOnly: true }
    }
    await update($, chosen, () => theme.id)
    await $.store.set(STORE_KEY, theme.id)
    await apply($, theme)

    return { text: `Ambiance : ${theme.label}. ${theme.signal[0]?.toUpperCase() ?? ''}${theme.signal.slice(1)}.`, isTextDisplayOnly: true }
  })

  on('session.measure', async ($, e, next) => {
    if (e.changed.includes('context')) {
      const value = bucket(e.context.percent)

      if (value !== (await read($, ctx))) {
        await update($, ctx, () => value)
      }
    }
    if (e.changed.includes('cost')) {
      const value = litFor(e.cost?.usd ?? 0)

      if (value !== (await read($, lit))) {
        await update($, lit, () => value)
      }
    }

    return next(e)
  })

  // Les outils nourrissent le plancton et la météo ; rien ici ne bloque un outil.
  let pending = 0
  on('tool.call', async ($, e, next) => {
    const nudge = (failed: boolean) => {
      void (async () => {
        const now = await read($, storm)
        const after = Math.max(0, Math.min(MAX_STORM, now + (failed ? FAIL_STEP : -OK_STEP)))

        if (after !== now) {
          await update($, storm, () => after)
        }
        pending += 1
        if (pending >= 3) {
          const step = pending
          pending = 0
          await update($, calls, n => Math.min(MAX_CALLS, n + step))
        }
      })().catch(() => undefined)
    }

    try {
      const ran = await next(e)
      nudge(ran.deny !== undefined || ran.isError === true)

      return ran
    } catch (error) {
      nudge(true)
      throw error
    }
  })

  on('ui.render', { component: 'Backdrop' }, async ($, e, next) => {
    if (e.surface !== 'desktop' && e.surface !== 'mobile') {
      return next(e)
    }
    if (e.props.plugin !== PLUGIN) {
      return next(e)
    }
    const theme = themeById(await read($, chosen))

    if (theme === undefined) {
      return next(e)
    }
    // Ne lire que les signaux de ce thème : les autres ne le redessinent pas.
    const uses = (name: SignalName) => theme.needs.includes(name)
    const signals: Signals = {
      ctx: uses('ctx') ? await read($, ctx) : 0,
      calls: uses('calls') ? await read($, calls) : 0,
      storm: uses('storm') ? await read($, storm) : 0,
      lit: uses('lit') ? await read($, lit) : litFor(0),
    }
    const { Svg } = $.ui.resolve(e)

    return <Svg source={theme.scene(signals)} alt={theme.alt(signals)} />
  })
}
