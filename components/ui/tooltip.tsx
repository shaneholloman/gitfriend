"use client"

import * as React from "react"
import { motion } from "framer-motion"
import * as TooltipPrimitive from "@radix-ui/react-tooltip"

import { cn } from "@/lib/utils"

// TooltipProvider with enhanced props
interface TooltipProviderProps {
  children: React.ReactNode
  openDelay?: number
  closeDelay?: number
  transition?: {
    type: "spring" | "tween"
    stiffness?: number
    damping?: number
    duration?: number
  }
}

function TooltipProvider({
  children,
  openDelay = 0,
  closeDelay = 300,
  transition = { type: "spring", stiffness: 300, damping: 35 },
}: TooltipProviderProps) {
  return (
    <TooltipPrimitive.Provider delayDuration={openDelay} skipDelayDuration={closeDelay}>
      {children}
    </TooltipPrimitive.Provider>
  )
}

// Tooltip with enhanced props
interface TooltipProps {
  children: React.ReactNode
  side?: "top" | "right" | "bottom" | "left"
  sideOffset?: number
  align?: "start" | "center" | "end"
  alignOffset?: number
}

function Tooltip({ children, side = "top", sideOffset = 10, align = "center", alignOffset = 0 }: TooltipProps) {
  return <TooltipPrimitive.Root>{children}</TooltipPrimitive.Root>
}

// TooltipTrigger with motion support
interface TooltipTriggerProps {
  children: React.ReactNode
  asChild?: boolean
  className?: string
}

const TooltipTrigger = React.forwardRef<React.ElementRef<typeof TooltipPrimitive.Trigger>, TooltipTriggerProps>(
  ({ children, asChild = false, className, ...props }, ref) => (
    <TooltipPrimitive.Trigger ref={ref} asChild={asChild} className={cn("", className)} {...props}>
      {children}
    </TooltipPrimitive.Trigger>
  ),
)
TooltipTrigger.displayName = TooltipPrimitive.Trigger.displayName

// TooltipContent with motion animations
interface TooltipContentProps {
  children: React.ReactNode
  className?: string
  layout?: boolean | "position" | "size" | "preserve-aspect"
  side?: "top" | "right" | "bottom" | "left"
  sideOffset?: number
  align?: "start" | "center" | "end"
  alignOffset?: number
}

const TooltipContent = React.forwardRef<React.ElementRef<typeof TooltipPrimitive.Content>, TooltipContentProps>(
  (
    {
      children,
      className,
      layout = "preserve-aspect",
      side = "right",
      sideOffset = 10,
      align = "center",
      alignOffset = 0,
      ...props
    },
    ref,
  ) => {
    return (
      <TooltipPrimitive.Content
        ref={ref}
        side={side}
        sideOffset={sideOffset}
        align={align}
        alignOffset={alignOffset}
        className={cn(
          "z-50 w-fit rounded-lg border border-white/40 bg-white/95 backdrop-blur-md text-gray-900 shadow-2xl relative",
          "will-change-transform will-change-opacity",
          "before:absolute before:inset-0 before:rounded-lg before:bg-gradient-to-br before:from-white/60 before:to-white/30 before:pointer-events-none",
          className,
        )}
        {...props}
      >
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 rounded-lg bg-gradient-to-br from-white/40 via-white/20 to-transparent"
        />
        <motion.div
          className="overflow-hidden px-3 py-2 text-sm font-medium text-pretty relative z-10"
          initial={{ opacity: 0, scale: 0.96, filter: "blur(4px)" }}
          animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
          exit={{ opacity: 0, scale: 0.96, filter: "blur(4px)" }}
          transition={{ type: "spring", stiffness: 300, damping: 30, duration: 0.18 }}
          layout={layout}
        >
          <motion.div layout={layout}>{children}</motion.div>
        </motion.div>
        <TooltipPrimitive.Arrow className="fill-white/95" />
      </TooltipPrimitive.Content>
    )
  },
)
TooltipContent.displayName = TooltipPrimitive.Content.displayName

export {
  TooltipProvider,
  Tooltip,
  TooltipTrigger,
  TooltipContent,
  type TooltipProviderProps,
  type TooltipProps,
  type TooltipTriggerProps,
  type TooltipContentProps,
}