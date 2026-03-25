import { useEffect, useRef, useCallback } from 'react'
import { useAppStore } from '../stores/appStore'
import type { WSMessage } from '../types'

const WS_URL = `ws://${window.location.hostname}:3001/ws`

export function useWebSocket() {
  const wsRef = useRef<WebSocket | null>(null)
  const reconnectTimeoutRef = useRef<number | null>(null)
  const terminalCallbacksRef = useRef<{
    onData?: (data: string) => void
    onExit?: (code: number) => void
  }>({})

  const {
    setConnectionStatus,
    setAgents,
    currentSessionId,
  } = useAppStore()

  const connect = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) return

    setConnectionStatus('connecting')

    const ws = new WebSocket(WS_URL)
    wsRef.current = ws

    ws.onopen = () => {
      setConnectionStatus('connected')
      // Subscribe to current session if any
      if (currentSessionId) {
        ws.send(JSON.stringify({ type: 'subscribe', sessionId: currentSessionId }))
      }
    }

    ws.onmessage = (event) => {
      try {
        const msg: WSMessage = JSON.parse(event.data)

        switch (msg.type) {
          case 'terminal_output':
            terminalCallbacksRef.current.onData?.(msg.data || '')
            break
          case 'terminal_exit':
            terminalCallbacksRef.current.onExit?.(Number(msg.data) || 0)
            break
          case 'agents_update':
            if (msg.agents) {
              setAgents(msg.agents)
            }
            break
          case 'connection_status':
            setConnectionStatus(msg.status || 'disconnected')
            break
        }
      } catch {
        // Ignore parse errors
      }
    }

    ws.onclose = () => {
      setConnectionStatus('disconnected')
      // Attempt reconnect after 3 seconds
      reconnectTimeoutRef.current = window.setTimeout(() => {
        connect()
      }, 3000)
    }

    ws.onerror = () => {
      setConnectionStatus('error')
    }
  }, [currentSessionId, setConnectionStatus, setAgents])

  const disconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current)
      reconnectTimeoutRef.current = null
    }
    if (wsRef.current) {
      wsRef.current.close()
      wsRef.current = null
    }
  }, [])

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
      terminalCallbacksRef.current = { onData, onExit }
    },
    []
  )

  const switchSession = useCallback((sessionId: string) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: 'session_switch', sessionId }))
    }
  }, [])

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

  useEffect(() => {
    connect()
    return () => disconnect()
  }, [connect, disconnect])

  return {
    sendInput,
    sendResize,
    subscribeToTerminal,
    switchSession,
    createSession,
    reconnect: connect,
  }
}
