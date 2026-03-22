export const CHART_TOKENS = {
  candle: {
    bull: '#008757',
    bear: '#EF4136',
    neutral: '#949DA8',
  },
  grid: {
    major: 'rgba(255,255,255,0.04)',
    minor: 'rgba(255,255,255,0.02)',
  },
  axis: {
    label: '#6E7681',
    tick: '#353D48',
    border: '#272F3A',
  },
  overlay: {
    vwap: '#FBBF24',
    vwapBand: 'rgba(251,191,36,0.08)',
    volumeProfile: {
      poc: '#FBBF24',
      valueArea: 'rgba(92,184,240,0.12)',
      volumeBar: 'rgba(92,184,240,0.2)',
    },
    volume: {
      bull: 'rgba(0,135,87,0.25)',
      bear: 'rgba(239,65,54,0.25)',
    },
  },
  crosshair: {
    line: 'rgba(255,255,255,0.3)',
    labelBackground: '#222830',
  },
  background: '#0F1318',
  paper: '#0A0D12',
} as const
