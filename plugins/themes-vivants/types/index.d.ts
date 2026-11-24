export type ThemeChoice = string
export type SignalValue = number

declare module 'claude-code' {
  interface PluginState {
    'themes-vivants': {
      theme: ThemeChoice
      ctx: SignalValue
      calls: SignalValue
      storm: SignalValue
      lit: SignalValue
    }
  }
}
