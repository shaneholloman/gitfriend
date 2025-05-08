"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { ChevronRight, ChevronDown, Folder, File, FolderOpen, FilePlus, FolderPlus } from "lucide-react"
import { cn } from "@/lib/utils"
import { ContextMenu, ContextMenuTrigger, ContextMenuContent, ContextMenuItem } from "@/components/ui/context-menu"
import { Checkbox } from "@/components/ui/checkbox"
import { DeleteConfirmationDialog } from "./delete-confirmation-dialog"
import { Trash2 } from "lucide-react"

interface FileTreeProps {
  data: FileTreeNode
  onSelectFile: (fileName: string, filePath: string) => void
  onNavigateFolder: (path: string[]) => void
  currentPath: string[]
  onCreateFile: (path: string[]) => void
  onCreateFolder: (path: string[]) => void
  onDelete: (node: FileTreeNode) => void
  onRename: (node: FileTreeNode) => void
  selectionMode: boolean
  selectedItems: Set<string>
  onToggleSelect: (path: string, selected: boolean) => void
  selectedRepo?: string
}

export interface FileTreeNode {
  name: string
  path: string | string[]
  type: "file" | "directory"
  children?: FileTreeNode[]
  size?: number
  updated?: string
}

// Add a function to check if a file is a .gitkeep file
// Add this function before the component definition:

function isGitKeepFile(fileName: string): boolean {
  return fileName === ".gitkeep"
}

export function FileTree({
  data,
  onSelectFile,
  onNavigateFolder,
  currentPath,
  onCreateFile,
  onCreateFolder,
  onDelete,
  onRename,
  selectionMode,
  selectedItems,
  onToggleSelect,
  selectedRepo,
}: FileTreeProps) {
  const [expandedNodes, setExpandedNodes] = useState<Record<string, boolean>>({})
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [nodeToDelete, setNodeToDelete] = useState<FileTreeNode | null>(null)

  // Initialize with the current path expanded
  useEffect(() => {
    if (currentPath.length > 0) {
      const newExpandedNodes: Record<string, boolean> = {}
      let pathSoFar = ""

      currentPath.forEach((segment) => {
        pathSoFar = pathSoFar ? `${pathSoFar}/${segment}` : segment
        newExpandedNodes[pathSoFar] = true
      })

      setExpandedNodes((prev) => ({
        ...prev,
        ...newExpandedNodes,
      }))
    }
  }, [currentPath])

  const toggleNode = (node: FileTreeNode, e: React.MouseEvent) => {
    e.stopPropagation()
    const nodePath = Array.isArray(node.path) ? node.path.join("/") : node.path

    // If the node is already expanded, collapse it
    if (expandedNodes[nodePath]) {
      setExpandedNodes((prev) => ({
        ...prev,
        [nodePath]: false,
      }))
    } else {
      // Otherwise expand it and ensure all parent nodes are expanded too
      const newExpandedNodes = { ...expandedNodes, [nodePath]: true }

      // If it's a path with multiple segments, ensure parent paths are expanded
      if (Array.isArray(node.path)) {
        let currentPath = ""
        for (const segment of node.path) {
          currentPath = currentPath ? `${currentPath}/${segment}` : segment
          newExpandedNodes[currentPath] = true
        }
      }

      setExpandedNodes(newExpandedNodes)
    }
  }

  const handleFileClick = (node: FileTreeNode, e: React.MouseEvent) => {
    e.stopPropagation()

    if (selectionMode) {
      const nodePath = Array.isArray(node.path) ? node.path.join("/") : node.path
      onToggleSelect(nodePath, !selectedItems.has(nodePath))
      return
    }

    if (node.type === "file") {
      const filePath = Array.isArray(node.path) ? node.path.join("/") : node.path
      onSelectFile(node.name, filePath)
    }
  }

  const handleFolderClick = (node: FileTreeNode, e: React.MouseEvent) => {
    e.stopPropagation()

    if (selectionMode) {
      const nodePath = Array.isArray(node.path) ? node.path.join("/") : node.path
      onToggleSelect(nodePath, !selectedItems.has(nodePath))
      return
    }

    if (node.type === "directory") {
      // For directories, we want to navigate to the path represented by this node
      const path = Array.isArray(node.path) ? [...node.path, node.name] : [node.name]
      onNavigateFolder(path)

      // Also expand this node in the tree
      const nodePath = Array.isArray(node.path) ? [...node.path, node.name].join("/") : node.path
      setExpandedNodes((prev) => ({
        ...prev,
        [nodePath]: true,
      }))
    }
  }

  const getNodePath = (node: FileTreeNode): string[] => {
    if (Array.isArray(node.path)) {
      // For directories, we want to return the path array plus the node name
      return [...node.path, node.name]
    } else {
      // For files, extract the path components
      const pathParts = (node.path as string).split("/")
      // Find the index of the repository name in the path
      const repoIndex = pathParts.findIndex((part) => part === selectedRepo)
      if (repoIndex !== -1 && repoIndex + 1 < pathParts.length) {
        // Return only the parts after the repository name
        return pathParts.slice(repoIndex + 1, pathParts.length - 1)
      }
      return []
    }
  }

  const handleCreateFile = (node: FileTreeNode) => {
    const path = node.type === "directory" ? getNodePath(node) : Array.isArray(node.path) ? node.path : []
    onCreateFile(path)
  }

  const handleCreateFolder = (node: FileTreeNode) => {
    const path = node.type === "directory" ? getNodePath(node) : Array.isArray(node.path) ? node.path : []
    onCreateFolder(path)
  }

  const handleDeleteClick = (node: FileTreeNode, e: React.MouseEvent) => {
    e.stopPropagation()
    setNodeToDelete(node)
    setIsDeleteDialogOpen(true)
  }

  const confirmDelete = async () => {
    if (nodeToDelete) {
      onDelete(nodeToDelete)
    }
    setIsDeleteDialogOpen(false)
    setNodeToDelete(null)
  }

  const renderNode = (node: FileTreeNode, depth = 0) => {
    const nodePath = Array.isArray(node.path) ? node.path.join("/") : node.path
    const isExpanded = expandedNodes[nodePath]
    const isDirectory = node.type === "directory"
    const nodePathString = isDirectory
      ? Array.isArray(node.path)
        ? [...node.path, node.name].join("/")
        : node.name
      : nodePath
    const isSelected = selectedItems.has(nodePathString)
    const isGitKeep = !isDirectory && isGitKeepFile(node.name)

    // Skip .gitkeep files completely
    if (isGitKeep) {
      return null
    }

    // Check if this node is in the current path
    const isInCurrentPath = isDirectory && currentPath.length >= depth + 1 && currentPath[depth] === node.name

    return (
      <div key={nodePath} className="select-none">
        <div
          className={cn(
            "flex items-center py-1 px-2 rounded-md hover:bg-muted/50 cursor-pointer",
            isInCurrentPath && "bg-muted/30",
            isSelected && "bg-primary/10",
          )}
          style={{ paddingLeft: `${depth * 16 + 8}px` }}
          onClick={(e) => (isDirectory ? handleFolderClick(node, e) : handleFileClick(node, e))}
        >
          {isDirectory && (
            <button className="mr-1 p-0.5 hover:bg-muted rounded-sm" onClick={(e) => toggleNode(node, e)}>
              {isExpanded ? (
                <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
              ) : (
                <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
              )}
            </button>
          )}

          {selectionMode && (
            <Checkbox
              checked={isSelected}
              className="mr-2 h-3.5 w-3.5"
              onCheckedChange={(checked) => {
                onToggleSelect(nodePathString, !!checked)
              }}
              onClick={(e) => e.stopPropagation()}
            />
          )}

          {isDirectory ? (
            isExpanded ? (
              <FolderOpen className="h-4 w-4 mr-2 text-blue-500" />
            ) : (
              <Folder className="h-4 w-4 mr-2 text-blue-500" />
            )
          ) : (
            <File className="h-4 w-4 mr-2 text-gray-500" />
          )}

          <span className="truncate text-sm">{node.name}</span>
        </div>

        {isDirectory && isExpanded && node.children && (
          <div>
            {node.children
              .filter((child) => !(child.type === "file" && isGitKeepFile(child.name)))
              .map((child) => renderNode(child, depth + 1))}
          </div>
        )}
      </div>
    )
  }

  return (
    <ContextMenu>
      <ContextMenuTrigger className="overflow-auto h-full">
        <div className="overflow-auto h-full">{renderNode(data)}</div>
      </ContextMenuTrigger>
      <ContextMenuContent>
        <ContextMenuItem onClick={() => handleCreateFile(data)} className="gap-2">
          <FilePlus className="h-4 w-4" />
          New File
        </ContextMenuItem>
        <ContextMenuItem onClick={() => handleCreateFolder(data)} className="gap-2">
          <FolderPlus className="h-4 w-4" />
          New Folder
        </ContextMenuItem>
        <ContextMenuItem
          className="flex items-center gap-2 cursor-pointer text-destructive focus:text-destructive"
          onClick={(e) => handleDeleteClick(data, e)}
        >
          <Trash2 className="h-4 w-4" />
          Delete
        </ContextMenuItem>
      </ContextMenuContent>
      {/* Delete Confirmation Dialog */}
      <DeleteConfirmationDialog
        isOpen={isDeleteDialogOpen}
        onClose={() => setIsDeleteDialogOpen(false)}
        onConfirm={confirmDelete}
        itemName={nodeToDelete?.name || ""}
        itemType={nodeToDelete?.type === "file" ? "file" : "folder"}
      />
    </ContextMenu>
  )
}
  