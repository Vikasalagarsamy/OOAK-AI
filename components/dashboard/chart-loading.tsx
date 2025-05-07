import { Skeleton } from "@/components/ui/skeleton"

export function ChartLoading() {
  return (
    <div className="space-y-4 pt-2">
      <div className="flex justify-between items-center">
        <Skeleton className="h-4 w-28" />
        <Skeleton className="h-4 w-14" />
      </div>

      {[1, 2, 3, 4, 5].map((item) => (
        <div key={item} className="space-y-2">
          <div className="flex justify-between">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-4 w-8" />
          </div>
          <Skeleton className="h-2 w-full" />
        </div>
      ))}
    </div>
  )
}
