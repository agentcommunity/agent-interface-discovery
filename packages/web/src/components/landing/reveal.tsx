'use client';

import { useInView } from '@/hooks/use-in-view';

type Direction = 'up' | 'down' | 'left' | 'right' | 'none';

interface RevealProps {
  children: React.ReactNode;
  /** Entrance direction. Default "up" */
  direction?: Direction;
  /** Extra delay in ms. Default 0 */
  delay?: number;
  /** Animation duration in ms. Default 600 */
  duration?: number;
  /** Distance in px for translate. Default 24 */
  distance?: number;
  /** className forwarded to the wrapper div */
  className?: string;
  /** IntersectionObserver threshold. Default 0.15 */
  threshold?: number;
}

const translateMap: Record<Direction, (d: number) => string> = {
  up: (d) => `translateY(${d}px)`,
  down: (d) => `translateY(-${d}px)`,
  left: (d) => `translateX(${d}px)`,
  right: (d) => `translateX(-${d}px)`,
  none: () => 'none',
};

/**
 * Lightweight scroll-reveal wrapper.
 * Animates children into view when they cross the viewport threshold.
 */
export function Reveal({
  children,
  direction = 'up',
  delay = 0,
  duration = 600,
  distance = 24,
  className = '',
  threshold = 0.15,
}: RevealProps) {
  const { ref, inView } = useInView({ threshold });

  const hidden = {
    opacity: 0,
    transform: translateMap[direction](distance),
  };

  const visible = {
    opacity: 1,
    transform: 'translateY(0) translateX(0)',
  };

  return (
    <div
      ref={ref}
      className={className}
      style={{
        ...(inView ? visible : hidden),
        transition: `opacity ${duration}ms cubic-bezier(.22,1,.36,1) ${delay}ms, transform ${duration}ms cubic-bezier(.22,1,.36,1) ${delay}ms`,
        willChange: 'opacity, transform',
      }}
    >
      {children}
    </div>
  );
}

/**
 * Convenience: stagger a list of children.
 * Each child gets an incremental delay.
 */
export function RevealStagger({
  children,
  direction = 'up',
  staggerMs = 80,
  baseDelay = 0,
  duration = 600,
  distance = 24,
  className = '',
  itemClassName = '',
  threshold = 0.1,
}: {
  children: React.ReactNode[];
  direction?: Direction;
  staggerMs?: number;
  baseDelay?: number;
  duration?: number;
  distance?: number;
  className?: string;
  itemClassName?: string;
  threshold?: number;
}) {
  const { ref, inView } = useInView({ threshold });

  return (
    <div ref={ref} className={className}>
      {children.map((child, i) => {
        const delay = baseDelay + i * staggerMs;
        const hidden = {
          opacity: 0,
          transform: translateMap[direction](distance),
        };
        const visible = {
          opacity: 1,
          transform: 'translateY(0) translateX(0)',
        };
        return (
          <div
            key={i}
            className={itemClassName}
            style={{
              ...(inView ? visible : hidden),
              transition: `opacity ${duration}ms cubic-bezier(.22,1,.36,1) ${delay}ms, transform ${duration}ms cubic-bezier(.22,1,.36,1) ${delay}ms`,
              willChange: 'opacity, transform',
            }}
          >
            {child}
          </div>
        );
      })}
    </div>
  );
}
