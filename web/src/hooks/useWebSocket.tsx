import { createContext, useContext, useRef, useCallback, useState } from 'react'
import { useAppStore } from '../stores/appStore'
import type { WSMessage, TimelineEvent } from '../types'

const WS_URL = `ws://localhost:3001/ws`

interface WebSocketContextValue {
  sendInput: (data: string) => void
  sendResize: (cols: number, rows: number) => void
  subscribeToTerminal: (onData: (data: string) => void, onExit: (code: number) => void) => void
  switchSession: (sessionId: string) => void
  createSession: (workDir: string, initialPrompt?: string) => Promise<string>
  deleteSession: (sessionId: string) => Promise<void>
  reconnect: () => void
}

const WebSocketContext = createContext<WebSocketContextValue | null>(null)

export function WebSocketProvider({ children }: { children: React.ReactNode }) {
  const wsRef = useRef<WebSocket | null>(null)
  const isConnectingRef = useRef(false)
  const terminalCallbacksRef = useRef<{
    onData?: (data: string) => void
    onExit?: (code: number) => void
  }>({})
  const terminalOutputBufferRef = useRef<string[]>([])
  const terminalExitBufferRef = useRef<number[]>([])
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null)

  const { setConnectionStatus, setAgents, setCurrentProject, addTimelineEvent, setManager } = useAppStore()

  const connect = useCallback((sessionIdOverride?: string) => {
    console.log('[WS] connect called with override:', sessionIdOverride)
    if (isConnectingRef.current) {
      console.log('[WS] Already connecting, skipping')
      return
    }
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      console.log('[WS] Already open, skipping')
      return
    }

    isConnectingRef.current = true
    console.log('[WS] Creating new WebSocket connection to:', WS_URL)
    setConnectionStatus('connecting')

    const ws = new WebSocket(WS_URL)
    wsRef.current = ws

    ws.onopen = () => {
      console.log('[WS] WebSocket connected')
      isConnectingRef.current = false
      setConnectionStatus('connected')
      const sessionId = sessionIdOverride || currentSessionId
      console.log('[WS] Sending subscribe for session:', sessionId)
      if (sessionId) {
        ws.send(JSON.stringify({ type: 'subscribe', sessionId }))
      }
    }

    ws.onmessage = (event) => {
      try {
        const msg: WSMessage = JSON.parse(event.data)
        console.log('[WS] Received message type:', msg.type)

        switch (msg.type) {
          case 'terminal_output':
            console.log('[WS] terminal_output, onData exists:', !!terminalCallbacksRef.current.onData)
            if (terminalCallbacksRef.current.onData) {
              terminalCallbacksRef.current.onData(msg.data || '')
            } else {
              terminalOutputBufferRef.current.push(msg.data || '')
            }
            break
          case 'terminal_exit':
            if (terminalCallbacksRef.current.onExit) {
              terminalCallbacksRef.current.onExit(Number(msg.data) || 0)
            } else {
              terminalExitBufferRef.current.push(Number(msg.data) || 0)
            }
            break
          case 'agents_update':
            if (msg.agents) {
              // Check if there's a main agent to set as manager
              const mainAgent = msg.agents.find((a: any) => a.isMain)
              if (mainAgent) {
                setManager({
                  id: mainAgent.id,
                  name: mainAgent.name || 'Claude',
                  status: mainAgent.status === 'running' || mainAgent.status === 'thinking' ? 'running' : 'idle',
                })
              }
              setAgents(msg.agents)
            }
            break
          case 'connection_status':
            setConnectionStatus(msg.status || 'disconnected')
            if (msg.sessionId) {
              setCurrentProject(msg.sessionId)
            }
            break
          case 'timeline_event':
            // Handle timeline events from server
            const timelineEvent = msg as unknown as TimelineEvent & { type: 'timeline_event' }
            if (timelineEvent.agentId && timelineEvent.agentName && timelineEvent.event && timelineEvent.message) {
              addTimelineEvent({
                agentId: timelineEvent.agentId,
                agentName: timelineEvent.agentName,
                event: timelineEvent.event as 'started' | 'completed' | 'error' | 'thinking',
                message: timelineEvent.message,
              })
            }
            break
        }
      } catch {
        // Ignore parse errors
      }
    }

    ws.onclose = () => {
      console.log('[WS] WebSocket closed')
      isConnectingRef.current = false
      setConnectionStatus('disconnected')
    }

    ws.onerror = (error) => {
      console.log('[WS] WebSocket error:', error)
      isConnectingRef.current = false
      setConnectionStatus('error')
    }
  }, [currentSessionId, setConnectionStatus, setAgents, setCurrentProject, addTimelineEvent, setManager])

  const sendInput = useCallback((data: string) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: 'terminal_input', data }))
    }
  }, [])

  const sendResize = useCallback((cols: number, rows: number) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: 'resize', cols, rows }))
    }
  }, [])

  const subscribeToTerminal = useCallback(
    (onData: (data: string) => void, onExit: (code: number) => void) => {
      console.log('[WS] subscribeToTerminal called, buffer size:', terminalOutputBufferRef.current.length)
      terminalCallbacksRef.current = { onData, onExit }
      // Flush buffered messages
      while (terminalOutputBufferRef.current.length > 0) {
        const data = terminalOutputBufferRef.current.shift()
        if (data) onData(data)
      }
      while (terminalExitBufferRef.current.length > 0) {
        const code = terminalExitBufferRef.current.shift()
        if (code !== undefined) onExit(code)
      }
    },
    []
  )

  const switchSession = useCallback((sessionId: string) => {
    console.log('[WS] switchSession called:', sessionId)
    setCurrentProject(sessionId)
    setCurrentSessionId(sessionId)

    if (wsRef.current?.readyState === WebSocket.OPEN) {
      console.log('[WS] Already connected, sending subscribe')
      wsRef.current.send(JSON.stringify({ type: 'subscribe', sessionId }))
    } else {
      console.log('[WS] Not connected, calling connect')
      connect(sessionId)
    }
  }, [setCurrentProject, connect])

  const createSession = useCallback(async (workDir: string, initialPrompt?: string): Promise<string> => {
    const res = await fetch('/api/sessions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ workDir, initialPrompt }),
    })
    if (!res.ok) {
      const error = await res.json().catch(() => ({ error: 'Failed to create session' }))
      throw new Error(error.error || 'Failed to create session')
    }
    const data = await res.json()
    return data.sessionId
  }, [])

  const deleteSession = useCallback(async (sessionId: string): Promise<void> => {
    const res = await fetch(`/api/sessions/${sessionId}`, {
      method: 'DELETE',
    })
    if (!res.ok) {
      throw new Error('Failed to delete session')
    }
  }, [])

  const value: WebSocketContextValue = {
    sendInput,
    sendResize,
    subscribeToTerminal,
    switchSession,
    createSession,
    deleteSession,
    reconnect: connect,
  }

  return (
    <WebSocketContext.Provider value={value}>
      {children}
    </WebSocketContext.Provider>
  )
}

export function useWebSocket() {
  const context = useContext(WebSocketContext)
  if (!context) {
    throw new Error('useWebSocket must be used within a WebSocketProvider')
  }
  return context
}
