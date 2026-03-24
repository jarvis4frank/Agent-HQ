import 'dotenv/config'

// CRITICAL: Check Claude CLI availability BEFORE any other imports that might load Ink
// This must be the FIRST import in the file
import './precheck.js'

// Fix Raw mode error: Try to make stdin look like a TTY
// This handles the case when running with stdin redirected from /dev/null
try {
  const stdin = process.stdin as any
  if (!stdin.isTTY) {
    // Make isTTY return true to trick Ink
    Object.defineProperty(stdin, 'isTTY', {
      get: () => true,
      set: () => {},
      configurable: true
    })
    // Add all missing methods that Ink expects
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

import React, { useEffect, useRef } from 'react'
import { render, Box } from 'ink'
import { useStore, hasClaudeCli } from './store'
import { ClaudeAdapter } from './agents/ClaudeAdapter'

// Now import OfficeView (Ink loads after precheck)
import OfficeView from './components/OfficeView'

// Drives each initial agent on startup.
// Uses SDK when ANTHROPIC_API_KEY is set (auto mode), otherwise mock.
const DemoController: React.FC = () => {
  const agents = useStore((state) => state.agents)
  const cleanupRef = useRef<Array<() => void>>([])

  useEffect(() => {
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
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  return null
}

const App: React.FC = () => (
  <Box flexDirection="column">
    <DemoController />
    <OfficeView cliAvailable={hasClaudeCli()} />
  </Box>
)

render(<App />)
