import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { FeedPanel } from '../FeedPanel'

describe('FeedPanel', () => {
  it('shows loading skeleton when loading=true and no items', () => {
    const { container } = render(<FeedPanel loading={true} />)
    // FeedSkeleton renders multiple Skeleton divs with class "skeleton"
    expect(container.querySelector('.skeleton')).toBeTruthy()
  })

  it('shows error message when error prop set and no items', () => {
    render(<FeedPanel error="Connection failed" />)
    expect(screen.getByText('Connection failed')).toBeTruthy()
  })

  it('shows no events message when items is empty array', () => {
    render(<FeedPanel items={[]} />)
    // Component renders "No events yet" for empty state
    expect(screen.getByText('No events yet')).toBeTruthy()
  })

  it('renders item message when items provided', () => {
    const items = [
      {
        time: '09:30',
        message: 'RTH Open',
        type: 'info' as const,
        timestamp: 1735827000,
      },
    ]
    render(<FeedPanel items={items} />)
    expect(screen.getByText('RTH Open')).toBeTruthy()
  })

  it('renders item time when items provided', () => {
    const items = [
      {
        time: '09:30',
        message: 'RTH Open',
        type: 'signal' as const,
      },
    ]
    render(<FeedPanel items={items} />)
    expect(screen.getByText('09:30')).toBeTruthy()
  })

  it('renders filter pills when items provided', () => {
    const items = [
      {
        time: '09:30',
        message: 'Market open',
        type: 'info' as const,
      },
    ]
    render(<FeedPanel items={items} />)
    // Filter "All" pill should be visible
    expect(screen.getByText('All')).toBeTruthy()
  })
})
