import { clsx } from 'clsx'

export function Input({ className, ...props }: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={clsx('w-full px-4 py-3 border border-[#E8E3DA] rounded-xl text-[15px] bg-white text-[#2D2926] outline-none focus:border-[#E07A5F] transition-colors', className)}
      {...props}
    />
  )
}
