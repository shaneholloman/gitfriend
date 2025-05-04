"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { ChevronRight, ChevronDown, Folder, File, FolderOpen, FilePlus, FolderPlus, Trash2, Pencil } from "lucide-react"
import { cn } from "@/lib/utils"
import {
  ContextMenu,
  ContextMenuTrigger,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
} from "@/components/ui/context-menu"
import { Checkbox } from "@/components/ui/checkbox"

interface FileTreeProps {
  data: FileTreeNode
  onSelectFile: (file: { name: string; path: string }) => void
  onNavigateFolder: (path: string[]) => void
  currentPath: string[]
  onCreateFile: (path: string[]) => void
  onCreateFolder: (path: string[]) => void
  onDelete: (node: FileTreeNode) => void
  onRename: (node: FileTreeNode) => void
  selectionMode: boolean
  selectedItems: Set<string>
  onToggleSelect: (path: string, selected: boolean) => void
}

export interface FileTreeNode {
  name: string
  path: string | string[]
  type: "file" | "directory"
  children?: FileTreeNode[]
  size?: number
  updated?: string
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
}: FileTreeProps) {
  const [expandedNodes, setExpandedNodes] = useState<Record<string, boolean>>({})

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
    setExpandedNodes((prev) => ({
      ...prev,
      [nodePath]: !prev[nodePath],
    }))
  }

  const handleFileClick = (node: FileTreeNode, e: React.MouseEvent) => {
    e.stopPropagation()

    if (selectionMode) {
      const nodePath = Array.isArray(node.path) ? node.path.join("/") : node.path
      onToggleSelect(nodePath, !selectedItems.has(nodePath))
      return
    }

    if (node.type === "file") {
      onSelectFile({ name: node.name, path: node.path as string })
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
      const path = Array.isArray(node.path) ? node.path.concat(node.name) : [node.name]
      onNavigateFolder(path)
    }
  }

  const getNodePath = (node: FileTreeNode): string[] => {
    if (Array.isArray(node.path)) {
      return [...node.path, node.name]
    } else {
      // For files, extract the path components
      const pathParts = (node.path as string).split("/")
      return pathParts.slice(pathParts.indexOf("users") + 2) // Skip users/userId
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

    // Check if this node is in the current path
    const isInCurrentPath = isDirectory && currentPath.length >= depth + 1 && currentPath[depth] === node.name

    return (
      <ContextMenu key={nodePath}>
        <ContextMenuTrigger>
          <div className="select-none">
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
              <div>{node.children.map((child) => renderNode(child, depth + 1))}</div>
            )}
          </div>
        </ContextMenuTrigger>

        <ContextMenuContent>
          {isDirectory ? (
            <>
              <ContextMenuItem onClick={() => handleCreateFile(node)} className="gap-2">
                <FilePlus className="h-4 w-4" />
                New File
              </ContextMenuItem>
              <ContextMenuItem onClick={() => handleCreateFolder(node)} className="gap-2">
                <FolderPlus className="h-4 w-4" />
                New Folder
              </ContextMenuItem>
              <ContextMenuSeparator />
              <ContextMenuItem onClick={() => onRename(node)} className="gap-2">
                <Pencil className="h-4 w-4" />
                Rename
              </ContextMenuItem>
              <ContextMenuItem onClick={() => onDelete(node)} className="gap-2 text-red-600">
                <Trash2 className="h-4 w-4" />
                Delete
              </ContextMenuItem>
            </>
          ) : (
            <>
              <ContextMenuItem onClick={() => onRename(node)} className="gap-2">
                <Pencil className="h-4 w-4" />
                Rename
              </ContextMenuItem>
              <ContextMenuItem onClick={() => onDelete(node)} className="gap-2 text-red-600">
                <Trash2 className="h-4 w-4" />
                Delete
              </ContextMenuItem>
            </>
          )}
        </ContextMenuContent>
      </ContextMenu>
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
      </ContextMenuContent>
    </ContextMenu>
  )
}
