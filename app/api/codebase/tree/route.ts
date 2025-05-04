import { type NextRequest, NextResponse } from "next/server"
import { getAuth } from "@/lib/auth-utils"
import { getRepoFileTreeApi } from "@/lib/gcs-utils"

export async function GET(req: NextRequest) {
  try {
    console.log("GET /api/codebase/tree - Authenticating request...")

    // Get the current user
    const user = await getAuth(req)

    if (!user) {
      console.log("GET /api/codebase/tree - Authentication failed")
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    console.log(`GET /api/codebase/tree - Authenticated as user ${user.uid}`)

    // Get the repository from the query parameters
    const url = new URL(req.url)
    const repo = url.searchParams.get("repo")

    if (!repo) {
      return NextResponse.json({ error: "Repository name is required" }, { status: 400 })
    }

    console.log(`GET /api/codebase/tree - Getting file tree for repo "${repo}"`)

    // Get the file tree
    const result = await getRepoFileTreeApi(user.uid, repo)

    console.log(`GET /api/codebase/tree - File tree retrieved successfully`)

    return NextResponse.json(result)
  } catch (error) {
    console.error("Error in GET /api/codebase/tree:", error)
    return NextResponse.json({ error: "Failed to get file tree" }, { status: 500 })
  }
}
