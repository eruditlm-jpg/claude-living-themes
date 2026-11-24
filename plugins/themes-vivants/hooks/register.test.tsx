import { expect, test } from 'claude-code/testing'

const BACKDROP = {
  plugin: 'themes-vivants',
  component: 'Backdrop',
  surface: 'desktop',
  props: { scene: 'lucioles', plugin: 'themes-vivants', glass: { blur: 18, tint: '#16132a', opacity: 0.55 } },
} as const

function engine(on: Parameters<Parameters<typeof test>[1]>[1], stored?: string) {
  const sets: unknown[] = []
  const saved: Record<string, unknown> = {}
  on('command.register', () => ({ value: { command: 'ambiance' } }))
  on('store.get', () => ({ value: stored }))
  on('store.set', (_, e) => {
    saved[(e as { key: string }).key] = (e as { value: unknown }).value

    return { value: undefined }
  })
  on('session.usage', () => ({ value: { startedAt: 0, context: { window: 200000, percent: 42 }, rateLimits: [], cost: { usd: 2.5 } } }))
  on('theme.set', (_, e) => {
    sets.push(e)

    return { value: { isDrawn: true } }
  })
  on('theme.clear', () => ({ value: undefined }))
  on('session.start', (_, e) => ({ cwd: (e as { cwd: string }).cwd }))
  on('tool.call', () => ({ result: {} }))

  return { sets, saved }
}

test('lucioles par défaut, et le fond suit le contexte', async ($, on) => {
  const { sets } = engine(on)
  await $.session.start({ cwd: '/', surface: 'desktop', isInteractive: true })
  expect(sets.length).toBe(1)
  const ui = await $.ui.mount(BACKDROP)
  const svg = await ui.find({ type: 'Svg' })
  expect(String(svg?.props.alt)).toContain('lucioles')
  // 42 % arrondi à 40 % : 10 + 80 × 0,4 = 42 lucioles.
  expect(String(svg?.props.alt)).toContain('42 lucioles')
  await ui.unmount()
})

test('/ambiance ocean change de thème et retient le choix', async ($, on) => {
  const { sets, saved } = engine(on)
  await $.session.start({ cwd: '/', surface: 'desktop', isInteractive: true })
  const out = await $.command.run({ command: 'ambiance', args: 'océan' })
  expect(String(out.text)).toContain('Océan nocturne')
  expect(saved.theme).toBe('ocean')
  expect(sets.length).toBe(2)
  const ui = await $.ui.mount({ ...BACKDROP, props: { ...BACKDROP.props, scene: 'ocean' } })
  expect(String((await ui.find({ type: 'Svg' }))?.props.alt)).toContain('Océan sous la lune')
  await ui.unmount()
})

test('/ambiance sans argument liste les thèmes', async ($, on) => {
  engine(on)
  await $.session.start({ cwd: '/', surface: 'desktop', isInteractive: true })
  const out = await $.command.run({ command: 'ambiance', args: '' })
  for (const id of ['lucioles', 'ocean', 'foret', 'ville']) {
    expect(String(out.text)).toContain(id)
  }
})

test('un nom inconnu ne change rien', async ($, on) => {
  const { sets, saved } = engine(on)
  await $.session.start({ cwd: '/', surface: 'desktop', isInteractive: true })
  const out = await $.command.run({ command: 'ambiance', args: 'désert' })
  expect(String(out.text)).toContain('Je ne connais pas')
  expect(saved.theme).toBe(undefined)
  expect(sets.length).toBe(1)
})

test('le choix d’une session précédente est repris', async ($, on) => {
  engine(on, 'ville')
  await $.session.start({ cwd: '/', surface: 'desktop', isInteractive: true })
  const ui = await $.ui.mount({ ...BACKDROP, props: { ...BACKDROP.props, scene: 'ville' } })
  expect(String((await ui.find({ type: 'Svg' }))?.props.alt)).toContain('Ville de nuit')
  await ui.unmount()
})
