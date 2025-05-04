import { type NextRequest, NextResponse } from "next/server"
import { getAuth } from "@/lib/auth-utils"
import { createFile, getFileContent, updateFileContent } from "@/lib/gcs-utils"

export async function GET(req: NextRequest) {
  try {
    console.log("GET /api/codebase/files - Authenticating request...")

    // Get the current user
    const user = await getAuth(req)

    if (!user) {
      console.log("GET /api/codebase/files - Authentication failed")
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    console.log(`GET /api/codebase/files - Authenticated as user ${user.uid}`)

    // Get the file path from the query parameters
    const url = new URL(req.url)
    const filePath = url.searchParams.get("path")

    if (!filePath) {
      return NextResponse.json({ error: "File path is required" }, { status: 400 })
    }

    // Ensure the user can only access their own files
    if (!filePath.startsWith(`users/${user.uid}/`)) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 })
    }

    console.log(`GET /api/codebase/files - Getting content for file at path "${filePath}"`)

    // Get the file content
    const content = await getFileContent(filePath)

    console.log(`GET /api/codebase/files - File content retrieved successfully`)

    return NextResponse.json({ content })
  } catch (error: any) {
    console.error("Error in GET /api/codebase/files:", error)

    if (error.message === "File not found") {
      return NextResponse.json({ error: "File not found" }, { status: 404 })
    }

    return NextResponse.json({ error: "Failed to get file content" }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    console.log("POST /api/codebase/files - Authenticating request...")

    // Get the current user
    const user = await getAuth(req)

    if (!user) {
      console.log("POST /api/codebase/files - Authentication failed")
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    console.log(`POST /api/codebase/files - Authenticated as user ${user.uid}`)

    // Get the request body
    const { repo, path, fileName, content } = await req.json()

    if (!repo || !fileName) {
      return NextResponse.json({ error: "Repository name and file name are required" }, { status: 400 })
    }

    console.log(`POST /api/codebase/files - Creating file "${fileName}" in repo "${repo}" at path "${path || ""}"`)

    // Create the file
    await createFile(user.uid, repo, Array.isArray(path) ? path : [], fileName, content || "")

    console.log(`POST /api/codebase/files - File "${fileName}" created successfully`)

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error("Error in POST /api/codebase/files:", error)

    if (error.message === "File already exists") {
      return NextResponse.json({ error: "File already exists" }, { status: 409 })
    }

    return NextResponse.json({ error: "Failed to create file" }, { status: 500 })
  }
}

export async function PUT(req: NextRequest) {
  try {
    console.log("PUT /api/codebase/files - Authenticating request...")

    // Get the current user
    const user = await getAuth(req)

    if (!user) {
      console.log("PUT /api/codebase/files - Authentication failed")
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    console.log(`PUT /api/codebase/files - Authenticated as user ${user.uid}`)

    // Get the request body
    const { path, content } = await req.json()

    if (!path) {
      return NextResponse.json({ error: "File path is required" }, { status: 400 })
    }

    // Ensure the user can only access their own files
    if (!path.startsWith(`users/${user.uid}/`)) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 })
    }

    console.log(`PUT /api/codebase/files - Updating content for file at path "${path}"`)

    // Update the file content
    await updateFileContent(path, content || "")

    console.log(`PUT /api/codebase/files - File content updated successfully`)

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error("Error in PUT /api/codebase/files:", error)

    if (error.message === "File not found") {
      return NextResponse.json({ error: "File not found" }, { status: 404 })
    }

    return NextResponse.json({ error: "Failed to update file" }, { status: 500 })
  }
}
