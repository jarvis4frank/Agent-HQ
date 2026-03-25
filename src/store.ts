import { create } from 'zustand'
import { AgentState, Agent } from './agents/types'

// Check Claude CLI availability (use pre-checked value from precheck.js)
export function hasClaudeCli(): boolean {
  return (globalThis as any).__CLAUDE_CLI_AVAILABLE__ ?? false
}

// App modes
export type AppMode = 'multi-agent' | 'session-agent-team'

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
let _appMode: AppMode = 'multi-agent'

export function getAppMode(): AppMode {
  return _appMode
}

export function setAppMode(mode: AppMode): void {
  _appMode = mode
  // Also update store if it exists
  const store = useStore.getState()
  if (typeof (store as any).setAppMode === 'function') {
    (store as any).setAppMode(mode)
  }
}

// Roles cycled when spawning new agents dynamically
const AGENT_ROLES = ['researcher', 'coder', 'reviewer', 'executor', 'planner', 'tester'] as const
const AGENT_NAMES = ['Researcher', 'Coder', 'Reviewer', 'Executor', 'Planner', 'Tester'] as const

export function buildInitialAgents(): Agent[] {
  const count = Math.max(1, Math.min(10, Number(process.env.AGENT_COUNT ?? 4)))
  return Array.from({ length: count }, (_, i) => ({
    id: String(i + 1),
    name: AGENT_NAMES[i % AGENT_NAMES.length],
    role: AGENT_ROLES[i % AGENT_ROLES.length],
    status: 'idle' as const,
    isMain: i === 0,
  }))
}

export function buildMainAgent(): Agent[] {
  return [{
    id: 'main',
    name: 'Researcher',
    role: 'researcher',
    status: 'idle' as const,
    isMain: true,
  }]
}

/** Get initial agents based on mode */
export function getInitialAgents(): Agent[] {
  return _appMode === 'session-agent-team' ? buildMainAgent() : buildInitialAgents()
}

let _nextId = 100

/** Create a new agent with an auto-assigned id, cycling through roles. */
export function createAgent(overrides: Partial<Omit<Agent, 'id'>> = {}): Agent {
  const idx = _nextId % AGENT_ROLES.length
  const id = String(_nextId++)
  return {
    id,
    name: AGENT_NAMES[idx],
    role: AGENT_ROLES[idx],
    status: 'idle',
    ...overrides,
  }
}

export const useStore = create<AgentState>((set, get) => ({
  agents: getInitialAgents(),
  messages: [],
  selectedAgentId: 'main',

  setAppMode: (mode: AppMode) => {
    _appMode = mode
    const agents = mode === 'session-agent-team' ? buildMainAgent() : buildInitialAgents()
    set({ agents, selectedAgentId: 'main' })
  },

  syncWithTeams: (teamMembers: Array<{ id: string; name: string; role: string }>) => {
    const state = get()
    const mode = _appMode
    
    if (mode !== 'session-agent-team') return // Only sync in team mode
    
    // Keep main agent, add/update teammates
    const mainAgent = state.agents.find(a => a.isMain) || buildMainAgent()[0]
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
    selectedAgentId: state.selectedAgentId === id ? 'main' : state.selectedAgentId,
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
