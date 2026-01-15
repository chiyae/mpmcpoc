"use client"

import * as React from "react"
import { Check, Loader } from "lucide-react"

import { cn } from "@/lib/utils"

// -----------------------------------------------------------------------------
// Context
// -----------------------------------------------------------------------------

type StepperContextValue = {
  currentStep: number
  steps: number[]
  isLastStep: boolean
  isStepOptional: (step: number) => boolean
  isStepCompleted: (step: number) => boolean
  isStepLoading: (step: number) => boolean
  onStepClick: (step: number) => void
  setSteps: React.Dispatch<React.SetStateAction<number[]>>
}

const StepperContext = React.createContext<StepperContextValue | null>(null)

function useStepper() {
  const context = React.useContext(StepperContext)
  if (!context) {
    throw new Error("useStepper must be used within a <Stepper />")
  }
  return context
}

// -----------------------------------------------------------------------------
// Stepper
// -----------------------------------------------------------------------------

type StepperProps = React.ComponentProps<"div"> & {
  initialStep?: number
  currentStep?: number
  onStepClick?: (step: number) => void
  optionalSteps?: number[]
  loadingSteps?: number[]
}

const Stepper = React.forwardRef<HTMLDivElement, StepperProps>(
  (
    {
      initialStep = 0,
      currentStep: currentStepProp = 0,
      onStepClick,
      optionalSteps = [],
      loadingSteps = [],
      className,
      children,
      ...props
    },
    ref
  ) => {
    const [steps, setSteps] = React.useState<number[]>([])

    const isLastStep = currentStepProp === steps.length - 1

    const isStepOptional = (step: number) => optionalSteps.includes(step)
    const isStepCompleted = (step: number) => step < currentStepProp
    const isStepLoading = (step: number) => loadingSteps.includes(step)

    const contextValue = React.useMemo(
      () => ({
        currentStep: currentStepProp,
        steps,
        isLastStep,
        isStepOptional,
        isStepCompleted,
        isStepLoading,
        onStepClick: onStepClick || (() => {}),
        setSteps,
      }),
      [
        currentStepProp,
        steps,
        isLastStep,
        isStepOptional,
        isStepCompleted,
        isStepLoading,
        onStepClick,
      ]
    )

    return (
      <StepperContext.Provider value={contextValue}>
        <div
          ref={ref}
          className={cn("flex w-full items-center", className)}
          {...props}
        >
          {children}
        </div>
      </StepperContext.Provider>
    )
  }
)
Stepper.displayName = "Stepper"

// -----------------------------------------------------------------------------
// Stepper Item
// -----------------------------------------------------------------------------

type StepperItemProps = React.ComponentProps<"div">

const StepperItem = React.forwardRef<HTMLDivElement, StepperItemProps>(
  ({ className, children, ...props }, ref) => {
    const { steps, setSteps } = useStepper()

    const step = React.useMemo(() => steps.length, [steps])

    React.useEffect(() => {
      setSteps((prev) => [...prev, step])

      return () => {
        setSteps((prev) => prev.filter((s) => s !== step))
      }
    }, [step, setSteps])

    return (
      <div
        ref={ref}
        className={cn(
          "flex flex-1 items-center gap-x-4 last:flex-initial",
          className
        )}
        {...props}
      >
        {children}
      </div>
    )
  }
)
StepperItem.displayName = "StepperItem"

// -----------------------------------------------------------------------------
// Stepper Indicator
// -----------------------------------------------------------------------------

type StepperIndicatorProps = React.ComponentProps<"button">

const StepperIndicator = React.forwardRef<
  HTMLButtonElement,
  StepperIndicatorProps
>(({ className, children, ...props }, ref) => {
  const {
    currentStep,
    isStepCompleted,
    isStepLoading,
    onStepClick,
    steps,
  } = useStepper()

  const step = React.useMemo(() => steps.length, [steps])
  const isActive = step === currentStep
  const isCompleted = isStepCompleted(step)
  const isLoading = isStepLoading(step)

  return (
    <button
      ref={ref}
      className={cn(
        "flex h-8 w-8 items-center justify-center rounded-full text-sm font-medium ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
        isActive
          ? "border-2 border-primary text-primary"
          : isCompleted
            ? "border-2 border-primary bg-primary text-primary-foreground"
            : "border-2 border-border bg-transparent text-muted-foreground",
        className
      )}
      onClick={() => onStepClick(step)}
      {...props}
    >
      {isLoading ? (
        <Loader className="h-4 w-4 animate-spin" />
      ) : isCompleted ? (
        <Check className="h-4 w-4" />
      ) : (
        children
      )}
    </button>
  )
})
StepperIndicator.displayName = "StepperIndicator"

// -----------------------------------------------------------------------------
// Stepper Separator
// -----------------------------------------------------------------------------

type StepperSeparatorProps = React.ComponentProps<"div">

const StepperSeparator = React.forwardRef<
  HTMLDivElement,
  StepperSeparatorProps
>(({ className, ...props }, ref) => {
  const { isLastStep } = useStepper()
  if (isLastStep) return null

  return (
    <div
      ref={ref}
      className={cn("h-px flex-1 bg-border", className)}
      {...props}
    />
  )
})
StepperSeparator.displayName = "StepperSeparator"

// -----------------------------------------------------------------------------
// Stepper Content
// -----------------------------------------------------------------------------

type StepperContentProps = React.ComponentProps<"div">

const StepperContent = React.forwardRef<HTMLDivElement, StepperContentProps>(
  ({ className, children, ...props }, ref) => {
    const { currentStep } = useStepper()

    const step = React.useMemo(() => {
      const stepper = document.querySelector(`[data-stepper-id="${ref}"]`)
      if (!stepper) return 0
      const steps = Array.from(stepper.children)
      const stepperItem = stepper.closest("[data-stepper-item-id]")
      if (!stepperItem) return 0
      return steps.indexOf(stepperItem)
    }, [ref])

    const isActive = step === currentStep

    if (!isActive) return null

    return (
      <div
        ref={ref}
        className={cn("mt-4 text-sm text-muted-foreground", className)}
        {...props}
      >
        {children}
      </div>
    )
  }
)

StepperContent.displayName = "StepperContent"

// -----------------------------------------------------------------------------
// Stepper Label
// -----------------------------------------------------------------------------

type StepperLabelProps = React.ComponentProps<"p">

const StepperLabel = React.forwardRef<HTMLParagraphElement, StepperLabelProps>(
  ({ className, children, ...props }, ref) => {
    return (
      <p
        ref={ref}
        className={cn("text-sm font-medium text-foreground", className)}
        {...props}
      >
        {children}
      </p>
    )
  }
)
StepperLabel.displayName = "StepperLabel"

// -----------------------------------------------------------------------------
// Stepper Description
// -----------------------------------------------------------------------------

type StepperDescriptionProps = React.ComponentProps<"p">

const StepperDescription = React.forwardRef<
  HTMLParagraphElement,
  StepperDescriptionProps
>(({ className, children, ...props }, ref) => {
  return (
    <p
      ref={ref}
      className={cn("text-sm text-muted-foreground", className)}
      {...props}
    >
      {children}
    </p>
  )
})
StepperDescription.displayName = "StepperDescription"

export {
  Stepper,
  StepperItem,
  StepperIndicator,
  StepperSeparator,
  StepperContent,
  StepperLabel,
  StepperDescription,
}
