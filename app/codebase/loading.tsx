import { NavbarDemo as Navbar } from "@/components/ui/navbar"
import { Skeleton } from "@/components/ui/skeleton"

export default function Loading() {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container mx-auto px-4 pt-24 pb-12">
        <div className="animate-pulse space-y-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <Skeleton className="h-10 w-64" />
            <Skeleton className="h-10 w-48" />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-1">
              <Skeleton className="h-8 w-full mb-4" />
              <Skeleton className="h-[500px] w-full" />
            </div>
            <div className="lg:col-span-2">
              <Skeleton className="h-[500px] w-full" />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
