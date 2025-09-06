"use client";

import React, {
  forwardRef,
  useCallback,
  useImperativeHandle,
  useRef,
  useState,
  useEffect,
} from "react";
import {
  AnimatePresence,
  motion,
  useMotionValue,
  useSpring,
  useTransform,
  type PanInfo,
} from "framer-motion";
import { Loader2, SendHorizontal } from "lucide-react";

import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";
import { type VariantProps } from "class-variance-authority";
import { Skeleton } from "@/components/ui/skeleton";

const DRAG_THRESHOLD = 0.75;

const ANIMATION_CONFIG = {
  spring: {
    type: "spring",
    stiffness: 400,
    damping: 40,
    mass: 0.8,
  },
};

interface SlideButtonProps
  extends React.ComponentProps<"button">,
    VariantProps<typeof buttonVariants> {
  text?: string;
  loadingText?: string;
  fullWidth?: boolean;
  onSlideComplete?: () => void;
  isSubmitting?: boolean;
  isLoading?: boolean;
}

export interface SlideButtonRef {
  reset: () => void;
  showSubmitting: () => void;
}

const SlideButton = forwardRef<SlideButtonRef, SlideButtonProps>(
  (
    {
      className,
      text = "Slide to submit",
      loadingText = "Submitting...",
      fullWidth = false,
      onSlideComplete,
      disabled,
      isSubmitting = false,
      isLoading = false,
      ...props
    },
    ref
  ) => {
    const [isDragging, setIsDragging] = useState(false);
    const [slideCompleted, setSlideCompleted] = useState(false);
    const [showSubmittingState, setShowSubmittingState] = useState(false);
    const [containerWidth, setContainerWidth] = useState(0);
    const containerRef = useRef<HTMLDivElement | null>(null);

    const dragConstraints = React.useMemo(
      () => ({
        left: 0,
        right: Math.max(0, containerWidth - 60),
      }),
      [containerWidth]
    );

    const dragX = useMotionValue(0);
    const springX = useSpring(dragX, ANIMATION_CONFIG.spring);
    const dragProgress = useTransform(
      springX,
      [0, dragConstraints.right],
      [0, 1]
    );

    useImperativeHandle(ref, () => ({
      reset: () => {
        setSlideCompleted(false);
        setShowSubmittingState(false);
        setIsDragging(false);
        dragX.stop();
        dragX.set(0);
      },
      showSubmitting: () => {
        setShowSubmittingState(true);
        setSlideCompleted(false);
        dragX.set(0);
      },
    }));

    useEffect(() => {
      if (containerRef.current) {
        const updateWidth = () => {
          if (containerRef.current) {
            setContainerWidth(containerRef.current.offsetWidth);
          }
        };

        updateWidth();
        const resizeObserver = new ResizeObserver(updateWidth);
        resizeObserver.observe(containerRef.current);
        return () => resizeObserver.disconnect();
      }
    }, []);

    const handleDragStart = useCallback(() => {
      if (slideCompleted || disabled || isSubmitting || showSubmittingState)
        return;
      setIsDragging(true);
    }, [slideCompleted, disabled, isSubmitting, showSubmittingState]);

    const handleDragEnd = useCallback(() => {
      if (slideCompleted || disabled || isSubmitting || showSubmittingState)
        return;
      setIsDragging(false);

      const progress = dragProgress.get();
      if (progress >= DRAG_THRESHOLD) {
        dragX.set(dragConstraints.right);
        setSlideCompleted(true);
        onSlideComplete?.();
        setTimeout(() => {
          dragX.set(0);
        }, 200);
      } else {
        dragX.set(0);
      }
    }, [
      slideCompleted,
      disabled,
      isSubmitting,
      showSubmittingState,
      dragProgress,
      onSlideComplete,
      dragX,
      dragConstraints.right,
    ]);

    const handleDrag = useCallback(
      (_event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
        if (slideCompleted || disabled || isSubmitting || showSubmittingState)
          return;
        const newX = Math.max(
          0,
          Math.min(info.offset.x, dragConstraints.right)
        );
        dragX.set(newX);
      },
      [
        slideCompleted,
        disabled,
        isSubmitting,
        showSubmittingState,
        dragConstraints.right,
        dragX,
      ]
    );

    const backgroundWidth = useTransform(springX, (x) =>
      Math.min(x + 56, containerWidth - 4)
    );
    const textOpacity = useTransform(springX, [0, 20], [1, 0]);

    if (isLoading) {
      return (
        <div
          className={cn(
            "space-y-2",
            fullWidth && "w-full",
            !fullWidth && "w-64"
          )}
        >
          <Skeleton className="h-12 w-full rounded-lg" />
        </div>
      );
    }

    if (showSubmittingState || isSubmitting) {
      return (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className={cn(
            "relative flex h-12 items-center justify-center rounded-lg bg-primary text-primary-foreground",
            fullWidth && "w-full",
            !fullWidth && "w-64"
          )}
        >
          <div className="flex items-center gap-2">
            <Loader2 className="size-4 animate-spin" />
            <span className="text-sm font-medium">{loadingText}</span>
          </div>
        </motion.div>
      );
    }

    return (
      <motion.div
        ref={containerRef}
        className={cn(
          "relative flex h-12 items-center justify-center rounded-lg border bg-muted/30 overflow-hidden",
          fullWidth && "w-full",
          !fullWidth && "w-64",
          disabled && "opacity-50 cursor-not-allowed"
        )}
      >
        <motion.div
          style={{ width: backgroundWidth }}
          className="absolute inset-y-0 left-0 z-0 bg-primary"
          initial={{ borderRadius: "0.5rem" }}
          animate={{ borderRadius: "0.5rem" }}
        />

        <motion.div
          style={{ opacity: textOpacity }}
          className="absolute inset-0 flex items-center justify-center z-5 pointer-events-none select-none px-16"
        >
          <span className="text-sm font-medium">{text}</span>
        </motion.div>

        <AnimatePresence>
          {!showSubmittingState && !isSubmitting && (
            <motion.div
              drag={slideCompleted || disabled ? false : "x"}
              dragConstraints={dragConstraints}
              dragElastic={0.05}
              dragMomentum={false}
              onDragStart={handleDragStart}
              onDragEnd={handleDragEnd}
              onDrag={handleDrag}
              style={{ x: springX }}
              className={cn(
                "absolute left-1 z-10 flex cursor-grab items-center justify-center active:cursor-grabbing",
                (disabled || slideCompleted) && "cursor-not-allowed"
              )}
            >
              <motion.div className="flex h-10 w-14 z-10 items-center justify-center rounded-md bg-transparent">
                <SendHorizontal className="size-4 mr-2 text-white" />
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    );
  }
);

SlideButton.displayName = "SlideButton";

export default SlideButton;
