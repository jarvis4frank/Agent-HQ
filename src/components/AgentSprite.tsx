import React from 'react'
import { Box, Text } from 'ink'
import { Agent, AgentStatus } from '../agents/types.js'

const statusColor: Record<AgentStatus, string> = {
  idle: 'gray',
  thinking: 'yellow',
  working: 'green',
  error: 'red',
  waiting: 'blue',
}

const statusLabel: Record<AgentStatus, string> = {
  idle: ' IDLE ',
  thinking: ' THINK',
  working: ' WORK ',
  error: ' ERR  ',
  waiting: ' WAIT ',
}

const roleSprite: Record<string, string[]> = {
  research: [
    ' .---. ',
    '(  o  )',
    ' `---` ',
    ' /|||\\  ',
  ],
  coder: [
    ' .---. ',
    '( ._. )',
    ' `---` ',
    ' |{|}| ',
  ],
  reviewer: [
    ' .---. ',
    '( .v. )',
    ' `---` ',
    ' /[_]\\  ',
  ],
  executor: [
    ' .---. ',
    '( >_< )',
    ' `---` ',
    ' |/|\\| ',
  ],
  default: [
    ' .---. ',
    '(  _  )',
    ' `---` ',
    ' /| |\\  ',
  ],
}

interface AgentSpriteProps {
  agent: Agent
  isSelected: boolean
}

const AgentSprite: React.FC<AgentSpriteProps> = ({ agent, isSelected }) => {
  const color = statusColor[agent.status]
  const sprite = roleSprite[agent.role] ?? roleSprite.default
  const label = statusLabel[agent.status]

  return (
    <Box
      flexDirection="column"
      alignItems="center"
      width={18}
      borderStyle={isSelected ? 'bold' : 'round'}
      borderColor={isSelected ? 'cyan' : color}
      paddingX={1}
      paddingY={0}
      marginRight={1}
      marginBottom={1}
    >
      {/* Sprite */}
      {sprite.map((line, i) => (
        <Text key={i} color={color}>{line}</Text>
      ))}

      {/* Name */}
      <Text bold color={isSelected ? 'cyan' : 'white'}>{agent.name.slice(0, 12)}</Text>

      {/* Status badge */}
      <Box>
        <Text backgroundColor={color} color="black">{label}</Text>
      </Box>

      {/* Current task (truncated) */}
      {agent.currentTask && (
        <Text color="dim" wrap="truncate-end">
          {agent.currentTask.slice(0, 14)}
        </Text>
      )}
    </Box>
  )
}

export default AgentSprite
