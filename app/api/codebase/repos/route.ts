import { type NextRequest, NextResponse } from "next/server"
import { getAuth } from "@/lib/auth-utils"
import { listUserRepos, createRepo } from "@/lib/gcs-utils"

export async function GET(req: NextRequest) {
  try {
    console.log("GET /api/codebase/repos - Authenticating request...")

    // Get the current user
    const user = await getAuth(req)

    if (!user) {
      console.log("GET /api/codebase/repos - Authentication failed")
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    console.log(`GET /api/codebase/repos - Authenticated as user ${user.uid}`)

    // List repositories for the user
    const repos = await listUserRepos(user.uid)
    console.log(`GET /api/codebase/repos - Found ${repos.length} repositories`)

    return NextResponse.json({ repos })
  } catch (error) {
    console.error("Error in GET /api/codebase/repos:", error)
    return NextResponse.json({ error: "Failed to fetch repositories" }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    console.log("POST /api/codebase/repos - Authenticating request...")

    // Get the current user
    const user = await getAuth(req)

    if (!user) {
      console.log("POST /api/codebase/repos - Authentication failed")
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    console.log(`POST /api/codebase/repos - Authenticated as user ${user.uid}`)

    // Get the repo name from the request body
    const { name } = await req.json()

    if (!name || typeof name !== "string") {
      return NextResponse.json({ error: "Repository name is required" }, { status: 400 })
    }

    // Validate repo name (alphanumeric, hyphens, and underscores only)
    if (!/^[a-zA-Z0-9-_]+$/.test(name)) {
      return NextResponse.json(
        {
          error: "Repository name can only contain letters, numbers, hyphens, and underscores",
        },
        { status: 400 },
      )
    }

    console.log(`POST /api/codebase/repos - Creating repository "${name}" for user ${user.uid}`)

    // Create the repository
    const result = await createRepo(user.uid, name)

    console.log(`POST /api/codebase/repos - Repository "${name}" created successfully`)

    return NextResponse.json(result)
  } catch (error: any) {
    console.error("Error in POST /api/codebase/repos:", error)

    // Check for specific errors
    if (error.message === "Repository already exists") {
      return NextResponse.json({ error: "Repository already exists" }, { status: 409 })
    }

    return NextResponse.json({ error: "Failed to create repository" }, { status: 500 })
  }
}
