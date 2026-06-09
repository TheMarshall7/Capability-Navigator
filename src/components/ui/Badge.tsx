import { type ReactNode } from 'react'
import { clsx } from 'clsx'

export function Badge({ children, color = 'accent' }: { children: ReactNode; color?: 'accent' | 'teal' | 'warn' }) {
  const styles = {
    accent: 'bg-[#FDF0EA] text-[#E07A5F]',
    teal: 'bg-[#EBF5F3] text-[#3D8A7A]',
    warn: 'bg-[#FEF7E8] text-[#E8A838]',
  }
  return <span className={clsx('text-xs font-semibold px-3 py-1 rounded-full tracking-wide', styles[color])}>{children}</span>
}
