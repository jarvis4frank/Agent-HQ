import { create } from 'zustand'
import type { Agent, Project, ConnectionStatus, Tool, TimelineEvent } from '../types'

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

// Format timestamp for timeline
function formatTimestamp(ms: number): string {
  const date = new Date(ms)
  return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false })
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
  // Add/update a single agent (for WebSocket updates)
  updateAgent: (agent: Agent) => void
  // Add a tool to an agent
  addToolToAgent: (agentId: string, tool: Tool) => void
  // Update a tool's status
  updateToolStatus: (agentId: string, toolName: string, updates: Partial<Tool>) => void
  // Set main manager
  manager: { id: string; name: string; status: 'running' | 'idle' } | null
  setManager: (manager: { id: string; name: string; status: 'running' | 'idle' } | null) => void

  // Timeline
  timelineEvents: TimelineEvent[]
  addTimelineEvent: (event: Omit<TimelineEvent, 'id' | 'timestamp' | 'timestampMs'>) => void
  clearTimeline: () => void

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
  updateAgent: (agent) => set((state) => {
    const existing = state.agents.find(a => a.id === agent.id)
    if (existing) {
      return {
        agents: state.agents.map(a => a.id === agent.id ? { ...a, ...agent } : a)
      }
    }
    return { agents: [...state.agents, agent] }
  }),
  addToolToAgent: (agentId, tool) => set((state) => ({
    agents: state.agents.map(a => {
      if (a.id === agentId) {
        const existingTools = a.tools || []
        const existing = existingTools.find(t => t.name === tool.name)
        if (existing) return a // Tool already exists
        return { ...a, tools: [...existingTools, tool] }
      }
      return a
    })
  })),
  updateToolStatus: (agentId, toolName, updates) => set((state) => ({
    agents: state.agents.map(a => {
      if (a.id === agentId && a.tools) {
        return {
          ...a,
          tools: a.tools.map(t => t.name === toolName ? { ...t, ...updates } : t)
        }
      }
      return a
    })
  })),
  manager: null,
  setManager: (manager) => set({ manager }),

  // Timeline
  timelineEvents: [],
  addTimelineEvent: (event) => set((state) => {
    const now = Date.now()
    const newEvent: TimelineEvent = {
      ...event,
      id: `event_${now}_${Math.random().toString(36).slice(2, 8)}`,
      timestamp: formatTimestamp(now),
      timestampMs: now,
    }
    // Keep last 20 events
    const events = [newEvent, ...state.timelineEvents].slice(0, 20)
    return { timelineEvents: events }
  }),
  clearTimeline: () => set({ timelineEvents: [] }),

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
