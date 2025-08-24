import { Skeleton } from "@/components/ui/skeleton";

export function EmployeesSkeleton() {
  return (
    <div className="space-y-6">
      {/* Header Skeleton */}
      <div className="flex items-center justify-between">
        <div>
          <Skeleton className="h-8 w-64 mb-2" />
          <Skeleton className="h-4 w-80" />
        </div>
        <div className="flex space-x-3">
          <Skeleton className="h-9 w-28" />
          <Skeleton className="h-9 w-24" />
        </div>
      </div>

      {/* Filters Skeleton */}
      <div className="flex flex-col sm:flex-row gap-4">
        <Skeleton className="h-9 w-64" />
        <Skeleton className="h-9 w-48" />
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }, (_, i) => (
          <div key={i} className="border rounded-lg p-4 space-y-2">
            <div className="flex items-center space-x-2">
              <Skeleton className="h-4 w-4" />
              <Skeleton className="h-4 w-20" />
            </div>
            <Skeleton className="h-8 w-12" />
            <Skeleton className="h-3 w-16" />
          </div>
        ))}
      </div>

      {/* Table Skeleton */}
      <div className="border rounded-lg">
        <div className="p-4">
          <div className="overflow-x-auto">
            <div className="space-y-3">
              {/* Table Header */}
              <div className="flex space-x-4 pb-2 border-b bg-muted/50 p-2 rounded">
                <Skeleton className="h-4 w-48" />
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-4 w-28" />
                <Skeleton className="h-4 w-20" />
              </div>
              
              {/* Table Rows */}
              {Array.from({ length: 8 }, (_, i) => (
                <div key={i} className="flex space-x-4 py-3 border-b">
                  <div className="w-48 space-y-1">
                    <Skeleton className="h-4 w-40" />
                    <Skeleton className="h-3 w-32" />
                  </div>
                  <Skeleton className="h-4 w-32" />
                  <div className="w-24 flex justify-center">
                    <Skeleton className="h-5 w-16 rounded-full" />
                  </div>
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="h-4 w-28" />
                  <Skeleton className="h-4 w-20" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}