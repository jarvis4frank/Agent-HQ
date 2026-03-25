import { create } from 'zustand'
import type { Agent, Session, ConnectionStatus } from '../types'

// Helper to fetch sessions from API
async function fetchSessionsFromApi(): Promise<Session[]> {
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
  // Sessions
  sessions: Session[]
  currentSessionId: string | null
  setSessions: (sessions: Session[]) => void
  setCurrentSession: (sessionId: string | null) => void
  fetchSessions: () => Promise<void>

  // Agents
  agents: Agent[]
  selectedAgentId: string | null
  setAgents: (agents: Agent[]) => void
  selectAgent: (id: string | null) => void

  // Connection
  connectionStatus: ConnectionStatus
  setConnectionStatus: (status: ConnectionStatus) => void

  // Terminal
  terminalExpanded: boolean
  setTerminalExpanded: (expanded: boolean) => void

  // UI
  showNewSessionModal: boolean
  setShowNewSessionModal: (show: boolean) => void
  showSessionSelector: boolean
  setShowSessionSelector: (show: boolean) => void
}

export const useAppStore = create<AppState>((set) => ({
  // Sessions
  sessions: [],
  currentSessionId: null,
  setSessions: (sessions) => set({ sessions }),
  setCurrentSession: (sessionId) => set({ currentSessionId: sessionId }),
  fetchSessions: async () => {
    const sessions = await fetchSessionsFromApi()
    set({ sessions })
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
  terminalExpanded: false,
  setTerminalExpanded: (expanded) => set({ terminalExpanded: expanded }),

  // UI
  showNewSessionModal: false,
  setShowNewSessionModal: (show) => set({ showNewSessionModal: show }),
  showSessionSelector: false,
  setShowSessionSelector: (show) => set({ showSessionSelector: show }),
}))
