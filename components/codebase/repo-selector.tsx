"use client"

import { useState } from "react"
import { Check, ChevronsUpDown } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { cn } from "@/lib/utils"

interface RepoSelectorProps {
  repos: string[]
  selectedRepo: string
  onSelectRepo: (repo: string) => void
  onCreateRepo: () => void
  isLoading?: boolean
}

export function RepoSelector({
  repos,
  selectedRepo,
  onSelectRepo,
  onCreateRepo,
  isLoading = false,
}: RepoSelectorProps) {
  const [open, setOpen] = useState(false)

  return (
    <div className="space-y-2">
      <label className="text-sm font-medium">Repository</label>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-full justify-between"
            disabled={isLoading}
          >
            {isLoading ? (
              <span className="animate-pulse">Loading repositories...</span>
            ) : selectedRepo ? (
              selectedRepo
            ) : (
              "Select repository"
            )}
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[200px] p-0">
          <Command>
            <CommandInput placeholder="Search repository..." />
            <CommandList>
              <CommandEmpty>
                <div className="p-2 text-center">
                  <p className="text-sm text-muted-foreground">No repositories found</p>
                  <Button
                    variant="outline"
                    size="sm"
                    className="mt-2 w-full"
                    onClick={() => {
                      setOpen(false)
                      onCreateRepo()
                    }}
                  >
                    Create Repository
                  </Button>
                </div>
              </CommandEmpty>
              <CommandGroup>
                {repos.map((repo) => (
                  <CommandItem
                    key={repo}
                    value={repo}
                    onSelect={() => {
                      onSelectRepo(repo)
                      setOpen(false)
                    }}
                  >
                    <Check className={cn("mr-2 h-4 w-4", selectedRepo === repo ? "opacity-100" : "opacity-0")} />
                    {repo}
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  )
}
