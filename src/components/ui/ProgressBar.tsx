export function ProgressBar({ value, max = 100, color = '#E07A5F' }: { value: number; max?: number; color?: string }) {
  return (
    <div className="bg-[#E8E3DA] rounded-full h-1.5 overflow-hidden">
      <div
        className="h-full rounded-full transition-all duration-500"
        style={{ width: `${(value / max) * 100}%`, background: color }}
      />
    </div>
  )
}
