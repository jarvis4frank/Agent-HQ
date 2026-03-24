import { useEffect, useRef, useCallback } from 'react'
import { useStore } from '../store.js'
import { Agent, AgentStatus } from '../agents/types.js'
import { ClaudeAdapter } from '../agents/ClaudeAdapter.js'

// --- Selector hooks ---

export function useAgents(): Agent[] {
  return useStore((state) => state.agents)
}

export function useSelectedAgent(): Agent | undefined {
  return useStore((state) => {
    const { agents, selectedAgentId } = state
    return agents.find((a) => a.id === selectedAgentId)
  })
}

export function useAgentById(id: string): Agent | undefined {
  return useStore((state) => state.agents.find((a) => a.id === id))
}

export function useAgentsByStatus(status: AgentStatus): Agent[] {
  return useStore((state) => state.agents.filter((a) => a.status === status))
}

// --- Action hooks ---

export function useAgentActions() {
  const addAgent = useStore((state) => state.addAgent)
  const removeAgent = useStore((state) => state.removeAgent)
  const updateAgent = useStore((state) => state.updateAgent)
  const updateAgentStatus = useStore((state) => state.updateAgentStatus)
  const selectAgent = useStore((state) => state.selectAgent)

  return { addAgent, removeAgent, updateAgent, updateAgentStatus, selectAgent }
}

// --- ClaudeAdapter hook ---

/**
 * Creates and manages a ClaudeAdapter for a given agent.
 * Automatically starts mock simulation on mount in dev mode.
 * Returns the adapter instance and a sendPrompt helper.
 */
export function useClaudeAdapter(
  agentId: string,
  options: { mock?: boolean; workDir?: string } = {},
): {
  sendPrompt: (prompt: string) => void
  stop: () => void
  isRunning: boolean
} {
  const adapterRef = useRef<ClaudeAdapter | null>(null)
  const cleanupRef = useRef<(() => void) | null>(null)
  const isRunningRef = useRef(false)

  if (!adapterRef.current) {
    adapterRef.current = new ClaudeAdapter({ agentId, workDir: options.workDir })
  }

  useEffect(() => {
    const adapter = adapterRef.current!

    if (options.mock) {
      cleanupRef.current = adapter.startMockSimulation()
      isRunningRef.current = true
    }

    return () => {
      cleanupRef.current?.()
      adapter.kill()
      isRunningRef.current = false
    }
  }, [agentId, options.mock])

  const sendPrompt = useCallback((prompt: string) => {
    adapterRef.current?.spawn(prompt)
    isRunningRef.current = true
  }, [])

  const stop = useCallback(() => {
    cleanupRef.current?.()
    adapterRef.current?.kill()
    isRunningRef.current = false
  }, [])

  return { sendPrompt, stop, isRunning: isRunningRef.current }
}
