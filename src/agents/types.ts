// Agent HQ - Core Types

export type AgentStatus = 'idle' | 'thinking' | 'working' | 'error' | 'waiting'

export interface Message {
  id: string
  agentId: string
  content: string
  timestamp: number
  role: 'user' | 'agent'
}

export interface Agent {
  id: string
  name: string
  role: string
  status: AgentStatus
  currentTask?: string
  lastMessage?: string
}

export interface AgentState {
  agents: Agent[]
  messages: Message[]
  selectedAgentId: string | null
  addAgent: (agent: Agent) => void
  removeAgent: (id: string) => void
  updateAgent: (id: string, updates: Partial<Omit<Agent, 'id'>>) => void
  updateAgentStatus: (id: string, status: AgentStatus) => void
  addMessage: (message: Message) => void
  selectAgent: (id: string | null) => void
}
