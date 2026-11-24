import type { ThemeSetArgs } from 'claude-code'

// Les signaux de la session que les scènes savent montrer.
export type Signals = {
  /** Remplissage du contexte, en % par paliers de 5. */
  ctx: number
  /** Appels d'outils de la session, plafonnés. */
  calls: number
  /** Force de l'orage, de 0 à 10. */
  storm: number
  /** Part des fenêtres allumées selon le coût, en %. */
  lit: number
}

export type SignalName = keyof Signals

export type LivingTheme = {
  id: string
  label: string
  /** Ce que la scène montre de la session, en une phrase. */
  signal: string
  /** Les seuls signaux que la scène lit : un autre signal ne la redessine pas. */
  needs: SignalName[]
  colors: NonNullable<ThemeSetArgs['colors']>
  problems: string[]
  tint: string
  scene: (s: Signals) => string
  alt: (s: Signals) => string
}
