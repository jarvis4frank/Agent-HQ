import React, { useRef, useState, useEffect } from 'react'
import { Box, Text, useInput, Spacer } from 'ink'
import TextInput from 'ink-text-input'
import { useStore } from '../store.js'
import { ClaudeAdapter } from '../agents/ClaudeAdapter.js'
import { Message } from '../agents/types.js'

const roleColor: Record<string, string> = {
  user: 'cyan',
  agent: 'green',
}

const MessageRow: React.FC<{ message: Message }> = ({ message }) => {
  const isUser = message.role === 'user'
  const color = roleColor[message.role] ?? 'white'
  const prefix = isUser ? '▸ You' : `  ◇ ${message.agentId}`
  const time = new Date(message.timestamp).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  })

  return (
    <Box flexDirection="column" marginBottom={0}>
      <Box>
        <Text color={color} bold>{prefix}</Text>
        <Text color="dim">  {time}</Text>
      </Box>
      <Text wrap="wrap">  {message.content}</Text>
    </Box>
  )
}

interface ChatPanelProps {
  isActive: boolean
}

const ChatPanel: React.FC<ChatPanelProps> = ({ isActive }) => {
  const messages = useStore((state) => state.messages)
  const agents = useStore((state) => state.agents)
  const selectedAgentId = useStore((state) => state.selectedAgentId)
  const addMessage = useStore((state) => state.addMessage)

  const [input, setInput] = useState('')
  const [isCollapsed, setIsCollapsed] = useState(false)
  const [showHelp, setShowHelp] = useState(false)
  const adaptersRef = useRef<Map<string, ClaudeAdapter>>(new Map())

  // Auto-collapse when switching away from chat
  useEffect(() => {
    if (!isActive && !isCollapsed) {
      setIsCollapsed(true)
    }
  }, [isActive])

  const getAdapter = (agentId: string): ClaudeAdapter => {
    if (!adaptersRef.current.has(agentId)) {
      const agent = agents.find((a) => a.id === agentId)
      adaptersRef.current.set(
        agentId,
        new ClaudeAdapter({
          agentId,
          mode: agent?.config?.mode ?? 'auto',
          workDir: agent?.config?.workDir,
          systemPrompt: agent?.config?.systemPrompt,
        }),
      )
    }
    return adaptersRef.current.get(agentId)!
  }

  const handleSend = (text: string) => {
    const trimmed = text.trim()
    if (!trimmed) return

    // Process special commands
    let processedContent = trimmed
    
    // Handle @file references - read file content inline
    const fileRefMatch = trimmed.match(/@(\S+)/g)
    if (fileRefMatch) {
      for (const ref of fileRefMatch) {
        const filePath = ref.slice(1)
        try {
          const fs = require('fs')
          if (fs.existsSync(filePath)) {
            const content = fs.readFileSync(filePath, 'utf-8').slice(0, 2000)
            processedContent = processedContent.replace(ref, `\n[File: ${filePath}]\n${content}\n[/File]`)
          }
        } catch (e) {}
      }
    }

    // Handle &gt;cmd - run command
    const cmdMatch = trimmed.match(/^>(\S+)\s*(.*)$/m)
    if (cmdMatch) {
      const cmd = cmdMatch[1]
      try {
        const { execSync } = require('child_process')
        const output = execSync(cmd, { cwd: process.cwd(), encoding: 'utf-8', timeout: 10000 }).slice(0, 2000)
        processedContent = `[Command: ${cmd}]\n${output}\n[/Command]\n\n${trimmed.replace(/^>.*$/m, '').trim()}`
      } catch (e) {
        processedContent = `[Command failed: ${cmd}]\n${trimmed.replace(/^>.*$/m, '').trim()}`
      }
    }

    const userMsg: Message = {
      id: `msg-${Date.now()}`,
      agentId: 'user',
      content: processedContent,
      timestamp: Date.now(),
      role: 'user',
    }
    addMessage(userMsg)

    if (selectedAgentId) {
      const adapter = getAdapter(selectedAgentId)
      adapter.spawn(processedContent)
    }

    setInput('')
  }

  useInput((char, key) => {
    // Toggle collapse with backslash key (only in chat mode)
    if (isActive && char === '\\') {
      setIsCollapsed((prev) => !prev)
      return
    }

    // Help trigger
    if (isActive && char === '?' && !isCollapsed) {
      setShowHelp(prev => !prev)
      return
    }

    if (!isActive || isCollapsed) return

    // Ctrl+C to cancel
    if (key.ctrl && char === 'c') {
      setInput('')
      return
    }
  })

  const selectedAgent = agents.find((a) => a.id === selectedAgentId)
  const filteredMessages = selectedAgentId
    ? messages.filter((m) => m.agentId === selectedAgentId || m.role === 'user')
    : messages
  const recentMessages = filteredMessages.slice(-12)

  // Render collapsed state
  if (isCollapsed) {
    return (
      <Box
        flexDirection="column"
        borderStyle="round"
        borderColor={isActive ? 'cyan' : 'gray'}
        paddingX={1}
      >
        <Box justifyContent="space-between">
          <Box>
            <Text bold color={isActive ? 'cyan' : 'white'}>Chat</Text>
            {selectedAgent && (
              <Text color="dim">  → {selectedAgent.name}</Text>
            )}
          </Box>
          <Text color="dim">[\\ expand]</Text>
        </Box>
        <Text color="dim">{'─'.repeat(38)}</Text>
        <Text color="dim" italic>Press \ to expand</Text>
      </Box>
    )
  }

  // Render help overlay
  if (showHelp) {
    return (
      <Box
        flexDirection="column"
        borderStyle="round"
        borderColor="yellow"
        paddingX={1}
      >
        <Text bold color="yellow">╔═══════════ Help ═══════════╗</Text>
        <Text>▸ Enter   Send message</Text>
        <Text>▸ @path   Reference file</Text>
        <Text>▸ &gt;cmd    Run command</Text>
        <Text>▸ \       Toggle collapse</Text>
        <Text>▸ ?       This help</Text>
        <Text>▸ Ctrl+C  Cancel input</Text>
        <Text>▸ Tab     Switch panel</Text>
        <Spacer />
        <Text color="dim">Press any key to close...</Text>
      </Box>
    )
  }

  // Render expanded state
  return (
    <Box
      flexDirection="column"
      borderStyle="round"
      borderColor={isActive ? 'cyan' : 'gray'}
      paddingX={1}
    >
      {/* Header */}
      <Box justifyContent="space-between">
        <Box>
          <Text bold color={isActive ? 'cyan' : 'white'}>Chat</Text>
          {selectedAgent && (
            <Text color="dim">  → {selectedAgent.name}</Text>
          )}
        </Box>
        <Text color="dim">[\\ collapse]</Text>
      </Box>
      <Text color="dim">{'─'.repeat(40)}</Text>

      {/* Messages */}
      <Box flexDirection="column" flexGrow={1} overflow="hidden">
        {recentMessages.length === 0 ? (
          <Text color="dim" italic>  No messages yet...</Text>
        ) : (
          recentMessages.map((msg) => (
            <MessageRow key={msg.id} message={msg} />
          ))
        )}
      </Box>

      <Text color="dim">{'─'.repeat(40)}</Text>

      {/* Input using ink-text-input - proper multiline support */}
      <Box flexDirection="column">
        <Text color="dim">▸ </Text>
        <TextInput
          value={input}
          onChange={setInput}
          onSubmit={handleSend}
          placeholder="Type message... (Enter to send)"
        />
      </Box>

      {/* Hints */}
      <Box>
        <Text color="dim">▸ @file | &gt;cmd | \ collapse | ? help</Text>
        <Spacer />
        <Text color={isActive ? 'green' : 'dim'}>
          {selectedAgent?.config?.mode ?? 'auto'}
        </Text>
      </Box>
    </Box>
  )
}

export default ChatPanel
