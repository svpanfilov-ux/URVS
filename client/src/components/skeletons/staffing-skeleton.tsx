import { Skeleton } from "@/components/ui/skeleton";

export function StaffingSkeleton() {
  return (
    <div className="space-y-6">
      {/* Header Skeleton */}
      <div className="flex items-center justify-between">
        <div>
          <Skeleton className="h-8 w-64 mb-2" />
          <Skeleton className="h-4 w-80" />
        </div>
        <Skeleton className="h-9 w-32" />
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {Array.from({ length: 3 }, (_, i) => (
          <div key={i} className="border rounded-lg p-4 space-y-2">
            <div className="flex items-center space-x-2">
              <Skeleton className="h-4 w-4" />
              <Skeleton className="h-4 w-20" />
            </div>
            <Skeleton className="h-8 w-12" />
            <Skeleton className="h-3 w-24" />
          </div>
        ))}
      </div>

      {/* Schedule Table Skeleton */}
      <div className="border rounded-lg">
        <div className="p-6 pb-4">
          <Skeleton className="h-6 w-48 mb-2" />
          <Skeleton className="h-4 w-72" />
        </div>
        <div className="p-6 pt-0">
          <div className="overflow-x-auto space-y-3">
            {/* Table Header */}
            <div className="flex space-x-2 pb-2 border-b bg-muted/50 p-2 rounded">
              <Skeleton className="h-4 w-32" />
              {Array.from({ length: 7 }, (_, i) => (
                <Skeleton key={i} className="h-4 w-24" />
              ))}
              <Skeleton className="h-4 w-20" />
            </div>
            
            {/* Table Rows */}
            {Array.from({ length: 8 }, (_, i) => (
              <div key={i} className="flex space-x-2 py-3 border-b">
                <Skeleton className="h-4 w-32" />
                {Array.from({ length: 7 }, (_, j) => (
                  <Skeleton key={j} className="h-4 w-24" />
                ))}
                <Skeleton className="h-4 w-20" />
              </div>
            ))}

            {/* Total Row */}
            <div className="flex space-x-2 py-3 border-t-2 bg-muted/30 p-2 rounded">
              <Skeleton className="h-4 w-32" />
              {Array.from({ length: 7 }, (_, i) => (
                <Skeleton key={i} className="h-4 w-24" />
              ))}
              <Skeleton className="h-4 w-20" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}