"use client"

import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Button } from "@/components/ui/button"

export function TooltipDemo() {
  return (
    <TooltipProvider>
      <div className="flex gap-4 p-8">
        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="outline">Hover me</Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>This is a tooltip with motion animations!</p>
          </TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="outline">And me</Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Another tooltip with smooth animations</p>
          </TooltipContent>
        </Tooltip>
      </div>
    </TooltipProvider>
  )
}
