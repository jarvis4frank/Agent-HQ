export interface HooksStatus {
  configured: boolean
  hookScriptExists: boolean
  hooksConfigured: string[]
  settingsFileExists: boolean
}

/**
 * Fetch hooks status from the API
 */
export async function fetchHooksStatus(): Promise<HooksStatus> {
  try {
    const res = await fetch('/api/hooks/status')
    if (!res.ok) {
      return {
        configured: false,
        hookScriptExists: false,
        hooksConfigured: [],
        settingsFileExists: false,
      }
    }
    const data = await res.json()
    return {
      configured: data.configured ?? false,
      hookScriptExists: data.hookScriptExists ?? false,
      hooksConfigured: data.hooksConfigured ?? [],
      settingsFileExists: data.settingsFileExists ?? false,
    }
  } catch {
    return {
      configured: false,
      hookScriptExists: false,
      hooksConfigured: [],
      settingsFileExists: false,
    }
  }
}
