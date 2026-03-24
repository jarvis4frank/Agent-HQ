import { useEffect, useRef, useCallback, useState } from 'react'

/**
 * Animation frame configuration.
 */
export interface AnimationConfig {
  /** Duration of each frame in ms */
  frameDuration?: number
  /** Number of frames in the animation */
  frameCount?: number
  /** Whether to loop the animation */
  loop?: boolean
}

/**
 * Hook for managing text-based animations (like loading spinners).
 */
export function useAnimation(
  config: AnimationConfig = {},
) {
  const {
    frameDuration = 100,
    frameCount = 4,
    loop = true,
  } = config

  const [frame, setFrame] = useState(0)
  const [isPlaying, setIsPlaying] = useState(false)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  /**
   * Start the animation.
   */
  const play = useCallback(() => {
    if (intervalRef.current) return
    setIsPlaying(true)
    intervalRef.current = setInterval(() => {
      setFrame((prev) => {
        if (prev >= frameCount - 1) {
          if (loop) return 0
          // Stop if not looping
          stop()
          return prev
        }
        return prev + 1
      })
    }, frameDuration)
  }, [frameCount, frameDuration, loop])

  /**
   * Stop the animation.
   */
  const stop = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }
    setIsPlaying(false)
    setFrame(0)
  }, [])

  /**
   * Pause the animation (keeps current frame).
   */
  const pause = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }
    setIsPlaying(false)
  }, [])

  /**
   * Reset to first frame.
   */
  const reset = useCallback(() => {
    setFrame(0)
    if (isPlaying) {
      stop()
    }
  }, [isPlaying, stop])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [])

  return {
    frame,
    isPlaying,
    play,
    stop,
    pause,
    reset,
  }
}

/**
 * Predefined animation frames for common use cases.
 */
export const ANIMATIONS = {
  /** Loading spinner frames */
  spinner: ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏'],

  /** Simple dots animation */
  dots: ['   ', '.  ', '.. ', '...', ' ..', '  .', '   '],

  /** Pulse animation */
  pulse: ['●   ', ' ●  ', '  ● ', '   ●', '  ● ', ' ●  '],

  /** Arrow progress */
  arrow: ['→   ', '→→  ', '→→→ ', ' →→→', '  →→', '   →'],
} as const

/**
 * Hook for a specific named animation.
 */
export function useNamedAnimation(
  name: keyof typeof ANIMATIONS,
  config: Partial<Omit<AnimationConfig, 'frameCount'>> = {},
) {
  const frames = ANIMATIONS[name]
  const { frame, isPlaying, play, stop, pause, reset } = useAnimation({
    ...config,
    frameCount: frames.length,
  })

  return {
    frame,
    frameCount: frames.length,
    currentFrame: frames[frame],
    frames,
    isPlaying,
    play,
    stop,
    pause,
    reset,
  }
}
