# shadcn/ui Refactoring Plan

## Project Overview
- **Project**: Agent HQ Web Frontend
- **Path**: `~/Workspace/agent-hq/web`
- **Current Stack**: Custom CSS modules + custom React components
- **Goal**: Integrate shadcn/ui for better accessibility and styling

---

## Component Analysis

### Current Components (6 total)

| Component | File | Type | shadcn Equivalent |
|-----------|------|------|-------------------|
| **ProjectSelector** | `ProjectSelector.tsx` | Dropdown/Select | `Select` or `DropdownMenu` |
| **AgentPanel** | `AgentPanel.tsx` | Card + List + Tooltip | `Card`, `Collapsible`, `Tooltip` |
| **TerminalPanel** | `TerminalPanel.tsx` | Terminal (xterm) | N/A - keep custom |
| **StatusBar** | `StatusBar.tsx` | Status bar | Keep custom (very simple) |
| **Header** | `Header.tsx` | Header + Buttons | `Button`, `Tooltip` |
| **HooksModal** | `HooksModal.tsx` | Modal/Dialog | `Dialog` |

---

## Component Mapping (Current → shadcn)

### 1. ProjectSelector → shadcn Select/DropdownMenu
**Priority**: HIGH  
**File**: `src/components/ProjectSelector.tsx`, `src/components/ProjectSelector.module.css`

| Current Custom | shadcn Component |
|----------------|-----------------|
| Custom dropdown with click-outside handling | `DropdownMenu` or `Select` |
| Project list with status dots, meta info | Combine with `Card` components |
| New project form (input + buttons) | `Input` + `Button` |

**Key Changes**:
- Replace custom dropdown logic with `DropdownMenu` or `Select`
- Use shadcn `Input` for project path input
- Use shadcn `Button` variants for Create/Cancel actions
- Remove click-outside `useEffect` (shadcn handles this)

**Dependencies**: None (standalone component)

---

### 2. AgentPanel → shadcn Card + Collapsible + Tooltip
**Priority**: HIGH  
**File**: `src/components/AgentPanel.tsx`, `src/components/AgentPanel.module.css`

| Current Custom | shadcn Component |
|----------------|-----------------|
| Agent cards | `Card`, `CardHeader`, `CardContent` |
| Expandable agent sections | `Collapsible` |
| Tooltip on tool hover | `Tooltip`, `TooltipTrigger`, `TooltipContent` |
| Timeline section | Keep custom or use `ScrollArea` |

**Key Changes**:
- Wrap agent cards in `Card` components
- Use `Collapsible` for expand/collapse functionality
- Replace custom tooltip with shadcn `Tooltip` components
- Keep timeline as-is (simple custom implementation)

**Dependencies**: `ProjectSelector` (needs dropdown replacement first for consistency)

---

### 3. HooksModal → shadcn Dialog
**Priority**: HIGH  
**File**: `src/components/HooksModal.tsx`, `src/components/HooksModal.module.css`

| Current Custom | shadcn Component |
|----------------|-----------------|
| Custom modal overlay | `Dialog`, `DialogPortal`, `DialogOverlay` |
| Modal header with close button | `DialogHeader`, `DialogTitle`, `DialogClose` |
| Status badges | `Badge` |
| Action buttons | `Button` variants |

**Key Changes**:
- Replace custom overlay with `Dialog` components
- Use `Badge` for configured/not configured status
- Use `Button` variants (primary/secondary/outline)
- Remove click-outside handling (shadcn handles this)

**Dependencies**: None (standalone component)

---

### 4. Header → shadcn Button + Tooltip
**Priority**: MEDIUM  
**File**: `src/components/Header.tsx`, `src/components/Header.module.css`

| Current Custom | shadcn Component |
|----------------|-----------------|
| Terminal toggle button | `Button` (icon variant) |
| Hooks indicator button | `Button` + `Tooltip` |

**Key Changes**:
- Replace custom buttons with shadcn `Button`
- Add `Tooltip` for status indicator

**Dependencies**: None (standalone component)

---

### 5. StatusBar
**Priority**: LOW  
**File**: `src/components/StatusBar.tsx`, `src/components/StatusBar.module.css`

| Current Custom | shadcn Component |
|----------------|-----------------|
| Status dots | Keep custom (CSS-only) |
| Simple layout | Keep custom |

**Recommendation**: Keep as-is. It's too simple to warrant shadcn migration and the layout is specific to this app.

---

### 6. TerminalPanel
**Priority**: NONE  
**File**: `src/components/TerminalPanel.tsx`

**Recommendation**: Keep completely custom. This wraps xterm.js which has its own rendering and needs special handling.

---

## Migration Priority Order

| Priority | Components | Reason |
|----------|------------|--------|
| **HIGH** | `HooksModal` | Self-contained modal, easy win |
| **HIGH** | `ProjectSelector` | Complex dropdown logic, high value |
| **HIGH** | `AgentPanel` | Core component, many sub-components |
| **MEDIUM** | `Header` | Simple buttons, easy incremental |
| **LOW** | `StatusBar` | Not worth the effort |
| **NONE** | `TerminalPanel` | Keep custom |

---

## Dependencies Between Components

```
ProjectSelector
  └── Dependencies: None

AgentPanel
  └── Dependencies: None (but benefits from shadcn theme consistency)

HooksModal
  └── Dependencies: None

Header
  └── Dependencies: ProjectSelector (imports it)

StatusBar
  └── Dependencies: None

TerminalPanel
  └── Dependencies: None
```

---

## Files to Modify

### Phase 1: Setup shadcn/ui
```bash
cd web
npx shadcn@latest init
```

Install required components:
```bash
npx shadcn@latest add button dialog dropdown-menu select card collapsible tooltip badge scroll-area input
```

### Phase 2: HooksModal (HIGH Priority)
- Delete: `src/components/HooksModal.module.css`
- Modify: `src/components/HooksModal.tsx`
- Add: shadcn `Dialog`, `Badge`, `Button`

### Phase 3: ProjectSelector (HIGH Priority)
- Delete: `src/components/ProjectSelector.module.css`
- Modify: `src/components/ProjectSelector.tsx`
- Add: shadcn `DropdownMenu` (or `Select`), `Input`, `Button`

### Phase 4: AgentPanel (HIGH Priority)
- Delete: `src/components/AgentPanel.module.css`
- Modify: `src/components/AgentPanel.tsx`
- Add: shadcn `Card`, `Collapsible`, `Tooltip`, `ScrollArea`

### Phase 5: Header (MEDIUM Priority)
- Delete: `src/components/Header.module.css`
- Modify: `src/components/Header.tsx`
- Add: shadcn `Button`, `Tooltip`

### Phase 6: StatusBar (LOW Priority - optional)
- Delete: `src/components/StatusBar.module.css`
- Modify: `src/components/StatusBar.tsx`
- Use: shadcn components where appropriate

---

## Estimated Effort

| Component | Lines of Code | Complexity | Estimated Hours |
|-----------|---------------|------------|-----------------|
| HooksModal | ~140 | Low | 1-2 |
| ProjectSelector | ~220 | Medium | 2-3 |
| AgentPanel | ~300 | High | 3-4 |
| Header | ~80 | Low | 1 |
| StatusBar | ~60 | Low | 0.5 |
| **Total** | ~800 | - | **7.5-10.5** |

---

## Next Steps

1. **Initialize shadcn/ui** in the project
2. **Install dependencies**: `button`, `dialog`, `dropdown-menu`, `select`, `card`, `collapsible`, `tooltip`, `badge`, `scroll-area`, `input`
3. **Start with HooksModal** (simplest, highest ROI)
4. **Iterate** through other components in priority order

---

## Notes

- shadcn/ui components are copied into `src/components/ui/` - they're not a runtime dependency
- Tailwind CSS is required for shadcn/ui
- Current CSS modules can be deleted after migration
- Consider updating `globals.css` to use shadcn's CSS variables