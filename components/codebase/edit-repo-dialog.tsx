"use client"

import type React from "react"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"

interface EditRepoDialogProps {
  isOpen: boolean
  onClose: () => void
  onEdit: (newName: string, newDescription: string) => Promise<void>
  currentName: string
  currentDescription: string
}

export function EditRepoDialog({ isOpen, onClose, onEdit, currentName, currentDescription }: EditRepoDialogProps) {
  const [name, setName] = useState(currentName)
  const [description, setDescription] = useState(currentDescription)
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

    if (name === currentName && description === currentDescription) {
      onClose()
      return
    }

    setError("")
    setIsSubmitting(true)

    try {
      await onEdit(name, description)
      onClose()
    } catch (error) {
      console.error("Error editing repository:", error)
      setError("Failed to update repository")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Edit Repository</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 pt-4">
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
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Repository description"
              disabled={isSubmitting}
              rows={3}
            />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting || !name.trim() || (name === currentName && description === currentDescription)}
            >
              {isSubmitting ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
