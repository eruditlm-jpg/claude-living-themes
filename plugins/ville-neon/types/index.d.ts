export type Lit = number

declare module 'claude-code' {
  interface PluginState {
    'ville-neon': { lit: Lit }
  }
}
