"use client"

import { useState, useEffect } from "react"
import { Save, X, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/hooks/use-toast"
import { auth } from "@/lib/firebase"

interface FileViewerProps {
  repo: string
  filePath: string
  fileName: string
  onClose?: () => void
}

export function FileViewer({ repo, filePath, fileName, onClose }: FileViewerProps) {
  const [content, setContent] = useState<string>("")
  const [originalContent, setOriginalContent] = useState<string>("")
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    if (filePath) {
      fetchFileContent()
    }
  }, [filePath])

  const fetchFileContent = async () => {
    setIsLoading(true)
    try {
      const token = await auth.currentUser?.getIdToken()

      if (!token) {
        console.error("No auth token available")
        return
      }

      const response = await fetch(`/api/codebase/files?path=${encodeURIComponent(filePath)}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (!response.ok) {
        throw new Error("Failed to fetch file content")
      }

      const data = await response.json()
      setContent(data.content)
      setOriginalContent(data.content)
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
    setIsSaving(true)
    try {
      const token = await auth.currentUser?.getIdToken()

      if (!token) {
        console.error("No auth token available")
        return
      }

      const response = await fetch("/api/codebase/files", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          path: filePath,
          content,
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to update file content")
      }

      setOriginalContent(content)
      toast({
        title: "Success",
        description: "File saved successfully",
      })
    } catch (error) {
      console.error("Error updating file content:", error)
      toast({
        title: "Error",
        description: "Failed to save file",
        variant: "destructive",
      })
    } finally {
      setIsSaving(false)
    }
  }

  const hasChanges = content !== originalContent

  return (
    <div className="flex flex-col h-full">
      <div className="bg-muted/30 p-3 border-b flex items-center justify-between">
        <div className="font-medium">{fileName}</div>
        <div className="flex items-center gap-2">
          {hasChanges && (
            <Button variant="outline" size="sm" onClick={handleSave} disabled={isSaving} className="gap-2">
              {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              Save
            </Button>
          )}
          {onClose && (
            <Button variant="ghost" size="sm" onClick={onClose} className="gap-2">
              <X className="h-4 w-4" />
              Close
            </Button>
          )}
        </div>
      </div>
      {isLoading ? (
        <div className="flex items-center justify-center h-full p-6">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <Textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          className="flex-1 rounded-none border-0 resize-none font-mono text-sm h-full"
          placeholder="File content..."
        />
      )}
    </div>
  )
}
