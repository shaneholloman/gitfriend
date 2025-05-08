"use client"

import { useState, useEffect } from "react"
import { Save, X, Edit } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/hooks/use-toast"
import { auth } from "@/lib/firebase"
import { getFileExtension, getLanguageFromExtension } from "@/lib/file-utils"

interface FilePreviewProps {
  repo: string
  fileName: string
  filePath: string
  onClose: () => void
}

export function FilePreview({ repo, fileName, filePath, onClose }: FilePreviewProps) {
  const [content, setContent] = useState<string>("")
  const [isLoading, setIsLoading] = useState(true)
  const [isEditing, setIsEditing] = useState(false)
  const [editedContent, setEditedContent] = useState<string>("")
  const { toast } = useToast()

  useEffect(() => {
    fetchFileContent()
  }, [repo, filePath])

  const fetchFileContent = async () => {
    try {
      setIsLoading(true)
      const token = await auth.currentUser?.getIdToken()

      if (!token) {
        console.error("No auth token available")
        toast({
          title: "Error",
          description: "Authentication required",
          variant: "destructive",
        })
        setIsLoading(false)
        return
      }

      const response = await fetch(`/api/codebase/content?repo=${repo}&path=${filePath}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (!response.ok) {
        throw new Error("Failed to fetch file content")
      }

      const data = await response.json()
      setContent(data.content)
      setEditedContent(data.content)
    } catch (error) {
      console.error("Error fetching file content:", error)
      toast({
        title: "Error",
        description: "Failed to fetch file content",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleSave = async () => {
    try {
      const token = await auth.currentUser?.getIdToken()

      if (!token) {
        console.error("No auth token available")
        toast({
          title: "Error",
          description: "Authentication required",
          variant: "destructive",
        })
        return
      }

      const response = await fetch("/api/codebase/content", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          repo,
          path: filePath,
          content: editedContent,
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to save file content")
      }

      setContent(editedContent)
      setIsEditing(false)

      toast({
        title: "Success",
        description: "File saved successfully",
      })
    } catch (error) {
      console.error("Error saving file content:", error)
      toast({
        title: "Error",
        description: "Failed to save file content",
        variant: "destructive",
      })
    }
  }

  const handleCancelEdit = () => {
    setEditedContent(content)
    setIsEditing(false)
  }

  const fileExtension = getFileExtension(fileName)
  const language = getLanguageFromExtension(fileExtension)

  return (
    <div className="border rounded-lg overflow-hidden bg-card h-full flex flex-col">
      <div className="flex items-center justify-between p-4 border-b">
        <div className="flex items-center">
          <h2 className="font-semibold">{fileName}</h2>
          {language && (
            <span className="ml-2 px-2 py-1 text-xs rounded-full bg-muted text-muted-foreground">{language}</span>
          )}
        </div>
        <div className="flex items-center space-x-2">
          {isEditing ? (
            <>
              <Button variant="outline" size="sm" onClick={handleCancelEdit}>
                <X className="h-4 w-4 mr-2" />
                Cancel
              </Button>
              <Button variant="default" size="sm" onClick={handleSave}>
                <Save className="h-4 w-4 mr-2" />
                Save
              </Button>
            </>
          ) : (
            <>
              <Button variant="outline" size="sm" onClick={() => setIsEditing(true)}>
                <Edit className="h-4 w-4 mr-2" />
                Edit
              </Button>
              <Button variant="ghost" size="sm" onClick={onClose}>
                <X className="h-4 w-4" />
              </Button>
            </>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-auto">
        {isLoading ? (
          <div className="p-4 space-y-2">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-1/2" />
          </div>
        ) : isEditing ? (
          <Textarea
            value={editedContent}
            onChange={(e) => setEditedContent(e.target.value)}
            className="font-mono text-sm h-full min-h-[500px] rounded-none border-0 resize-none focus-visible:ring-0"
          />
        ) : (
          <pre className="p-4 overflow-auto font-mono text-sm whitespace-pre-wrap">{content}</pre>
        )}
      </div>
    </div>
  )
}
