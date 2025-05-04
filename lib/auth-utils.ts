import type { NextRequest } from "next/server"
import { getAdminAuth } from "./firebase-admin"

/**
 * Authenticates a request using Firebase ID token
 * @param req - The Next.js request object
 * @returns The decoded Firebase user token or null if authentication fails
 */
export async function getAuth(req: NextRequest) {
  try {
    // Get the authorization header
    const authHeader = req.headers.get("authorization")

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      console.log("No valid authorization header found")
      return null
    }

    // Extract the token
    const token = authHeader.split("Bearer ")[1]

    if (!token) {
      console.log("No token found in authorization header")
      return null
    }

    // Get the Firebase Admin Auth instance
    const adminAuth = getAdminAuth()

    if (!adminAuth) {
      console.error("Firebase Admin Auth is not initialized")
      return null
    }

    // Verify the token
    try {
      const decodedToken = await adminAuth.verifyIdToken(token)
      console.log("Token verified successfully for user:", decodedToken.uid)
      return decodedToken
    } catch (error: any) {
      console.error("Token verification failed:", error.message)

      // Check for specific error types
      if (error.code === "auth/id-token-expired") {
        console.error("Token has expired")
      } else if (error.code === "auth/argument-error") {
        console.error("Invalid token format")
      } else if (error.code === "auth/invalid-credential") {
        console.error("Invalid credential")
      }

      return null
    }
  } catch (error) {
    console.error("Error in getAuth:", error)
    return null
  }
}
