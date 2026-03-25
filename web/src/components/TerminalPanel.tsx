import { useEffect, useRef, useState } from 'react'
import { Terminal } from '@xterm/xterm'
import { FitAddon } from '@xterm/addon-fit'
import { ChevronDown, ChevronUp, Loader2 } from 'lucide-react'
import { useAppStore } from '../stores/appStore'
import { useWebSocket } from '../hooks/useWebSocket'
import styles from './TerminalPanel.module.css'
import '@xterm/xterm/css/xterm.css'

export default function TerminalPanel() {
  const terminalRef = useRef<HTMLDivElement>(null)
  const xtermRef = useRef<Terminal | null>(null)
  const fitAddonRef = useRef<FitAddon | null>(null)
  const [isExpanded, setIsExpanded] = useState(true)
  const [isConnecting, setIsConnecting] = useState(false)
  const sendInputRef = useRef<(data: string) => void>(() => {})

  const { connectionStatus, setTerminalExpanded } = useAppStore()
  const { subscribeToTerminal, sendResize, sendInput } = useWebSocket()

  useEffect(() => {
    if (!terminalRef.current) return

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
        black: '#0a0c10',
        red: '#f85149',
        green: '#3fb950',
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
        setIsConnecting(false)
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

    // Initial resize
    handleResize()

    return () => {
      window.removeEventListener('resize', handleResize)
      terminal.dispose()
    }
  }, [subscribeToTerminal, sendResize])

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

  // Update connecting state based on connection status
  useEffect(() => {
    if (connectionStatus === 'connecting') {
      setIsConnecting(true)
    }
  }, [connectionStatus])

  const toggleExpanded = () => {
    setIsExpanded(!isExpanded)
    setTerminalExpanded(!isExpanded)
    // Refit terminal after animation
    setTimeout(() => {
      if (fitAddonRef.current) {
        fitAddonRef.current.fit()
      }
    }, 250)
  }

  return (
    <div className={`${styles.container} ${isExpanded ? styles.expanded : styles.collapsed}`}>
      <div className={styles.header}>
        <span className={styles.title}>Terminal</span>
        <div className={styles.headerRight}>
          <span className={`${styles.statusDot} ${styles[connectionStatus]}`} />
          <button className={styles.toggleBtn} onClick={toggleExpanded}>
            {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </button>
        </div>
      </div>

      {isExpanded && (
        <div className={styles.terminalWrapper}>
          {isConnecting && (
            <div className={styles.connectingOverlay}>
              <Loader2 size={24} className={styles.spinner} />
              <span>Connecting to Claude Code...</span>
            </div>
          )}
          <div ref={terminalRef} className={styles.terminal} />
        </div>
      )}

      {!isExpanded && (
        <div className={styles.collapsedPreview}>
          <span>Terminal collapsed</span>
          <button onClick={toggleExpanded} className={styles.expandBtn}>
            Expand
          </button>
        </div>
      )}
    </div>
  )
}
