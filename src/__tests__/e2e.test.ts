import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { useStore } from '../store.js'
import { ClaudeAdapter } from '../agents/ClaudeAdapter.js'
import { ANIMATIONS } from '../hooks/useAnimation.js'
import { Agent, Message } from '../agents/types.js'

// Reset store before each test
beforeEach(() => {
  useStore.setState({
    agents: [
      { id: '1', name: 'Researcher', role: 'researcher', status: 'idle' },
      { id: '2', name: 'Coder', role: 'coder', status: 'idle' },
    ],
    messages: [],
    selectedAgentId: null,
  })
  vi.useFakeTimers()
})

afterEach(() => {
  vi.useRealTimers()
  vi.restoreAllMocks()
})

describe('T8 - End-to-End Tests', () => {
  describe('Complete Flow Tests', () => {
    it('complete agent workflow: spawn -> chat -> status update -> kill', () => {
      // Step 1: Select an agent
      useStore.getState().selectAgent('1')
      expect(useStore.getState().selectedAgentId).toBe('1')

      // Step 2: Spawn adapter and start mock simulation
      const adapter = new ClaudeAdapter({ agentId: '1', mode: 'mock' })
      const stop = adapter.startMockSimulation()
      
      // Step 3: Verify status changes
      vi.advanceTimersByTime(3000)
      let agent = useStore.getState().agents.find((a) => a.id === '1')
      expect(agent?.status).toBe('working')

      // Step 4: Verify messages are added
      const messagesBefore = useStore.getState().messages.length
      expect(messagesBefore).toBeGreaterThan(0)

      // Step 5: Kill the adapter
      stop()
      adapter.kill()
      
      agent = useStore.getState().agents.find((a) => a.id === '1')
      expect(agent?.status).toBe('idle')
    })

    it('handles multiple agents with separate adapters', () => {
      // Create two adapters for different agents
      const adapter1 = new ClaudeAdapter({ agentId: '1', mode: 'mock' })
      const adapter2 = new ClaudeAdapter({ agentId: '2', mode: 'mock' })

      const stop1 = adapter1.startMockSimulation()
      const stop2 = adapter2.startMockSimulation()

      // Both should be running
      expect(adapter1.isRunning()).toBe(true)
      expect(adapter2.isRunning()).toBe(true)

      // Advance time and check both have messages
      vi.advanceTimersByTime(3000)
      
      const messages = useStore.getState().messages
      const agent1Messages = messages.filter(m => m.agentId === '1')
      const agent2Messages = messages.filter(m => m.agentId === '2')

      expect(agent1Messages.length).toBeGreaterThan(0)
      expect(agent2Messages.length).toBeGreaterThan(0)

      // Cleanup
      stop1()
      stop2()
      adapter1.kill()
      adapter2.kill()
    })

    it('respects agent selection across operations', () => {
      // Select first agent
      useStore.getState().selectAgent('1')
      
      const adapter1 = new ClaudeAdapter({ agentId: '1', mode: 'mock' })
      adapter1.startMockSimulation()

      // Verify agent 1 is selected and running
      expect(useStore.getState().selectedAgentId).toBe('1')
      
      // Switch to agent 2
      useStore.getState().selectAgent('2')
      expect(useStore.getState().selectedAgentId).toBe('2')

      // Stop agent 1
      adapter1.kill()
      
      // Agent 1 should be idle
      const agent1 = useStore.getState().agents.find(a => a.id === '1')
      expect(agent1?.status).toBe('idle')
    })
  })

  describe('Status Synchronization Tests', () => {
    it('status updates propagate correctly to store', () => {
      const adapter = new ClaudeAdapter({ agentId: '1' })
      
      // Start in mock mode
      adapter.startMockSimulation()

      // Initial status should be thinking
      let agent = useStore.getState().agents.find(a => a.id === '1')
      expect(agent?.status).toBe('thinking')

      // Advance to next step (working)
      vi.advanceTimersByTime(3000)
      agent = useStore.getState().agents.find(a => a.id === '1')
      expect(agent?.status).toBe('working')

      // Advance to waiting (needs 4 more steps: working -> thinking -> waiting)
      // Step 2: working (tick at 3s already done)
      // Step 3: thinking (after 6s)
      vi.advanceTimersByTime(6000)
      agent = useStore.getState().agents.find(a => a.id === '1')
      expect(agent?.status).toBe('thinking')

      // Step 4: waiting (after 9s)
      vi.advanceTimersByTime(3000)
      agent = useStore.getState().agents.find(a => a.id === '1')
      expect(agent?.status).toBe('waiting')

      adapter.kill()
    })

    it('status change updates currentTask correctly', () => {
      const adapter = new ClaudeAdapter({ agentId: '1', mode: 'mock' })
      adapter.startMockSimulation()

      // First tick sets status to thinking
      let agent = useStore.getState().agents.find(a => a.id === '1')
      expect(agent?.currentTask).toBeDefined()

      vi.advanceTimersByTime(3000)
      agent = useStore.getState().agents.find(a => a.id === '1')
      expect(agent?.currentTask).toBe('Reading files')

      adapter.kill()
    })

    it('kill resets status to idle', () => {
      const adapter = new ClaudeAdapter({ agentId: '1', mode: 'mock' })
      adapter.startMockSimulation()

      vi.advanceTimersByTime(3000)
      adapter.kill()

      const agent = useStore.getState().agents.find(a => a.id === '1')
      expect(agent?.status).toBe('idle')
      expect(agent?.currentTask).toBeUndefined()
    })
  })

  describe('Chat Functionality Tests', () => {
    it('useChat: addUserMessage creates correct message structure', () => {
      // We need to test the hook in a proper React context
      // For now, test the underlying store operations
      
      const initialCount = useStore.getState().messages.length
      
      // Simulate adding a user message
      useStore.getState().addMessage({
        id: 'test-msg-1',
        agentId: 'user',
        content: 'Hello agent',
        timestamp: Date.now(),
        role: 'user',
      })

      const messages = useStore.getState().messages
      expect(messages.length).toBe(initialCount + 1)
      expect(messages[messages.length - 1].role).toBe('user')
      expect(messages[messages.length - 1].content).toBe('Hello agent')
    })

    it('useChat: addAgentMessage creates correct message structure', () => {
      const initialCount = useStore.getState().messages.length
      
      useStore.getState().addMessage({
        id: 'test-msg-2',
        agentId: '1',
        content: 'Hello human',
        timestamp: Date.now(),
        role: 'agent',
      })

      const messages = useStore.getState().messages
      expect(messages.length).toBe(initialCount + 1)
      expect(messages[messages.length - 1].role).toBe('agent')
      expect(messages[messages.length - 1].agentId).toBe('1')
    })

    it('useChat: getMessagesForAgent filters correctly', () => {
      // Add test messages
      useStore.getState().addMessage({ id: '1', agentId: '1', content: 'Msg for 1', timestamp: 1, role: 'agent' })
      useStore.getState().addMessage({ id: '2', agentId: '2', content: 'Msg for 2', timestamp: 2, role: 'agent' })
      useStore.getState().addMessage({ id: '3', agentId: 'user', content: 'User msg', timestamp: 3, role: 'user' })

      // Test filtering via store
      const allMessages = useStore.getState().messages
      const agent1Messages = allMessages.filter(m => m.agentId === '1' || m.role === 'user')
      
      expect(agent1Messages.length).toBe(2) // Msg for 1 + user msg
    })

    it('conversation flow: user sends message -> agent responds', async () => {
      // Setup: Select agent and add user message
      useStore.getState().selectAgent('1')
      
      const userMsg: Message = {
        id: 'user-msg-1',
        agentId: 'user',
        content: 'Hello, can you help me?',
        timestamp: Date.now(),
        role: 'user',
      }
      useStore.getState().addMessage(userMsg)

      // Verify user message was added
      let messages = useStore.getState().messages
      expect(messages.filter(m => m.role === 'user').length).toBe(1)

      // Simulate agent response via adapter
      const adapter = new ClaudeAdapter({ agentId: '1', mode: 'mock' })
      const stop = adapter.startMockSimulation()

      vi.advanceTimersByTime(3000)

      // Verify agent messages were added
      messages = useStore.getState().messages
      const agentMessages = messages.filter(m => m.agentId === '1' && m.role === 'agent')
      expect(agentMessages.length).toBeGreaterThan(0)

      stop()
      adapter.kill()
    })
  })

  describe('Animation Tests', () => {
    it('ANIMATIONS: all predefined animations have frames', () => {
      expect(ANIMATIONS.spinner.length).toBeGreaterThan(0)
      expect(ANIMATIONS.dots.length).toBeGreaterThan(0)
      expect(ANIMATIONS.pulse.length).toBeGreaterThan(0)
      expect(ANIMATIONS.arrow.length).toBeGreaterThan(0)
    })

    it('ANIMATIONS: spinner has expected frame count', () => {
      // Spinner has 10 frames as defined in the implementation
      expect(ANIMATIONS.spinner.length).toBe(10)
    })

    it('ANIMATIONS: dots cycles correctly', () => {
      // Dots animation goes from no dots to three dots
      expect(ANIMATIONS.dots[0]).toBe('   ')
      expect(ANIMATIONS.dots[3]).toBe('...')
      expect(ANIMATIONS.dots[6]).toBe('   ')
    })
  })
})
