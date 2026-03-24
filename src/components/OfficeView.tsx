import React, { useState } from 'react'
import { Box, Text, useInput } from 'ink'
import { useStore } from '../store.js'
import AgentList from './AgentList.js'
import ChatPanel from './ChatPanel.js'

type FocusArea = 'office' | 'chat'

const OfficeView: React.FC = () => {
  const agents = useStore((state) => state.agents)
  const selectedAgentId = useStore((state) => state.selectedAgentId)
  const selectAgent = useStore((state) => state.selectAgent)

  const [focus, setFocus] = useState<FocusArea>('office')

  useInput((_char, key) => {
    if (key.tab) {
      setFocus((prev) => (prev === 'office' ? 'chat' : 'office'))
    }

    if (focus === 'office') {
      if (key.leftArrow || key.rightArrow || key.upArrow || key.downArrow) {
        const ids = agents.map((a) => a.id)
        const currentIdx = ids.indexOf(selectedAgentId ?? '')
        if (key.rightArrow || key.downArrow) {
          const next = ids[(currentIdx + 1) % ids.length]
          selectAgent(next ?? null)
        } else {
          const prev = ids[(currentIdx - 1 + ids.length) % ids.length]
          selectAgent(prev ?? null)
        }
      }
    }
  })

  return (
    <Box flexDirection="column">
      {/* Header */}
      <Box borderStyle="bold" borderColor="cyan" paddingX={2} paddingY={0}>
        <Text bold color="cyan">Agent HQ</Text>
        <Text color="dim">  Claude Code Team Visualization</Text>
      </Box>

      {/* Main Content */}
      <Box flexDirection="row" marginTop={1}>
        {/* Office Scene */}
        <Box flexDirection="column" flexGrow={1}>
          <Box>
            <Text bold color={focus === 'office' ? 'cyan' : 'white'}>Office</Text>
            <Text color="dim">  {agents.length} agents  |  arrows: select  |  tab: switch panel</Text>
          </Box>
          <AgentList />
        </Box>

        {/* Chat Panel */}
        <ChatPanel isActive={focus === 'chat'} />
      </Box>

      {/* Status Bar */}
      <Box borderStyle="single" paddingX={1}>
        <Text color="dim">
          Selected: {selectedAgentId ?? 'none'} | Focus: {focus} | Tab: switch | Arrows: navigate agents
        </Text>
      </Box>
    </Box>
  )
}

export default OfficeView
