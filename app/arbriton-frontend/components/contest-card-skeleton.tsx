import { Skeleton } from "@/components/ui/skeleton"
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card"

export function ContestCardSkeleton() {
  return (
    <Card className="glass glass-hover overflow-hidden transition-smooth hover:translate-y-[-2px]">
      <CardHeader className="pb-4">
        <div className="flex items-start justify-between mb-2">
          <Skeleton className="h-6 w-2/3 bg-primary/20" />
          <Skeleton className="h-5 w-20 rounded-full bg-primary/20" />
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Prize and Fee */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Skeleton className="h-4 w-16 bg-primary/20" />
            <Skeleton className="h-6 w-24 bg-primary/20" />
          </div>
          <div className="space-y-2">
            <Skeleton className="h-4 w-16 bg-primary/20" />
            <Skeleton className="h-6 w-20 bg-primary/20" />
          </div>
        </div>

        {/* Stats */}
        <div className="glass rounded-lg p-3 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Skeleton className="h-4 w-4 bg-primary/20" />
              <Skeleton className="h-4 w-20 bg-primary/20" />
            </div>
            <Skeleton className="h-4 w-16 bg-primary/20" />
          </div>
          
          <Skeleton className="h-2 w-full rounded-full bg-primary/20" />
          
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <Skeleton className="h-4 w-4 bg-primary/20" />
              <Skeleton className="h-4 w-24 bg-primary/20" />
            </div>
            <Skeleton className="h-4 w-20 bg-primary/20" />
          </div>
        </div>
      </CardContent>

      <CardFooter>
        <Skeleton className="h-10 w-full rounded-2xl bg-primary/20" />
      </CardFooter>
    </Card>
  )
}
