"use client"

import type React from "react"
import { useState, useEffect } from "react"
import Link from "next/link"
import { motion, AnimatePresence } from "framer-motion"
import { GitBranch, Menu, X, Sun, Moon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useTheme } from "next-themes"
import { cn } from "@/lib/utils"

interface NavbarProps {
  transparent?: boolean
}

export const Navbar: React.FC<NavbarProps> = ({ transparent = false }) => {
  const [scrolled, setScrolled] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  // Handle scroll events
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20)
    }

    window.addEventListener("scroll", handleScroll)
    handleScroll() // Check initial scroll position

    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  // Handle theme mounting
  useEffect(() => {
    setMounted(true)
  }, [])

  const toggleTheme = () => {
    setTheme(theme === "dark" ? "light" : "dark")
  }

  const navLinks = [
    // { href: "#features", label: "Features" },
    // { href: "#how-it-works", label: "How It Works" },
    { href: "/ai-chat", label: "AI Chat" },
    { href: "/generate-readme", label: "Generate Readme" },
    { href: "/git-mojis", label: "Git Mojis" },
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
          <Link href="/" className="flex items-center gap-2 group">
            <motion.div
              whileHover={{ rotate: [0, 15, 0], scale: 1.1 }}
              transition={{ duration: 0.5 }}
              className="relative"
            >
              <div className="absolute -inset-1 rounded-full bg-primary/10 blur-md opacity-0 group-hover:opacity-100 transition-opacity"></div>
              <GitBranch className="h-6 w-6 relative text-primary" />
            </motion.div>
            <motion.span
              className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-foreground to-foreground/80"
              animate={{ scale: scrolled ? 0.95 : 1 }}
              transition={{ duration: 0.2 }}
            >
              Git Friend
            </motion.span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-1">
            {navLinks.map((link, index) => (
              <Link key={index} href={link.href} className="relative px-3 py-2 text-sm font-medium group">
                <span className="relative z-10 text-foreground/80 group-hover:text-foreground transition-colors duration-200">
                  {link.label}
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

            {/* Login Button */}
            <Button
              variant="outline"
              size="sm"
              className="hidden md:flex border-primary/20 hover:border-primary/50 transition-colors"
            >
              Log In
            </Button>

            {/* Sign Up Button */}
            <Button size="sm" className="relative overflow-hidden group">
              <span className="absolute inset-0 bg-gradient-to-r from-primary/0 via-primary/30 to-primary/0 opacity-0 group-hover:opacity-100 animate-[shine_1.5s_ease_infinite] -z-10"></span>
              Sign Up
            </Button>

            {/* Mobile Menu Toggle */}
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
            >
              <AnimatePresence mode="wait">
                {mobileMenuOpen ? (
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
        {mobileMenuOpen && (
          <motion.div
            className="fixed inset-0 z-30 bg-background/95 backdrop-blur-md pt-20"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.2 }}
          >
            <div className="container flex flex-col gap-4 p-4">
              {navLinks.map((link, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <Link
                    href={link.href}
                    className="flex items-center text-lg font-medium p-3 hover:bg-primary/5 rounded-md transition-colors"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <span>{link.label}</span>
                  </Link>
                </motion.div>
              ))}
              <div className="mt-4 space-y-3">
                <Button variant="outline" onClick={() => setMobileMenuOpen(false)} className="w-full">
                  Log In
                </Button>
                <Button onClick={() => setMobileMenuOpen(false)} className="w-full">
                  Sign Up
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.header>
  )
}

