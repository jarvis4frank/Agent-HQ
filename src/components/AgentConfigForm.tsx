import React, { useState } from 'react'
import { Box, Text, useInput } from 'ink'
import { AgentConfig } from '../agents/types.js'

const ROLES = ['researcher', 'coder', 'reviewer', 'executor', 'planner', 'tester'] as const
const MODES = ['auto', 'sdk', 'cli', 'mock'] as const

type Field = 'name' | 'role' | 'mode' | 'workDir' | 'systemPrompt' | 'initialPrompt'
const FIELDS: Field[] = ['name', 'role', 'mode', 'workDir', 'systemPrompt', 'initialPrompt']

const LABELS: Record<Field, string> = {
  name: 'Name',
  role: 'Role',
  mode: 'Mode',
  workDir: 'Work Dir',
  systemPrompt: 'System Prompt',
  initialPrompt: 'Initial Prompt',
}

const HINTS: Record<Field, string> = {
  name: 'Agent display name',
  role: 'Tab cycles options',
  mode: 'Tab cycles: auto/sdk/cli/mock',
  workDir: 'Working directory path',
  systemPrompt: 'Optional system instructions',
  initialPrompt: 'Task to send on spawn',
}

export interface AgentFormValues {
  name: string
  role: string
  config: AgentConfig
}

interface AgentConfigFormProps {
  defaultName?: string
  defaultRole?: string
  defaultConfig?: AgentConfig
  onSubmit: (values: AgentFormValues) => void
  onCancel: () => void
}

const AgentConfigForm: React.FC<AgentConfigFormProps> = ({
  defaultName = '',
  defaultRole = 'coder',
  defaultConfig = {},
  onSubmit,
  onCancel,
}) => {
  const [focusIdx, setFocusIdx] = useState(0)
  const [name, setName] = useState(defaultName)
  const [role, setRole] = useState(defaultRole)
  const [mode, setMode] = useState<string>(defaultConfig.mode ?? 'auto')
  const [workDir, setWorkDir] = useState(defaultConfig.workDir ?? '')
  const [systemPrompt, setSystemPrompt] = useState(defaultConfig.systemPrompt ?? '')
  const [initialPrompt, setInitialPrompt] = useState(defaultConfig.initialPrompt ?? '')

  const values: Record<Field, string> = { name, role, mode, workDir, systemPrompt, initialPrompt }
  const setters: Record<Field, (v: string) => void> = {
    name: setName,
    role: setRole,
    mode: setMode,
    workDir: setWorkDir,
    systemPrompt: setSystemPrompt,
    initialPrompt: setInitialPrompt,
  }

  const focusField = FIELDS[focusIdx]

  useInput((char, key) => {
    if (key.escape) { onCancel(); return }

    if (key.return) {
      if (name.trim()) {
        onSubmit({
          name: name.trim() || 'Agent',
          role,
          config: {
            mode: mode as AgentConfig['mode'],
            workDir: workDir.trim() || undefined,
            systemPrompt: systemPrompt.trim() || undefined,
            initialPrompt: initialPrompt.trim() || undefined,
          },
        })
      }
      return
    }

    if (key.tab || key.upArrow || key.downArrow) {
      const dir = key.upArrow ? -1 : 1
      setFocusIdx((i) => (i + dir + FIELDS.length) % FIELDS.length)
      return
    }

    // Cycle enum fields
    if (focusField === 'role' && (char === ' ' || key.rightArrow)) {
      const idx = ROLES.indexOf(role as typeof ROLES[number])
      setRole(ROLES[(idx + 1) % ROLES.length])
      return
    }
    if (focusField === 'mode' && (char === ' ' || key.rightArrow)) {
      const idx = MODES.indexOf(mode as typeof MODES[number])
      setMode(MODES[(idx + 1) % MODES.length])
      return
    }

    // Text input for text fields
    if (focusField === 'name' || focusField === 'workDir' || focusField === 'systemPrompt' || focusField === 'initialPrompt') {
      if (key.backspace || key.delete) {
        setters[focusField](values[focusField].slice(0, -1))
      } else if (!key.ctrl && !key.meta && char) {
        setters[focusField](values[focusField] + char)
      }
    }
  })

  return (
    <Box flexDirection="column" borderStyle="round" borderColor="cyan" paddingX={2} paddingY={1} width={60}>
      <Text bold color="cyan">Configure Agent</Text>
      <Text color="dim">Tab/arrows: navigate  |  Space: cycle options  |  Enter: create  |  Esc: cancel</Text>
      <Box marginTop={1} flexDirection="column">
        {FIELDS.map((field, i) => {
          const isFocused = i === focusIdx
          const value = values[field]
          const isEnum = field === 'role' || field === 'mode'
          return (
            <Box key={field} marginBottom={0}>
              <Box width={16}>
                <Text color={isFocused ? 'cyan' : 'white'} bold={isFocused}>
                  {isFocused ? '> ' : '  '}{LABELS[field]}:
                </Text>
              </Box>
              <Box flexGrow={1}>
                <Text color={isFocused ? 'yellow' : 'white'}>
                  {value || (isFocused ? ' ' : '')}
                  {isFocused && !isEnum ? <Text color="cyan">█</Text> : null}
                </Text>
                {isFocused && (
                  <Text color="dim">  {HINTS[field]}</Text>
                )}
              </Box>
            </Box>
          )
        })}
      </Box>
      {!name.trim() && (
        <Text color="red">Name is required</Text>
      )}
    </Box>
  )
}

export default AgentConfigForm
