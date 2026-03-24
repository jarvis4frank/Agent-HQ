import React from 'react'
import { Box, Text } from 'ink'
import { useStore } from '../store.js'
import { Agent } from '../agents/types.js'

const statusEmoji: Record<string, string> = {
  idle: '💤',
  thinking: '💭',
  working: '⚡',
  error: '❌',
  waiting: '⚠️',
}

const AgentCard: React.FC<{ agent: Agent }> = ({ agent }) => {
  const isSelected = useStore((state) => state.selectedAgentId) === agent.id

  return (
    <Box
      flexDirection="column"
      width={25}
      borderStyle={isSelected ? 'bold' : 'round'}
      borderColor={isSelected ? 'cyan' : 'gray'}
      padding={1}
      marginRight={1}
    >
      <Text bold>{statusEmoji[agent.status]} {agent.name}</Text>
      <Text color="dim">Role: {agent.role}</Text>
      <Text color="dim">Task: {agent.currentTask || 'none'}</Text>
    </Box>
  )
}

const AgentList: React.FC = () => {
  const agents = useStore((state) => state.agents)

  return (
    <Box flexWrap="wrap">
      {agents.map((agent) => (
        <AgentCard key={agent.id} agent={agent} />
      ))}
    </Box>
  )
}

export default AgentList
