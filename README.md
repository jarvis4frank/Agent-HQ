# Agent HQ

A terminal UI for visualizing a team of Claude Code agents. Each agent is displayed as an ASCII sprite with live status updates, and you can chat with any selected agent directly from the interface.

## Installation

```bash
npm install
```

## Build

```bash
npm run build
```

## Usage

```bash
npm start
```

For development (no build step required):

```bash
npm run dev
```

## Controls

| Key | Action |
|-----|--------|
| `Tab` | Switch focus between Office panel and Chat panel |
| `Arrow keys` | Select an agent (left/up = previous, right/down = next) |
| `Enter` | Send message to the selected agent (Chat panel) |
| `Backspace` | Delete character in chat input |
| `q` | Quit |
| `Ctrl+C` | Quit |

## Layout

- **Office panel** (left) — shows all agents as ASCII sprites with their current status and task
- **Chat panel** (right) — shows message history and lets you type messages to the selected agent
- **Status bar** (bottom) — shows the currently selected agent and active focus

## Agent Roles

| Role | Description |
|------|-------------|
| `research` | Research and analysis agent |
| `coder` | Code implementation agent |
| `reviewer` | Code review agent |
| `executor` | Task execution agent |

## Agent Statuses

| Status | Color | Meaning |
|--------|-------|---------|
| `idle` | gray | Waiting for work |
| `thinking` | yellow | Planning or reasoning |
| `working` | green | Actively executing a task |
| `waiting` | blue | Waiting for input or approval |
| `error` | red | Encountered an error |
