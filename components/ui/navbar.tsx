"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Menu, X, Sun, Moon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useTheme } from "next-themes"
import { cn } from "@/lib/utils"
import { UserAuthButton } from "@/components/auth/user-auth-button"
import { motion, AnimatePresence } from "framer-motion"

export function NavbarDemo({ transparent = false }: { transparent?: boolean }) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)
  const pathname = usePathname()

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20)
    }
    window.addEventListener("scroll", handleScroll)
    handleScroll()
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  useEffect(() => {
    setMounted(true)
  }, [])

  const toggleTheme = () => {
    setTheme(theme === "dark" ? "light" : "dark")
  }

  const navItems = [
    { name: "Home", link: "/" },
    { name: "AI Chat", link: "/ai-chat" },
    { name: "Generate README", link: "/generate-readme" },
    { name: "Git Mojis", link: "/git-mojis" },
    { name: "Codebase", link: "/codebase" },
  ]

  return (
    <motion.header
      className={cn(
        "fixed top-0 left-0 right-0 z-40 transition-all duration-300",
        scrolled
          ? "bg-background/80 backdrop-blur-xl border-b border-border/50 py-2"
          : transparent
            ? "bg-transparent py-4"
            : "bg-background/60 backdrop-blur-xl py-3",
      )}
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
    >
      <div className="container mx-auto px-4 md:px-6">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2">
            <span className="font-bold text-lg">GitFriend</span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-1">
            {navItems.map((item) => (
              <Link
                key={item.link}
                href={item.link}
                className={cn(
                  "relative px-3 py-2 text-sm font-medium group",
                  pathname === item.link ? "text-primary" : "text-foreground/80 hover:text-foreground"
                )}
              >
                <span className="relative z-10 transition-colors duration-200">
                  {item.name}
                </span>
                <span className="absolute bottom-0 left-0 w-full h-[2px] bg-primary scale-x-0 group-hover:scale-x-100 transition-transform duration-200 origin-left"></span>
              </Link>
            ))}
          </nav>

          {/* Right Side Actions */}
          <div className="flex items-center gap-3">
            {/* Theme Toggle */}
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleTheme}
              aria-label="Toggle theme"
              className="relative overflow-hidden rounded-full"
            >
              {mounted && (
                <>
                  <motion.div
                    initial={{ scale: theme === "dark" ? 0 : 1, opacity: theme === "dark" ? 0 : 1 }}
                    animate={{ scale: theme === "dark" ? 0 : 1, opacity: theme === "dark" ? 0 : 1 }}
                    transition={{ duration: 0.3 }}
                    className="absolute inset-0 flex items-center justify-center"
                  >
                    <Sun className="h-5 w-5" />
                  </motion.div>
                  <motion.div
                    initial={{ scale: theme === "dark" ? 1 : 0, opacity: theme === "dark" ? 1 : 0 }}
                    animate={{ scale: theme === "dark" ? 1 : 0, opacity: theme === "dark" ? 1 : 0 }}
                    transition={{ duration: 0.3 }}
                    className="absolute inset-0 flex items-center justify-center"
                  >
                    <Moon className="h-5 w-5" />
                  </motion.div>
                </>
              )}
              <span className="sr-only">Toggle theme</span>
            </Button>

            {/* Auth Button */}
            <UserAuthButton />

            {/* Mobile Menu Toggle */}
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              aria-label={isMobileMenuOpen ? "Close menu" : "Open menu"}
            >
              <AnimatePresence mode="wait">
                {isMobileMenuOpen ? (
                  <motion.div
                    key="close"
                    initial={{ rotate: -90, opacity: 0 }}
                    animate={{ rotate: 0, opacity: 1 }}
                    exit={{ rotate: 90, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <X className="h-6 w-6" />
                  </motion.div>
                ) : (
                  <motion.div
                    key="menu"
                    initial={{ rotate: 90, opacity: 0 }}
                    animate={{ rotate: 0, opacity: 1 }}
                    exit={{ rotate: -90, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <Menu className="h-6 w-6" />
                  </motion.div>
                )}
              </AnimatePresence>
            </Button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            className="fixed inset-0 z-30 bg-background/95 backdrop-blur-md pt-20"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.2 }}
          >
            <div className="container flex flex-col gap-4 p-4">
              {navItems.map((item, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <Link
                    href={item.link}
                    className={cn(
                      "flex items-center text-lg font-medium p-3 hover:bg-primary/5 rounded-md transition-colors",
                      pathname === item.link ? "text-primary" : "text-foreground/80"
                    )}
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    <span>{item.name}</span>
                  </Link>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.header>
  )
}
