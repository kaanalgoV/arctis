interface SectionDividerProps {
  glow?: boolean
}

function SectionDivider({ glow = false }: SectionDividerProps) {
  return (
    <div className="relative py-2">
      {/* Main line */}
      <div
        className="w-full h-px"
        style={{
          background: glow
            ? 'linear-gradient(to right, transparent 5%, rgba(92,184,240,0.2) 30%, rgba(92,184,240,0.35) 50%, rgba(92,184,240,0.2) 70%, transparent 95%)'
            : 'linear-gradient(to right, transparent 5%, rgba(53,61,72,0.6) 30%, rgba(53,61,72,0.8) 50%, rgba(53,61,72,0.6) 70%, transparent 95%)',
        }}
      />
      {/* Glow bloom behind line */}
      {glow && (
        <div
          aria-hidden="true"
          className="absolute inset-x-0 top-1/2 -translate-y-1/2 h-8 pointer-events-none"
          style={{
            background:
              'radial-gradient(ellipse 60% 100% at 50% 50%, rgba(92,184,240,0.04) 0%, transparent 70%)',
          }}
        />
      )}
    </div>
  )
}

export { SectionDivider }
