import { type NextRequest, NextResponse } from "next/server"
import { getAuth } from "@/lib/auth-utils"
import { getBucket } from "@/lib/gcs-utils"

export async function GET(req: NextRequest) {
  try {
    // Get the current user
    const user = await getAuth(req)

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const userId = user.uid
    const bucket = getBucket()

    // Get query parameters
    const searchParams = req.nextUrl.searchParams
    const repo = searchParams.get("repo")
    const path = searchParams.get("path")

    if (!repo || !path) {
      return NextResponse.json({ error: "Repository and path are required" }, { status: 400 })
    }

    // Get the file from GCS
    const file = bucket.file(`users/${userId}/${repo}/${path}`)

    // Check if the file exists
    const [exists] = await file.exists()

    if (!exists) {
      return NextResponse.json({ error: "File not found" }, { status: 404 })
    }

    // Download the file content
    const [content] = await file.download()

    return NextResponse.json({ content: content.toString() })
  } catch (error) {
    console.error("Error fetching file content:", error)
    return NextResponse.json({ error: "Failed to fetch file content" }, { status: 500 })
  }
}

export async function PUT(req: NextRequest) {
  try {
    // Get the current user
    const user = await getAuth(req)

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const userId = user.uid
    const bucket = getBucket()

    // Get the file details from the request body
    const { repo, path, content } = await req.json()

    if (!repo || !path) {
      return NextResponse.json({ error: "Repository and path are required" }, { status: 400 })
    }

    // Get the file from GCS
    const file = bucket.file(`users/${userId}/${repo}/${path}`)

    // Check if the file exists
    const [exists] = await file.exists()

    if (!exists) {
      return NextResponse.json({ error: "File not found" }, { status: 404 })
    }

    // Save the updated file content
    await file.save(content || "", {
      contentType: "text/plain",
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error updating file content:", error)
    return NextResponse.json({ error: "Failed to update file content" }, { status: 500 })
  }
}
