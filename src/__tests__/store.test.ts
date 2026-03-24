import { describe, it, expect, beforeEach } from 'vitest'
import { useStore } from '../store.js'
import type { Agent, Message } from '../agents/types.js'

// Reset store state before each test
beforeEach(() => {
  useStore.setState({
    agents: [],
    messages: [],
    selectedAgentId: null,
  })
})

const makeAgent = (overrides: Partial<Agent> = {}): Agent => ({
  id: 'a1',
  name: 'TestAgent',
  role: 'coder',
  status: 'idle',
  ...overrides,
})

const makeMessage = (overrides: Partial<Message> = {}): Message => ({
  id: 'msg-1',
  agentId: 'a1',
  content: 'Hello',
  timestamp: 1000,
  role: 'agent',
  ...overrides,
})

describe('useStore', () => {
  describe('addAgent', () => {
    it('adds an agent to the store', () => {
      const agent = makeAgent()
      useStore.getState().addAgent(agent)
      expect(useStore.getState().agents).toHaveLength(1)
      expect(useStore.getState().agents[0]).toEqual(agent)
    })

    it('accumulates multiple agents', () => {
      useStore.getState().addAgent(makeAgent({ id: 'a1', name: 'A1' }))
      useStore.getState().addAgent(makeAgent({ id: 'a2', name: 'A2' }))
      expect(useStore.getState().agents).toHaveLength(2)
    })
  })

  describe('removeAgent', () => {
    it('removes an agent by id', () => {
      useStore.getState().addAgent(makeAgent({ id: 'a1' }))
      useStore.getState().addAgent(makeAgent({ id: 'a2', name: 'B' }))
      useStore.getState().removeAgent('a1')
      const agents = useStore.getState().agents
      expect(agents).toHaveLength(1)
      expect(agents[0].id).toBe('a2')
    })

    it('does nothing if id does not exist', () => {
      useStore.getState().addAgent(makeAgent({ id: 'a1' }))
      useStore.getState().removeAgent('nonexistent')
      expect(useStore.getState().agents).toHaveLength(1)
    })
  })

  describe('updateAgent', () => {
    it('updates agent fields', () => {
      useStore.getState().addAgent(makeAgent({ id: 'a1', status: 'idle' }))
      useStore.getState().updateAgent('a1', { status: 'working', currentTask: 'Running tests' })
      const agent = useStore.getState().agents.find((a) => a.id === 'a1')
      expect(agent?.status).toBe('working')
      expect(agent?.currentTask).toBe('Running tests')
    })

    it('does not mutate other agents', () => {
      useStore.getState().addAgent(makeAgent({ id: 'a1' }))
      useStore.getState().addAgent(makeAgent({ id: 'a2', name: 'Other', status: 'idle' }))
      useStore.getState().updateAgent('a1', { status: 'error' })
      const other = useStore.getState().agents.find((a) => a.id === 'a2')
      expect(other?.status).toBe('idle')
    })
  })

  describe('updateAgentStatus', () => {
    it('updates only the status of the target agent', () => {
      useStore.getState().addAgent(makeAgent({ id: 'a1', status: 'idle', currentTask: 'original' }))
      useStore.getState().updateAgentStatus('a1', 'thinking')
      const agent = useStore.getState().agents.find((a) => a.id === 'a1')
      expect(agent?.status).toBe('thinking')
      expect(agent?.currentTask).toBe('original') // unchanged
    })
  })

  describe('addMessage', () => {
    it('adds a message to the store', () => {
      useStore.getState().addMessage(makeMessage())
      expect(useStore.getState().messages).toHaveLength(1)
    })

    it('preserves message order', () => {
      useStore.getState().addMessage(makeMessage({ id: 'msg-1', timestamp: 1 }))
      useStore.getState().addMessage(makeMessage({ id: 'msg-2', timestamp: 2 }))
      const msgs = useStore.getState().messages
      expect(msgs[0].id).toBe('msg-1')
      expect(msgs[1].id).toBe('msg-2')
    })
  })

  describe('selectAgent', () => {
    it('sets selectedAgentId', () => {
      useStore.getState().selectAgent('a1')
      expect(useStore.getState().selectedAgentId).toBe('a1')
    })

    it('can deselect with null', () => {
      useStore.getState().selectAgent('a1')
      useStore.getState().selectAgent(null)
      expect(useStore.getState().selectedAgentId).toBeNull()
    })
  })
})
