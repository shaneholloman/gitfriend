"use client"

import * as React from "react"
import { motion } from "motion/react"
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
          "z-50 w-fit rounded-md border border-[hsl(var(--border))/60] bg-[hsl(var(--popover)/0.82)] text-[hsl(var(--popover-foreground))] shadow-md backdrop-blur-md relative",
          "will-change-transform will-change-opacity",
          className,
        )}
        {...props}
      >
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-15"
          style={{
            backgroundImage: "radial-gradient(hsl(var(--border)) 0.75px, transparent 0.75px)",
            backgroundSize: "7px 7px",
          }}
        />
        <motion.div
          className="overflow-hidden px-3 py-1.5 text-xs text-pretty"
          initial={{ opacity: 0, scale: 0.96, filter: "blur(6px) saturate(0.95) brightness(0.98)" }}
          animate={{ opacity: 1, scale: 1, filter: "blur(0px) saturate(1) brightness(1)" }}
          exit={{ opacity: 0, scale: 0.96, filter: "blur(6px) saturate(0.95) brightness(0.98)" }}
          transition={{ type: "spring", stiffness: 300, damping: 30, duration: 0.18 }}
          layout={layout}
        >
          <motion.div layout={layout}>{children}</motion.div>
        </motion.div>
        <TooltipPrimitive.Arrow className="fill-[hsl(var(--border)/0.6)]" />
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
