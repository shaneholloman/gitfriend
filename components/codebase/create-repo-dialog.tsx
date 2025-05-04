"use client"

import type React from "react"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

interface CreateRepoDialogProps {
  isOpen: boolean
  onClose: () => void
  onCreateRepo: (name: string) => void
}

export function CreateRepoDialog({ isOpen, onClose, onCreateRepo }: CreateRepoDialogProps) {
  const [name, setName] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState("")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Validate repository name
    if (!name) {
      setError("Repository name is required")
      return
    }

    if (!/^[a-zA-Z0-9-_]+$/.test(name)) {
      setError("Repository name can only contain letters, numbers, hyphens, and underscores")
      return
    }

    setError("")
    setIsSubmitting(true)

    try {
      await onCreateRepo(name)
      setName("")
    } catch (error) {
      console.error("Error in create repo dialog:", error)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create New Repository</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Repository Name</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="my-repo"
                disabled={isSubmitting}
              />
              {error && <p className="text-sm text-destructive">{error}</p>}
              <p className="text-sm text-muted-foreground">
                Repository names can only contain letters, numbers, hyphens, and underscores.
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Creating..." : "Create Repository"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
