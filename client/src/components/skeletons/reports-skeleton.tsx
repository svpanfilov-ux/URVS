import { Skeleton } from "@/components/ui/skeleton";

export function ReportsSkeleton() {
  return (
    <div className="space-y-6">
      {/* Header Skeleton */}
      <div>
        <Skeleton className="h-8 w-64 mb-2" />
        <Skeleton className="h-4 w-80" />
      </div>

      {/* Report Management Buttons (for Object Manager) */}
      <div className="border rounded-lg p-6 space-y-4">
        <Skeleton className="h-6 w-40" />
        <Skeleton className="h-4 w-48" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {Array.from({ length: 4 }, (_, i) => (
            <Skeleton key={i} className="h-9 w-full" />
          ))}
        </div>
      </div>

      {/* Report Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {Array.from({ length: 2 }, (_, i) => (
          <div key={i} className="border rounded-lg">
            <div className="p-6 pb-4">
              <div className="flex items-center justify-between mb-2">
                <Skeleton className="h-6 w-40" />
                <Skeleton className="h-5 w-20 rounded-full" />
              </div>
              <Skeleton className="h-4 w-32" />
            </div>
            <div className="p-6 pt-0 space-y-4">
              <div className="space-y-3">
                <div className="flex justify-between">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-4 w-8" />
                </div>
                <div className="flex justify-between">
                  <Skeleton className="h-4 w-28" />
                  <Skeleton className="h-4 w-12" />
                </div>
                <div className="flex justify-between">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-4 w-20" />
                </div>
              </div>
              <div className="flex space-x-2">
                <Skeleton className="h-9 flex-1" />
                <Skeleton className="h-9 w-24" />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Report History Table */}
      <div className="border rounded-lg">
        <div className="p-6 pb-4">
          <Skeleton className="h-6 w-32" />
        </div>
        <div className="p-6 pt-0">
          <div className="overflow-x-auto space-y-3">
            {/* Table Header */}
            <div className="flex space-x-4 pb-2 border-b bg-muted/50 p-2 rounded">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-4 w-16" />
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-4 w-28" />
              <Skeleton className="h-4 w-20" />
            </div>
            
            {/* Table Rows */}
            {Array.from({ length: 5 }, (_, i) => (
              <div key={i} className="flex space-x-4 py-3 border-b">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-4 w-16" />
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-4 w-28" />
                <Skeleton className="h-4 w-20" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}