import React, { useEffect, useRef } from 'react'
import { render, Box } from 'ink'
import OfficeView from './components/OfficeView'
import { useStore } from './store'
import { ClaudeAdapter } from './agents/ClaudeAdapter'

// Starts mock simulation for each agent to demonstrate live state changes
const DemoController: React.FC = () => {
  const agents = useStore((state) => state.agents)
  const cleanupRef = useRef<Array<() => void>>([])

  useEffect(() => {
    const adapters = agents.map((agent, index) => {
      const adapter = new ClaudeAdapter({ agentId: agent.id })
      // Stagger start times so agents cycle out of sync
      const delay = index * 1200
      const timer = setTimeout(() => {
        const cleanup = adapter.startMockSimulation()
        cleanupRef.current.push(cleanup)
      }, delay)
      return () => clearTimeout(timer)
    })

    return () => {
      adapters.forEach((cancel) => cancel())
      cleanupRef.current.forEach((stop) => stop())
      cleanupRef.current = []
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  return null
}

const App: React.FC = () => (
  <Box flexDirection="column">
    <DemoController />
    <OfficeView />
  </Box>
)

render(<App />)
