import { type NextRequest, NextResponse } from "next/server"
import { getAuth } from "@/lib/auth-utils"
import { deleteFileOrFolder } from "@/lib/gcs-utils"

export async function POST(req: NextRequest) {
  try {
    console.log("POST /api/codebase/delete - Authenticating request...")

    // Get the current user
    const user = await getAuth(req)

    if (!user) {
      console.log("POST /api/codebase/delete - Authentication failed")
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    console.log(`POST /api/codebase/delete - Authenticated as user ${user.uid}`)

    // Get the request body
    const { paths } = await req.json()

    if (!paths || !Array.isArray(paths) || paths.length === 0) {
      return NextResponse.json({ error: "Paths are required" }, { status: 400 })
    }

    // Ensure the user can only delete their own files
    for (const path of paths) {
      if (!path.startsWith(`users/${user.uid}/`)) {
        return NextResponse.json({ error: "Access denied" }, { status: 403 })
      }
    }

    console.log(`POST /api/codebase/delete - Deleting ${paths.length} items`)

    // Delete the files/folders
    await Promise.all(paths.map((path) => deleteFileOrFolder(path)))

    console.log(`POST /api/codebase/delete - Items deleted successfully`)

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error("Error in POST /api/codebase/delete:", error)
    return NextResponse.json({ error: "Failed to delete items" }, { status: 500 })
  }
}
