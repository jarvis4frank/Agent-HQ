import { useEffect, useRef } from 'react'
import { Terminal } from '@xterm/xterm'
import { FitAddon } from '@xterm/addon-fit'
import { useAppStore } from '../stores/appStore'
import { useWebSocket } from '../hooks/useWebSocket'
import '@xterm/xterm/css/xterm.css'

interface TerminalPanelProps {
  className?: string
}

export default function TerminalPanel({ className }: TerminalPanelProps) {
  const terminalRef = useRef<HTMLDivElement>(null)
  const xtermRef = useRef<Terminal | null>(null)
  const fitAddonRef = useRef<FitAddon | null>(null)
  const sendInputRef = useRef<(data: string) => void>(() => {})

  const { connectionStatus, terminalMode } = useAppStore()
  const { subscribeToTerminal, sendResize, sendInput } = useWebSocket()

  const isVisible = terminalMode !== 'collapsed'

  useEffect(() => {
    if (!terminalRef.current || !isVisible) return

    // Initialize xterm
    const terminal = new Terminal({
      fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
      fontSize: 14,
      theme: {
        background: '#0a0c10',
        foreground: '#e6edf3',
        cursor: '#58a6ff',
        cursorAccent: '#0a0c10',
        selectionBackground: '#3b5070',
      },
      cursorBlink: true,
      cursorStyle: 'block',
      scrollback: 10000,
    })

    const fitAddon = new FitAddon()
    terminal.loadAddon(fitAddon)

    terminal.open(terminalRef.current)
    fitAddon.fit()

    xtermRef.current = terminal
    fitAddonRef.current = fitAddon

    // Subscribe to terminal output
    subscribeToTerminal(
      (data) => {
        terminal.write(data)
      },
      (exitCode) => {
        terminal.write(`\r\n\x1b[33m[Process exited with code ${exitCode}]\x1b[0m\r\n`)
      }
    )

    // Handle resize
    const handleResize = () => {
      if (fitAddonRef.current) {
        fitAddonRef.current.fit()
        sendResize(terminal.cols, terminal.rows)
      }
    }

    window.addEventListener('resize', handleResize)
    handleResize()

    return () => {
      window.removeEventListener('resize', handleResize)
      terminal.dispose()
    }
  }, [isVisible, subscribeToTerminal, sendResize])

  // Handle terminal input
  useEffect(() => {
    const terminal = xtermRef.current
    if (!terminal) return

    sendInputRef.current = sendInput

    const handleData = (data: string) => {
      sendInputRef.current(data)
    }

    const dispose = terminal.onData(handleData)

    return () => {
      dispose.dispose()
    }
  }, [sendInput])

  // Refit when mode changes
  useEffect(() => {
    if (isVisible && fitAddonRef.current) {
      // Multiple fit attempts to handle container transition timing
      const fitTerminal = () => {
        fitAddonRef.current?.fit()
        sendResize(xtermRef.current?.cols || 80, xtermRef.current?.rows || 24)
      }
      
      // Immediate fit, then again after transitions complete
      fitTerminal()
      const timeout1 = setTimeout(fitTerminal, 100)
      const timeout2 = setTimeout(fitTerminal, 300)
      
      return () => {
        clearTimeout(timeout1)
        clearTimeout(timeout2)
      }
    }
  }, [terminalMode, isVisible, sendResize])

  if (!isVisible) return null

  const statusDotColor = {
    connected: 'bg-accent-green',
    connecting: 'bg-accent-yellow',
    disconnected: 'bg-text-muted',
    error: 'bg-accent-red',
  }[connectionStatus]

  return (
    <div className={`flex flex-col bg-bg-secondary border border-border rounded-md overflow-hidden transition-all duration-250 terminal-panel ${(terminalMode as string) !== 'collapsed' ? 'h-full' : 'h-10'} ${className || ''}`}>
      <div className="flex items-center justify-between px-3 py-2 bg-bg-tertiary border-b border-border min-h-10">
        <span className="text-[13px] font-semibold text-text-secondary uppercase tracking-wide">Terminal</span>
        <div className="flex items-center gap-2">
          <span className={`w-2 h-2 rounded-full ${statusDotColor} transition-colors duration-100`} />
        </div>
      </div>

      <div className="flex-1 relative bg-terminal-bg min-h-[200px]">
        <div ref={terminalRef} className="w-full h-full p-2" />
      </div>
    </div>
  )
}