# Agent HQ

A web-based visualization tool for Claude Code agents. Monitor and interact with your Claude Code sessions through a modern web interface with real-time terminal output and agent status visualization.

> **Legacy TUI Version**: See [`doc/tui-version.md`](doc/tui-version.md) for the original terminal UI version.

## 🚀 Quick Start

```bash
# 1. Install dependencies
cd server && npm install
cd ../web && npm install
cd ..

# 2. Start both servers (in separate terminals)

# Terminal 1 - Backend
cd server && npm run dev

# Terminal 2 - Frontend
cd web && npm run dev
```

Then open **http://localhost:5173** in your browser.

## 📋 Requirements

- Node.js 18+
- Claude Code CLI (`claude`) installed and authenticated
- macOS (node-pty dependency)

## 🏗️ Architecture

```
┌─────────────────┐     WebSocket      ┌─────────────────┐
│   React UI      │ ←──────────────→  │   Node.js       │
│   (Vite)        │                    │   Backend       │
│   localhost:5173│                    │   localhost:3001│
└─────────────────┘                    └─────────────────┘
                                              │
                                              ↓
                                      ┌─────────────────┐
                                      │  Claude Code    │
                                      │  CLI (subprocess)│
                                      └─────────────────┘
```

## 🎨 Features

- **Terminal Panel** - Full xterm.js terminal with Claude Code CLI
- **Agent Visualization** - Real-time agent status cards
- **Session Management** - Switch between sessions or create new ones
- **Expand/Collapse** - Toggle terminal panel visibility

## 📁 Project Structure

```
agent-hq/
├── web/                    # React + Vite frontend
│   ├── src/
│   │   ├── components/     # UI components
│   │   ├── hooks/          # Custom React hooks
│   │   ├── stores/         # Zustand state management
│   │   └── styles/         # CSS variables
│   └── package.json
├── server/                 # Express + WebSocket backend
│   ├── src/
│   │   └── index.ts        # Server entry point
│   └── package.json
└── SPEC.md                 # Full specification
```

## 🔧 Development

```bash
# Backend (with hot reload)
cd server && npm run dev

# Frontend (with hot reload)
cd web && npm run dev
```

## 📖 Documentation

- [SPEC.md](SPEC.md) - Detailed specification
- [doc/usage.md](doc/usage.md) - Usage guide (Chinese)
- [doc/tui-version.md](doc/tui-version.md) - Legacy TUI version
