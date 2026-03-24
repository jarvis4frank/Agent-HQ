import { create } from 'zustand'
import { AgentState, Agent } from './agents/types'

// Mock agents for MVP
const mockAgents: Agent[] = [
  { id: '1', name: 'Researcher', role: 'research', status: 'idle', currentTask: 'Analyzing market trends' },
  { id: '2', name: 'Coder', role: 'coder', status: 'working', currentTask: 'Implementing features' },
  { id: '3', name: 'Reviewer', role: 'reviewer', status: 'thinking', currentTask: 'Reviewing code' },
  { id: '4', name: 'Executor', role: 'executor', status: 'waiting', currentTask: 'Waiting for approval' },
]

export const useStore = create<AgentState>((set) => ({
  agents: mockAgents,
  messages: [],
  selectedAgentId: null,
  
  addAgent: (agent) => set((state) => ({ 
    agents: [...state.agents, agent] 
  })),
  
  removeAgent: (id) => set((state) => ({ 
    agents: state.agents.filter(a => a.id !== id) 
  })),
  
  updateAgentStatus: (id, status) => set((state) => ({ 
    agents: state.agents.map(a => 
      a.id === id ? { ...a, status } : a
    )
  })),
  
  addMessage: (message) => set((state) => ({ 
    messages: [...state.messages, message] 
  })),
  
  selectAgent: (id) => set({ selectedAgentId: id }),
}))
