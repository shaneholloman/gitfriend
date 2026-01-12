"use client"

import { createContext, useContext, useState, useEffect, ReactNode } from "react"

interface GitHubAuthContextType {
  isConnected: boolean
  accessToken: string | null
  userInfo: { login: string; avatar_url: string; name: string } | null
  connectGitHub: () => void
  disconnectGitHub: () => void
  loading: boolean
}

const GitHubAuthContext = createContext<GitHubAuthContextType | undefined>(undefined)

export function GitHubAuthProvider({ children }: { children: ReactNode }) {
  const [accessToken, setAccessToken] = useState<string | null>(null)
  const [userInfo, setUserInfo] = useState<{ login: string; avatar_url: string; name: string } | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Check for stored token on mount
    const token = localStorage.getItem("github_access_token")
    const user = localStorage.getItem("github_user_info")
    
    if (token) {
      setAccessToken(token)
      if (user) {
        setUserInfo(JSON.parse(user))
      }
    }
    setLoading(false)

    // Listen for OAuth callback
    const handleMessage = (event: MessageEvent) => {
      if (event.data.type === "github-oauth-success") {
        setAccessToken(event.data.token)
        setUserInfo(event.data.user)
        localStorage.setItem("github_access_token", event.data.token)
        localStorage.setItem("github_user_info", JSON.stringify(event.data.user))
      }
    }

    window.addEventListener("message", handleMessage)
    return () => window.removeEventListener("message", handleMessage)
  }, [])

  const connectGitHub = () => {
    const clientId = process.env.NEXT_PUBLIC_GITHUB_CLIENT_ID
    const redirectUri = `${window.location.origin}/api/auth/github/callback`
    const scope = "repo"
    
    const width = 600
    const height = 700
    const left = window.screenX + (window.outerWidth - width) / 2
    const top = window.screenY + (window.outerHeight - height) / 2

    window.open(
      `https://github.com/login/oauth/authorize?client_id=${clientId}&redirect_uri=${redirectUri}&scope=${scope}`,
      "GitHub OAuth",
      `width=${width},height=${height},left=${left},top=${top}`
    )
  }

  const disconnectGitHub = () => {
    localStorage.removeItem("github_access_token")
    localStorage.removeItem("github_user_info")
    setAccessToken(null)
    setUserInfo(null)
  }

  return (
    <GitHubAuthContext.Provider
      value={{
        isConnected: !!accessToken,
        accessToken,
        userInfo,
        connectGitHub,
        disconnectGitHub,
        loading,
      }}
    >
      {children}
    </GitHubAuthContext.Provider>
  )
}

export const useGitHubAuth = () => {
  const context = useContext(GitHubAuthContext)
  if (!context) {
    throw new Error("useGitHubAuth must be used within GitHubAuthProvider")
  }
  return context
}