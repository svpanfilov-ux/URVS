import { Skeleton } from "@/components/ui/skeleton";

export function TimesheetSkeleton() {
  return (
    <div className="space-y-6">
      {/* Header Skeleton */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Skeleton className="h-8 w-8" />
          <div>
            <Skeleton className="h-8 w-80 mb-2" />
            <Skeleton className="h-4 w-60" />
          </div>
        </div>
        
        <div className="flex items-center space-x-4">
          <Skeleton className="h-9 w-24" />
          <Skeleton className="h-9 w-32" />
          <Skeleton className="h-9 w-28" />
          <Skeleton className="h-9 w-44" />
        </div>
      </div>

      {/* Table Skeleton */}
      <div className="overflow-hidden border rounded-lg bg-background">
        <div className="w-full">
          <div className="border-collapse">
            {/* Header Row */}
            <div className="flex border-b bg-muted/50">
              <Skeleton className="w-32 h-12 m-1" />
              {Array.from({ length: 31 }, (_, i) => (
                <Skeleton key={i} className="w-7 h-12 m-1" />
              ))}
              <Skeleton className="w-12 h-12 m-1" />
              <Skeleton className="w-12 h-12 m-1" />
            </div>

            {/* Employee Rows */}
            <div className="space-y-1 p-1">
              {/* Section Header */}
              <Skeleton className="h-8 w-full bg-blue-100/50" />
              
              {/* Employee Rows */}
              {Array.from({ length: 6 }, (_, i) => (
                <div key={i} className="flex space-x-1">
                  <div className="w-32 space-y-1">
                    <Skeleton className="h-3 w-28" />
                    <Skeleton className="h-2 w-24" />
                  </div>
                  {Array.from({ length: 31 }, (_, j) => (
                    <Skeleton key={j} className="w-7 h-6" />
                  ))}
                  <Skeleton className="w-12 h-6" />
                  <Skeleton className="w-12 h-6" />
                </div>
              ))}

              {/* Subtotal Row */}
              <Skeleton className="h-6 w-full bg-blue-200/50" />

              {/* Part-time Section */}
              <Skeleton className="h-8 w-full bg-orange-100/50 mt-4" />
              
              {Array.from({ length: 3 }, (_, i) => (
                <div key={i} className="flex space-x-1">
                  <div className="w-32 space-y-1">
                    <Skeleton className="h-3 w-28" />
                    <Skeleton className="h-2 w-24" />
                  </div>
                  {Array.from({ length: 31 }, (_, j) => (
                    <Skeleton key={j} className="w-7 h-6" />
                  ))}
                  <Skeleton className="w-12 h-6" />
                  <Skeleton className="w-12 h-6" />
                </div>
              ))}

              {/* Final Subtotal */}
              <Skeleton className="h-6 w-full bg-orange-200/50" />
            </div>
          </div>
        </div>
      </div>

      {/* Color Legend Skeleton */}
      <div className="bg-background border rounded-lg p-4">
        <Skeleton className="h-5 w-32 mb-3" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {Array.from({ length: 8 }, (_, i) => (
            <div key={i} className="flex items-center space-x-2">
              <Skeleton className="w-4 h-4 rounded" />
              <Skeleton className="h-4 w-16" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}