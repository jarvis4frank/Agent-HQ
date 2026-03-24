import React from 'react'
import { render, Box, Text } from 'ink'
import { useStore } from '../store.js'
import AgentList from './AgentList'

const OfficeView: React.FC = () => {
  const agents = useStore((state) => state.agents)
  const messages = useStore((state) => state.messages)

  return (
    <Box flexDirection="column" height={100}>
      {/* Header */}
      <Box borderStyle="bold" borderColor="cyan" padding={1}>
        <Text bold color="cyan">🏢 Agent HQ - Claude Code Team Visualization</Text>
      </Box>

      {/* Main Content */}
      <Box flexDirection="row" flexGrow={1} padding={1}>
        {/* Office Scene - Agent Grid */}
        <Box flexDirection="column" width={60}>
          <Text bold>📍 Office</Text>
          <AgentList />
        </Box>

        {/* Side Panel - Messages */}
        <Box flexDirection="column" width={40} borderStyle="round" borderColor="gray" padding={1}>
          <Text bold>💬 Messages</Text>
          {messages.length === 0 ? (
            <Text color="dim">No messages yet</Text>
          ) : (
            messages.slice(-5).map((msg) => (
              <Text key={msg.id} color="dim">
                {msg.role === 'user' ? '>' : msg.agentId}: {msg.content.slice(0, 30)}...
              </Text>
            ))
          )}
        </Box>
      </Box>

      {/* Status Bar */}
      <Box borderStyle="single" padding={1}>
        <Text color="dim">
          Agents: {agents.length} | Selected: {useStore.getState().selectedAgentId || 'none'} | Press Tab to select
        </Text>
      </Box>
    </Box>
  )
}

export default OfficeView
