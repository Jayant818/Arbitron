import { Loader2 } from "lucide-react"

export default function CreateLoading() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="text-center">
        <Loader2 className="mx-auto h-12 w-12 animate-spin text-primary" />
        <p className="mt-4 text-sm text-muted-foreground">Loading create contest...</p>
      </div>
    </div>
  )
}
