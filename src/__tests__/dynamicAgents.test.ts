import { describe, it, expect, beforeEach } from 'vitest'
import { useStore, createAgent } from '../store.js'

beforeEach(() => {
  useStore.setState({ agents: [], messages: [], selectedAgentId: null })
})

describe('createAgent', () => {
  it('creates an agent with a unique id each time', () => {
    const a1 = createAgent()
    const a2 = createAgent()
    expect(a1.id).not.toBe(a2.id)
  })

  it('defaults to idle status', () => {
    expect(createAgent().status).toBe('idle')
  })

  it('accepts overrides', () => {
    const agent = createAgent({ name: 'Custom', role: 'tester', status: 'working' })
    expect(agent.name).toBe('Custom')
    expect(agent.role).toBe('tester')
    expect(agent.status).toBe('working')
  })

  it('assigns a name and role by cycling through presets', () => {
    const agent = createAgent()
    expect(agent.name).toBeTruthy()
    expect(agent.role).toBeTruthy()
  })
})

describe('dynamic agent management via store', () => {
  it('adds a newly created agent to the store', () => {
    const agent = createAgent()
    useStore.getState().addAgent(agent)
    expect(useStore.getState().agents).toHaveLength(1)
    expect(useStore.getState().agents[0].id).toBe(agent.id)
  })

  it('clears selectedAgentId when the selected agent is removed', () => {
    const agent = createAgent()
    useStore.getState().addAgent(agent)
    useStore.getState().selectAgent(agent.id)
    expect(useStore.getState().selectedAgentId).toBe(agent.id)

    useStore.getState().removeAgent(agent.id)
    expect(useStore.getState().selectedAgentId).toBeNull()
  })

  it('does not clear selectedAgentId when a different agent is removed', () => {
    const a1 = createAgent()
    const a2 = createAgent()
    useStore.getState().addAgent(a1)
    useStore.getState().addAgent(a2)
    useStore.getState().selectAgent(a1.id)

    useStore.getState().removeAgent(a2.id)
    expect(useStore.getState().selectedAgentId).toBe(a1.id)
  })

  it('can add multiple agents and remove them individually', () => {
    const agents = [createAgent(), createAgent(), createAgent()]
    agents.forEach((a) => useStore.getState().addAgent(a))
    expect(useStore.getState().agents).toHaveLength(3)

    useStore.getState().removeAgent(agents[1].id)
    expect(useStore.getState().agents).toHaveLength(2)
    expect(useStore.getState().agents.find((a) => a.id === agents[1].id)).toBeUndefined()
  })
})
