// Agent HQ - ASCII/Unicode Sprite Renderer
// Renders agent sprites with animations and effects

import { Agent } from '../agents/types.js'
import { 
  mapAgentToVisual, 
  AgentVisualMapping,
  mapClaudeCodeStatus,
  extractStatusFromMessage 
} from './mapper.js'

// === Renderer Configuration ===

export interface RenderOptions {
  showIcon?: boolean
  showName?: boolean
  showStatus?: boolean
  showTask?: boolean
  compact?: boolean
  animated?: boolean
}

const DEFAULT_OPTIONS: RenderOptions = {
  showIcon: true,
  showName: true,
  showStatus: true,
  showTask: true,
  compact: false,
  animated: true,
}

// === Animation Frames ===

const IDLE_ANIMATION = ['  ', '   ', '    ']
const THINKING_ANIMATION = ['💭', '💭', ' ']
const WORKING_ANIMATION = ['⚡', ' ', '⚡']
const WAITING_ANIMATION = ['⚠️', ' ', '⚠️']
const ERROR_ANIMATION = ['❌', '❗', '❌']

/** Get animation frames for a status */
function getAnimationFrames(status: string): string[] {
  const frames: Record<string, string[]> = {
    idle: IDLE_ANIMATION,
    thinking: THINKING_ANIMATION,
    working: WORKING_ANIMATION,
    waiting: WAITING_ANIMATION,
    error: ERROR_ANIMATION,
  }
  return frames[status] ?? IDLE_ANIMATION
}

// === Render Functions ===

/**
 * Render a complete agent sprite with all visual elements
 */
export function renderAgentSprite(
  agent: Agent, 
  options: RenderOptions = DEFAULT_OPTIONS,
  frameIndex: number = 0
): string[] {
  const visual = mapAgentToVisual(agent)
  const opts = { ...DEFAULT_OPTIONS, ...options }
  
  const lines: string[] = []
  
  // Animated icon (above sprite)
  if (opts.showIcon && opts.animated) {
    const frames = getAnimationFrames(agent.status)
    lines.push(`  ${frames[frameIndex % frames.length]}  `)
  } else if (opts.showIcon) {
    lines.push(`   ${visual.icon}   `)
  }
  
  // Sprite body
  for (const line of visual.sprite) {
    lines.push(line)
  }
  
  // Name and status label (compact vs full)
  if (opts.compact) {
    if (opts.showName) {
      lines.push(` ${agent.name.slice(0, 10)} `)
    }
  } else {
    if (opts.showName) {
      lines.push(` ${agent.name.slice(0, 12)} `)
    }
    if (opts.showStatus) {
      lines.push(` [${visual.label}] `)
    }
    if (opts.showTask && agent.currentTask) {
      const task = agent.currentTask.slice(0, opts.compact ? 10 : 14)
      lines.push(` ${task} `)
    }
  }
  
  return lines
}

/**
 * Render a simple status indicator for a single line display
 */
export function renderStatusIndicator(agent: Agent): string {
  const visual = mapAgentToVisual(agent)
  return `${visual.icon} ${agent.name}: ${visual.label}`
}

/**
 * Render agent in a selected/active state with highlight
 */
export function renderSelectedAgent(agent: Agent, options: RenderOptions = {}): string[] {
  const opts = { ...DEFAULT_OPTIONS, ...options, showIcon: true }
  const lines = renderAgentSprite(agent, opts)
  
  // Add selection indicator
  const width = Math.max(...lines.map(l => l.length), 12)
  const bar = '─'.repeat(width)
  
  return [
    `┌${bar}┐`,
    ...lines.map(l => `│${l.padEnd(width)}│`),
    `└${bar}┘`,
  ]
}

/**
 * Render multiple agents in a row/grid layout
 */
export function renderAgentRow(agents: Agent[], options: RenderOptions = {}): string {
  if (agents.length === 0) return ''
  
  const rendered = agents.map(agent => renderAgentSprite(agent, options))
  const maxLines = Math.max(...rendered.map(r => r.length))
  
  const rows: string[] = []
  for (let i = 0; i < maxLines; i++) {
    const row = rendered
      .map(lines => lines[i] ?? ''.padEnd(lines[0]?.length ?? 10))
      .join('  ')
    rows.push(row)
  }
  
  return rows.join('\n')
}

// === Claude Code Integration ===

/**
 * Update agent status based on Claude Code message
 * This is the main integration point for real-time updates
 */
export function createStatusUpdater() {
  let frame = 0
  
  return {
    /**
     * Update status from Claude Code output
     */
    updateFromClaudeCode(agent: Agent, message: string): Agent {
      const newStatus = extractStatusFromMessage(message)
      return { ...agent, status: newStatus }
    },
    
    /**
     * Update status from known Claude Code status string
     */
    updateFromStatus(agent: Agent, ccStatus: string): Agent {
      const newStatus = mapClaudeCodeStatus(ccStatus)
      return { ...agent, status: newStatus }
    },
    
    /**
     * Get next animation frame
     */
    nextFrame(): number {
      frame = (frame + 1) % 10
      return frame
    },
    
    /**
     * Get current animation frame index
     */
    getFrame(): number {
      return frame
    },
  }
}

// === Export all components ===

export { mapAgentToVisual, mapClaudeCodeStatus, extractStatusFromMessage }
export type { AgentVisualMapping }
