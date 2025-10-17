import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

/**
 * Loading skeleton for Dashboard Stats
 * Provides visual feedback while the dashboard is loading
 */
export function DashboardStatsLoader() {
  return (
    <div className="space-y-6">
      {/* Header Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center space-y-0 pb-2">
            <Skeleton className="h-4 w-4 mr-2" />
            <Skeleton className="h-4 w-32" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-8 w-full" />
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center space-y-0 pb-2">
            <Skeleton className="h-4 w-4 mr-2" />
            <Skeleton className="h-4 w-32" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-8 w-full" />
          </CardContent>
        </Card>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-4 w-4" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-16 mb-2" />
              <Skeleton className="h-3 w-32" />
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {[1, 2].map((i) => (
          <Card key={i}>
            <CardHeader>
              <Skeleton className="h-6 w-48" />
              <Skeleton className="h-4 w-64 mt-2" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-[300px] w-full" />
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

/**
 * Loading skeleton for Map Page
 */
export function MapPageLoader() {
  return (
    <div className="h-full w-full flex items-center justify-center bg-gray-50">
      <div className="text-center space-y-4">
        <Skeleton className="h-12 w-12 rounded-full mx-auto" />
        <Skeleton className="h-4 w-32 mx-auto" />
        <Skeleton className="h-3 w-48 mx-auto" />
      </div>
    </div>
  );
}

/**
 * Loading skeleton for Table Page (Users, Reports)
 */
export function TablePageLoader() {
  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex justify-between items-center">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-10 w-32" />
      </div>

      {/* Table */}
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-40" />
          <Skeleton className="h-4 w-64 mt-2" />
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="flex items-center space-x-4">
                <Skeleton className="h-10 w-10 rounded-full" />
                <div className="space-y-2 flex-1">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-3 w-3/4" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

/**
 * Loading skeleton for Profile Page
 */
export function ProfilePageLoader() {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center space-x-4">
            <Skeleton className="h-20 w-20 rounded-full" />
            <div className="space-y-2">
              <Skeleton className="h-6 w-48" />
              <Skeleton className="h-4 w-32" />
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="space-y-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-10 w-full" />
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}

/**
 * Generic Loading skeleton for pages
 */
export function PageLoader() {
  return (
    <div className="flex items-center justify-center min-h-[400px] bg-#f97316">
      <div className="text-center">
        <div className="animate-pulse">
          <img 
            src="/accizard-uploads/accizard-logotype-vertical.svg" 
            alt="AcciZard Logo" 
            className="mx-auto mb-4 w-48 h-auto"
            style={{ filter: 'brightness(0) invert(1)' }}
          />
        </div>
        <p className="text-sm text-white">Loading...</p>
      </div>
    </div>
  );
}

