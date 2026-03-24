import { create } from 'zustand'
import { AgentState, Agent } from './agents/types'

// Roles cycled when spawning new agents dynamically
const AGENT_ROLES = ['researcher', 'coder', 'reviewer', 'executor', 'planner', 'tester'] as const
const AGENT_NAMES = ['Researcher', 'Coder', 'Reviewer', 'Executor', 'Planner', 'Tester'] as const

/** Build the initial agent list. Count is configurable via AGENT_COUNT env var (default 4). */
function buildInitialAgents(): Agent[] {
  const count = Math.max(1, Math.min(10, Number(process.env.AGENT_COUNT ?? 4)))
  return Array.from({ length: count }, (_, i) => ({
    id: String(i + 1),
    name: AGENT_NAMES[i % AGENT_NAMES.length],
    role: AGENT_ROLES[i % AGENT_ROLES.length],
    status: 'idle' as const,
  }))
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

export const useStore = create<AgentState>((set) => ({
  agents: buildInitialAgents(),
  messages: [],
  selectedAgentId: null,

  addAgent: (agent) => set((state) => ({
    agents: [...state.agents, agent],
  })),

  removeAgent: (id) => set((state) => ({
    agents: state.agents.filter((a) => a.id !== id),
    selectedAgentId: state.selectedAgentId === id ? null : state.selectedAgentId,
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
