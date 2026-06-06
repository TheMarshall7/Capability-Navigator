'use client'
import { type ButtonHTMLAttributes, type CSSProperties, type ReactNode } from 'react'
import { clsx } from 'clsx'

// ─── Design tokens ────────────────────────────────────────────────────────────
export const C = {
  bg: '#F8F6F1', card: '#FFFFFF', text: '#2D2926', muted: '#7A756F',
  border: '#E8E3DA', accent: '#E07A5F', accentLight: '#FDF0EA',
  teal: '#3D8A7A', tealLight: '#EBF5F3', warn: '#E8A838', warnLight: '#FEF7E8',
}

// ─── Button ───────────────────────────────────────────────────────────────────
type BtnVariant = 'primary' | 'outline' | 'ghost' | 'teal' | 'danger'
type BtnSize = 'sm' | 'md' | 'lg'

interface BtnProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: BtnVariant
  size?: BtnSize
  loading?: boolean
  children: ReactNode
}

const btnBase = "inline-flex items-center justify-center gap-2 font-medium rounded-xl transition-all duration-200 cursor-pointer border-none disabled:opacity-50 disabled:cursor-not-allowed"
const btnSizes: Record<BtnSize, string> = {
  sm: 'px-4 py-2 text-[13px]',
  md: 'px-6 py-3 text-[15px]',
  lg: 'px-8 py-4 text-[16px]',
}
const btnVariants: Record<BtnVariant, string> = {
  primary: 'bg-[#E07A5F] text-white hover:bg-[#C96848]',
  outline: 'bg-transparent text-[#2D2926] border border-[#E8E3DA] hover:bg-[#F8F6F1]',
  ghost: 'bg-transparent text-[#7A756F] hover:bg-[#F8F6F1]',
  teal: 'bg-[#3D8A7A] text-white hover:bg-[#2E6B5E]',
  danger: 'bg-[#FEE2E2] text-[#DC2626] hover:bg-[#FECACA]',
}

export function Btn({ variant = 'primary', size = 'md', loading, children, className, ...props }: BtnProps) {
  return (
    <button
      className={clsx(btnBase, btnSizes[size], btnVariants[variant], className)}
      disabled={loading || props.disabled}
      {...props}
    >
      {loading ? <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" /> : null}
      {children}
    </button>
  )
}

// ─── Card ─────────────────────────────────────────────────────────────────────
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

// ─── Badge ────────────────────────────────────────────────────────────────────
export function Badge({ children, color = 'accent' }: { children: ReactNode; color?: 'accent' | 'teal' | 'warn' }) {
  const styles = {
    accent: 'bg-[#FDF0EA] text-[#E07A5F]',
    teal: 'bg-[#EBF5F3] text-[#3D8A7A]',
    warn: 'bg-[#FEF7E8] text-[#E8A838]',
  }
  return <span className={clsx('text-xs font-semibold px-3 py-1 rounded-full tracking-wide', styles[color])}>{children}</span>
}

// ─── Progress bar ─────────────────────────────────────────────────────────────
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

// ─── Input ────────────────────────────────────────────────────────────────────
export function Input({ className, ...props }: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={clsx('w-full px-4 py-3 border border-[#E8E3DA] rounded-xl text-[15px] bg-white text-[#2D2926] outline-none focus:border-[#E07A5F] transition-colors', className)}
      {...props}
    />
  )
}

// ─── Textarea ─────────────────────────────────────────────────────────────────
export function Textarea({ className, ...props }: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      className={clsx('w-full px-4 py-3 border border-[#E8E3DA] rounded-xl text-[14px] bg-white text-[#2D2926] outline-none focus:border-[#E07A5F] transition-colors resize-y leading-relaxed min-h-[110px]', className)}
      {...props}
    />
  )
}

// ─── Section label ────────────────────────────────────────────────────────────
export function SectionLabel({ children }: { children: ReactNode }) {
  return <div className="text-xs font-bold tracking-widest text-[#7A756F] mb-3">{children}</div>
}

// ─── Empty state ──────────────────────────────────────────────────────────────
export function EmptyState({ icon, title, desc, action }: { icon: string; title: string; desc: string; action?: ReactNode }) {
  return (
    <div className="text-center py-16 px-6">
      <div className="text-5xl mb-4">{icon}</div>
      <h3 className="font-semibold text-lg mb-2 text-[#2D2926]">{title}</h3>
      <p className="text-[#7A756F] mb-6 max-w-xs mx-auto leading-relaxed">{desc}</p>
      {action}
    </div>
  )
}

// ─── Copy block ───────────────────────────────────────────────────────────────
export function CopyBlock({ text, label }: { text: string; label?: string }) {
  const copy = () => navigator.clipboard?.writeText(text).catch(() => {})
  return (
    <div className="border border-[#E8E3DA] rounded-xl overflow-hidden mt-4">
      <div className="flex justify-between items-center px-4 py-2.5 bg-[#F8F6F1] border-b border-[#E8E3DA]">
        <span className="text-xs font-semibold text-[#7A756F] tracking-wide">{label || 'COPY THIS'}</span>
        <button onClick={copy} className="text-xs px-3 py-1 rounded-full border border-[#E8E3DA] text-[#7A756F] hover:bg-white transition-colors cursor-pointer bg-transparent">
          Copy
        </button>
      </div>
      <div className="p-4 text-sm text-[#2D2926] leading-relaxed whitespace-pre-line font-serif">{text}</div>
    </div>
  )
}
