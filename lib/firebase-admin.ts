import * as admin from "firebase-admin"

// Initialize Firebase Admin SDK
let firebaseAdminApp: admin.app.App | undefined

/**
 * Initializes and returns the Firebase Admin SDK
 */
export function getFirebaseAdmin() {
  if (firebaseAdminApp) {
    return firebaseAdminApp
  }

  try {
    // Format the private key correctly
    const privateKey = process.env.FIREBASE_PRIVATE_KEY
      ? process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, "\n")
      : undefined

    // Check if required environment variables are available
    if (!privateKey || !process.env.FIREBASE_CLIENT_EMAIL || !process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID) {
      throw new Error("Missing required Firebase Admin credentials")
    }

    // Initialize the Firebase Admin SDK
    firebaseAdminApp = admin.initializeApp(
      {
        credential: admin.credential.cert({
          projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
          clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
          privateKey,
        }),
        storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
      },
      "gitfriend-admin", // Unique app name to avoid conflicts
    )

    console.log("Firebase Admin initialized successfully with project ID:", process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID)
    return firebaseAdminApp
  } catch (error: any) {
    // Check if the error is because the app is already initialized
    if (error.code === "app/duplicate-app") {
      console.log("Firebase Admin app already exists, retrieving existing app")
      return admin.app("gitfriend-admin")
    }

    console.error("Firebase Admin initialization error:", error)
    throw error
  }
}

// Export the auth instance for convenience
export const getAdminAuth = () => {
  try {
    const app = getFirebaseAdmin()
    return app.auth()
  } catch (error) {
    console.error("Failed to get Firebase Admin Auth:", error)
    return null
  }
}
