export default function Loading() {
  return (
    <div className="max-w-[900px] mx-auto px-6 py-10 animate-pulse">
      <div className="h-6 bg-[#E8E3DA] rounded w-32 mb-4" />
      <div className="h-9 bg-[#E8E3DA] rounded-xl w-80 mb-3" />
      <div className="h-4 bg-[#E8E3DA] rounded w-full max-w-md mb-8" />
      <div className="flex gap-4 mb-8">
        <div className="h-10 bg-[#E8E3DA] rounded-xl w-44" />
        <div className="h-10 bg-[#E8E3DA] rounded-xl w-44" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="h-48 bg-[#E8E3DA] rounded-2xl" />
        <div className="h-48 bg-[#E8E3DA] rounded-2xl" />
        <div className="h-48 bg-[#E8E3DA] rounded-2xl" />
        <div className="h-48 bg-[#E8E3DA] rounded-2xl" />
      </div>
    </div>
  )
}
