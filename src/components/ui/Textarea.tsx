import { clsx } from 'clsx'

export function Textarea({ className, ...props }: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      className={clsx('w-full px-4 py-3 border border-[#E8E3DA] rounded-xl text-[14px] bg-white text-[#2D2926] outline-none focus:border-[#E07A5F] transition-colors resize-y leading-relaxed min-h-[110px]', className)}
      {...props}
    />
  )
}
