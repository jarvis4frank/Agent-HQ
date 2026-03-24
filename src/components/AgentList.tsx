import React from 'react'
import { Box } from 'ink'
import { useStore } from '../store.js'
import AgentSprite from './AgentSprite.js'

const AgentList: React.FC = () => {
  const agents = useStore((state) => state.agents)
  const selectedAgentId = useStore((state) => state.selectedAgentId)

  return (
    <Box flexWrap="wrap" marginTop={1}>
      {agents.map((agent) => (
        <AgentSprite
          key={agent.id}
          agent={agent}
          isSelected={selectedAgentId === agent.id}
        />
      ))}
    </Box>
  )
}

export default AgentList
