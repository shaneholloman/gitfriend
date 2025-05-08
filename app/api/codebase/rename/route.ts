import { type NextRequest, NextResponse } from "next/server"
import { getAuth } from "@/lib/auth-utils"
import { renameFileOrFolder } from "@/lib/gcs-utils"

export async function POST(req: NextRequest) {
  try {
    console.log("POST /api/codebase/rename - Authenticating request...")

    // Get the current user
    const user = await getAuth(req)

    if (!user) {
      console.log("POST /api/codebase/rename - Authentication failed")
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    console.log(`POST /api/codebase/rename - Authenticated as user ${user.uid}`)

    // Get the request body
    const { oldPath, newName } = await req.json()

    if (!oldPath || !newName) {
      return NextResponse.json({ error: "Path and new name are required" }, { status: 400 })
    }

    // Ensure the user can only rename their own files
    if (!oldPath.startsWith(`users/${user.uid}/`)) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 })
    }

    console.log(`POST /api/codebase/rename - Renaming ${oldPath} to ${newName}`)

    // Rename the file/folder
    await renameFileOrFolder(oldPath, newName)

    console.log(`POST /api/codebase/rename - Item renamed successfully`)

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error("Error in POST /api/codebase/rename:", error)
    return NextResponse.json({ error: "Failed to rename item" }, { status: 500 })
  }
}
