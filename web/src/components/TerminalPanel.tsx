import { useEffect, useRef } from 'react'
import { Terminal } from '@xterm/xterm'
import { FitAddon } from '@xterm/addon-fit'
import { useAppStore } from '../stores/appStore'
import { useWebSocket } from '../hooks/useWebSocket'
import styles from './TerminalPanel.module.css'
import '@xterm/xterm/css/xterm.css'

export default function TerminalPanel() {
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
      setTimeout(() => {
        fitAddonRef.current?.fit()
      }, 100)
    }
  }, [terminalMode, isVisible])

  if (!isVisible) return null

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <span className={styles.title}>Terminal</span>
        <div className={styles.headerRight}>
          <span className={`${styles.statusDot} ${styles[connectionStatus]}`} />
        </div>
      </div>

      <div className={styles.terminalWrapper}>
        <div ref={terminalRef} className={styles.terminal} />
      </div>
    </div>
  )
}