"use client"

import { useState } from "react"
import { Folder, File, ChevronUp, ChevronDown, ArrowUp, FilePlus, FolderPlus, Trash2, Pencil } from "lucide-react"
import { formatDistanceToNow } from "date-fns"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { cn } from "@/lib/utils"

interface FileExplorerTableProps {
  files: FileItem[]
  folders: string[]
  onNavigateUp: () => void
  onNavigateFolder: (folderName: string) => void
  onSelectFile: (fileName: string, filePath: string) => void
  currentPath: string[]
  onCreateFile: () => void
  onCreateFolder: () => void
  onDeleteFile: (filePath: string, fileName: string) => void
  onDeleteFolder: (folderName: string) => void
  onRenameFile: (filePath: string, fileName: string) => void
  onRenameFolder: (folderName: string) => void
  selectionMode: boolean
  selectedItems: Set<string>
  onToggleSelect: (path: string, selected: boolean) => void
}

interface FileItem {
  name: string
  path: string
  size: number
  contentType: string
  updated: string
}

function isGitKeepFile(fileName: string): boolean {
  return fileName === ".gitkeep"
}

export function FileExplorerTable({
  files,
  folders,
  onNavigateUp,
  onNavigateFolder,
  onSelectFile,
  currentPath,
  onCreateFile,
  onCreateFolder,
  onDeleteFile,
  onDeleteFolder,
  onRenameFile,
  onRenameFolder,
  selectionMode,
  selectedItems,
  onToggleSelect,
}: FileExplorerTableProps) {
  const [sortField, setSortField] = useState<"name" | "updated">("name")
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc")

  const handleSort = (field: "name" | "updated") => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc")
    } else {
      setSortField(field)
      setSortDirection("asc")
    }
  }

  const sortedFolders = [...folders].sort((a, b) => {
    if (sortField === "name") {
      return sortDirection === "asc" ? a.localeCompare(b) : b.localeCompare(a)
    }
    return 0
  })

  const sortedFiles = [...files]
    .filter((file) => !isGitKeepFile(file.name))
    .sort((a, b) => {
      if (sortField === "name") {
        return sortDirection === "asc" ? a.name.localeCompare(b.name) : b.name.localeCompare(a.name)
      } else if (sortField === "updated") {
        return sortDirection === "asc"
          ? new Date(a.updated).getTime() - new Date(b.updated).getTime()
          : new Date(b.updated).getTime() - new Date(a.updated).getTime()
      }
      return 0
    })

  const getFolderPath = (folderName: string): string => {
    return [...currentPath, folderName].join("/")
  }

  // Render a folder row
  const renderFolderRow = (folder: string) => {
    const folderPath = getFolderPath(folder)
    const isSelected = selectedItems.has(folderPath)

    return (
      <tr
        key={folder}
        className={cn("hover:bg-muted/30 border-b cursor-pointer", isSelected && "bg-primary/10")}
        onClick={() => (selectionMode ? onToggleSelect(folderPath, !isSelected) : onNavigateFolder(folder))}
      >
        <td className="py-2 px-4">
          <div className="flex items-center gap-2">
            {selectionMode && (
              <Checkbox
                checked={isSelected}
                className="mr-2"
                onCheckedChange={(checked) => {
                  onToggleSelect(folderPath, !!checked)
                }}
                onClick={(e) => e.stopPropagation()}
              />
            )}
            <Folder className="h-4 w-4 text-blue-500" />
            <span>{folder}</span>
          </div>
        </td>
        <td className="py-2 px-4 text-sm text-muted-foreground">-</td>
        <td className="py-2 px-4 text-right">
          <div className="flex items-center justify-end gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={(e) => {
                e.stopPropagation()
                onRenameFolder(folder)
              }}
            >
              <Pencil className="h-3.5 w-3.5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-red-500"
              onClick={(e) => {
                e.stopPropagation()
                onDeleteFolder(folder)
              }}
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </div>
        </td>
      </tr>
    )
  }

  // Render a file row
  const renderFileRow = (file: FileItem) => {
    const isSelected = selectedItems.has(file.path)

    return (
      <tr
        key={file.path}
        className={cn("hover:bg-muted/30 border-b cursor-pointer", isSelected && "bg-primary/10")}
        onClick={() => (selectionMode ? onToggleSelect(file.path, !isSelected) : onSelectFile(file.name, file.path))}
      >
        <td className="py-2 px-4">
          <div className="flex items-center gap-2">
            {selectionMode && (
              <Checkbox
                checked={isSelected}
                className="mr-2"
                onCheckedChange={(checked) => {
                  onToggleSelect(file.path, !!checked)
                }}
                onClick={(e) => e.stopPropagation()}
              />
            )}
            <File className="h-4 w-4 text-gray-500" />
            <span>{file.name}</span>
          </div>
        </td>
        <td className="py-2 px-4 text-sm text-muted-foreground">
          {formatDistanceToNow(new Date(file.updated), { addSuffix: true })}
        </td>
        <td className="py-2 px-4 text-right">
          <div className="flex items-center justify-end gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={(e) => {
                e.stopPropagation()
                onRenameFile(file.path, file.name)
              }}
            >
              <Pencil className="h-3.5 w-3.5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-red-500"
              onClick={(e) => {
                e.stopPropagation()
                onDeleteFile(file.path, file.name)
              }}
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </div>
        </td>
      </tr>
    )
  }

  return (
    <div className="border rounded-md overflow-hidden">
      <div className="flex justify-between items-center p-3 bg-muted/30 border-b">
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={onCreateFile} className="gap-2">
            <FilePlus className="h-4 w-4" />
            New File
          </Button>
          <Button variant="outline" size="sm" onClick={onCreateFolder} className="gap-2">
            <FolderPlus className="h-4 w-4" />
            New Folder
          </Button>
        </div>
        <div className="text-sm text-muted-foreground">
          {sortedFiles.length} file{sortedFiles.length !== 1 ? "s" : ""}, {folders.length} folder
          {folders.length !== 1 ? "s" : ""}
        </div>
      </div>
      <table className="w-full">
        <thead>
          <tr className="bg-muted/30 border-b">
            <th className="text-left py-2 px-4 font-medium text-sm">
              <button className="flex items-center gap-1 hover:text-primary" onClick={() => handleSort("name")}>
                Name
                {sortField === "name" &&
                  (sortDirection === "asc" ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />)}
              </button>
            </th>
            <th className="text-left py-2 px-4 font-medium text-sm">
              <button className="flex items-center gap-1 hover:text-primary" onClick={() => handleSort("updated")}>
                Last updated
                {sortField === "updated" &&
                  (sortDirection === "asc" ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />)}
              </button>
            </th>
            <th className="text-right py-2 px-4 font-medium text-sm">Actions</th>
          </tr>
        </thead>
        <tbody>
          {currentPath.length > 0 && (
            <tr className="hover:bg-muted/30 border-b">
              <td colSpan={3} className="py-2 px-4">
                <Button variant="ghost" className="flex items-center gap-2 p-1 h-auto" onClick={onNavigateUp}>
                  <ArrowUp className="h-4 w-4" />
                  <span>Go up</span>
                </Button>
              </td>
            </tr>
          )}

          {sortedFolders.map(renderFolderRow)}
          {sortedFiles.map(renderFileRow)}

          {folders.length === 0 && files.length === 0 && (
            <tr>
              <td colSpan={3} className="py-8 text-center text-muted-foreground">
                This folder is empty
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  )
}
