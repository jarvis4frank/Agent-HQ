import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { useStore } from '../store.js'
import { ClaudeAdapter } from '../agents/ClaudeAdapter.js'

beforeEach(() => {
  useStore.setState({
    agents: [{ id: 'agent-1', name: 'TestAgent', role: 'coder', status: 'idle' }],
    messages: [],
    selectedAgentId: null,
  })
  vi.useFakeTimers()
})

afterEach(() => {
  vi.useRealTimers()
  vi.restoreAllMocks()
})

describe('ClaudeAdapter', () => {
  describe('constructor', () => {
    it('creates an adapter for a given agentId', () => {
      const adapter = new ClaudeAdapter({ agentId: 'agent-1' })
      expect(adapter.isRunning()).toBe(false)
    })

    it('starts with empty output buffer', () => {
      const adapter = new ClaudeAdapter({ agentId: 'agent-1' })
      expect(adapter.getOutputBuffer()).toHaveLength(0)
    })
  })

  describe('startMockSimulation', () => {
    it('immediately updates agent status on first tick', () => {
      const adapter = new ClaudeAdapter({ agentId: 'agent-1' })
      const stop = adapter.startMockSimulation()

      const agent = useStore.getState().agents.find((a) => a.id === 'agent-1')
      expect(agent?.status).toBe('thinking')

      stop()
    })

    it('adds a message to the store on first tick', () => {
      const adapter = new ClaudeAdapter({ agentId: 'agent-1' })
      const stop = adapter.startMockSimulation()

      const messages = useStore.getState().messages
      expect(messages).toHaveLength(1)
      expect(messages[0].agentId).toBe('agent-1')
      expect(messages[0].role).toBe('agent')

      stop()
    })

    it('advances through steps on each tick interval', () => {
      const adapter = new ClaudeAdapter({ agentId: 'agent-1' })
      const stop = adapter.startMockSimulation()

      // Tick 1 already fired (thinking)
      vi.advanceTimersByTime(3000) // Tick 2
      vi.advanceTimersByTime(3000) // Tick 3

      const messages = useStore.getState().messages
      expect(messages.length).toBeGreaterThanOrEqual(3)

      stop()
    })

    it('returns a cleanup function that stops the interval', () => {
      const adapter = new ClaudeAdapter({ agentId: 'agent-1' })
      const stop = adapter.startMockSimulation()

      const countAfterStart = useStore.getState().messages.length
      stop()

      vi.advanceTimersByTime(9000) // 3 more ticks that should NOT fire
      expect(useStore.getState().messages.length).toBe(countAfterStart)
    })

    it('cycles through all 6 simulation steps', () => {
      const adapter = new ClaudeAdapter({ agentId: 'agent-1' })
      const stop = adapter.startMockSimulation()

      // Tick 1 fires immediately; advance 5 more intervals
      for (let i = 0; i < 5; i++) vi.advanceTimersByTime(3000)

      const statuses = useStore.getState().messages.map((m) => m.content)
      expect(statuses.length).toBe(6)

      stop()
    })

    it('wraps around and cycles again after all steps', () => {
      const adapter = new ClaudeAdapter({ agentId: 'agent-1' })
      const stop = adapter.startMockSimulation()

      // 6 steps complete one cycle; fire 7 total
      for (let i = 0; i < 6; i++) vi.advanceTimersByTime(3000)

      expect(useStore.getState().messages.length).toBe(7)
      stop()
    })
  })

  describe('kill', () => {
    it('sets status to idle and clears currentTask', () => {
      const adapter = new ClaudeAdapter({ agentId: 'agent-1' })
      adapter.kill()
      const agent = useStore.getState().agents.find((a) => a.id === 'agent-1')
      expect(agent?.status).toBe('idle')
      expect(agent?.currentTask).toBeUndefined()
    })

    it('is safe to call when no process is running', () => {
      const adapter = new ClaudeAdapter({ agentId: 'agent-1' })
      expect(() => adapter.kill()).not.toThrow()
    })
  })

  describe('isRunning', () => {
    it('returns false when no spawn has been called', () => {
      const adapter = new ClaudeAdapter({ agentId: 'agent-1' })
      expect(adapter.isRunning()).toBe(false)
    })
  })

  describe('getOutputBuffer', () => {
    it('returns a readonly array', () => {
      const adapter = new ClaudeAdapter({ agentId: 'agent-1' })
      const buf = adapter.getOutputBuffer()
      expect(Array.isArray(buf)).toBe(true)
    })
  })
})
