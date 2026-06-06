export default function Loading() {
  return (
    <div className="max-w-[780px] mx-auto px-6 py-10 animate-pulse">
      <div className="h-4 bg-[#E8E3DA] rounded w-32 mb-6" />
      <div className="h-6 bg-[#E8E3DA] rounded w-20 mb-4" />
      <div className="h-9 bg-[#E8E3DA] rounded-xl w-80 mb-2" />
      <div className="h-4 bg-[#E8E3DA] rounded w-48 mb-8" />
      <div className="grid grid-cols-2 gap-4 mb-5">
        <div className="h-48 bg-[#E8E3DA] rounded-2xl" />
        <div className="h-48 bg-[#E8E3DA] rounded-2xl" />
      </div>
      <div className="h-64 bg-[#E8E3DA] rounded-2xl mb-5" />
      <div className="grid grid-cols-3 gap-4">
        <div className="h-40 bg-[#E8E3DA] rounded-2xl" />
        <div className="h-40 bg-[#E8E3DA] rounded-2xl" />
        <div className="h-40 bg-[#E8E3DA] rounded-2xl" />
      </div>
    </div>
  )
}
