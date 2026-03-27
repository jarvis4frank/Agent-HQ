import { create } from 'zustand'
import type { Agent, Project, ConnectionStatus } from '../types'

// Helper to fetch projects from API
async function fetchProjectsFromApi(): Promise<Project[]> {
  try {
    const res = await fetch('/api/sessions')
    if (!res.ok) return []
    const data = await res.json()
    return data.sessions || []
  } catch {
    return []
  }
}

// Helper to fetch hooks status from API
async function fetchHooksStatusFromApi(): Promise<{
  configured: boolean
  hookScriptExists: boolean
  hooksConfigured: string[]
  settingsFileExists: boolean
}> {
  try {
    const res = await fetch('/api/hooks/status')
    if (!res.ok) return { configured: false, hookScriptExists: false, hooksConfigured: [], settingsFileExists: false }
    const data = await res.json()
    return {
      configured: data.configured ?? false,
      hookScriptExists: data.hookScriptExists ?? false,
      hooksConfigured: data.hooksConfigured ?? [],
      settingsFileExists: data.settingsFileExists ?? false,
    }
  } catch {
    return { configured: false, hookScriptExists: false, hooksConfigured: [], settingsFileExists: false }
  }
}

interface AppState {
  // Projects
  projects: Project[]
  currentProjectId: string | null
  setProjects: (projects: Project[]) => void
  setCurrentProject: (projectId: string | null) => void
  fetchProjects: () => Promise<void>

  // Agents
  agents: Agent[]
  selectedAgentId: string | null
  setAgents: (agents: Agent[]) => void
  selectAgent: (id: string | null) => void

  // Connection
  connectionStatus: ConnectionStatus
  setConnectionStatus: (status: ConnectionStatus) => void

  // Terminal
  terminalMode: 'collapsed' | 'half' | 'full'
  setTerminalMode: (mode: 'collapsed' | 'half' | 'full') => void
  toggleTerminal: () => void

  // Hooks
  hooksConfigured: boolean
  hooksHookScriptExists: boolean
  hooksConfiguredEvents: string[]
  hooksModalOpen: boolean
  setHooksStatus: (status: { configured: boolean; hookScriptExists: boolean; hooksConfigured: string[] }) => void
  setHooksModalOpen: (open: boolean) => void
  fetchHooksStatus: () => Promise<void>
}

export const useAppStore = create<AppState>((set, get) => ({
  // Projects
  projects: [],
  currentProjectId: null,
  setProjects: (projects) => set({ projects }),
  setCurrentProject: (projectId) => set({ currentProjectId: projectId }),
  fetchProjects: async () => {
    const projects = await fetchProjectsFromApi()
    set({ projects })
  },

  // Agents
  agents: [],
  selectedAgentId: null,
  setAgents: (agents) => set({ agents }),
  selectAgent: (id) => set({ selectedAgentId: id }),

  // Connection
  connectionStatus: 'disconnected',
  setConnectionStatus: (status) => set({ connectionStatus: status }),

  // Terminal - default to 'half' to show Terminal on load
  terminalMode: 'half' as const,
  setTerminalMode: (mode) => {
    console.log('[Store] setTerminalMode:', mode)
    set({ terminalMode: mode })
  },
  toggleTerminal: () => {
    const current = get().terminalMode
    console.log('[Store] toggleTerminal:', current)
    if (current === 'collapsed') set({ terminalMode: 'half' })
    else if (current === 'half') set({ terminalMode: 'full' })
    else set({ terminalMode: 'collapsed' })
  },

  // Hooks
  hooksConfigured: false,
  hooksHookScriptExists: false,
  hooksConfiguredEvents: [],
  hooksModalOpen: false,
  setHooksStatus: (status) => set({ 
    hooksConfigured: status.configured,
    hooksHookScriptExists: status.hookScriptExists,
    hooksConfiguredEvents: status.hooksConfigured,
  }),
  setHooksModalOpen: (open) => set({ hooksModalOpen: open }),
  fetchHooksStatus: async () => {
    const status = await fetchHooksStatusFromApi()
    set({ 
      hooksConfigured: status.configured,
      hooksHookScriptExists: status.hookScriptExists,
      hooksConfiguredEvents: status.hooksConfigured,
    })
  },
}))
