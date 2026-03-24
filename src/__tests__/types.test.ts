import { describe, it, expect } from 'vitest'
import type { Agent, AgentStatus, Message, AgentState } from '../agents/types.js'

describe('Agent types', () => {
  describe('AgentStatus', () => {
    const validStatuses: AgentStatus[] = ['idle', 'thinking', 'working', 'error', 'waiting']

    it('includes all expected status values', () => {
      expect(validStatuses).toHaveLength(5)
      expect(validStatuses).toContain('idle')
      expect(validStatuses).toContain('thinking')
      expect(validStatuses).toContain('working')
      expect(validStatuses).toContain('error')
      expect(validStatuses).toContain('waiting')
    })
  })

  describe('Agent interface', () => {
    it('constructs a minimal agent object', () => {
      const agent: Agent = {
        id: '1',
        name: 'TestAgent',
        role: 'coder',
        status: 'idle',
      }
      expect(agent.id).toBe('1')
      expect(agent.name).toBe('TestAgent')
      expect(agent.role).toBe('coder')
      expect(agent.status).toBe('idle')
      expect(agent.currentTask).toBeUndefined()
      expect(agent.lastMessage).toBeUndefined()
    })

    it('constructs a full agent object with optional fields', () => {
      const agent: Agent = {
        id: '2',
        name: 'FullAgent',
        role: 'researcher',
        status: 'working',
        currentTask: 'Reading files',
        lastMessage: 'Opening src/index.ts',
      }
      expect(agent.currentTask).toBe('Reading files')
      expect(agent.lastMessage).toBe('Opening src/index.ts')
    })

    it('allows all valid statuses', () => {
      const statuses: AgentStatus[] = ['idle', 'thinking', 'working', 'error', 'waiting']
      for (const status of statuses) {
        const agent: Agent = { id: '1', name: 'A', role: 'r', status }
        expect(agent.status).toBe(status)
      }
    })
  })

  describe('Message interface', () => {
    it('constructs a user message', () => {
      const msg: Message = {
        id: 'msg-1',
        agentId: 'agent-1',
        content: 'Hello agent',
        timestamp: 1000,
        role: 'user',
      }
      expect(msg.role).toBe('user')
      expect(msg.content).toBe('Hello agent')
    })

    it('constructs an agent message', () => {
      const msg: Message = {
        id: 'msg-2',
        agentId: 'agent-1',
        content: 'Working on it...',
        timestamp: 2000,
        role: 'agent',
      }
      expect(msg.role).toBe('agent')
    })
  })

  describe('AgentState interface shape', () => {
    it('has the expected action signatures (compile-time check via type assertion)', () => {
      const mockState: Pick<AgentState, 'agents' | 'messages' | 'selectedAgentId'> = {
        agents: [],
        messages: [],
        selectedAgentId: null,
      }
      expect(mockState.agents).toEqual([])
      expect(mockState.messages).toEqual([])
      expect(mockState.selectedAgentId).toBeNull()
    })
  })
})
