import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { ConfluencePanel } from '../ConfluencePanel'

describe('ConfluencePanel', () => {
  it('shows loading skeleton when loading=true and no data', () => {
    const { container } = render(<ConfluencePanel loading={true} />)
    // ConfluenceSkeleton renders multiple Skeleton divs with class "skeleton"
    expect(container.querySelector('.skeleton')).toBeTruthy()
  })

  it('shows error message when error prop set and no data', () => {
    render(<ConfluencePanel error="Fetch failed" />)
    expect(screen.getByText('Fetch failed')).toBeTruthy()
  })

  it('shows waiting message when no data and not loading', () => {
    render(<ConfluencePanel />)
    expect(screen.getByText('Waiting for data...')).toBeTruthy()
  })

  it('renders score when data provided', () => {
    const data = {
      score: 7,
      max_score: 10,
      direction: 'LONG',
      confidence: 'HIGH',
      signals: [],
      indicators: {},
    }
    render(<ConfluencePanel data={data} />)
    // score > 0 renders as "+7"
    expect(screen.getByText('+7')).toBeTruthy()
  })

  it('renders direction when data provided', () => {
    const data = {
      score: 7,
      max_score: 10,
      direction: 'LONG',
      confidence: 'HIGH',
      signals: [],
      indicators: {},
    }
    render(<ConfluencePanel data={data} />)
    expect(screen.getByText('LONG')).toBeTruthy()
  })

  it('renders signal rows when signals provided', () => {
    const data = {
      score: 5,
      max_score: 10,
      direction: 'LONG',
      confidence: 'MEDIUM',
      signals: [{ name: 'VWAP', direction: 'LONG', strength: 2, detail: 'above' }],
      indicators: {},
    }
    render(<ConfluencePanel data={data} />)
    expect(screen.getByText('VWAP')).toBeTruthy()
  })
})
