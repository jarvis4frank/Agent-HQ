import 'dotenv/config'

// CRITICAL: Check Claude CLI availability BEFORE any other imports that might load Ink
// This must be the FIRST import in the file
import './precheck.js'

// Fix Raw mode error: Try to make stdin look like a TTY
try {
  const stdin = process.stdin as any
  if (!stdin.isTTY) {
    Object.defineProperty(stdin, 'isTTY', {
      get: () => true,
      set: () => {},
      configurable: true
    })
    if (typeof stdin.ref !== 'function') stdin.ref = () => {}
    if (typeof stdin.unref !== 'function') stdin.unref = () => {}
    if (typeof stdin.addListener !== 'function') stdin.addListener = () => stdin
    if (typeof stdin.on !== 'function') stdin.on = () => stdin
    if (typeof stdin.setRawMode !== 'function') stdin.setRawMode = () => {}
    if (typeof stdin.setEncoding !== 'function') stdin.setEncoding = () => {}
    if (typeof stdin.resume !== 'function') stdin.resume = () => {}
    if (typeof stdin.pause !== 'function') stdin.pause = () => {}
  }
} catch (e) {}

// Parse command line args for mode BEFORE importing store
const args = process.argv.slice(2)
const teamMode = args.includes('--team') || args.includes('-t')

// Import store and set mode
import { useStore, hasClaudeCli, getAppMode, setAppMode, buildMainAgent, buildInitialAgents } from './store'

if (teamMode) {
  setAppMode('session-agent-team')
}

import React, { useEffect, useRef } from 'react'
import { render, Box } from 'ink'
import { ClaudeAdapter } from './agents/ClaudeAdapter'
import OfficeView from './components/OfficeView'
import TeamController from './components/TeamController'

// Demo Controller - spawns agents based on mode
const DemoController: React.FC = () => {
  const agents = useStore((state) => state.agents)
  const cleanupRef = useRef<Array<() => void>>([])

  useEffect(() => {
    const mode = getAppMode()
    
    // In team mode, we don't auto-spawn agents
    if (mode === 'session-agent-team') {
      return
    }

    const cancels = agents.map((agent, index) => {
      const adapter = new ClaudeAdapter({
        agentId: agent.id,
        mode: agent.config?.mode ?? 'auto',
        workDir: agent.config?.workDir,
        systemPrompt: agent.config?.systemPrompt,
      })

      const delay = index * 1200
      const timer = setTimeout(() => {
        const prompt = agent.config?.initialPrompt
          ?? `You are a ${agent.role} agent. Briefly describe what you are working on right now in one sentence.`

        if (adapter.getResolvedMode() === 'mock') {
          const stop = adapter.startMockSimulation()
          cleanupRef.current.push(stop)
        } else {
          adapter.spawn(prompt)
        }
      }, delay)

      return () => clearTimeout(timer)
    })

    return () => {
      cancels.forEach((cancel) => cancel())
      cleanupRef.current.forEach((stop) => stop())
      cleanupRef.current = []
    }
  }, [])

  return null
}

const App: React.FC = () => {
  const mode = getAppMode()
  
  return (
    <Box flexDirection="column">
      <DemoController />
      {mode === 'session-agent-team' && <TeamController />}
      <OfficeView cliAvailable={hasClaudeCli()} />
    </Box>
  )
}

render(<App />)
