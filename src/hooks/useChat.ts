import { useCallback, useMemo } from 'react'
import { useStore } from '../store.js'
import { Message } from '../agents/types.js'

/**
 * Hook for managing chat messages and conversation state.
 */
export function useChat() {
  const messages = useStore((state) => state.messages)
  const addMessage = useStore((state) => state.addMessage)
  const selectedAgentId = useStore((state) => state.selectedAgentId)
  const selectAgent = useStore((state) => state.selectAgent)
  const agents = useStore((state) => state.agents)

  /**
   * Get messages for a specific agent.
   */
  const getMessagesForAgent = useCallback(
    (agentId: string): Message[] => {
      return messages.filter((m) => m.agentId === agentId || m.role === 'user')
    },
    [messages],
  )

  /**
   * Get recent messages (last N messages).
   */
  const getRecentMessages = useCallback(
    (agentId: string | null, limit = 10): Message[] => {
      if (!agentId) return messages.slice(-limit)
      return getMessagesForAgent(agentId).slice(-limit)
    },
    [messages, getMessagesForAgent],
  )

  /**
   * Add a new user message.
   */
  const addUserMessage = useCallback(
    (content: string): Message => {
      const message: Message = {
        id: `msg-${Date.now()}-${Math.random().toString(36).slice(2)}`,
        agentId: 'user',
        content,
        timestamp: Date.now(),
        role: 'user',
      }
      addMessage(message)
      return message
    },
    [addMessage],
  )

  /**
   * Add a new agent message.
   */
  const addAgentMessage = useCallback(
    (agentId: string, content: string): Message => {
      const message: Message = {
        id: `msg-${Date.now()}-${Math.random().toString(36).slice(2)}`,
        agentId,
        content,
        timestamp: Date.now(),
        role: 'agent',
      }
      addMessage(message)
      return message
    },
    [addMessage],
  )

  /**
   * Get the selected agent.
   */
  const selectedAgent = useMemo(() => {
    if (!selectedAgentId) return null
    return agents.find((a) => a.id === selectedAgentId) ?? null
  }, [agents, selectedAgentId])

  /**
   * Clear all messages.
   */
  const clearMessages = useCallback(() => {
    useStore.setState({ messages: [] })
  }, [])

  /**
   * Clear messages for a specific agent.
   */
  const clearAgentMessages = useCallback(
    (agentId: string) => {
      useStore.setState((state) => ({
        messages: state.messages.filter(
          (m) => m.agentId !== agentId && m.role !== 'user',
        ),
      }))
    },
    [],
  )

  return {
    messages,
    selectedAgentId,
    selectedAgent,
    getMessagesForAgent,
    getRecentMessages,
    addUserMessage,
    addAgentMessage,
    clearMessages,
    clearAgentMessages,
    selectAgent,
  }
}
