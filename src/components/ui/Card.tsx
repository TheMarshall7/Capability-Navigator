import { type CSSProperties, type ReactNode } from 'react'
import { clsx } from 'clsx'

export function Card({ children, className, onClick, style }: { children: ReactNode; className?: string; onClick?: () => void; style?: CSSProperties }) {
  return (
    <div
      onClick={onClick}
      style={style}
      className={clsx('bg-white border border-[#E8E3DA] rounded-2xl p-6', onClick && 'cursor-pointer hover:shadow-sm transition-shadow', className)}
    >
      {children}
    </div>
  )
}
