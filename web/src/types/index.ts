// Tool Status
export type ToolStatus = 'idle' | 'executing' | 'completed' | 'failed'

// Tool interface
export interface Tool {
  name: string
  status: ToolStatus
  startedAt?: number
  duration?: number
  error?: string
  hookEvent?: string
  hookPayload?: Record<string, unknown>
  query?: string // For search tools
  command?: string // For bash tools
}

// Timeline Event interface
export interface TimelineEvent {
  id: string
  timestamp: string // Formatted time: "10:01"
  timestampMs: number
  agentId: string
  agentName: string
  event: 'started' | 'completed' | 'error' | 'thinking'
  message: string
}

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
  tools?: Tool[]
  startedAt?: number
  sessionId?: string
}

// Message interface
export interface Message {
  id: string
  agentId: string
  content: string
  timestamp: number
  role: 'user' | 'agent'
}

// Project interface (replaces Session)
export interface Project {
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
  | 'timeline_event'

export interface WSMessage {
  type: WSMessageType
  data?: string
  agents?: Agent[]
  status?: ConnectionStatus
  sessionId?: string
  cols?: number
  rows?: number
  agentId?: string
  agentName?: string
  event?: 'started' | 'completed' | 'error' | 'thinking'
  message?: string
}
