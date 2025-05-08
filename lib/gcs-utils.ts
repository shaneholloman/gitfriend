import { Storage } from "@google-cloud/storage"

// Initialize Google Cloud Storage
let storageInstance: Storage | null = null

/**
 * Gets the Google Cloud Storage instance
 */
export function getStorage(): Storage {
  if (storageInstance) {
    return storageInstance
  }

  try {
    // Format the private key correctly
    const privateKey = process.env.GCS_PRIVATE_KEY ? process.env.GCS_PRIVATE_KEY.replace(/\\n/g, "\n") : undefined

    // Check if required environment variables are available
    if (!privateKey || !process.env.GCS_CLIENT_EMAIL || !process.env.GCS_PROJECT_ID) {
      throw new Error("Missing required GCS credentials")
    }

    // Initialize the Storage client
    storageInstance = new Storage({
      projectId: process.env.GCS_PROJECT_ID,
      credentials: {
        client_email: process.env.GCS_CLIENT_EMAIL,
        private_key: privateKey,
      },
    })

    console.log("Google Cloud Storage initialized successfully")
    return storageInstance
  } catch (error) {
    console.error("Error initializing Google Cloud Storage:", error)
    throw error
  }
}

/**
 * Gets the GCS bucket
 */
export function getBucket() {
  const storage = getStorage()
  const bucketName = process.env.GCS_BUCKET_NAME || "gitfriend-bucket"
  return storage.bucket(bucketName)
}

/**
 * Lists repositories for a user
 * @param userId - The user ID
 * @returns Array of repository names
 */
export async function listUserRepos(userId: string): Promise<string[]> {
  try {
    const bucket = getBucket()
    const prefix = `users/${userId}/`

    console.log(`Listing repositories for user ${userId} with prefix ${prefix}`)

    // List all files in the user's directory
    const [files] = await bucket.getFiles({
      prefix,
      autoPaginate: false,
    })

    console.log(`Found ${files.length} files for user ${userId}`)

    // Extract repository names from file paths
    const repoSet = new Set<string>()

    files.forEach((file) => {
      const filePath = file.name
      // Skip the user directory itself
      if (filePath === prefix) return

      // Extract the repository name (first directory after the user ID)
      const parts = filePath.substring(prefix.length).split("/")
      if (parts.length > 0 && parts[0]) {
        repoSet.add(parts[0])
      }
    })

    const repos = Array.from(repoSet)
    console.log(`Extracted ${repos.length} repositories: ${repos.join(", ")}`)

    return repos
  } catch (error) {
    console.error("Error listing user repositories:", error)
    throw error
  }
}

/**
 * Creates a new repository for a user
 * @param userId - The user ID
 * @param repoName - The repository name
 * @returns Object with the created repository name
 */
export async function createRepo(userId: string, repoName: string) {
  try {
    const bucket = getBucket()
    const filePath = `users/${userId}/${repoName}/.gitkeep`

    console.log(`Creating repository at path: ${filePath}`)

    // Create a placeholder file to represent the repository
    const file = bucket.file(filePath)

    // Check if the repository already exists
    const [exists] = await file.exists()

    if (exists) {
      throw new Error("Repository already exists")
    }

    // Create the repository by creating a placeholder file
    await file.save("", {
      contentType: "text/plain",
    })

    console.log(`Repository created successfully at path: ${filePath}`)
    return { name: repoName }
  } catch (error) {
    console.error("Error creating repository:", error)
    throw error
  }
}

/**
 * Lists files and folders in a repository
 * @param userId - The user ID
 * @param repoName - The repository name
 * @param path - The path within the repository
 * @returns Object with files and folders
 */
export async function listFilesAndFolders(userId: string, repoName: string, path: string[] = []) {
  try {
    const bucket = getBucket()

    // Construct the prefix for the current path
    const prefix = path.length > 0 ? `users/${userId}/${repoName}/${path.join("/")}/` : `users/${userId}/${repoName}/`

    console.log(`Listing files and folders at prefix: ${prefix}`)

    // List all files with the prefix
    const [files] = await bucket.getFiles({
      prefix,
      autoPaginate: false,
    })

    console.log(`Found ${files.length} files at prefix ${prefix}`)

    // Extract folders and files
    const folderSet = new Set<string>()
    const fileList: Array<{
      name: string
      path: string
      size: number
      contentType: string
      updated: string
    }> = []

    files.forEach((file) => {
      const filePath = file.name

      // Skip the current directory itself
      if (filePath === prefix) return

      // Get the relative path from the current directory
      const relativePath = filePath.substring(prefix.length)

      // If the relative path contains a slash, it's a file in a subdirectory
      if (relativePath.includes("/")) {
        // Extract the folder name (first part before the slash)
        const folderName = relativePath.split("/")[0]
        if (folderName && folderName !== ".gitkeep") {
          folderSet.add(folderName)
        }
      } else {
        // It's a file in the current directory
        if (relativePath && relativePath !== ".gitkeep") {
          fileList.push({
            name: relativePath,
            path: filePath,
            size: Number.parseInt(file.metadata.size || "0", 10),
            contentType: file.metadata.contentType || "text/plain",
            updated: file.metadata.updated || new Date().toISOString(),
          })
        }
      }
    })

    const folders = Array.from(folderSet)
    console.log(`Extracted ${folders.length} folders and ${fileList.length} files`)

    return { files: fileList, folders }
  } catch (error) {
    console.error("Error listing files and folders:", error)
    throw error
  }
}

/**
 * Gets the content of a file
 * @param filePath - The full path to the file in GCS
 * @returns The file content as a string
 */
export async function getFileContent(filePath: string): Promise<string> {
  try {
    const bucket = getBucket()
    const file = bucket.file(filePath)

    // Check if the file exists
    const [exists] = await file.exists()

    if (!exists) {
      throw new Error("File not found")
    }

    // Download the file content
    const [content] = await file.download()

    return content.toString("utf-8")
  } catch (error) {
    console.error("Error getting file content:", error)
    throw error
  }
}

/**
 * Updates the content of a file
 * @param filePath - The full path to the file in GCS
 * @param content - The new content for the file
 */
export async function updateFileContent(filePath: string, content: string): Promise<void> {
  try {
    const bucket = getBucket()
    const file = bucket.file(filePath)

    // Check if the file exists
    const [exists] = await file.exists()

    if (!exists) {
      throw new Error("File not found")
    }

    // Save the new content
    await file.save(content, {
      contentType: "text/plain", // You might want to determine this based on file extension
    })
  } catch (error) {
    console.error("Error updating file content:", error)
    throw error
  }
}

/**
 * Creates a new file
 * @param userId - The user ID
 * @param repoName - The repository name
 * @param path - The path within the repository
 * @param fileName - The name of the file to create
 * @param content - The content of the file
 */
export async function createFile(
  userId: string,
  repoName: string,
  path: string[],
  fileName: string,
  content = "",
): Promise<void> {
  try {
    const bucket = getBucket()

    // Construct the file path
    const filePath =
      path.length > 0
        ? `users/${userId}/${repoName}/${path.join("/")}/${fileName}`
        : `users/${userId}/${repoName}/${fileName}`

    console.log(`Creating file at path: ${filePath}`)

    const file = bucket.file(filePath)

    // Check if the file already exists
    const [exists] = await file.exists()

    if (exists) {
      throw new Error("File already exists")
    }

    // Create the file with the provided content
    await file.save(content, {
      contentType: "text/plain", // You might want to determine this based on file extension
    })

    console.log(`File created successfully at path: ${filePath}`)
  } catch (error) {
    console.error("Error creating file:", error)
    throw error
  }
}

/**
 * Creates a new folder
 * @param userId - The user ID
 * @param repoName - The repository name
 * @param path - The path within the repository
 * @param folderName - The name of the folder to create
 */
export async function createFolder(
  userId: string,
  repoName: string,
  path: string[],
  folderName: string,
): Promise<void> {
  try {
    const bucket = getBucket()

    // Construct the folder path (with a placeholder file)
    const folderPath =
      path.length > 0
        ? `users/${userId}/${repoName}/${path.join("/")}/${folderName}/.gitkeep`
        : `users/${userId}/${repoName}/${folderName}/.gitkeep`

    console.log(`Creating folder at path: ${folderPath}`)

    const file = bucket.file(folderPath)

    // Check if the folder already exists
    const [exists] = await file.exists()

    if (exists) {
      throw new Error("Folder already exists")
    }

    // Create the folder by creating a placeholder file
    await file.save("", {
      contentType: "text/plain",
    })

    console.log(`Folder created successfully at path: ${folderPath}`)
  } catch (error) {
    console.error("Error creating folder:", error)
    throw error
  }
}

/**
 * Gets the full file tree for a repository
 * @param userId - The user ID
 * @param repoName - The repository name
 * @returns The file tree structure
 */
export async function getRepoFileTree(userId: string, repoName: string) {
  try {
    const bucket = getBucket()
    const prefix = `users/${userId}/${repoName}/`

    console.log(`Getting file tree for repository ${repoName} with prefix ${prefix}`)

    // List all files in the repository
    const [files] = await bucket.getFiles({
      prefix,
      autoPaginate: false,
    })

    console.log(`Found ${files.length} files in repository ${repoName}`)

    // Build the file tree
    const tree: any = {
      name: repoName,
      path: [],
      children: [],
      type: "directory",
    }

    // Map to track directories
    const dirMap = new Map<string, any>()
    dirMap.set("", tree)

    files.forEach((file) => {
      const filePath = file.name

      // Skip the repository root
      if (filePath === prefix) return

      // Get the relative path from the repository root
      const relativePath = filePath.substring(prefix.length)

      // Skip .gitkeep files
      if (relativePath.endsWith("/.gitkeep")) return

      const parts = relativePath.split("/")
      let currentPath = ""
      let parentPath = ""

      // Create directory nodes as needed
      for (let i = 0; i < parts.length - 1; i++) {
        parentPath = currentPath
        currentPath = currentPath ? `${currentPath}/${parts[i]}` : parts[i]

        if (!dirMap.has(currentPath)) {
          const dirNode = {
            name: parts[i],
            path: parentPath ? parentPath.split("/") : [],
            children: [],
            type: "directory",
          }

          dirMap.get(parentPath).children.push(dirNode)
          dirMap.set(currentPath, dirNode)
        }
      }

      // Add the file node
      if (parts.length > 0 && !filePath.endsWith("/")) {
        const fileName = parts[parts.length - 1]
        const fileParentPath = parts.length > 1 ? parts.slice(0, -1).join("/") : ""

        const fileNode = {
          name: fileName,
          path: filePath,
          type: "file",
          size: Number.parseInt(file.metadata.size || "0", 10),
          updated: file.metadata.updated || new Date().toISOString(),
        }

        dirMap.get(fileParentPath).children.push(fileNode)
      }
    })

    return tree
  } catch (error) {
    console.error("Error getting repository file tree:", error)
    throw error
  }
}

/**
 * Deletes a file or folder
 * @param path - The full path to the file or folder in GCS
 */
export async function deleteFileOrFolder(path: string): Promise<void> {
  try {
    const bucket = getBucket()

    // Check if it's a file
    const file = bucket.file(path)
    const [fileExists] = await file.exists()

    if (fileExists) {
      // It's a file, delete it
      await file.delete()
      console.log(`File deleted successfully: ${path}`)
      return
    }

    // It might be a folder, add trailing slash if not present
    const folderPath = path.endsWith("/") ? path : `${path}/`

    // List all files with the folder prefix
    const [files] = await bucket.getFiles({
      prefix: folderPath,
      autoPaginate: false,
    })

    if (files.length === 0) {
      throw new Error("File or folder not found")
    }

    // Delete all files in the folder
    await Promise.all(files.map((file) => file.delete()))

    console.log(`Folder and its contents deleted successfully: ${folderPath}`)
  } catch (error) {
    console.error("Error deleting file or folder:", error)
    throw error
  }
}

/**
 * Renames a file or folder
 * @param oldPath - The full path to the file or folder in GCS
 * @param newName - The new name for the file or folder
 */
export async function renameFileOrFolder(oldPath: string, newName: string): Promise<void> {
  try {
    const bucket = getBucket()

    // Check if it's a file
    const file = bucket.file(oldPath)
    const [fileExists] = await file.exists()

    if (fileExists) {
      // It's a file, rename it
      // Get the directory path
      const pathParts = oldPath.split("/")
      pathParts.pop() // Remove the filename
      const dirPath = pathParts.join("/")
      const newPath = `${dirPath}/${newName}`

      // Copy the file to the new path
      await bucket.file(oldPath).copy(bucket.file(newPath))

      // Delete the old file
      await bucket.file(oldPath).delete()

      console.log(`File renamed successfully from ${oldPath} to ${newPath}`)
      return
    }

    // It might be a folder, add trailing slash if not present
    const folderPath = oldPath.endsWith("/") ? oldPath : `${oldPath}/`

    // List all files with the folder prefix
    const [files] = await bucket.getFiles({
      prefix: folderPath,
      autoPaginate: false,
    })

    if (files.length === 0) {
      throw new Error("File or folder not found")
    }

    // Get the parent directory path
    const pathParts = folderPath.split("/")
    pathParts.pop() // Remove the empty string after the trailing slash
    pathParts.pop() // Remove the folder name
    const parentPath = pathParts.join("/")
    const newFolderPath = `${parentPath}/${newName}/`

    // Copy all files to the new folder path
    await Promise.all(
      files.map(async (file) => {
        const relativePath = file.name.substring(folderPath.length)
        const newFilePath = `${newFolderPath}${relativePath}`

        await bucket.file(file.name).copy(bucket.file(newFilePath))
        await bucket.file(file.name).delete()
      }),
    )

    console.log(`Folder renamed successfully from ${folderPath} to ${newFolderPath}`)
  } catch (error) {
    console.error("Error renaming file or folder:", error)
    throw error
  }
}

/**
 * Gets the API route for the tree endpoint
 */
export async function getRepoFileTreeApi(userId: string, repoName: string) {
  try {
    const tree = await getRepoFileTree(userId, repoName)
    return { tree }
  } catch (error) {
    console.error("Error getting repository file tree:", error)
    throw error
  }
}
