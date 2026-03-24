import React, { useRef, useState } from 'react'
import { Box, Text, useInput } from 'ink'
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
  const prefix = isUser ? '> You' : `  ${message.agentId}`
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
  const adaptersRef = useRef<Map<string, ClaudeAdapter>>(new Map())

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

  useInput((char, key) => {
    if (!isActive) return

    if (key.return) {
      const trimmed = input.trim()
      if (!trimmed) return

      const userMsg: Message = {
        id: `msg-${Date.now()}`,
        agentId: 'user',
        content: trimmed,
        timestamp: Date.now(),
        role: 'user',
      }
      addMessage(userMsg)

      if (selectedAgentId) {
        const adapter = getAdapter(selectedAgentId)
        adapter.spawn(trimmed)
      }

      setInput('')
    } else if (key.backspace || key.delete) {
      setInput((prev) => prev.slice(0, -1))
    } else if (!key.ctrl && !key.meta && char) {
      setInput((prev) => prev + char)
    }
  })

  const selectedAgent = agents.find((a) => a.id === selectedAgentId)
  const filteredMessages = selectedAgentId
    ? messages.filter((m) => m.agentId === selectedAgentId || m.role === 'user')
    : messages
  const recentMessages = filteredMessages.slice(-8)

  return (
    <Box
      flexDirection="column"
      width={42}
      borderStyle="round"
      borderColor={isActive ? 'cyan' : 'gray'}
      paddingX={1}
    >
      {/* Header */}
      <Box>
        <Text bold color={isActive ? 'cyan' : 'white'}>Chat</Text>
        {selectedAgent && (
          <Text color="dim">  → {selectedAgent.name} [{selectedAgent.config?.mode ?? 'auto'}]</Text>
        )}
      </Box>

      {/* Divider */}
      <Text color="dim">{'─'.repeat(38)}</Text>

      {/* Messages */}
      <Box flexDirection="column" flexGrow={1} minHeight={10}>
        {recentMessages.length === 0 ? (
          <Text color="dim">No messages yet. Select an agent and type.</Text>
        ) : (
          recentMessages.map((msg) => (
            <MessageRow key={msg.id} message={msg} />
          ))
        )}
      </Box>

      {/* Divider */}
      <Text color="dim">{'─'.repeat(38)}</Text>

      {/* Input */}
      <Box>
        <Text color="cyan">&gt; </Text>
        <Text>{input}</Text>
        {isActive && <Text color="cyan">█</Text>}
      </Box>

      {!isActive && (
        <Text color="dim">Press Tab to focus chat</Text>
      )}
    </Box>
  )
}

export default ChatPanel
