// ---- SKELETON CARD COMPONENT ----
// Displays a pulsing placeholder card while search results are loading
// Shown instead of a blank page — makes the wait feel much shorter
// The layout mirrors the real EventCard/VenueCard so the transition feels smooth

function SkeletonCard() {
  return (
    <div className="card bg-base-100 shadow-md border border-base-200 animate-pulse">
      <div className="card-body gap-3">

        {/* Title and badge placeholder */}
        <div className="flex justify-between items-start gap-2">
          <div className="h-6 bg-base-300 rounded w-2/3" />
          <div className="h-6 bg-base-300 rounded w-16 shrink-0" />
        </div>

        {/* Image placeholder */}
        <div className="w-full h-40 bg-base-300 rounded-xl" />

        {/* Details grid placeholder */}
        <div className="grid grid-cols-2 gap-x-4 gap-y-2">
          <div className="h-4 bg-base-300 rounded w-full" />
          <div className="h-4 bg-base-300 rounded w-3/4" />
          <div className="h-4 bg-base-300 rounded w-2/3" />
          <div className="h-4 bg-base-300 rounded w-1/2" />
        </div>

        {/* Keywords placeholder */}
        <div className="flex gap-2">
          <div className="h-5 bg-base-300 rounded-full w-16" />
          <div className="h-5 bg-base-300 rounded-full w-20" />
          <div className="h-5 bg-base-300 rounded-full w-14" />
        </div>

        {/* Description placeholder */}
        <div className="space-y-2">
          <div className="h-4 bg-base-300 rounded w-full" />
          <div className="h-4 bg-base-300 rounded w-4/5" />
        </div>

        {/* Buttons placeholder */}
        <div className="flex gap-2 mt-1">
          <div className="h-8 bg-base-300 rounded-lg flex-1" />
          <div className="h-8 bg-base-300 rounded-lg flex-1" />
        </div>

      </div>
    </div>
  )
}

export default SkeletonCard
