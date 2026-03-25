// Agent Status
export type AgentStatus = 'idle' | 'running' | 'thinking' | 'working' | 'error' | 'waiting'

// Agent interface
export interface Agent {
  id: string
  name: string
  role: string
  status: AgentStatus
  currentTask?: string
  lastMessage?: string
  isMain?: boolean
}

// Message interface
export interface Message {
  id: string
  agentId: string
  content: string
  timestamp: number
  role: 'user' | 'agent'
}

// Session interface
export interface Session {
  id: string
  path: string
  status: 'active' | 'closed'
  lastActivity: number
  size: number
  workDir?: string
}

// Connection status
export type ConnectionStatus = 'connecting' | 'connected' | 'disconnected' | 'error'

// WebSocket message types
export type WSMessageType =
  | 'terminal_output'
  | 'terminal_input'
  | 'terminal_exit'
  | 'resize'
  | 'agents_update'
  | 'connection_status'
  | 'subscribe'
  | 'session_switch'

export interface WSMessage {
  type: WSMessageType
  data?: string
  agents?: Agent[]
  status?: ConnectionStatus
  sessionId?: string
  cols?: number
  rows?: number
}
