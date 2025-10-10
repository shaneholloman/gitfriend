"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/context/auth-context"
import { X, GitBranch } from "lucide-react"
import { motion } from "framer-motion"
import { FcGoogle } from "react-icons/fc"

interface LoginModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess?: () => void
}

export function LoginModal({ isOpen, onClose, onSuccess }: LoginModalProps) {
  const { signInWithGoogle } = useAuth()
  const { guestLogin } = useAuth()
  const [isLoading, setIsLoading] = useState(false)

  const handleLogin = async () => {
    setIsLoading(true)
    try {
      await signInWithGoogle()
      onSuccess?.()
    } catch (error) {
      console.error("Error signing in:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleGuest = () => {
    guestLogin()
    onSuccess?.()
    onClose()
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-background rounded-lg shadow-lg max-w-md w-full p-6 relative"
      >
        <Button variant="ghost" size="icon" className="absolute right-4 top-4" onClick={onClose}>
          <X className="h-4 w-4" />
        </Button>

        <div className="flex flex-col items-center text-center">
          <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center mb-6">
            <GitBranch className="h-8 w-8 text-primary" />
          </div>

          <h2 className="text-2xl font-bold mb-2">Sign in to Git Friend</h2>
          <p className="text-muted-foreground mb-6">You need to be signed in to access this feature.</p>

          <Button
            className="w-full flex items-center justify-center gap-2 py-6"
            onClick={handleLogin}
            disabled={isLoading}
          >
            <FcGoogle className="h-5 w-5" />
            {isLoading ? "Signing in..." : "Sign in with Google"}
          </Button>
          <div className="my-4 w-full flex items-center">
            <div className="flex-grow border-t border-gray-200" />
            <span className="mx-2 text-xs text-gray-400">or</span>
            <div className="flex-grow border-t border-gray-200" />
          </div>
          <Button
            className="w-full flex items-center justify-center gap-2 py-4 bg-gray-100 text-gray-700 hover:bg-gray-200"
            onClick={handleGuest}
            variant="outline"
          >
            <span>Continue as Guest</span>
          </Button>
          <p className="text-xs text-gray-400 mt-2">Guest access is limited to 5 minutes.</p>
        </div>
      </motion.div>
    </div>
  )
}
