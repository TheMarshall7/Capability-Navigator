export default function Loading() {
  return (
    <div className="max-w-[900px] mx-auto px-6 py-10 animate-pulse">
      <div className="h-6 bg-[#E8E3DA] rounded w-20 mb-4" />
      <div className="h-9 bg-[#E8E3DA] rounded-xl w-72 mb-3" />
      <div className="h-4 bg-[#E8E3DA] rounded w-48 mb-8" />
      <div className="h-28 bg-[#E8E3DA] rounded-2xl mb-4" />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        <div className="h-44 bg-[#E8E3DA] rounded-2xl" />
        <div className="h-44 bg-[#E8E3DA] rounded-2xl" />
      </div>
      <div className="h-44 bg-[#E8E3DA] rounded-2xl" />
    </div>
  )
}
