export default function Loading() {
  return (
    <div className="max-w-[900px] mx-auto px-6 py-10 animate-pulse">
      <div className="h-8 bg-[#E8E3DA] rounded-xl w-64 mb-3" />
      <div className="h-4 bg-[#E8E3DA] rounded w-96 mb-10" />
      <div className="h-24 bg-[#E8E3DA] rounded-2xl mb-4" />
      <div className="grid grid-cols-3 gap-4 mb-4">
        <div className="h-36 bg-[#E8E3DA] rounded-2xl" />
        <div className="h-36 bg-[#E8E3DA] rounded-2xl" />
        <div className="h-36 bg-[#E8E3DA] rounded-2xl" />
      </div>
      <div className="h-20 bg-[#E8E3DA] rounded-2xl" />
    </div>
  )
}
