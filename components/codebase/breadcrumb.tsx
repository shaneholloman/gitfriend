"use client"

import { ChevronRight, Home } from "lucide-react"
import { Button } from "@/components/ui/button"

interface BreadcrumbProps {
  repo: string
  path: string[]
  onNavigate: (path: string[]) => void
}

export function Breadcrumb({ repo, path, onNavigate }: BreadcrumbProps) {
  return (
    <div className="flex items-center flex-wrap gap-1 text-sm">
      <Button variant="ghost" size="sm" className="h-auto p-1" onClick={() => onNavigate([])}>
        <Home className="h-4 w-4" />
      </Button>
      <ChevronRight className="h-4 w-4 text-muted-foreground" />
      <Button variant="ghost" size="sm" className="h-auto p-1 font-medium" onClick={() => onNavigate([])}>
        {repo}
      </Button>

      {path.map((segment, index) => (
        <div key={index} className="flex items-center">
          <ChevronRight className="h-4 w-4 text-muted-foreground" />
          <Button variant="ghost" size="sm" className="h-auto p-1" onClick={() => onNavigate(path.slice(0, index + 1))}>
            {segment}
          </Button>
        </div>
      ))}
    </div>
  )
}
