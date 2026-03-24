// Agent HQ - Sprite Mapper
// Maps Claude Code agent properties to visual representations

import { Agent, AgentStatus } from '../agents/types.js'

// === Role to Sprite Mapping ===

/** All available sprite templates for different agent roles */
export const ROLE_SPRITES: Record<string, string[]> = {
  researcher: [
    ' .---. ',
    '( 🔬 )',
    ' `---` ',
    ' /|||\\ ',
  ],
  coder: [
    ' .---. ',
    '( 💻 )',
    ' `---` ',
    ' |💻|  ',
  ],
  reviewer: [
    ' .---. ',
    '( 🔍 )',
    ' `---` ',
    ' /🔎\\  ',
  ],
  executor: [
    ' .---. ',
    '( ⚡ )',
    ' `---` ',
    ' |⚡|  ',
  ],
  planner: [
    ' .---. ',
    '( 📋 )',
    ' `---` ',
    ' |📝|  ',
  ],
  tester: [
    ' .---. ',
    '( 🧪 )',
    ' `---` ',
    ' |🧪|  ',
  ],
  default: [
    ' .---. ',
    '( 👤 )',
    ' `---` ',
    ' /| |\\ ',
  ],
}

/** Get sprite lines for an agent based on role */
export function getSpriteForRole(role: string): string[] {
  return ROLE_SPRITES[role] ?? ROLE_SPRITES.default
}

// === Status to Color Mapping ===

/** Status to terminal color mapping */
export const STATUS_COLORS: Record<AgentStatus, string> = {
  idle: 'gray',
  thinking: 'yellow',
  working: 'green',
  error: 'red',
  waiting: 'blue',
}

/** Get color for agent status */
export function getColorForStatus(status: AgentStatus): string {
  return STATUS_COLORS[status]
}

// === Status to Label Mapping ===

/** Status to display label mapping */
export const STATUS_LABELS: Record<AgentStatus, string> = {
  idle: ' IDLE ',
  thinking: ' THINK',
  working: ' WORK ',
  error: ' ERR  ',
  waiting: ' WAIT ',
}

/** Get label for agent status */
export function getLabelForStatus(status: AgentStatus): string {
  return STATUS_LABELS[status]
}

// === Status to Icon Mapping ===

/** Status to floating icon mapping (shown above sprite) */
export const STATUS_ICONS: Record<AgentStatus, string> = {
  idle: '💤',
  thinking: '💭',
  working: '⚡',
  error: '❌',
  waiting: '⚠️',
}

/** Get icon for agent status */
export function getIconForStatus(status: AgentStatus): string {
  return STATUS_ICONS[status]
}

// === Claude Code State Mapping ===

/**
 * Map Claude Code agent state to Agent HQ status
 * This translates Claude Code's internal states to our visual representation
 */
export type ClaudeCodeStatus = 'idle' | 'thinking' | 'command' | 'error' | 'waiting' | 'tool' | 'disabled' | 'enabled'

/** Map Claude Code status string to Agent HQ status */
export function mapClaudeCodeStatus(ccStatus: string): AgentStatus {
  const statusMap: Record<string, AgentStatus> = {
    idle: 'idle',
    thinking: 'thinking',
    command: 'working',
    running: 'working',
    executing: 'working',
    error: 'error',
    waiting: 'waiting',
    tool_use: 'working',
    tool: 'working',
    disabled: 'idle',
    enabled: 'idle',
  }
  return statusMap[ccStatus.toLowerCase()] ?? 'idle'
}

/**
 * Extract agent status from Claude Code message/response
 * This parses Claude Code's output to determine agent state
 */
export function extractStatusFromMessage(message: string): AgentStatus {
  const lower = message.toLowerCase()
  
  if (lower.includes('error') || lower.includes('failed')) {
    return 'error'
  }
  if (lower.includes('thinking') || lower.includes('analyzing')) {
    return 'thinking'
  }
  if (lower.includes('executing') || lower.includes('running') || lower.includes('command')) {
    return 'working'
  }
  if (lower.includes('waiting') || lower.includes('need') || lower.includes('please')) {
    return 'waiting'
  }
  if (lower.includes('done') || lower.includes('complete') || lower.includes('finished')) {
    return 'idle'
  }
  
  return 'idle'
}

/**
 * Create a complete visual mapping for an agent
 * Returns all visual properties needed to render the sprite
 */
export interface AgentVisualMapping {
  sprite: string[]
  color: string
  label: string
  icon: string
}

export function mapAgentToVisual(agent: Agent): AgentVisualMapping {
  return {
    sprite: getSpriteForRole(agent.role),
    color: getColorForStatus(agent.status),
    label: getLabelForStatus(agent.status),
    icon: getIconForStatus(agent.status),
  }
}
