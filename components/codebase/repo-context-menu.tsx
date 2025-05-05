"use client"

import type React from "react"

import { useState } from "react"
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from "@/components/ui/context-menu"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Pencil, Trash2, Edit } from "lucide-react"
import { RenameRepoDialog } from "./rename-repo-dialog"
import { EditRepoDialog } from "./edit-repo-dialog"

interface RepoContextMenuProps {
  children: React.ReactNode
  repoName: string
  onRename: (repoName: string, newName: string) => Promise<void>
  onDelete: (repoName: string) => Promise<void>
  onEdit: (repoName: string, newName: string, description: string) => Promise<void>
  description?: string
}

export function RepoContextMenu({
  children,
  repoName,
  onRename,
  onDelete,
  onEdit,
  description = "",
}: RepoContextMenuProps) {
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [isRenameDialogOpen, setIsRenameDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  const handleDelete = async () => {
    setIsDeleting(true)
    try {
      await onDelete(repoName)
    } finally {
      setIsDeleting(false)
      setIsDeleteDialogOpen(false)
    }
  }

  return (
    <>
      <ContextMenu>
        <ContextMenuTrigger asChild>{children}</ContextMenuTrigger>
        <ContextMenuContent className="w-48">
          <ContextMenuItem
            className="flex items-center gap-2 cursor-pointer"
            onClick={() => setIsRenameDialogOpen(true)}
          >
            <Pencil className="h-4 w-4" />
            Rename
          </ContextMenuItem>
          <ContextMenuItem className="flex items-center gap-2 cursor-pointer" onClick={() => setIsEditDialogOpen(true)}>
            <Edit className="h-4 w-4" />
            Edit
          </ContextMenuItem>
          <ContextMenuSeparator />
          <ContextMenuItem
            className="flex items-center gap-2 cursor-pointer text-destructive focus:text-destructive"
            onClick={() => setIsDeleteDialogOpen(true)}
          >
            <Trash2 className="h-4 w-4" />
            Delete
          </ContextMenuItem>
        </ContextMenuContent>
      </ContextMenu>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure you want to delete this repository?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the repository
              <span className="font-semibold"> {repoName}</span> and all of its files.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault()
                handleDelete()
              }}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Rename Dialog */}
      <RenameRepoDialog
        isOpen={isRenameDialogOpen}
        onClose={() => setIsRenameDialogOpen(false)}
        onRename={(newName) => onRename(repoName, newName)}
        currentName={repoName}
      />

      {/* Edit Dialog */}
      <EditRepoDialog
        isOpen={isEditDialogOpen}
        onClose={() => setIsEditDialogOpen(false)}
        onEdit={(newName, newDescription) => onEdit(repoName, newName, newDescription)}
        currentName={repoName}
        currentDescription={description}
      />
    </>
  )
}
