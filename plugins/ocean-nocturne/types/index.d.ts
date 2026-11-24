export type Tide = number
export type ToolCalls = number

declare module 'claude-code' {
  interface PluginState {
    'ocean-nocturne': { tide: Tide; calls: ToolCalls }
  }
}
