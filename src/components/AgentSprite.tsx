import React, { useEffect, useState } from 'react'
import { Box, Text } from 'ink'
import { Agent, AgentStatus } from '../agents/types.js'
import {
  mapAgentToVisual,
  mapClaudeCodeStatus,
  extractStatusFromMessage,
  getIconForStatus,
  STATUS_COLORS,
  STATUS_LABELS,
} from '../sprites/mapper.js'

interface AgentSpriteProps {
  agent: Agent
  isSelected: boolean
  onSelect?: (id: string) => void
  /** Enable animation loop (for demo/testing) */
  animated?: boolean
}

/** Animation frames for each status type */
const STATUS_FRAMES: Record<AgentStatus, string[]> = {
  idle: [' ', '  '],
  thinking: ['💭', ' '],
  running: ["🔄", "  "],
  working: ['⚡', '⚡'],
  error: ['❌', '❗'],
  waiting: ['⚠️', ' '],
}

const AgentSprite: React.FC<AgentSpriteProps> = ({
  agent,
  isSelected,
  onSelect,
  animated = false,
}) => {
  const visual = mapAgentToVisual(agent)
  const [frame, setFrame] = useState(0)

  // Animation loop
  useEffect(() => {
    if (!animated) return

    const interval = setInterval(() => {
      setFrame(f => (f + 1) % 2)
    }, 800)

    return () => clearInterval(interval)
  }, [animated])

  const borderColor = isSelected ? 'cyan' : visual.color
  const borderStyle = isSelected ? 'bold' : 'round'

  return (
    <Box
      flexDirection="column"
      alignItems="center"
      width={18}
      borderStyle={borderStyle}
      borderColor={borderColor}
      paddingX={1}
      paddingY={0}
      marginRight={1}
      marginBottom={1}
    >
      {/* Animated status icon */}
      <Text color={visual.color}>
        {animated
          ? `  ${STATUS_FRAMES[agent.status][frame]}  `
          : `   ${visual.icon}   `}
      </Text>

      {/* Sprite body */}
      {visual.sprite.map((line, i) => (
        <Text key={i} color={visual.color}>{line}</Text>
      ))}

      {/* Agent name */}
      <Text bold color={isSelected ? 'cyan' : 'white'}>
        {agent.isMain ? '★ ' : ''}{agent.name.slice(0, 12)}
      </Text>

      {/* Status badge */}
      <Box>
        <Text backgroundColor={visual.color} color="black">
          {visual.label}
        </Text>
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

// === Export helper functions for external use ===

export {
  mapAgentToVisual,
  mapClaudeCodeStatus,
  extractStatusFromMessage,
  getIconForStatus,
  STATUS_COLORS,
  STATUS_LABELS,
}
