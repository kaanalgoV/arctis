import type { TradeSignal } from '../../hooks/useSignals'

const LABELS: Record<string, string> = {
  orb_break: 'ORB Break', ib_break: 'IB Break', poc_rejection: 'POC Reject',
  va_edge: 'VA Edge', bos: 'BOS', sammelzone_breakout: 'Zone Break', absorption: 'Absorption',
}

export function SetupAnnotation({ signal, onClose }: { signal: TradeSignal; onClose: () => void }) {
  const isLong = signal.direction === 'long'
  const color = isLong ? '#22C55E' : '#EF4444'
  return (
    <div className="absolute top-2 right-2 z-50 bg-[#161B22] border border-[#21262D] rounded-md p-3 w-52 font-mono text-[11px] shadow-xl">
      <div className="flex justify-between items-center mb-2">
        <span className="font-semibold text-[13px]" style={{ color }}>
          {LABELS[signal.signal_type] || signal.signal_type}
        </span>
        <button onClick={onClose} className="text-[#484F58] hover:text-[#8B949E] cursor-pointer">x</button>
      </div>
      <div className="space-y-1 text-[#8B949E]">
        <Row label="Direction" value={signal.direction.toUpperCase()} color={color} />
        <Row label="Entry" value={signal.entry_price.toFixed(2)} color="#E6EDF3" />
        <Row label="Stop" value={signal.stop_price.toFixed(2)} color="#EF4444" />
        <Row label="Target" value={signal.target_price.toFixed(2)} color="#22C55E" />
        <Row label="R:R" value={signal.risk_reward.toFixed(1)} color="#5CB8F0" />
        <Row label="Confidence" value={signal.confidence} />
      </div>
      <div className="mt-2 pt-2 border-t border-[#21262D] text-[10px] text-[#484F58]">{signal.reason}</div>
    </div>
  )
}

function Row({ label, value, color }: { label: string; value: string; color?: string }) {
  return (
    <div className="flex justify-between">
      <span>{label}</span>
      <span style={color ? { color } : undefined}>{value}</span>
    </div>
  )
}
