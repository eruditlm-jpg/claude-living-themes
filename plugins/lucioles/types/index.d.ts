export type Fill = number

declare module 'claude-code' {
  interface PluginState {
    lucioles: { fill: Fill }
  }
}
