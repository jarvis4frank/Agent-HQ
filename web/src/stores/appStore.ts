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

  // Terminal
  terminalMode: 'half',
  setTerminalMode: (mode) => set({ terminalMode: mode }),
  toggleTerminal: () => {
    const current = get().terminalMode
    if (current === 'collapsed') set({ terminalMode: 'half' })
    else if (current === 'half') set({ terminalMode: 'full' })
    else set({ terminalMode: 'collapsed' })
  },
}))
