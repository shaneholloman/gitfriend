import { type NextRequest, NextResponse } from "next/server"
import { getAuth } from "@/lib/auth-utils"
import { createFolder, listFilesAndFolders } from "@/lib/gcs-utils"

export async function GET(req: NextRequest) {
  try {
    console.log("GET /api/codebase/folders - Authenticating request...")

    // Get the current user
    const user = await getAuth(req)

    if (!user) {
      console.log("GET /api/codebase/folders - Authentication failed")
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    console.log(`GET /api/codebase/folders - Authenticated as user ${user.uid}`)

    // Get the repository and path from the query parameters
    const url = new URL(req.url)
    const repo = url.searchParams.get("repo")
    const pathParam = url.searchParams.get("path")

    if (!repo) {
      return NextResponse.json({ error: "Repository name is required" }, { status: 400 })
    }

    // Parse the path parameter
    const path = pathParam ? pathParam.split("/").filter(Boolean) : []

    console.log(`GET /api/codebase/folders - Listing files and folders for repo "${repo}" at path "${pathParam || ""}"`)

    // List files and folders
    const result = await listFilesAndFolders(user.uid, repo, path)

    console.log(`GET /api/codebase/folders - Found ${result.files.length} files and ${result.folders.length} folders`)

    return NextResponse.json(result)
  } catch (error) {
    console.error("Error in GET /api/codebase/folders:", error)
    return NextResponse.json({ error: "Failed to list files and folders" }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    console.log("POST /api/codebase/folders - Authenticating request...")

    // Get the current user
    const user = await getAuth(req)

    if (!user) {
      console.log("POST /api/codebase/folders - Authentication failed")
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    console.log(`POST /api/codebase/folders - Authenticated as user ${user.uid}`)

    // Get the request body
    const { repo, path, folderName } = await req.json()

    if (!repo || !folderName) {
      return NextResponse.json({ error: "Repository name and folder name are required" }, { status: 400 })
    }

    console.log(
      `POST /api/codebase/folders - Creating folder "${folderName}" in repo "${repo}" at path "${path || ""}"`,
    )

    // Create the folder
    await createFolder(user.uid, repo, Array.isArray(path) ? path : [], folderName)

    console.log(`POST /api/codebase/folders - Folder "${folderName}" created successfully`)

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error("Error in POST /api/codebase/folders:", error)

    if (error.message === "Folder already exists") {
      return NextResponse.json({ error: "Folder already exists" }, { status: 409 })
    }

    return NextResponse.json({ error: "Failed to create folder" }, { status: 500 })
  }
}
