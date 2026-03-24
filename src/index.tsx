import 'dotenv/config'
import React, { useEffect, useRef } from 'react'
import { render, Box } from 'ink'
import OfficeView from './components/OfficeView'
import { useStore } from './store'
import { ClaudeAdapter } from './agents/ClaudeAdapter'

// Drives each agent: uses real Claude CLI when ANTHROPIC_API_KEY is set, otherwise mock.
const DemoController: React.FC = () => {
  const agents = useStore((state) => state.agents)
  const cleanupRef = useRef<Array<() => void>>([])
  const hasKey = Boolean(process.env.ANTHROPIC_API_KEY)

  useEffect(() => {
    const cancels = agents.map((agent, index) => {
      const adapter = new ClaudeAdapter({ agentId: agent.id })
      const delay = index * 1200
      const timer = setTimeout(() => {
        if (hasKey) {
          // Real mode: send an initial prompt to each agent based on its role
          adapter.spawn(`You are a ${agent.role} agent. Briefly describe what you are working on right now in one sentence.`)
        } else {
          const cleanup = adapter.startMockSimulation()
          cleanupRef.current.push(cleanup)
        }
      }, delay)
      return () => clearTimeout(timer)
    })

    return () => {
      cancels.forEach((cancel) => cancel())
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
