import { Skeleton } from "@/components/ui/skeleton"
import { Card, CardContent, CardHeader } from "@/components/ui/card"

export default function Loading() {
  return (
    <div className="min-h-screen bg-black text-white p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <Skeleton className="h-10 w-80 mb-2" />
          <Skeleton className="h-6 w-64" />
        </div>

        {/* Filters Skeleton */}
        <Card className="bg-gray-900 border-gray-700 mb-6">
          <CardHeader>
            <Skeleton className="h-6 w-16" />
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          </CardContent>
        </Card>

        {/* Table Skeleton */}
        <Card className="bg-gray-900 border-gray-700">
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-700">
                    <th className="text-left p-4">
                      <Skeleton className="h-4 w-20" />
                    </th>
                    <th className="text-left p-4">
                      <Skeleton className="h-4 w-16" />
                    </th>
                    <th className="text-left p-4">
                      <Skeleton className="h-4 w-12" />
                    </th>
                    <th className="text-right p-4">
                      <Skeleton className="h-4 w-12 ml-auto" />
                    </th>
                    <th className="text-right p-4">
                      <Skeleton className="h-4 w-12 ml-auto" />
                    </th>
                    <th className="text-left p-4">
                      <Skeleton className="h-4 w-20" />
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {Array.from({ length: 10 }).map((_, index) => (
                    <tr key={index} className="border-b border-gray-700">
                      <td className="p-4">
                        <div className="flex items-center space-x-3">
                          <Skeleton className="w-6 h-6 rounded" />
                          <div>
                            <Skeleton className="h-4 w-32 mb-1" />
                            <Skeleton className="h-3 w-24" />
                          </div>
                        </div>
                      </td>
                      <td className="p-4">
                        <Skeleton className="h-6 w-16 rounded-full" />
                      </td>
                      <td className="p-4">
                        <div className="flex space-x-2">
                          <Skeleton className="h-5 w-12 rounded" />
                          <Skeleton className="h-5 w-16 rounded" />
                          <Skeleton className="h-5 w-10 rounded" />
                        </div>
                      </td>
                      <td className="p-4 text-right">
                        <Skeleton className="h-4 w-12 ml-auto" />
                      </td>
                      <td className="p-4 text-right">
                        <Skeleton className="h-4 w-12 ml-auto" />
                      </td>
                      <td className="p-4">
                        <Skeleton className="h-6 w-16 rounded-full" />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
