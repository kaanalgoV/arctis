interface SectionDividerProps {
  glow?: boolean
}

function SectionDivider({ glow = false }: SectionDividerProps) {
  return (
    <div
      className="w-full h-px"
      style={{
        background: glow
          ? 'linear-gradient(to right, transparent, rgba(92,184,240,0.15), transparent)'
          : 'linear-gradient(to right, transparent, rgba(53,61,72,0.5), transparent)',
      }}
    />
  )
}

export { SectionDivider }
