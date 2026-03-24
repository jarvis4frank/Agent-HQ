import React, { useState } from 'react'
import { Box, Text, useInput, useApp } from 'ink'
import { useStore, createAgent, hasClaudeCli } from '../store.js'
import { ClaudeAdapter } from '../agents/ClaudeAdapter.js'
import AgentList from './AgentList.js'
import ChatPanel from './ChatPanel.js'
import AgentConfigForm, { AgentFormValues } from './AgentConfigForm.js'

type FocusArea = 'office' | 'chat'
type OverlayMode = 'none' | 'add'

interface OfficeViewProps {
  cliAvailable?: boolean
}

const OfficeView: React.FC<OfficeViewProps> = ({ cliAvailable: initialCliAvailable }) => {
  const agents = useStore((state) => state.agents)
  const selectedAgentId = useStore((state) => state.selectedAgentId)
  const selectAgent = useStore((state) => state.selectAgent)
  const addAgent = useStore((state) => state.addAgent)
  const removeAgent = useStore((state) => state.removeAgent)

  const { exit } = useApp()
  const [focus, setFocus] = useState<FocusArea>('office')
  const [overlay, setOverlay] = useState<OverlayMode>('none')

  const hasApiKey = Boolean(process.env.ANTHROPIC_API_KEY)
  const hasClaudeCliResult = initialCliAvailable ?? hasClaudeCli()
  const isCliMode = hasClaudeCliResult || hasApiKey

  const handleAddAgent = (values: AgentFormValues): void => {
    const agent = createAgent({ name: values.name, role: values.role, config: values.config })
    addAgent(agent)
    selectAgent(agent.id)

    const adapter = new ClaudeAdapter({
      agentId: agent.id,
      mode: values.config.mode ?? 'auto',
      workDir: values.config.workDir,
      systemPrompt: values.config.systemPrompt,
    })

    if (values.config.initialPrompt?.trim()) {
      adapter.spawn(values.config.initialPrompt)
    } else if (adapter.getResolvedMode() === 'mock') {
      adapter.startMockSimulation()
    }

    setOverlay('none')
  }

  useInput((char, key) => {
    if (overlay !== 'none') return  // let AgentConfigForm handle input

    if (char === 'q' || (key.ctrl && char === 'c')) {
      exit()
      return
    }

    if (key.tab) {
      setFocus((prev) => (prev === 'office' ? 'chat' : 'office'))
    }

    if (focus === 'office') {
      if (char === '+' || char === '=' || char === 'a') {
        setOverlay('add')
        return
      }

      if (char === '-' || char === '_') {
        if (selectedAgentId && agents.length > 1) {
          removeAgent(selectedAgentId)
        }
        return
      }

      if (key.leftArrow || key.rightArrow || key.upArrow || key.downArrow) {
        const ids = agents.map((a) => a.id)
        const currentIdx = ids.indexOf(selectedAgentId ?? '')
        if (key.rightArrow || key.downArrow) {
          selectAgent(ids[(currentIdx + 1) % ids.length] ?? null)
        } else {
          selectAgent(ids[(currentIdx - 1 + ids.length) % ids.length] ?? null)
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
        <Box flexGrow={1} />
        {isCliMode
          ? <Text color="green"> API: Claude Code ready</Text>
          : <Text color="yellow"> API: no key (mock mode)</Text>
        }
      </Box>

      {/* Add Agent Overlay */}
      {overlay === 'add' && (
        <Box marginTop={1} marginLeft={2}>
          <AgentConfigForm
            onSubmit={handleAddAgent}
            onCancel={() => setOverlay('none')}
          />
        </Box>
      )}

      {/* Main Content */}
      {overlay === 'none' && (
        <Box flexDirection="row" marginTop={1}>
          {/* Office Scene */}
          <Box flexDirection="column" flexGrow={1}>
            <Box>
              <Text bold color={focus === 'office' ? 'cyan' : 'white'}>Office</Text>
              <Text color="dim">  {agents.length} agents  |  arrows: select  |  a/+: add  |  -: remove  |  tab: switch panel  |  q: quit</Text>
            </Box>
            <AgentList />
          </Box>

          {/* Chat Panel */}
          <ChatPanel isActive={focus === 'chat'} />
        </Box>
      )}

      {/* Status Bar */}
      {overlay === 'none' && (
        <Box borderStyle="single" paddingX={1}>
          <Text color="dim">
            Selected: {selectedAgentId ?? 'none'} | Agents: {agents.length} | Focus: {focus} | Mode: {hasApiKey ? 'sdk' : 'mock'}
          </Text>
        </Box>
      )}
    </Box>
  )
}

export default OfficeView
