"use client"

import { useState } from "react"
import { Folder, File, ChevronUp, ChevronDown, ArrowUp, FilePlus, FolderPlus, Trash2, Pencil } from "lucide-react"
import { formatDistanceToNow } from "date-fns"
import { Button } from "@/components/ui/button"
import {
  ContextMenu,
  ContextMenuTrigger,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
} from "@/components/ui/context-menu"
import { Checkbox } from "@/components/ui/checkbox"

interface FileExplorerTableProps {
  files: FileItem[]
  folders: string[]
  onNavigateUp: () => void
  onNavigateFolder: (folderName: string) => void
  onSelectFile: (fileName: string, filePath: string) => void
  currentPath: string[]
  onCreateFile: () => void
  onCreateFolder: () => void
  onDeleteFile: (filePath: string) => void
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

  const sortedFiles = [...files].sort((a, b) => {
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

  return (
    <ContextMenu>
      <ContextMenuTrigger>
        <div className="border rounded-md overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="bg-muted/30 border-b">
                <th className="text-left py-2 px-4 font-medium text-sm">
                  <button className="flex items-center gap-1 hover:text-primary" onClick={() => handleSort("name")}>
                    Name
                    {sortField === "name" &&
                      (sortDirection === "asc" ? (
                        <ChevronUp className="h-3 w-3" />
                      ) : (
                        <ChevronDown className="h-3 w-3" />
                      ))}
                  </button>
                </th>
                <th className="text-left py-2 px-4 font-medium text-sm">
                  <button className="flex items-center gap-1 hover:text-primary" onClick={() => handleSort("updated")}>
                    Last updated
                    {sortField === "updated" &&
                      (sortDirection === "asc" ? (
                        <ChevronUp className="h-3 w-3" />
                      ) : (
                        <ChevronDown className="h-3 w-3" />
                      ))}
                  </button>
                </th>
              </tr>
            </thead>
            <tbody>
              {currentPath.length > 0 && (
                <tr className="hover:bg-muted/30 border-b">
                  <td colSpan={2} className="py-2 px-4">
                    <Button variant="ghost" className="flex items-center gap-2 p-1 h-auto" onClick={onNavigateUp}>
                      <ArrowUp className="h-4 w-4" />
                      <span>Go up</span>
                    </Button>
                  </td>
                </tr>
              )}

              {sortedFolders.map((folder) => (
                <ContextMenu key={folder}>
                  <ContextMenuTrigger>
                    <tr
                      className={cn(
                        "hover:bg-muted/30 border-b cursor-pointer",
                        selectedItems.has(getFolderPath(folder)) && "bg-primary/10",
                      )}
                      onClick={() =>
                        selectionMode
                          ? onToggleSelect(getFolderPath(folder), !selectedItems.has(getFolderPath(folder)))
                          : onNavigateFolder(folder)
                      }
                    >
                      <td className="py-2 px-4">
                        <div className="flex items-center gap-2">
                          {selectionMode && (
                            <Checkbox
                              checked={selectedItems.has(getFolderPath(folder))}
                              className="mr-2"
                              onCheckedChange={(checked) => {
                                onToggleSelect(getFolderPath(folder), !!checked)
                              }}
                              onClick={(e) => e.stopPropagation()}
                            />
                          )}
                          <Folder className="h-4 w-4 text-blue-500" />
                          <span>{folder}</span>
                        </div>
                      </td>
                      <td className="py-2 px-4 text-sm text-muted-foreground">-</td>
                    </tr>
                  </ContextMenuTrigger>
                  <ContextMenuContent>
                    <ContextMenuItem onClick={() => onNavigateFolder(folder)} className="gap-2">
                      <Folder className="h-4 w-4" />
                      Open
                    </ContextMenuItem>
                    <ContextMenuItem
                      onClick={() => {
                        onNavigateFolder(folder)
                        onCreateFile()
                      }}
                      className="gap-2"
                    >
                      <FilePlus className="h-4 w-4" />
                      New File
                    </ContextMenuItem>
                    <ContextMenuItem
                      onClick={() => {
                        onNavigateFolder(folder)
                        onCreateFolder()
                      }}
                      className="gap-2"
                    >
                      <FolderPlus className="h-4 w-4" />
                      New Folder
                    </ContextMenuItem>
                    <ContextMenuSeparator />
                    <ContextMenuItem onClick={() => onRenameFolder(folder)} className="gap-2">
                      <Pencil className="h-4 w-4" />
                      Rename
                    </ContextMenuItem>
                    <ContextMenuItem onClick={() => onDeleteFolder(folder)} className="gap-2 text-red-600">
                      <Trash2 className="h-4 w-4" />
                      Delete
                    </ContextMenuItem>
                  </ContextMenuContent>
                </ContextMenu>
              ))}

              {sortedFiles.map((file) => (
                <ContextMenu key={file.path}>
                  <ContextMenuTrigger>
                    <tr
                      className={cn(
                        "hover:bg-muted/30 border-b cursor-pointer",
                        selectedItems.has(file.path) && "bg-primary/10",
                      )}
                      onClick={() =>
                        selectionMode
                          ? onToggleSelect(file.path, !selectedItems.has(file.path))
                          : onSelectFile(file.name, file.path)
                      }
                    >
                      <td className="py-2 px-4">
                        <div className="flex items-center gap-2">
                          {selectionMode && (
                            <Checkbox
                              checked={selectedItems.has(file.path)}
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
                    </tr>
                  </ContextMenuTrigger>
                  <ContextMenuContent>
                    <ContextMenuItem onClick={() => onSelectFile(file.name, file.path)} className="gap-2">
                      <File className="h-4 w-4" />
                      Open
                    </ContextMenuItem>
                    <ContextMenuSeparator />
                    <ContextMenuItem onClick={() => onRenameFile(file.path, file.name)} className="gap-2">
                      <Pencil className="h-4 w-4" />
                      Rename
                    </ContextMenuItem>
                    <ContextMenuItem onClick={() => onDeleteFile(file.path)} className="gap-2 text-red-600">
                      <Trash2 className="h-4 w-4" />
                      Delete
                    </ContextMenuItem>
                  </ContextMenuContent>
                </ContextMenu>
              ))}

              {folders.length === 0 && files.length === 0 && (
                <tr>
                  <td colSpan={2} className="py-8 text-center text-muted-foreground">
                    This folder is empty
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </ContextMenuTrigger>
      <ContextMenuContent>
        <ContextMenuItem onClick={onCreateFile} className="gap-2">
          <FilePlus className="h-4 w-4" />
          New File
        </ContextMenuItem>
        <ContextMenuItem onClick={onCreateFolder} className="gap-2">
          <FolderPlus className="h-4 w-4" />
          New Folder
        </ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  )
}

// Helper function for conditional class names
function cn(...classes: (string | boolean | undefined)[]) {
  return classes.filter(Boolean).join(" ")
}
