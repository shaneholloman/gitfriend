import { type NextRequest, NextResponse } from "next/server"
import { getAuth } from "@/lib/auth-utils"
import { getBucket } from "@/lib/gcs-utils"

export async function POST(req: NextRequest) {
  try {
    // Get the current user
    const user = await getAuth(req)

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const userId = user.uid
    const bucket = getBucket()

    // Parse the form data
    const formData = await req.formData()
    const file = formData.get("file") as File
    const repo = formData.get("repo") as string
    const path = formData.get("path") as string

    if (!file || !repo) {
      return NextResponse.json({ error: "File and repository are required" }, { status: 400 })
    }

    // Get the file content as an ArrayBuffer
    const fileBuffer = await file.arrayBuffer()

    // Create the file path
    const filePath = path ? `${path}/${file.name}` : file.name

    // Create the file in GCS
    const gcsFile = bucket.file(`users/${userId}/${repo}/${filePath}`)

    // Check if the file already exists
    const [exists] = await gcsFile.exists()

    if (exists) {
      return NextResponse.json({ error: "File already exists" }, { status: 409 })
    }

    // Save the file content
    await gcsFile.save(Buffer.from(fileBuffer), {
      contentType: file.type || "application/octet-stream",
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error uploading file:", error)
    return NextResponse.json({ error: "Failed to upload file" }, { status: 500 })
  }
}
