import { useState } from 'react'
import { Bot } from 'lucide-react'
import { useAppStore } from '../stores/appStore'
import type { Agent, Tool } from '../types'

interface Props {
  className?: string
}

// Status color mapping
const statusColors: Record<string, string> = {
  running: 'bg-[#3fb950]',
  idle: 'bg-[#8b949e]',
  thinking: 'bg-[#d29922]',
  working: 'bg-[#58a6ff]',
  waiting: 'bg-[#58a6ff]',
  error: 'bg-[#f85149]',
  executing: 'bg-[#58a6ff]',
  completed: 'bg-[#3fb950]',
  failed: 'bg-[#f85149]',
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
  
  const statusClass = statusColors[tool.status] || statusColors.idle
  const isExecuting = tool.status === 'executing'
  const isCompleted = tool.status === 'completed'
  const isFailed = tool.status === 'failed'
  
  const duration = tool.startedAt 
    ? (tool.duration || (Date.now() - tool.startedAt) / 1000)
    : undefined

  return (
    <div 
      className="relative pl-9 py-1"
      onMouseEnter={() => tool.hookEvent && setShowTooltip(true)}
      onMouseLeave={() => setShowTooltip(false)}
    >
      <div className="flex items-center gap-2">
        <span className={`w-2 h-2 rounded-full flex-shrink-0 ${statusClass}`} />
        <span className="text-[13px] font-medium text-text-secondary">{getToolDisplayName(tool.name)}</span>
        {isExecuting && duration && (
          <span className="text-[11px] text-accent-blue ml-auto">{formatDuration(duration)}</span>
        )}
        {isCompleted && tool.duration && (
          <span className="text-[11px] text-accent-blue ml-auto">{formatDuration(tool.duration)}</span>
        )}
        {isFailed && tool.startedAt && (
          <span className="text-[11px] text-accent-red ml-auto">
            ({Math.floor((Date.now() - tool.startedAt) / 1000)}s ago)
          </span>
        )}
      </div>
      
      {(tool.query || tool.command) && (
        <div className="pl-5 text-[12px] text-text-muted mt-0.5">
          <span className="text-text-secondary">{tool.query ? 'Query: ' : 'Command: '}</span>
          <span className="font-mono text-text-secondary">{tool.query || tool.command}</span>
        </div>
      )}
      
      {isFailed && tool.error && (
        <div className="pl-5 text-[12px] text-accent-red mt-1">
          Error: {tool.error}
        </div>
      )}
      
      {showTooltip && tool.hookEvent && (
        <div className="absolute left-full top-0 ml-2 bg-bg-secondary border border-border rounded-md p-3 z-50 min-w-[200px] max-w-[300px] shadow-lg">
          <div className="text-[10px] font-semibold text-accent-yellow uppercase tracking-wide mb-1">HOOK</div>
          <div className="text-[11px] text-text-primary font-mono break-all">Event: {tool.hookEvent}</div>
          <div className="text-[11px] text-accent-blue mt-1">Target: {tool.name}</div>
          {tool.hookPayload && (
            <div className="text-[10px] text-text-secondary mt-1 font-mono whitespace-pre-wrap break-all max-h-[100px] overflow-y-auto">
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
  
  const statusClass = statusColors[agent.status] || statusColors.idle
  
  return (
    <div className="mb-2">
      <div 
        className="flex items-center gap-2 py-2 px-3 cursor-pointer rounded-md bg-bg-secondary hover:bg-bg-tertiary"
        onClick={() => setExpanded(!expanded)}
      >
        <span className="text-[10px] text-text-muted w-3">
          {expanded ? '▼' : '▶'}
        </span>
        <span className={`w-2 h-2 rounded-full flex-shrink-0 ${statusClass}`} />
        <span className="text-sm font-semibold text-text-primary">{agent.name}</span>
        <span className="text-xs font-normal text-text-secondary italic">({deriveRole(agent.role)})</span>
        {agent.currentTask && (
          <span className="text-xs text-text-secondary ml-auto max-w-[200px] overflow-hidden text-ellipsis whitespace-nowrap">{agent.currentTask}</span>
        )}
      </div>
      
      {expanded && tools.length > 0 && (
        <div className="pl-9 mt-1">
          {tools.map((tool, idx) => (
            <ToolItem key={`${agent.id}-${tool.name}-${idx}`} tool={tool} />
          ))}
        </div>
      )}
      
      {expanded && tools.length === 0 && (
        <div className="pl-9 text-xs text-text-muted italic">No tools executed yet</div>
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
  const statusClass = statusColors[status] || statusColors.idle
  
  return (
    <div className="mb-4">
      <div className="flex items-center gap-2 p-3 bg-bg-secondary rounded-md mb-2">
        <span className={`w-2 h-2 rounded-full ${statusClass}`} />
        <span className="text-xs font-semibold text-text-secondary uppercase tracking-wide">MANAGER:</span>
        <span className="text-sm font-semibold text-text-primary">{name}</span>
      </div>
      <div className="pl-6 border-l border-border">
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
      case 'started': return 'text-accent-green'
      case 'completed': return 'text-accent-green'
      case 'error': return 'text-accent-red'
      case 'thinking': return 'text-accent-yellow'
      default: return ''
    }
  }
  
  return (
    <div className="absolute bottom-0 left-0 right-0 bg-[rgba(22,27,34,0.95)] backdrop-blur-sm border-t border-border max-h-[120px] overflow-hidden">
      <div className="py-2 px-4 text-[11px] font-semibold text-[#7d8590] border-b border-border">
        <span>⏰ Timeline</span>
      </div>
      <div className="py-2 px-4 max-h-[80px] overflow-y-auto">
        {timelineEvents.slice(0, 10).map(event => (
          <div key={event.id} className={`flex items-center gap-2 text-xs text-[#7d8590] py-0.5 ${getEventClass(event.event)}`}>
            <span className="font-mono text-[11px] text-[#7d8590] flex-shrink-0">{event.timestamp}</span>
            <span className="text-[10px] w-3.5 text-center flex-shrink-0">{getEventIcon(event.event)}</span>
            <span className="font-medium text-text-secondary flex-shrink-0">{event.agentName}</span>
            <span className="text-[#7d8590] overflow-hidden text-ellipsis whitespace-nowrap">{event.message}</span>
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
      <div className={`h-full flex flex-col relative bg-bg-primary ${className || ''}`}>
        <div className="flex flex-col items-center justify-center h-full text-text-muted gap-4">
          <Bot size={32} />
          <p>Connect to a session to see agents</p>
        </div>
      </div>
    )
  }
  
  return (
    <div className={`h-full flex flex-col relative bg-bg-primary ${className || ''}`}>
      <div className="flex items-center gap-2 p-3 border-b border-border">
        <span className="text-sm font-semibold text-text-primary">Agents</span>
        <span className="bg-accent-blue text-bg-primary text-[11px] font-semibold px-2 py-0.5 rounded-full">
          {agents.length + (manager ? 1 : 0)}
        </span>
      </div>
      
      <div className="flex-1 overflow-y-auto p-4 pb-20">
        {manager && (
          <ManagerView 
            name={manager.name} 
            status={manager.status} 
            agents={agents}
          />
        )}
        
        {!manager && agents.length > 0 && (
          <div className="flex flex-col gap-2">
            {agents.map(agent => (
              <AgentCard key={agent.id} agent={agent} />
            ))}
          </div>
        )}
        
        {!manager && agents.length === 0 && (
          <div className="flex items-center justify-center h-[100px] text-text-muted">
            <p>No agent activity yet</p>
          </div>
        )}
      </div>
      
      <Timeline />
    </div>
  )
}