'use client'
import { type ButtonHTMLAttributes, type ReactNode } from 'react'
import { clsx } from 'clsx'

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
