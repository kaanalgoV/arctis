import { ReactNode } from 'react'
import { cn } from '@/lib/utils'

interface AppShellProps {
  children: ReactNode
  rightPanel?: ReactNode
  topbarContent?: ReactNode
}

export function AppShell({ children, rightPanel, topbarContent }: AppShellProps) {
  return (
    <div
      className={cn(
        'h-screen w-screen overflow-hidden',
        'grid',
        'bg-[var(--color-surface-base)]',
      )}
      style={{
        gridTemplateColumns: '52px 1fr 280px',
        gridTemplateRows: '48px 1fr 24px',
      }}
    >
      {/* Sidebar: col 1, rows 1-3 */}
      <div style={{ gridColumn: '1', gridRow: '1 / 4' }} className="min-h-0">
        {/* Sidebar is rendered as a direct child slot — imported separately */}
        {/* This slot is intentionally empty; Sidebar is placed via composition */}
      </div>

      {/* Topbar: col 2-3, row 1 */}
      <div style={{ gridColumn: '2 / 4', gridRow: '1' }} className="min-w-0">
        {topbarContent}
      </div>

      {/* Main content: col 2, row 2 */}
      <main
        style={{ gridColumn: '2', gridRow: '2' }}
        className="min-h-0 min-w-0 overflow-hidden"
      >
        {children}
      </main>

      {/* Right panel: col 3, row 2 */}
      <div
        style={{ gridColumn: '3', gridRow: '2' }}
        className="min-h-0 overflow-hidden"
      >
        {rightPanel}
      </div>

      {/* Status bar: col 1-3, row 3 */}
      <div style={{ gridColumn: '1 / 4', gridRow: '3' }} className="min-w-0">
        {/* StatusBar is rendered via composition */}
      </div>
    </div>
  )
}

/**
 * Composed version of AppShell that accepts named slots as explicit props.
 * Renders sidebar, topbar, main, rightPanel, and statusBar in the CSS grid.
 */
interface AppShellComposedProps {
  sidebar: ReactNode
  topbar: ReactNode
  children: ReactNode
  rightPanel?: ReactNode
  statusBar: ReactNode
}

export function AppShellLayout({
  sidebar,
  topbar,
  children,
  rightPanel,
  statusBar,
}: AppShellComposedProps) {
  return (
    <div
      className="h-screen w-screen overflow-hidden grid bg-[var(--color-surface-base)]"
      style={{
        gridTemplateColumns: '52px 1fr 280px',
        gridTemplateRows: '48px 1fr 24px',
      }}
    >
      {/* Sidebar: col 1, all rows */}
      <div style={{ gridColumn: '1', gridRow: '1 / 4' }} className="min-h-0 z-20">
        {sidebar}
      </div>

      {/* Topbar: col 2-3, row 1 */}
      <div style={{ gridColumn: '2 / 4', gridRow: '1' }} className="min-w-0 z-10">
        {topbar}
      </div>

      {/* Main content: col 2, row 2 */}
      <main
        style={{ gridColumn: '2', gridRow: '2' }}
        className="min-h-0 min-w-0 overflow-hidden relative"
      >
        {children}
      </main>

      {/* Right panel: col 3, row 2 */}
      <div
        style={{ gridColumn: '3', gridRow: '2' }}
        className="min-h-0 overflow-hidden"
      >
        {rightPanel}
      </div>

      {/* Status bar: col 1-3, row 3 */}
      <div style={{ gridColumn: '1 / 4', gridRow: '3' }} className="min-w-0 z-10">
        {statusBar}
      </div>
    </div>
  )
}
