import { useState } from 'react'
import { Bot, Zap, Brain, Clock, AlertCircle, ChevronDown, ChevronUp } from 'lucide-react'
import { useAppStore } from '../stores/appStore'
import type { Agent, AgentStatus } from '../types'
import styles from './AgentPanel.module.css'

const STATUS_CONFIG: Record<AgentStatus, { color: string; label: string; icon: typeof Bot }> = {
  idle: { color: 'gray', label: 'Idle', icon: Bot },
  running: { color: 'green', label: 'Running', icon: Zap },
  thinking: { color: 'yellow', label: 'Thinking', icon: Brain },
  working: { color: 'purple', label: 'Working', icon: Clock },
  error: { color: 'red', label: 'Error', icon: AlertCircle },
  waiting: { color: 'blue', label: 'Waiting', icon: Clock },
}

function getInitials(name: string): string {
  return name
    .split(' ')
    .map((word) => word[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

function getAvatarColor(role: string): string {
  const colors = [
    '#58a6ff',
    '#3fb950',
    '#a371f7',
    '#d29922',
    '#f85149',
    '#8b949e',
  ]
  let hash = 0
  for (let i = 0; i < role.length; i++) {
    hash = role.charCodeAt(i) + ((hash << 5) - hash)
  }
  return colors[Math.abs(hash) % colors.length]
}

interface AgentCardProps {
  agent: Agent
  isSelected: boolean
  onClick: () => void
}

function AgentCard({ agent, isSelected, onClick }: AgentCardProps) {
  const config = STATUS_CONFIG[agent.status]
  const IconComponent = config.icon

  return (
    <div
      className={`${styles.card} ${styles[agent.status]} ${isSelected ? styles.selected : ''}`}
      onClick={onClick}
    >
      <div className={styles.cardHeader}>
        <div
          className={styles.avatar}
          style={{ backgroundColor: getAvatarColor(agent.role) }}
        >
          {getInitials(agent.name)}
        </div>
        <div className={styles.agentInfo}>
          <div className={styles.agentName}>
            {agent.name}
            {agent.isMain && <span className={styles.mainBadge}>Main</span>}
          </div>
          <div className={styles.agentRole}>{agent.role}</div>
        </div>
        <div className={`${styles.statusBadge} ${styles[config.color]}`}>
          <IconComponent size={12} />
          <span>{config.label}</span>
        </div>
      </div>

      {agent.currentTask && (
        <div className={styles.currentTask}>
          <span className={styles.taskLabel}>Current:</span>
          <span className={styles.taskText}>{agent.currentTask}</span>
        </div>
      )}

      {agent.lastMessage && (
        <div className={styles.lastMessage}>
          <span className={styles.messageLabel}>Last:</span>
          <span className={styles.messageText}>{agent.lastMessage}</span>
        </div>
      )}
    </div>
  )
}

interface AgentPanelProps {
  className?: string
}

export default function AgentPanel({ className }: AgentPanelProps) {
  const { agents, selectedAgentId, selectAgent, connectionStatus } = useAppStore()
  const [isCollapsed, setIsCollapsed] = useState(false)

  const toggleCollapsed = () => {
    setIsCollapsed(!isCollapsed)
  }

  return (
    <div className={`${styles.container} agent-panel ${isCollapsed ? styles.collapsed : ''} ${className || ''}`}>
      <div className={styles.header}>
        <span className={styles.title}>Agents</span>
        <div className={styles.headerRight}>
          <span className={styles.count}>{agents.length}</span>
          <button className={styles.collapseBtn} onClick={toggleCollapsed}>
            {isCollapsed ? <ChevronDown size={16} /> : <ChevronUp size={16} />}
          </button>
        </div>
      </div>

      {!isCollapsed && (
        <div className={styles.content}>
          {connectionStatus !== 'connected' && (
            <div className={styles.emptyState}>
              <Bot size={48} className={styles.emptyIcon} />
              <p>Connect to a session to see agents</p>
            </div>
          )}

          {connectionStatus === 'connected' && agents.length === 0 && (
            <div className={styles.emptyState}>
              <Bot size={48} className={styles.emptyIcon} />
              <p>No agents in this session</p>
            </div>
          )}

          {agents.length > 0 && (
            <div className={styles.grid}>
              {agents.map((agent) => (
                <AgentCard
                  key={agent.id}
                  agent={agent}
                  isSelected={agent.id === selectedAgentId}
                  onClick={() => selectAgent(agent.id === selectedAgentId ? null : agent.id)}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
