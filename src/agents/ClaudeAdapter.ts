import { spawn, ChildProcess } from 'child_process'
import { config as loadEnv } from 'dotenv'
import { useStore } from '../store.js'
import { AgentStatus } from './types.js'

// Load .env once at module level (no-op if already set or file absent)
loadEnv()

export interface ClaudeAdapterOptions {
  agentId: string
  claudePath?: string
  workDir?: string
  /** Override API key. Falls back to ANTHROPIC_API_KEY env var. */
  apiKey?: string
}

// Map output patterns to agent status + task label
const STATUS_PATTERNS: Array<{ pattern: RegExp; status: AgentStatus; taskLabel?: string }> = [
  { pattern: /thinking|let me think|i'll analyze/i, status: 'thinking', taskLabel: 'Thinking...' },
  { pattern: /reading file|writing to|executing|running|tool_use/i, status: 'working' },
  { pattern: /waiting for|please confirm|needs approval/i, status: 'waiting', taskLabel: 'Waiting...' },
  { pattern: /error:|failed:|cannot|exception/i, status: 'error' },
  { pattern: /done\.|complete\.|finished\.|task complete/i, status: 'idle', taskLabel: 'Idle' },
]

export class ClaudeAdapter {
  private agentId: string
  private claudePath: string
  private workDir: string
  private apiKey: string | undefined
  private process: ChildProcess | null = null
  private outputBuffer: string[] = []

  constructor(options: ClaudeAdapterOptions) {
    this.agentId = options.agentId
    this.claudePath = options.claudePath ?? 'claude'
    this.workDir = options.workDir ?? process.cwd()
    this.apiKey = options.apiKey ?? process.env.ANTHROPIC_API_KEY
  }

  spawn(prompt: string): void {
    if (this.process) this.kill()

    this.updateAgent({ status: 'thinking', currentTask: 'Starting...' })

    const env: NodeJS.ProcessEnv = { ...process.env }
    if (this.apiKey) {
      env.ANTHROPIC_API_KEY = this.apiKey
    }

    this.process = spawn(this.claudePath, ['--print', prompt], {
      cwd: this.workDir,
      env,
    })

    this.process.stdout?.on('data', (data: Buffer) => {
      data.toString().split('\n').filter(Boolean).forEach((line) => this.handleOutput(line))
    })

    this.process.stderr?.on('data', (data: Buffer) => {
      data.toString().split('\n').filter(Boolean).forEach((line) => this.handleOutput(line, true))
    })

    this.process.on('exit', (code) => {
      if (code === 0) {
        this.updateAgent({ status: 'idle', currentTask: 'Task complete' })
      } else {
        this.updateAgent({ status: 'error', currentTask: `Exited with code ${code ?? 'unknown'}` })
      }
      this.process = null
    })

    this.process.on('error', (err) => {
      this.updateAgent({ status: 'error', currentTask: err.message })
      this.process = null
    })
  }

  private handleOutput(line: string, _isStderr = false): void {
    this.outputBuffer.push(line)
    if (this.outputBuffer.length > 200) this.outputBuffer.shift()

    useStore.getState().addMessage({
      id: `msg-${Date.now()}-${Math.random().toString(36).slice(2)}`,
      agentId: this.agentId,
      content: line,
      timestamp: Date.now(),
      role: 'agent',
    })

    for (const { pattern, status, taskLabel } of STATUS_PATTERNS) {
      if (pattern.test(line)) {
        this.updateAgent({ status, currentTask: taskLabel ?? line.slice(0, 40) })
        break
      }
    }
  }

  private updateAgent(updates: { status?: AgentStatus; currentTask?: string }): void {
    useStore.getState().updateAgent(this.agentId, updates)
  }

  kill(): void {
    this.process?.kill()
    this.process = null
    this.updateAgent({ status: 'idle', currentTask: undefined })
  }

  isRunning(): boolean {
    return this.process !== null
  }

  getOutputBuffer(): readonly string[] {
    return this.outputBuffer
  }

  /**
   * Returns true if an ANTHROPIC_API_KEY is available (option or env).
   */
  hasApiKey(): boolean {
    return Boolean(this.apiKey)
  }

  /**
   * Simulate Claude Code activity for development/demo.
   * Returns a cleanup function to stop the simulation.
   */
  startMockSimulation(): () => void {
    const steps: Array<{ status: AgentStatus; task: string; message: string }> = [
      { status: 'thinking', task: 'Reading codebase...', message: 'Thinking about the approach...' },
      { status: 'working', task: 'Reading files', message: 'Reading file: src/index.ts' },
      { status: 'working', task: 'Writing code', message: 'Writing to: src/output.ts' },
      { status: 'thinking', task: 'Reviewing output...', message: 'Let me review the changes I made.' },
      { status: 'waiting', task: 'Awaiting approval', message: 'Waiting for confirmation...' },
      { status: 'idle', task: 'Task complete', message: 'Done. All changes applied.' },
    ]

    let i = 0
    const tick = (): void => {
      const step = steps[i % steps.length]
      this.updateAgent({ status: step.status, currentTask: step.task })

      useStore.getState().addMessage({
        id: `mock-${Date.now()}-${Math.random().toString(36).slice(2)}`,
        agentId: this.agentId,
        content: step.message,
        timestamp: Date.now(),
        role: 'agent',
      })

      i++
    }

    tick()
    const interval = setInterval(tick, 3000)
    return () => clearInterval(interval)
  }
}
