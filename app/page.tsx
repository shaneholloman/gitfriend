"use client"

import { useState, useRef } from "react"
import Link from "next/link"
import { motion, useScroll, useTransform, useSpring } from "framer-motion"
import { ArrowRight, CheckCircle, Code, GitBranch, GitMerge, GitPullRequest, Users, Terminal, FileText, Sparkles, FileCode, ImageIcon,BookOpen,TerminalSquare,Trophy,Wand2,Download } from "lucide-react"

import { Button } from "@/components/ui/button"
import { useTheme } from "next-themes"
import BadgeShine from "@/components/ui/badge-shine"
import InputPulseBorder from "@/components/ui/input-pulse-border"
import TextAnimatedGradient from "@/components/ui/text-animated-gradient"
import { AnimatedBeams } from "@/components/ui/animated-beams"
import { Navbar } from "@/components/ui/navbar"

export default function LandingPage() {
  const [email, setEmail] = useState("")
  const heroRef = useRef(null)
  const { theme } = useTheme()
  const { scrollYProgress } = useScroll({
    target: heroRef,
    offset: ["start start", "end start"],
  })

  const y = useTransform(scrollYProgress, [0, 1], ["0%", "40%"])
  const opacity = useTransform(scrollYProgress, [0, 0.5], [1, 0])

  const springY = useSpring(y, { stiffness: 100, damping: 30 })
  const springOpacity = useSpring(opacity, { stiffness: 100, damping: 30 })

  const fadeIn = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.6 },
    },
  }

  const staggerContainer = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  }

  const textVariant = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        type: "spring",
        stiffness: 100,
        damping: 15,
      },
    },
  }

  const features = [
    {
      icon: <Terminal className="h-6 w-6" />,
      title: "Simplified Commands",
      description: "Convert complex Git operations into simple, intuitive commands.",
    },
    {
      icon: <GitBranch className="h-6 w-6" />,
      title: "Branch Management",
      description: "Visualize and manage your branches with ease.",
    },
    {
      icon: <GitMerge className="h-6 w-6" />,
      title: "Merge Assistance",
      description: "Get smart suggestions for resolving merge conflicts.",
    },
    {
      icon: <GitPullRequest className="h-6 w-6" />,
      title: "PR Workflows",
      description: "Streamline your pull request process from creation to review.",
    },
  ]

  return (
    <div className="flex min-h-screen flex-col relative overflow-hidden">
      {/* Noise overlay */}
      <div className="fixed inset-0 z-50 pointer-events-none opacity-[0.015] bg-repeat bg-noise"></div>

      {/* Animated beams background */}
      <AnimatedBeams className="z-0" />

      {/* Modern Navbar */}
      <Navbar transparent={true} />

      <main className="flex-1 pt-16">
        {/* Hero Section */}
        <section ref={heroRef} className="relative overflow-hidden py-20 md:py-32">
          <motion.div
            className="absolute inset-0 -z-10"
            style={{
              backgroundImage: "radial-gradient(circle at 50% 0%, hsl(var(--primary)/0.2) 0%, transparent 50%)",
              y: springY,
              opacity: springOpacity,
            }}
          />
          <div className="absolute inset-0 -z-10 bg-grid-pattern opacity-[0.02]"></div>

          <div className="container relative z-10">
            <motion.div
              className="mx-auto max-w-3xl text-center"
              initial="hidden"
              animate="visible"
              variants={staggerContainer}
            >
              <motion.div variants={textVariant} className="mb-6">
                <BadgeShine>Simplify Your Git Workflow</BadgeShine>
              </motion.div>
              <motion.h1
                className="text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl mb-6"
                variants={textVariant}
              >
                Make Git <TextAnimatedGradient>Simple</TextAnimatedGradient> Again
              </motion.h1>
              <motion.p className="mt-6 text-lg text-muted-foreground md:text-xl" variants={textVariant}>
                Git Friend simplifies complex Git workflows, making version control intuitive and collaborative for
                developers of all skill levels.
              </motion.p>
              <motion.div
                className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4"
                variants={textVariant}
              >
                <div className="relative w-full max-w-md">
                  <InputPulseBorder
                    placeholder="Enter your email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                  <Button className="absolute right-0 top-0 h-full rounded-l-none" size="sm">
                    Get Started
                  </Button>
                </div>
              </motion.div>
            </motion.div>
          </div>

          <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-background to-transparent"></div>
        </section>

        {/* Animated Terminal Demo */}
        <section className="py-16 md:py-24 relative">
          <div className="absolute inset-0 -z-10 bg-grid-pattern opacity-[0.02]"></div>
          <div className="container">
            <motion.div
              className="mx-auto max-w-4xl overflow-hidden rounded-xl border bg-black shadow-xl"
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              viewport={{ once: true }}
            >
              <div className="flex items-center gap-2 border-b border-border/40 bg-muted/20 px-4 py-3">
                <div className="h-3 w-3 rounded-full bg-red-500"></div>
                <div className="h-3 w-3 rounded-full bg-yellow-500"></div>
                <div className="h-3 w-3 rounded-full bg-green-500"></div>
                <div className="ml-2 text-xs text-muted-foreground">terminal</div>
              </div>
              <div className="p-4 font-mono text-sm text-green-400">
                <motion.div
                  initial={{ opacity: 0 }}
                  whileInView={{ opacity: 1 }}
                  transition={{ delay: 0.5 }}
                  viewport={{ once: true }}
                >
                  <span className="text-muted-foreground">$</span> git friend init
                </motion.div>
                <motion.div
                  initial={{ opacity: 0 }}
                  whileInView={{ opacity: 1 }}
                  transition={{ delay: 1.0 }}
                  viewport={{ once: true }}
                >
                  <span className="text-white">✓</span> Git Friend initialized successfully!
                </motion.div>
                <motion.div
                  initial={{ opacity: 0 }}
                  whileInView={{ opacity: 1 }}
                  transition={{ delay: 1.5 }}
                  viewport={{ once: true }}
                >
                  <span className="text-muted-foreground">$</span> git friend create-branch feature
                </motion.div>
                <motion.div
                  initial={{ opacity: 0 }}
                  whileInView={{ opacity: 1 }}
                  transition={{ delay: 2.0 }}
                  viewport={{ once: true }}
                >
                  <span className="text-white">✓</span> Created and switched to branch{" "}
                  <span className="text-primary">'feature'</span>
                </motion.div>
                <motion.div
                  initial={{ opacity: 0 }}
                  whileInView={{ opacity: 1 }}
                  transition={{ delay: 2.5 }}
                  viewport={{ once: true }}
                >
                  <span className="text-muted-foreground">$</span> git friend push
                </motion.div>
                <motion.div
                  initial={{ opacity: 0 }}
                  whileInView={{ opacity: 1 }}
                  transition={{ delay: 3.0 }}
                  viewport={{ once: true }}
                >
                  <span className="text-white">✓</span> Changes pushed to remote. PR created:{" "}
                  <span className="text-primary underline">github.com/repo/pull/42</span>
                </motion.div>
              </div>
            </motion.div>
          </div>
        </section>

        {/* Features Section */}
        <section id="features" className="py-16 md:py-24 relative">
          <div className="absolute inset-0 -z-10 bg-grid-pattern opacity-[0.02]"></div>
          <div className="absolute inset-0 -z-10 bg-gradient-to-b from-muted/50 to-transparent"></div>
          <div className="container">
            <div className="mx-auto max-w-2xl text-center">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                viewport={{ once: true }}
              >
                <BadgeShine>Features</BadgeShine>
                <h2 className="text-3xl font-bold tracking-tight sm:text-4xl mt-4">
                  <TextAnimatedGradient>Powerful Features</TextAnimatedGradient>, Simple Interface
                </h2>
                <p className="mt-4 text-muted-foreground">
                  Git Friend combines powerful Git functionality with an intuitive interface, making version control
                  accessible to everyone.
                </p>
              </motion.div>
            </div>
            <motion.div
              className="mt-16 grid gap-8 md:grid-cols-2"
              variants={staggerContainer}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
            >
              {features.map((feature, index) => (
                <motion.div
                  key={index}
                  className="rounded-xl border bg-card/50 backdrop-blur-sm p-6 shadow-sm transition-all hover:shadow-md relative group overflow-hidden"
                  variants={fadeIn}
                  whileHover={{ y: -5, transition: { duration: 0.2 } }}
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                  <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    {feature.icon}
                  </div>
                  <h3 className="mb-2 text-xl font-bold">{feature.title}</h3>
                  <p className="text-muted-foreground">{feature.description}</p>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </section>

        {/* How It Works */}
        <section id="how-it-works" className="py-28 md:py-36 relative">
          {/* Enhanced background elements */}
          <div className="absolute inset-0 -z-10 bg-dot-pattern opacity-5 dark:opacity-10"></div>
          <div className="absolute top-0 left-0 right-0 h-40 bg-gradient-to-b from-background to-transparent"></div>
          <div className="absolute bottom-0 left-0 right-0 h-40 bg-gradient-to-t from-background to-transparent"></div>
          
          {/* Ambient light effects */}
          <div className="absolute -top-20 -left-20 w-96 h-96 bg-primary/20 rounded-full blur-3xl opacity-50 animate-pulse"></div>
          <div className="absolute -bottom-20 -right-20 w-96 h-96 bg-indigo-500/20 rounded-full blur-3xl opacity-50 animate-pulse" style={{ animationDelay: '2s' }}></div>
          
          <div className="container px-4 mx-auto relative">
            <div className="mx-auto max-w-2xl text-center mb-20">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7 }}
                viewport={{ once: true }}
              >
                <BadgeShine>AI-Powered Git Assistant</BadgeShine>
                <h2 className="text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl mt-4">
                  <TextAnimatedGradient>How Git Friend Works</TextAnimatedGradient>
                </h2>
                <p className="mt-6 text-lg text-muted-foreground max-w-xl mx-auto">
                  Your AI companion that helps you learn Git, generate READMEs, and create meaningful commit messages.
                </p>
              </motion.div>
            </div>
            
            {/* Enhanced Bento Grid Layout with improved spacing and arrangement */}
            <div className="grid grid-cols-12 gap-6 relative">
              {/* Step 1 - AI Chat Assistant */}
              <motion.div 
                className="col-span-12 md:col-span-8 row-span-1 p-10 rounded-3xl border border-white/10 bg-gradient-to-br from-background/30 to-background/60 backdrop-blur-xl shadow-xl hover:shadow-2xl hover:border-primary/30 transition-all duration-500 overflow-hidden relative group"
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7, delay: 0.1 }}
                viewport={{ once: true }}
                whileHover={{ scale: 1.01 }}
              >
                {/* Enhanced glow effects */}
                <div className="absolute -right-20 -bottom-40 w-96 h-96 bg-primary/10 rounded-full blur-3xl group-hover:bg-primary/20 transition-all duration-700"></div>
                <div className="absolute -left-20 -top-40 w-80 h-80 bg-indigo-500/5 rounded-full blur-3xl group-hover:bg-indigo-500/10 transition-all duration-700"></div>
                
                <div className="relative">
                  <div className="flex items-center mb-8">
                    <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-primary/20 to-primary/10 text-primary mr-5 group-hover:from-primary group-hover:to-primary/80 group-hover:text-primary-foreground transition-colors duration-500 shadow-lg">
                      <span className="text-2xl font-bold">1</span>
                    </div>
                    <h3 className="text-3xl font-bold">AI Git Assistant</h3>
                  </div>
                  
                  <p className="text-muted-foreground mb-8 max-w-lg text-lg leading-relaxed">
                    Get instant help with Git commands, learn best practices, and solve Git-related issues through natural conversation with our AI assistant.
                  </p>
                  
                  <div className="rounded-2xl bg-black/50 border border-white/10 p-5 backdrop-blur-md overflow-hidden shadow-inner">
                    <motion.div 
                      className="font-mono text-sm"
                      initial={{ opacity: 0 }}
                      whileInView={{ opacity: 1 }}
                      transition={{ delay: 0.5 }}
                      viewport={{ once: true }}
                    >
                      <span className="text-blue-400">You:</span> How do I resolve merge conflicts?
                      <motion.div
                        initial={{ opacity: 0 }}
                        whileInView={{ opacity: 1 }}
                        transition={{ delay: 0.8 }}
                        viewport={{ once: true }}
                      >
                        <span className="text-green-400">Git Friend:</span> I'll guide you through the process step by step. First, identify the conflicted files with <span className="text-yellow-400">git status</span>. Then, open each file and look for conflict markers...
                      </motion.div>
                    </motion.div>
                  </div>
                  
                  <div className="mt-8 flex flex-wrap gap-3">
                    <span className="px-4 py-1.5 text-xs font-medium rounded-full bg-gradient-to-r from-primary/20 to-primary/10 text-primary border border-primary/20 shadow-sm">Git Commands</span>
                    <span className="px-4 py-1.5 text-xs font-medium rounded-full bg-gradient-to-r from-primary/20 to-primary/10 text-primary border border-primary/20 shadow-sm">Troubleshooting</span>
                    <span className="px-4 py-1.5 text-xs font-medium rounded-full bg-gradient-to-r from-primary/20 to-primary/10 text-primary border border-primary/20 shadow-sm">Best Practices</span>
                    <span className="px-4 py-1.5 text-xs font-medium rounded-full bg-gradient-to-r from-primary/20 to-primary/10 text-primary border border-primary/20 shadow-sm">GitHub Workflows</span>
                  </div>
                </div>
              </motion.div>
              
              {/* Step 2 - README Generator */}
              <motion.div 
                className="col-span-12 md:col-span-4 p-8 rounded-3xl border border-white/10 bg-gradient-to-br from-background/30 to-background/60 backdrop-blur-xl shadow-xl hover:shadow-2xl hover:border-primary/30 transition-all duration-500 overflow-hidden relative"
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7, delay: 0.2 }}
                viewport={{ once: true }}
                whileHover={{ scale: 1.01 }}
              >
                <div className="absolute -right-20 -bottom-20 w-64 h-64 bg-primary/10 rounded-full blur-3xl transition-all duration-700"></div>
                
                <div className="flex items-center mb-6">
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-primary/20 to-primary/10 text-primary mr-4 transition-colors duration-500 shadow-lg">
                    <span className="text-xl font-bold">2</span>
                  </div>
                  <h3 className="text-2xl font-bold">README Generator</h3>
                </div>
                
                <p className="text-muted-foreground mb-6">
                  Generate professional README files for your GitHub repositories with just a repository link.
                </p>
                
                <div className="space-y-3">
                  <motion.div 
                    className="flex items-center gap-3 px-4 py-3 rounded-xl bg-black/50 border border-white/10 backdrop-blur-md shadow-inner group"
                    whileHover={{ x: 5, backgroundColor: 'rgba(0,0,0,0.6)' }}
                  >
                    <FileText className="h-5 w-5 text-primary" />
                    <div className="flex-1">
                      <div className="text-sm font-medium mb-1">Repository Analysis</div>
                      <div className="text-xs text-muted-foreground">Scans repository to understand project structure</div>
                    </div>
                  </motion.div>
                  
                  <motion.div 
                    className="flex items-center gap-3 px-4 py-3 rounded-xl bg-black/50 border border-white/10 backdrop-blur-md shadow-inner group"
                    whileHover={{ x: 5, backgroundColor: 'rgba(0,0,0,0.6)' }}
                  >
                    <Wand2 className="h-5 w-5 text-primary" />
                    <div className="flex-1">
                      <div className="text-sm font-medium mb-1">AI Generation</div>
                      <div className="text-xs text-muted-foreground">Creates comprehensive README content</div>
                    </div>
                  </motion.div>
                  
                  <motion.div 
                    className="flex items-center gap-3 px-4 py-3 rounded-xl bg-black/50 border border-white/10 backdrop-blur-md shadow-inner group"
                    whileHover={{ x: 5, backgroundColor: 'rgba(0,0,0,0.6)' }}
                  >
                    <Download className="h-5 w-5 text-primary" />
                    <div className="flex-1">
                      <div className="text-sm font-medium mb-1">Easy Export</div>
                      <div className="text-xs text-muted-foreground">Download or push directly to repository</div>
                    </div>
                  </motion.div>
                </div>
              </motion.div>

            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="py-16 md:py-24 relative">
          <div className="absolute inset-0 -z-10 bg-grid-pattern opacity-[0.02]"></div>
          <div className="container">
            <motion.div
              className="mx-auto max-w-3xl rounded-xl bg-gradient-to-r from-primary to-primary/80 p-8 text-center text-primary-foreground md:p-12 relative overflow-hidden"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true }}
            >
              <div className="absolute inset-0 bg-grid-pattern opacity-10"></div>
              <div className="absolute inset-0 bg-noise opacity-[0.03]"></div>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.1 }}
                viewport={{ once: true }}
              >
                <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">Ready to simplify Git?</h2>
                <p className="mt-4 text-primary-foreground/90">
                  Join thousands of developers who have transformed their Git workflow with Git Friend.
                </p>
                <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
                  <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                    <Button variant="secondary" size="lg" className="shadow-xl">
                      Start Free Trial
                    </Button>
                  </motion.div>
                  <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                    <Button
                      variant="outline"
                      size="lg"
                      className="bg-transparent border-primary-foreground/20 text-primary-foreground hover:bg-primary-foreground/10 shadow-xl"
                    >
                      Schedule Demo
                    </Button>
                  </motion.div>
                </div>
              </motion.div>
            </motion.div>
          </div>
        </section>
      </main>
      <footer className="border-t py-12 md:py-16 relative">
        <div className="absolute inset-0 -z-10 bg-grid-pattern opacity-[0.02]"></div>
        <div className="container">
          <div className="flex flex-col md:flex-row justify-between gap-8">
            <div className="space-y-4 md:max-w-xs">
              <div className="flex items-center gap-2">
                <GitBranch className="h-6 w-6" />
                <span className="text-xl font-bold">Git Friend</span>
              </div>
              <p className="text-sm text-muted-foreground">
                Git Friend simplifies Git workflows, making version control intuitive and collaborative for developers
                of all skill levels.
              </p>
              <div className="flex gap-4">
                <Link href="#" className="text-muted-foreground hover:text-foreground transition-colors">
                  <span className="sr-only">Twitter</span>
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="h-5 w-5"
                  >
                    <path d="M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17.3-18 11.6 2.2.1 4.4-.6 6-2C3 15.5.5 9.6 3 5c2.2 2.6 5.6 4.1 9 4-.9-4.2 4-6.6 7-3.8 1.1 0 3-1.2 3-1.2z"></path>
                  </svg>
                </Link>
                <Link href="#" className="text-muted-foreground hover:text-foreground transition-colors">
                  <span className="sr-only">GitHub</span>
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="h-5 w-5"
                  >
                    <path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4"></path>
                    <path d="M9 18c-4.51 2-5-2-7-2"></path>
                  </svg>
                </Link>
                <Link href="#" className="text-muted-foreground hover:text-foreground transition-colors">
                  <span className="sr-only">LinkedIn</span>
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="h-5 w-5"
                  >
                    <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"></path>
                    <rect width="4" height="12" x="2" y="9"></rect>
                    <circle cx="4" cy="4" r="2"></circle>
                  </svg>
                </Link>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-8 sm:grid-cols-3">
              <div className="space-y-4">
                <h3 className="text-sm font-semibold">Product</h3>
                <ul className="space-y-2">
                  <li>
                    <Link href="#" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                      Features
                    </Link>
                  </li>
                  <li>
                    <Link href="#" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                      Pricing
                    </Link>
                  </li>
                  <li>
                    <Link href="#" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                      Integrations
                    </Link>
                  </li>
                  <li>
                    <Link href="#" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                      Changelog
                    </Link>
                  </li>
                </ul>
              </div>
              <div className="space-y-4">
                <h3 className="text-sm font-semibold">Resources</h3>
                <ul className="space-y-2">
                  <li>
                    <Link href="#" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                      Documentation
                    </Link>
                  </li>
                  <li>
                    <Link href="#" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                      Tutorials
                    </Link>
                  </li>
                  <li>
                    <Link href="#" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                      Blog
                    </Link>
                  </li>
                  <li>
                    <Link href="#" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                      Community
                    </Link>
                  </li>
                </ul>
              </div>
              <div className="space-y-4">
                <h3 className="text-sm font-semibold">Company</h3>
                <ul className="space-y-2">
                  <li>
                    <Link href="#" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                      About
                    </Link>
                  </li>
                  <li>
                    <Link href="#" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                      Careers
                    </Link>
                  </li>
                  <li>
                    <Link href="#" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                      Contact
                    </Link>
                  </li>
                  <li>
                    <Link href="#" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                      Privacy
                    </Link>
                  </li>
                </ul>
              </div>
            </div>
          </div>
          <div className="mt-8 border-t pt-8">
            <p className="text-center text-xs text-muted-foreground">
              © {new Date().getFullYear()} Git Friend. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}

