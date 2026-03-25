import { create } from 'zustand'
import { AgentState, Agent } from './agents/types'

// Check Claude CLI availability (use pre-checked value from precheck.js)
export function hasClaudeCli(): boolean {
  return (globalThis as any).__CLAUDE_CLI_AVAILABLE__ ?? false
}

// App modes
export type AppMode = 'monitor' | 'session-agent-team'

// Usage tracking
let _totalTokens: number = 0
let _totalRequests: number = 0

export function getUsage(): { tokens: number; requests: number } {
  return { tokens: _totalTokens, requests: _totalRequests }
}

export function addUsage(tokens: number): void {
  _totalTokens += tokens
  _totalRequests += 1
}

// Current app mode
let _appMode: AppMode = 'monitor'

export function getAppMode(): AppMode {
  return _appMode
}

export function setAppMode(mode: AppMode): void {
  _appMode = mode
  const store = useStore.getState()
  if (typeof (store as any).setAppMode === 'function') {
    (store as any).setAppMode(mode)
  }
}

// Roles for session agents
const SESSION_ROLES = ['researcher', 'coder', 'reviewer', 'executor', 'planner', 'tester'] as const
const SESSION_NAMES = ['Researcher', 'Coder', 'Reviewer', 'Executor', 'Planner', 'Tester'] as const

/** Build initial monitoring agents */
function buildMonitoringAgents(): Agent[] {
  // In monitor mode, show system status
  return [{
    id: 'system',
    name: 'Claude Observer',
    role: 'system',
    status: 'idle',
    isMain: true,
  }]
}

/** Build single main agent for session-agent-team mode */
function buildMainAgent(): Agent[] {
  return [{
    id: 'main',
    name: 'Researcher',
    role: 'researcher',
    status: 'idle',
    isMain: true,
  }]
}

/** Get initial agents based on mode */
export function getInitialAgents(): Agent[] {
  return _appMode === 'session-agent-team' ? buildMainAgent() : buildMonitoringAgents()
}

/** Get initial selected agent ID */
export function getInitialSelectedId(): string {
  return 'system'
}

let _nextId = 100

/** Create a new agent */
export function createAgent(overrides: Partial<Omit<Agent, 'id'>> = {}): Agent {
  const idx = _nextId % SESSION_ROLES.length
  const id = String(_nextId++)
  return {
    id,
    name: SESSION_NAMES[idx],
    role: SESSION_ROLES[idx],
    status: 'idle',
    ...overrides,
  }
}

export const useStore = create<AgentState>((set, get) => ({
  agents: getInitialAgents(),
  messages: [],
  selectedAgentId: getInitialSelectedId(),

  setAppMode: (mode: AppMode) => {
    _appMode = mode
    const agents = mode === 'session-agent-team' ? buildMainAgent() : buildMonitoringAgents()
    set({ agents, selectedAgentId: 'system' })
  },

  // Sync sessions from monitor
  syncSessions: (sessions: Array<{ id: string; status: string; lastActivity: number; size?: number }>) => {
    const state = get()
    
    if (_appMode !== 'monitor') return
    
    // Limit to recent sessions (max 10)
    const recentSessions = sessions.slice(0, 10)
    
    // Convert sessions to agents
    const agents: Agent[] = [{
      id: 'system',
      name: 'Claude Observer',
      role: 'system',
      status: recentSessions.length > 0 ? 'running' : 'idle',
      currentTask: recentSessions.length > 0 ? `${recentSessions.length} sessions` : 'No active sessions',
      isMain: true,
    }]
    
    // Add each session as an agent
    for (const session of recentSessions) {
      const age = Date.now() - session.lastActivity
      const sizeKB = session.size ? Math.round(session.size / 1024) : 0
      agents.push({
        id: session.id,
        name: session.id.slice(0, 12),
        role: 'session',
        status: session.status === 'active' ? 'running' : 'idle',
        currentTask: `${sizeKB}KB · ${age < 60000 ? 'just now' : age < 3600000 ? Math.floor(age/60000)+'m ago' : Math.floor(age/3600000)+'h ago'}`,
        isMain: false,
      })
    }
    
    set({ agents })
  },

  // Sync teams from TeamController
  syncWithTeams: (teamMembers: Array<{ id: string; name: string; role: string }>) => {
    const state = get()
    
    if (_appMode !== 'session-agent-team') return
    
    const mainAgent = buildMainAgent()[0]
    const teammates = teamMembers
      .filter(m => m.role !== 'lead')
      .map(m => ({
        id: m.id,
        name: m.name,
        role: m.role,
        status: 'idle' as const,
        isMain: false,
      }))
    
    set({
      agents: [mainAgent, ...teammates]
    })
  },

  addAgent: (agent) => set((state) => ({
    agents: [...state.agents, agent],
  })),

  removeAgent: (id) => set((state) => ({
    agents: state.agents.filter((a) => a.id !== id),
    selectedAgentId: state.selectedAgentId === id ? 'system' : state.selectedAgentId,
  })),

  updateAgent: (id, updates) => set((state) => ({
    agents: state.agents.map((a) => a.id === id ? { ...a, ...updates } : a),
  })),

  updateAgentStatus: (id, status) => set((state) => ({
    agents: state.agents.map((a) => a.id === id ? { ...a, status } : a),
  })),

  addMessage: (message) => set((state) => ({
    messages: [...state.messages, message],
  })),

  selectAgent: (id) => set({ selectedAgentId: id }),
}))
