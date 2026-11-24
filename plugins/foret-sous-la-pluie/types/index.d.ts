export type Storm = number

declare module 'claude-code' {
  interface PluginState {
    'foret-sous-la-pluie': { storm: Storm }
  }
}
