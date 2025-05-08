import { type NextRequest, NextResponse } from "next/server"
import { getAuth } from "@/lib/auth-utils"
import { deleteFileOrFolder } from "@/lib/gcs-utils"

// PUT - Rename or edit repository
export async function PUT(request: NextRequest) {
  try {
    // Verify authentication
    const user = await getAuth(request)
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { oldName, newName, description } = await request.json()

    if (!oldName || !newName) {
      return NextResponse.json({ error: "Repository names are required" }, { status: 400 })
    }

    if (!/^[a-zA-Z0-9-_]+$/.test(newName)) {
      return NextResponse.json(
        { error: "Repository name can only contain letters, numbers, hyphens, and underscores" },
        { status: 400 },
      )
    }

    // If only updating description, no need to rename files
    if (oldName === newName) {
      // Store description in a metadata file
      if (description !== undefined) {
        const metadataPath = `users/${user.uid}/${newName}/.metadata.json`
        const metadataContent = JSON.stringify({ description })

        // Create a file with the metadata content
        await fetch("/api/codebase/files", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${await user.getIdToken()}`,
          },
          body: JSON.stringify({
            repo: newName,
            path: [],
            fileName: ".metadata.json",
            content: metadataContent,
          }),
        })
      }

      return NextResponse.json({ success: true, name: newName })
    }

    // Rename repository by copying all files to new location
    // First, get all files in the repository
    const filesResponse = await fetch(`/api/codebase/tree?repo=${oldName}`, {
      headers: {
        Authorization: `Bearer ${await user.getIdToken()}`,
      },
    })

    if (!filesResponse.ok) {
      return NextResponse.json({ error: "Failed to get repository files" }, { status: 500 })
    }

    const filesData = await filesResponse.json()
    const tree = filesData.tree

    // Create the new repository
    await fetch("/api/codebase/repos", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${await user.getIdToken()}`,
      },
      body: JSON.stringify({ name: newName }),
    })

    // Copy all files to the new repository
    // This is a simplified approach - in a real app, you'd need to handle this more efficiently
    const copyFiles = async (node: any, currentPath: string[] = []) => {
      if (node.type === "file") {
        // Get file content
        const contentResponse = await fetch(`/api/codebase/file-content?path=${node.path}`, {
          headers: {
            Authorization: `Bearer ${await user.getIdToken()}`,
          },
        })

        if (contentResponse.ok) {
          const content = await contentResponse.text()

          // Create file in new repository
          await fetch("/api/codebase/files", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${await user.getIdToken()}`,
            },
            body: JSON.stringify({
              repo: newName,
              path: currentPath,
              fileName: node.name,
              content,
            }),
          })
        }
      } else if (node.children) {
        // Process folders and their children
        for (const child of node.children) {
          if (child.type === "folder") {
            // Create folder in new repository
            await fetch("/api/codebase/folders", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${await user.getIdToken()}`,
              },
              body: JSON.stringify({
                repo: newName,
                path: currentPath,
                folderName: child.name,
              }),
            })

            // Process children of this folder
            await copyFiles(child, [...currentPath, child.name])
          } else {
            // Process files directly in this folder
            await copyFiles(child, currentPath)
          }
        }
      }
    }

    // Start copying files
    await copyFiles(tree)

    // Store description in a metadata file if provided
    if (description !== undefined) {
      const metadataContent = JSON.stringify({ description })

      await fetch("/api/codebase/files", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${await user.getIdToken()}`,
        },
        body: JSON.stringify({
          repo: newName,
          path: [],
          fileName: ".metadata.json",
          content: metadataContent,
        }),
      })
    }

    // Delete the old repository
    const basePath = `users/${user.uid}/${oldName}`
    await deleteFileOrFolder(basePath)

    return NextResponse.json({ success: true, name: newName })
  } catch (error) {
    console.error("Error updating repository:", error)
    return NextResponse.json({ error: "Failed to update repository" }, { status: 500 })
  }
}

// GET - Get repository metadata
export async function GET(request: NextRequest) {
  try {
    // Verify authentication
    const user = await getAuth(request)
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const repoName = searchParams.get("name")

    if (!repoName) {
      return NextResponse.json({ error: "Repository name is required" }, { status: 400 })
    }

    // Try to get the metadata file
    try {
      const metadataPath = `users/${user.uid}/${repoName}/.metadata.json`

      const contentResponse = await fetch(`/api/codebase/file-content?path=${metadataPath}`, {
        headers: {
          Authorization: `Bearer ${await user.getIdToken()}`,
        },
      })

      if (contentResponse.ok) {
        const content = await contentResponse.text()
        const metadata = JSON.parse(content)
        return NextResponse.json({ ...metadata, name: repoName })
      } else {
        // Return default metadata if file doesn't exist
        return NextResponse.json({ name: repoName, description: `Repository for ${repoName} project` })
      }
    } catch (error) {
      // Return default metadata if there's an error
      return NextResponse.json({ name: repoName, description: `Repository for ${repoName} project` })
    }
  } catch (error) {
    console.error("Error getting repository metadata:", error)
    return NextResponse.json({ error: "Failed to get repository metadata" }, { status: 500 })
  }
}
