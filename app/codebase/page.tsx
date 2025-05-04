"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import {
  Plus,
  RefreshCw,
  FolderPlus,
  FilePlus,
  Code,
  Github,
  GitBranch,
  Loader2,
  Search,
  ChevronDown,
  Trash2,
  Check,
  X,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { useToast } from "@/hooks/use-toast"
import { auth } from "@/lib/firebase"
import { ProtectedRoute } from "@/components/auth/protected-route"
import { CreateRepoDialog } from "@/components/codebase/create-repo-dialog"
import { CreateFileDialog } from "@/components/codebase/create-file-dialog"
import { CreateFolderDialog } from "@/components/codebase/create-folder-dialog"
import { RenameDialog } from "@/components/codebase/rename-dialog"
import { FileTree, type FileTreeNode } from "@/components/codebase/file-tree"
import { FileExplorerTable } from "@/components/codebase/file-explorer-table"
import { FileViewer } from "@/components/codebase/file-viewer"
import { Breadcrumb } from "@/components/codebase/breadcrumb"
import { Input } from "@/components/ui/input"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { NavbarDemo } from "@/components/ui/navbar"

export default function CodebasePage() {
  const [selectedRepo, setSelectedRepo] = useState<string>("")
  const [repos, setRepos] = useState<string[]>([])
  const [currentPath, setCurrentPath] = useState<string[]>([])
  const [isCreateRepoOpen, setIsCreateRepoOpen] = useState(false)
  const [isCreateFileOpen, setIsCreateFileOpen] = useState(false)
  const [isCreateFolderOpen, setIsCreateFolderOpen] = useState(false)
  const [isRenameOpen, setIsRenameOpen] = useState(false)
  const [renameItem, setRenameItem] = useState<{ path: string; name: string; type: "file" | "folder" } | null>(null)
  const [selectedFile, setSelectedFile] = useState<{ name: string; path: string } | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [files, setFiles] = useState<any[]>([])
  const [folders, setFolders] = useState<string[]>([])
  const [fileTree, setFileTree] = useState<FileTreeNode | null>(null)
  const [selectionMode, setSelectionMode] = useState(false)
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set())
  const [isDeleting, setIsDeleting] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const { toast } = useToast()
  const router = useRouter()

  useEffect(() => {
    // Check if user is logged in before fetching repos
    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (user) {
        fetchRepos()
      } else {
        setIsLoading(false)
      }
    })

    return () => unsubscribe()
  }, [])

  useEffect(() => {
    if (selectedRepo) {
      fetchFilesAndFolders()
      fetchFileTree()
    }
  }, [selectedRepo, currentPath])

  const fetchRepos = async () => {
    setIsLoading(true)
    setIsRefreshing(true)

    try {
      // Wait for the current user to be available
      if (!auth.currentUser) {
        console.log("No user logged in")
        setIsLoading(false)
        setIsRefreshing(false)
        return
      }

      // Force refresh the token to ensure it's up-to-date
      const token = await auth.currentUser.getIdToken(true)

      console.log("Fetching repositories...")

      const response = await fetch("/api/codebase/repos", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || `Failed to fetch repositories: ${response.status}`)
      }

      const data = await response.json()
      console.log("Repositories fetched:", data.repos)
      setRepos(data.repos || [])

      // If there are repos and none is selected, select the first one
      if (data.repos?.length > 0 && !selectedRepo) {
        setSelectedRepo(data.repos[0])
      }
    } catch (error) {
      console.error("Error fetching repositories:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to fetch repositories",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
      setIsRefreshing(false)
    }
  }

  const fetchFilesAndFolders = async () => {
    if (!selectedRepo) return

    try {
      // Wait for the current user to be available
      if (!auth.currentUser) {
        toast({
          title: "Authentication Error",
          description: "Please log in to view files",
          variant: "destructive",
        })
        return
      }

      // Force refresh the token to ensure it's up-to-date
      const token = await auth.currentUser.getIdToken(true)

      const pathQuery = currentPath.length > 0 ? `&path=${currentPath.join("/")}` : ""
      const response = await fetch(`/api/codebase/folders?repo=${selectedRepo}${pathQuery}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (!response.ok) {
        throw new Error("Failed to fetch files and folders")
      }

      const data = await response.json()
      setFiles(data.files || [])
      setFolders(data.folders || [])
    } catch (error) {
      console.error("Error fetching files and folders:", error)
      toast({
        title: "Error",
        description: "Failed to fetch files and folders",
        variant: "destructive",
      })
    }
  }

  const fetchFileTree = async () => {
    if (!selectedRepo) return

    try {
      // Wait for the current user to be available
      if (!auth.currentUser) {
        return
      }

      // Force refresh the token to ensure it's up-to-date
      const token = await auth.currentUser.getIdToken(true)

      const response = await fetch(`/api/codebase/tree?repo=${selectedRepo}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (!response.ok) {
        throw new Error("Failed to fetch file tree")
      }

      const data = await response.json()
      setFileTree(data.tree)
    } catch (error) {
      console.error("Error fetching file tree:", error)
      // Don't show a toast for this error as it's not critical
    }
  }

  const handleCreateRepo = async (name: string) => {
    try {
      // Wait for the current user to be available
      if (!auth.currentUser) {
        toast({
          title: "Authentication Error",
          description: "Please log in to create a repository",
          variant: "destructive",
        })
        return
      }

      // Force refresh the token to ensure it's up-to-date
      const token = await auth.currentUser.getIdToken(true)

      console.log("Creating repository:", name)

      const response = await fetch("/api/codebase/repos", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ name }),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || `Failed to create repository: ${response.status}`)
      }

      const data = await response.json()
      setIsCreateRepoOpen(false)
      await fetchRepos()
      setSelectedRepo(data.name)
      toast({
        title: "Success",
        description: `Repository "${data.name}" created successfully`,
      })
    } catch (error) {
      console.error("Error creating repository:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to create repository",
        variant: "destructive",
      })
    }
  }

  const handleCreateFile = async (fileName: string, content: string) => {
    try {
      // Wait for the current user to be available
      if (!auth.currentUser) {
        toast({
          title: "Authentication Error",
          description: "Please log in to create a file",
          variant: "destructive",
        })
        return
      }

      // Force refresh the token to ensure it's up-to-date
      const token = await auth.currentUser.getIdToken(true)

      const response = await fetch("/api/codebase/files", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          repo: selectedRepo,
          path: currentPath,
          fileName,
          content,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || `Failed to create file: ${response.status}`)
      }

      setIsCreateFileOpen(false)

      // Refresh the file explorer
      fetchFilesAndFolders()
      fetchFileTree()

      toast({
        title: "Success",
        description: `File "${fileName}" created successfully`,
      })
    } catch (error) {
      console.error("Error creating file:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to create file",
        variant: "destructive",
      })
    }
  }

  const handleCreateFolder = async (folderName: string) => {
    try {
      // Wait for the current user to be available
      if (!auth.currentUser) {
        toast({
          title: "Authentication Error",
          description: "Please log in to create a folder",
          variant: "destructive",
        })
        return
      }

      // Force refresh the token to ensure it's up-to-date
      const token = await auth.currentUser.getIdToken(true)

      const response = await fetch("/api/codebase/folders", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          repo: selectedRepo,
          path: currentPath,
          folderName,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || `Failed to create folder: ${response.status}`)
      }

      setIsCreateFolderOpen(false)

      // Refresh the file explorer
      fetchFilesAndFolders()
      fetchFileTree()

      toast({
        title: "Success",
        description: `Folder "${folderName}" created successfully`,
      })
    } catch (error) {
      console.error("Error creating folder:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to create folder",
        variant: "destructive",
      })
    }
  }

  const handleDeleteItems = async () => {
    if (selectedItems.size === 0) return

    try {
      setIsDeleting(true)

      // Wait for the current user to be available
      if (!auth.currentUser) {
        toast({
          title: "Authentication Error",
          description: "Please log in to delete items",
          variant: "destructive",
        })
        return
      }

      // Force refresh the token to ensure it's up-to-date
      const token = await auth.currentUser.getIdToken(true)

      const paths = Array.from(selectedItems)

      const response = await fetch("/api/codebase/delete", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ paths }),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || `Failed to delete items: ${response.status}`)
      }

      // Clear selection and exit selection mode
      setSelectedItems(new Set())
      setSelectionMode(false)

      // Refresh the file explorer
      fetchFilesAndFolders()
      fetchFileTree()

      toast({
        title: "Success",
        description: `${paths.length} item${paths.length !== 1 ? "s" : ""} deleted successfully`,
      })
    } catch (error) {
      console.error("Error deleting items:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to delete items",
        variant: "destructive",
      })
    } finally {
      setIsDeleting(false)
    }
  }

  const handleRenameItem = async (newName: string) => {
    if (!renameItem) return

    try {
      // Wait for the current user to be available
      if (!auth.currentUser) {
        toast({
          title: "Authentication Error",
          description: "Please log in to rename items",
          variant: "destructive",
        })
        return
      }

      // Force refresh the token to ensure it's up-to-date
      const token = await auth.currentUser.getIdToken(true)

      const response = await fetch("/api/codebase/rename", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          oldPath: renameItem.path,
          newName,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || `Failed to rename item: ${response.status}`)
      }

      setIsRenameOpen(false)
      setRenameItem(null)

      // Refresh the file explorer
      fetchFilesAndFolders()
      fetchFileTree()

      toast({
        title: "Success",
        description: `${renameItem.type === "file" ? "File" : "Folder"} renamed successfully`,
      })
    } catch (error) {
      console.error("Error renaming item:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to rename item",
        variant: "destructive",
      })
    }
  }

  const handleSelectRepo = (repo: string) => {
    setSelectedRepo(repo)
    setCurrentPath([])
    setSelectedFile(null)
    setSelectionMode(false)
    setSelectedItems(new Set())
  }

  const handleNavigate = (path: string[]) => {
    setCurrentPath(path)
    setSelectedFile(null)
  }

  const handleNavigateUp = () => {
    if (currentPath.length > 0) {
      setCurrentPath(currentPath.slice(0, -1))
      setSelectedFile(null)
    }
  }

  const handleSelectFile = (fileName: string, filePath: string) => {
    setSelectedFile({ name: fileName, path: filePath })
  }

  const handleToggleSelect = (path: string, selected: boolean) => {
    setSelectedItems((prev) => {
      const newSet = new Set(prev)
      if (selected) {
        newSet.add(path)
      } else {
        newSet.delete(path)
      }
      return newSet
    })
  }

  const handleDeleteNode = (node: FileTreeNode) => {
    const path =
      node.type === "file"
        ? (node.path as string)
        : Array.isArray(node.path)
          ? `users/${auth.currentUser?.uid}/${selectedRepo}/${[...node.path, node.name].join("/")}`
          : (node.path as string)

    setSelectedItems(new Set([path]))
    handleDeleteItems()
  }

  const handleRenameNode = (node: FileTreeNode) => {
    const path =
      node.type === "file"
        ? (node.path as string)
        : Array.isArray(node.path)
          ? `users/${auth.currentUser?.uid}/${selectedRepo}/${[...node.path, node.name].join("/")}`
          : (node.path as string)

    setRenameItem({
      path,
      name: node.name,
      type: node.type,
    })
    setIsRenameOpen(true)
  }

  // If no repositories, show the empty state
  if (!isLoading && repos.length === 0) {
    return (
      <ProtectedRoute>
        <div className="container mx-auto py-8 px-4 max-w-7xl">
          <div className="flex flex-col space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <Code className="h-8 w-8 text-primary" />
                <h1 className="text-3xl font-bold">Codebase</h1>
              </div>
              <Button onClick={() => setIsCreateRepoOpen(true)} className="gap-2">
                <Plus className="h-4 w-4" />
                New Repository
              </Button>
            </div>

            <Card className="flex items-center justify-center h-[500px]">
              <div className="text-center p-6">
                <Github className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h2 className="text-xl font-semibold mb-2">No Repositories Found</h2>
                <p className="text-muted-foreground mb-6">Create your first repository to get started with GitFriend</p>
                <Button onClick={() => setIsCreateRepoOpen(true)} className="gap-2">
                  <Plus className="h-4 w-4" />
                  Create Repository
                </Button>
              </div>
            </Card>
          </div>

          <CreateRepoDialog
            isOpen={isCreateRepoOpen}
            onClose={() => setIsCreateRepoOpen(false)}
            onCreateRepo={handleCreateRepo}
          />
        </div>
      </ProtectedRoute>
    )
  }

  return (
    <ProtectedRoute>
      <NavbarDemo />
      <div className="container mx-auto py-8 px-4 max-w-7xl mt-20">
        <div className="flex flex-col space-y-6">
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <Code className="h-8 w-8 text-primary" />
              <h1 className="text-3xl font-bold">Codebase</h1>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" onClick={fetchRepos} disabled={isRefreshing} className="gap-2">
                {isRefreshing ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
                Refresh
              </Button>
              <Button onClick={() => setIsCreateRepoOpen(true)} className="gap-2">
                <Plus className="h-4 w-4" />
                New Repository
              </Button>
            </div>
          </div>

          {/* Repository Selector */}
          {isLoading ? (
            <div className="flex items-center gap-2">
              <Skeleton className="h-10 w-40" />
              <Skeleton className="h-10 w-10" />
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="gap-2 w-64 justify-between">
                    <div className="flex items-center gap-2">
                      <GitBranch className="h-4 w-4" />
                      <span className="truncate">{selectedRepo || "Select Repository"}</span>
                    </div>
                    <ChevronDown className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-64">
                  {repos.map((repo) => (
                    <DropdownMenuItem key={repo} onClick={() => handleSelectRepo(repo)}>
                      <GitBranch className="h-4 w-4 mr-2" />
                      {repo}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
              <div className="flex-1 max-w-md">
                <div className="relative">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="search"
                    placeholder="Search files..."
                    className="pl-9"
                    disabled={!selectedRepo}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Selection Mode Controls */}
          {selectionMode && (
            <Alert className="bg-primary/5 border-primary/20">
              <div className="flex items-center justify-between">
                <AlertDescription className="flex items-center">
                  <span className="mr-2">
                    {selectedItems.size} item{selectedItems.size !== 1 ? "s" : ""} selected
                  </span>
                </AlertDescription>
                <div className="flex items-center gap-2">
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={handleDeleteItems}
                    disabled={selectedItems.size === 0 || isDeleting}
                    className="gap-2"
                  >
                    {isDeleting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                    Delete
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setSelectionMode(false)
                      setSelectedItems(new Set())
                    }}
                    className="gap-2"
                  >
                    <X className="h-4 w-4" />
                    Cancel
                  </Button>
                </div>
              </div>
            </Alert>
          )}

          {/* Main Content */}
          {isLoading ? (
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
              <div className="lg:col-span-1">
                <div className="border rounded-md overflow-hidden">
                  <div className="bg-muted/30 p-3 border-b">
                    <Skeleton className="h-5 w-20" />
                  </div>
                  <div className="p-2 h-[600px]">
                    <div className="space-y-2">
                      <Skeleton className="h-6 w-full" />
                      <Skeleton className="h-6 w-full" />
                      <Skeleton className="h-6 w-full" />
                      <Skeleton className="h-6 w-3/4" />
                      <Skeleton className="h-6 w-5/6" />
                    </div>
                  </div>
                </div>
              </div>
              <div className="lg:col-span-3">
                <div className="border rounded-md overflow-hidden">
                  <div className="bg-muted/30 p-3 border-b flex items-center justify-between">
                    <Skeleton className="h-5 w-40" />
                    <div className="flex items-center gap-2">
                      <Skeleton className="h-8 w-24" />
                      <Skeleton className="h-8 w-24" />
                    </div>
                  </div>
                  <div className="h-[600px] p-4">
                    <div className="space-y-3">
                      <Skeleton className="h-10 w-full" />
                      <Skeleton className="h-10 w-full" />
                      <Skeleton className="h-10 w-full" />
                      <Skeleton className="h-10 w-full" />
                      <Skeleton className="h-10 w-full" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : selectedRepo ? (
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
              {/* File Tree */}
              <div className="lg:col-span-1 border rounded-md overflow-hidden">
                <div className="bg-muted/30 p-3 border-b flex items-center justify-between">
                  <h3 className="font-medium text-sm">Files</h3>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 px-2 text-xs"
                    onClick={() => {
                      setSelectionMode(!selectionMode)
                      setSelectedItems(new Set())
                    }}
                  >
                    {selectionMode ? (
                      <span className="flex items-center gap-1">
                        <X className="h-3.5 w-3.5" />
                        Cancel
                      </span>
                    ) : (
                      <span className="flex items-center gap-1">
                        <Check className="h-3.5 w-3.5" />
                        Select
                      </span>
                    )}
                  </Button>
                </div>
                <div className="p-2 h-[600px] overflow-auto">
                  {fileTree ? (
                    <FileTree
                      data={fileTree}
                      onSelectFile={handleSelectFile}
                      onNavigateFolder={handleNavigate}
                      currentPath={currentPath}
                      onCreateFile={(path) => {
                        setCurrentPath(path)
                        setIsCreateFileOpen(true)
                      }}
                      onCreateFolder={(path) => {
                        setCurrentPath(path)
                        setIsCreateFolderOpen(true)
                      }}
                      onDelete={handleDeleteNode}
                      onRename={handleRenameNode}
                      selectionMode={selectionMode}
                      selectedItems={selectedItems}
                      onToggleSelect={handleToggleSelect}
                    />
                  ) : (
                    <div className="flex items-center justify-center h-full">
                      <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                    </div>
                  )}
                </div>
              </div>

              {/* Content Area */}
              <div className="lg:col-span-3">
                <div className="border rounded-md overflow-hidden">
                  {/* Breadcrumb and Actions */}
                  <div className="bg-muted/30 p-3 border-b flex items-center justify-between">
                    <Breadcrumb repo={selectedRepo} path={currentPath} onNavigate={handleNavigate} />
                    <div className="flex items-center gap-2">
                      <Button variant="outline" size="sm" onClick={() => setIsCreateFolderOpen(true)} className="gap-2">
                        <FolderPlus className="h-4 w-4" />
                        New Folder
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => setIsCreateFileOpen(true)} className="gap-2">
                        <FilePlus className="h-4 w-4" />
                        New File
                      </Button>
                    </div>
                  </div>

                  {/* File Explorer or File Viewer */}
                  <div className="h-[600px] overflow-auto">
                    {selectedFile ? (
                      <FileViewer
                        repo={selectedRepo}
                        filePath={selectedFile.path}
                        fileName={selectedFile.name}
                        onClose={() => setSelectedFile(null)}
                      />
                    ) : (
                      <FileExplorerTable
                        files={files}
                        folders={folders}
                        onNavigateUp={handleNavigateUp}
                        onNavigateFolder={(folder) => handleNavigate([...currentPath, folder])}
                        onSelectFile={handleSelectFile}
                        currentPath={currentPath}
                        onCreateFile={() => setIsCreateFileOpen(true)}
                        onCreateFolder={() => setIsCreateFolderOpen(true)}
                        onDeleteFile={(path) => {
                          setSelectedItems(new Set([path]))
                          handleDeleteItems()
                        }}
                        onDeleteFolder={(folderName) => {
                          const path = `users/${auth.currentUser?.uid}/${selectedRepo}/${[...currentPath, folderName].join("/")}`
                          setSelectedItems(new Set([path]))
                          handleDeleteItems()
                        }}
                        onRenameFile={(path, name) => {
                          setRenameItem({ path, name, type: "file" })
                          setIsRenameOpen(true)
                        }}
                        onRenameFolder={(folderName) => {
                          const path = `users/${auth.currentUser?.uid}/${selectedRepo}/${[...currentPath, folderName].join("/")}`
                          setRenameItem({ path, name: folderName, type: "folder" })
                          setIsRenameOpen(true)
                        }}
                        selectionMode={selectionMode}
                        selectedItems={selectedItems}
                        onToggleSelect={handleToggleSelect}
                      />
                    )}
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center h-[600px]">
              <div className="text-center">
                <Github className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h2 className="text-xl font-semibold mb-2">Select a Repository</h2>
                <p className="text-muted-foreground mb-4">Choose a repository from the dropdown above</p>
              </div>
            </div>
          )}
        </div>

        <CreateRepoDialog
          isOpen={isCreateRepoOpen}
          onClose={() => setIsCreateRepoOpen(false)}
          onCreateRepo={handleCreateRepo}
        />

        <CreateFileDialog
          isOpen={isCreateFileOpen}
          onClose={() => setIsCreateFileOpen(false)}
          onCreateFile={handleCreateFile}
        />

        <CreateFolderDialog
          isOpen={isCreateFolderOpen}
          onClose={() => setIsCreateFolderOpen(false)}
          onCreateFolder={handleCreateFolder}
        />

        <RenameDialog
          isOpen={isRenameOpen}
          onClose={() => {
            setIsRenameOpen(false)
            setRenameItem(null)
          }}
          onRename={handleRenameItem}
          currentName={renameItem?.name || ""}
          type={renameItem?.type || "file"}
        />
      </div>
    </ProtectedRoute>
  )
}
