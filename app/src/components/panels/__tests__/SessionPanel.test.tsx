import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { SessionPanel } from '../SessionPanel'

describe('SessionPanel', () => {
  it('shows loading skeleton when loading=true and no data', () => {
    const { container } = render(<SessionPanel loading={true} />)
    // SessionSkeleton renders multiple Skeleton divs with class "skeleton"
    expect(container.querySelector('.skeleton')).toBeTruthy()
  })

  it('shows error message when error prop set and no data', () => {
    render(<SessionPanel error="Connection failed" />)
    expect(screen.getByText('Connection failed')).toBeTruthy()
  })

  it('shows waiting message when no data and not loading', () => {
    render(<SessionPanel />)
    expect(screen.getByText('Waiting for data...')).toBeTruthy()
  })

  it('renders session rows when data is provided', () => {
    const data = {
      current_session: 'ny_open',
      session_stats: {
        ny_open: { bar_count: 30, avg_volume: 1000, avg_range: 10, total_volume: 30000 },
      },
      bar_count: 30,
    }
    render(<SessionPanel data={data} />)
    // NY Open should be rendered as active session
    expect(screen.getByText('NY Open')).toBeTruthy()
  })
})
