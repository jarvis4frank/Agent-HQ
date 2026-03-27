import { useState } from 'react'
import { Bot } from 'lucide-react'
import { useAppStore } from '../stores/appStore'
import type { Agent, Tool } from '../types'
import styles from './AgentPanel.module.css'

interface Props {
  className?: string
}

// Status color mapping
const statusColors: Record<string, string> = {
  running: styles.statusRunning,
  idle: styles.statusIdle,
  thinking: styles.statusThinking,
  working: styles.statusExecuting,
  waiting: styles.statusWaiting,
  error: styles.statusError,
  executing: styles.statusExecuting,
  completed: styles.statusCompleted,
  failed: styles.statusError,
}

// Format duration
function formatDuration(seconds: number): string {
  if (seconds < 1) return '<1s'
  if (seconds < 60) return `${seconds.toFixed(1)}s`
  const mins = Math.floor(seconds / 60)
  const secs = Math.floor(seconds % 60)
  return `${mins}m ${secs}s`
}

// Get tool icon/display name
function getToolDisplayName(toolName: string): string {
  // Map common tool names to display names
  const mappings: Record<string, string> = {
    WebSearch: 'WebSearch (SerpApi)',
    web_search: 'WebSearch (SerpApi)',
    Read: 'File Reader',
    read: 'File Reader',
    Bash: 'Bash',
    bash: 'Bash',
    Glob: 'Glob',
    glob: 'Glob',
    Grep: 'Grep',
    grep: 'Grep',
    Edit: 'Editor',
    edit: 'Editor',
    Notion: 'Notion API',
    notion: 'Notion API',
    Jupyter: 'Jupyter Notebook',
    jupyter: 'Jupyter Notebook',
  }
  return mappings[toolName] || toolName
}

// Derive role from agent type
function deriveRole(agentType: string): string {
  const type = agentType?.toLowerCase() || ''
  if (type.includes('research')) return 'Researcher'
  if (type.includes('analyst')) return 'Analyst'
  if (type.includes('code') || type.includes('dev')) return 'Developer'
  if (type.includes('writer')) return 'Writer'
  if (type.includes('main') || type.includes('coordinator')) return 'Coordinator'
  return 'Assistant'
}

// Tool Item Component
function ToolItem({ tool }: { tool: Tool }) {
  const [showTooltip, setShowTooltip] = useState(false)
  
  const statusClass = statusColors[tool.status] || styles.statusIdle
  const isExecuting = tool.status === 'executing'
  const isCompleted = tool.status === 'completed'
  const isFailed = tool.status === 'failed'
  
  // Calculate duration if executing
  const duration = tool.startedAt 
    ? (tool.duration || (Date.now() - tool.startedAt) / 1000)
    : undefined

  return (
    <div 
      className={styles.toolItem}
      onMouseEnter={() => tool.hookEvent && setShowTooltip(true)}
      onMouseLeave={() => setShowTooltip(false)}
    >
      <div className={styles.toolRow}>
        <span className={`${styles.statusDot} ${statusClass}`} />
        <span className={styles.toolName}>{getToolDisplayName(tool.name)}</span>
        {isExecuting && duration && (
          <span className={styles.duration}>{formatDuration(duration)}</span>
        )}
        {isCompleted && tool.duration && (
          <span className={styles.duration}>{formatDuration(tool.duration)}</span>
        )}
        {isFailed && tool.startedAt && (
          <span className={styles.errorTime}>
            ({Math.floor((Date.now() - tool.startedAt) / 1000)}s ago)
          </span>
        )}
      </div>
      
      {/* Show query or command if available */}
      {(tool.query || tool.command) && (
        <div className={styles.toolDetail}>
          {tool.query && <span className={styles.detailLabel}>Query: </span>}
          {tool.command && <span className={styles.detailLabel}>Command: </span>}
          <span className={styles.detailValue}>
            {tool.query || tool.command}
          </span>
        </div>
      )}
      
      {/* Show error if failed */}
      {isFailed && tool.error && (
        <div className={styles.errorMessage}>
          Error: {tool.error}
        </div>
      )}
      
      {/* Hook tooltip */}
      {showTooltip && tool.hookEvent && (
        <div className={styles.tooltip}>
          <div className={styles.tooltipHeader}>HOOK</div>
          <div className={styles.tooltipEvent}>Event: {tool.hookEvent}</div>
          <div className={styles.tooltipTarget}>Target: {tool.name}</div>
          {tool.hookPayload && (
            <div className={styles.tooltipPayload}>
              Payload: {JSON.stringify(tool.hookPayload, null, 2)}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// Agent Card Component
function AgentCard({ agent }: { agent: Agent }) {
  const [expanded, setExpanded] = useState(true)
  const tools = agent.tools || []
  
  const statusClass = statusColors[agent.status] || styles.statusIdle
  
  return (
    <div className={styles.agentCard}>
      <div 
        className={styles.agentHeader}
        onClick={() => setExpanded(!expanded)}
      >
        <span className={styles.expandIcon}>
          {expanded ? '▼' : '▶'}
        </span>
        <span className={`${styles.statusDot} ${statusClass}`} />
        <span className={styles.agentName}>{agent.name}</span>
        <span className={styles.agentRole}>({deriveRole(agent.role)})</span>
        {agent.currentTask && (
          <span className={styles.agentTask}>{agent.currentTask}</span>
        )}
      </div>
      
      {expanded && tools.length > 0 && (
        <div className={styles.toolsContainer}>
          {tools.map((tool, idx) => (
            <ToolItem key={`${agent.id}-${tool.name}-${idx}`} tool={tool} />
          ))}
        </div>
      )}
      
      {expanded && tools.length === 0 && (
        <div className={styles.noTools}>No tools executed yet</div>
      )}
    </div>
  )
}

// Manager Component
function ManagerView({ 
  name, 
  status, 
  agents 
}: { 
  name: string
  status: 'running' | 'idle'
  agents: Agent[]
}) {
  const statusClass = statusColors[status] || styles.statusIdle
  
  return (
    <div className={styles.managerCard}>
      <div className={styles.managerHeader}>
        <span className={`${styles.statusDot} ${statusClass}`} />
        <span className={styles.managerLabel}>MANAGER:</span>
        <span className={styles.managerName}>{name}</span>
      </div>
      <div className={styles.agentsContainer}>
        {agents.map(agent => (
          <AgentCard key={agent.id} agent={agent} />
        ))}
      </div>
    </div>
  )
}

// Timeline Component
function Timeline() {
  const { timelineEvents } = useAppStore()
  
  if (timelineEvents.length === 0) {
    return null
  }
  
  const getEventIcon = (event: string) => {
    switch (event) {
      case 'started': return '▶'
      case 'completed': return '✓'
      case 'error': return '✗'
      case 'thinking': return '💭'
      default: return '•'
    }
  }
  
  const getEventClass = (event: string) => {
    switch (event) {
      case 'started': return styles.eventStarted
      case 'completed': return styles.eventCompleted
      case 'error': return styles.eventError
      case 'thinking': return styles.eventThinking
      default: return ''
    }
  }
  
  return (
    <div className={styles.timeline}>
      <div className={styles.timelineHeader}>
        <span>⏰ Timeline</span>
      </div>
      <div className={styles.timelineContent}>
        {timelineEvents.slice(0, 10).map(event => (
          <div key={event.id} className={`${styles.timelineEvent} ${getEventClass(event.event)}`}>
            <span className={styles.timelineTime}>{event.timestamp}</span>
            <span className={styles.timelineIcon}>{getEventIcon(event.event)}</span>
            <span className={styles.timelineAgent}>{event.agentName}</span>
            <span className={styles.timelineMessage}>{event.message}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

export default function AgentPanel({ className }: Props) {
  const { agents, manager } = useAppStore()
  
  const hasAgents = agents.length > 0 || manager !== null
  
  if (!hasAgents) {
    return (
      <div className={`${styles.container} ${className || ''}`}>
        <div className={styles.emptyState}>
          <Bot size={32} />
          <p>Connect to a session to see agents</p>
        </div>
      </div>
    )
  }
  
  return (
    <div className={`${styles.container} ${className || ''}`}>
      <div className={styles.header}>
        <span className={styles.headerTitle}>Agents</span>
        <span className={styles.headerCount}>
          {agents.length + (manager ? 1 : 0)}
        </span>
      </div>
      
      <div className={styles.content}>
        {/* Manager (if exists) */}
        {manager && (
          <ManagerView 
            name={manager.name} 
            status={manager.status} 
            agents={agents}
          />
        )}
        
        {/* No manager, just show agents */}
        {!manager && agents.length > 0 && (
          <div className={styles.agentsList}>
            {agents.map(agent => (
              <AgentCard key={agent.id} agent={agent} />
            ))}
          </div>
        )}
        
        {/* No agents at all */}
        {!manager && agents.length === 0 && (
          <div className={styles.noAgents}>
            <p>No agent activity yet</p>
          </div>
        )}
      </div>
      
      {/* Floating timeline */}
      <Timeline />
    </div>
  )
}