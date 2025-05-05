"use client"

import { useState, useEffect } from "react"
import { Folder, File, ChevronRight, Loader2 } from "lucide-react"
import { auth } from "@/lib/firebase"
import { useToast } from "@/hooks/use-toast"
import { Skeleton } from "@/components/ui/skeleton"
import { ScrollArea } from "@/components/ui/scroll-area"

interface FileExplorerProps {
  repo: string
  path: string[]
  onNavigate: (path: string[]) => void
  onSelectFile: (fileName: string, filePath: string) => void
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

export function FileExplorer({ repo, path, onNavigate, onSelectFile }: FileExplorerProps) {
  const [files, setFiles] = useState<FileItem[]>([])
  const [folders, setFolders] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const { toast } = useToast()

  useEffect(() => {
    if (repo) {
      fetchFilesAndFolders()
    }
  }, [repo, path])

  const fetchFilesAndFolders = async () => {
    setLoading(true)
    try {
      const token = await auth.currentUser?.getIdToken()

      if (!token) {
        console.error("No auth token available")
        toast({
          title: "Authentication Error",
          description: "Please log in to view files",
          variant: "destructive",
        })
        setLoading(false)
        return
      }

      const pathQuery = path.length > 0 ? `&path=${path.join("/")}` : ""
      const response = await fetch(`/api/codebase/folders?repo=${repo}${pathQuery}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (!response.ok) {
        throw new Error("Failed to fetch files and folders")
      }

      const data = await response.json()
      // Filter out .gitkeep files
      const filteredFiles = (data.files || []).filter((file: FileItem) => !isGitKeepFile(file.name))
      setFiles(filteredFiles)
      setFolders(data.folders || [])
    } catch (error) {
      console.error("Error fetching files and folders:", error)
      toast({
        title: "Error",
        description: "Failed to fetch files and folders",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleFolderClick = (folderName: string) => {
    const newPath = [...path, folderName]
    onNavigate(newPath)
  }

  const handleFileClick = (file: FileItem) => {
    onSelectFile(file.name, file.path)
  }

  if (loading) {
    return (
      <div className="border rounded-lg p-4">
        <div className="flex items-center justify-center py-2 mb-4">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          <span className="ml-2 text-sm text-muted-foreground">Loading files...</span>
        </div>
        <div className="space-y-2">
          {[1, 2, 3, 4, 5].map((i) => (
            <Skeleton key={i} className="h-8 w-full" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="border rounded-lg overflow-hidden">
      <div className="bg-muted/30 p-3 border-b">
        <h3 className="font-medium text-sm">Files and Folders</h3>
      </div>
      <ScrollArea className="h-[400px]">
        {folders.length === 0 && files.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full p-6">
            <p className="text-muted-foreground text-center">This folder is empty</p>
          </div>
        ) : (
          <div className="p-2">
            {folders.map((folder) => (
              <button
                key={folder}
                onClick={() => handleFolderClick(folder)}
                className="w-full flex items-center p-2 rounded-md hover:bg-muted/50 text-left group"
              >
                <Folder className="h-4 w-4 mr-2 text-blue-500" />
                <span className="flex-1 truncate">{folder}</span>
                <ChevronRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
              </button>
            ))}

            {files.map((file) => (
              <button
                key={file.path}
                onClick={() => handleFileClick(file)}
                className="w-full flex items-center p-2 rounded-md hover:bg-muted/50 text-left"
              >
                <File className="h-4 w-4 mr-2 text-gray-500" />
                <span className="flex-1 truncate">{file.name}</span>
                <span className="text-xs text-muted-foreground">{formatFileSize(file.size)}</span>
              </button>
            ))}
          </div>
        )}
      </ScrollArea>
    </div>
  )
}

function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 B"

  const k = 1024
  const sizes = ["B", "KB", "MB", "GB"]
  const i = Math.floor(Math.log(bytes) / Math.log(k))

  return Number.parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i]
}
