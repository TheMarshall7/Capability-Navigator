'use client'
import { useRouter } from 'next/navigation'

interface TransitionFiltersProps {
  fromRoles: string[]
  toRoles: string[]
  currentFrom?: string
  currentTo?: string
}

export default function TransitionFilters({
  fromRoles,
  toRoles,
  currentFrom = '',
  currentTo = '',
}: TransitionFiltersProps) {
  const router = useRouter()

  const apply = (from: string, to: string) => {
    const params = new URLSearchParams()
    if (from) params.set('from', from)
    if (to) params.set('to', to)
    const qs = params.toString()
    router.push(qs ? `/transitions?${qs}` : '/transitions')
  }

  return (
    <div className="flex flex-wrap gap-4 items-end">
      <div>
        <label htmlFor="filter-from" className="block text-xs font-semibold text-[#7A756F] mb-1.5 uppercase tracking-wide">
          From
        </label>
        <select
          id="filter-from"
          value={currentFrom}
          onChange={e => apply(e.target.value, currentTo)}
          className="px-4 py-2.5 border border-[#E8E3DA] rounded-xl text-sm bg-white text-[#2D2926] min-w-[180px] outline-none focus:border-[#E07A5F]"
        >
          <option value="">All roles</option>
          {fromRoles.map(r => (
            <option key={r} value={r}>{r}</option>
          ))}
        </select>
      </div>
      <div>
        <label htmlFor="filter-to" className="block text-xs font-semibold text-[#7A756F] mb-1.5 uppercase tracking-wide">
          To
        </label>
        <select
          id="filter-to"
          value={currentTo}
          onChange={e => apply(currentFrom, e.target.value)}
          className="px-4 py-2.5 border border-[#E8E3DA] rounded-xl text-sm bg-white text-[#2D2926] min-w-[180px] outline-none focus:border-[#E07A5F]"
        >
          <option value="">All roles</option>
          {toRoles.map(r => (
            <option key={r} value={r}>{r}</option>
          ))}
        </select>
      </div>
      {(currentFrom || currentTo) && (
        <button
          type="button"
          onClick={() => apply('', '')}
          className="text-sm text-[#7A756F] hover:text-[#E07A5F] bg-transparent border-none cursor-pointer pb-2.5"
        >
          Clear filters
        </button>
      )}
    </div>
  )
}
