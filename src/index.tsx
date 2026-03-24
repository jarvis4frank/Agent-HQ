import 'dotenv/config'

// CRITICAL: Check Claude CLI availability BEFORE any other imports that might load Ink
// This must be the FIRST import in the file
import './precheck.js'

// Fix Raw mode error: Create a mock stdin that looks like a TTY
// This is needed because we're running with stdin from /dev/null
class MockStdin {
  isTTY = true
  readonly writable = false
  readonly readable = true
  
  setEncoding(encoding: string) {}
  setRawMode(enabled: boolean) {}
  resume() {}
  pause() {}
  ref() {}
  unref() {}
  
  on(event: string, handler: Function) { return this }
  once(event: string, handler: Function) { return this }
  addListener(event: string, handler: Function) { return this }
  removeListener(event: string, handler: Function) {}
  removeAllListeners(event?: string) {}
  emit(event: string, ...args: any[]) { return true }
  read(size?: number) { return null }
  _read(size: number) {}
}

// Replace stdin before ink loads if running with redirected stdin
const originalStdin = process.stdin as any
if (!originalStdin.isTTY) {
  process.stdin = new MockStdin() as any
}

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
