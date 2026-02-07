'use client';

import { useRef, useState, useCallback } from 'react';

interface UseInViewOptions {
  /** Fraction of element visible before triggering (0-1). Default 0.15 */
  threshold?: number;
  /** Root margin string, e.g. "0px 0px -50px 0px". Default "-40px" */
  rootMargin?: string;
  /** Fire only once, then disconnect. Default true */
  once?: boolean;
}

/**
 * Lightweight scroll-reveal hook.
 * Returns a ref callback and a boolean `inView`.
 *
 * Usage:
 *   const { ref, inView } = useInView();
 *   <div ref={ref} className={inView ? 'animate-reveal' : 'opacity-0'} />
 */
export function useInView(options: UseInViewOptions = {}) {
  const { threshold = 0.15, rootMargin = '-40px', once = true } = options;

  const [inView, setInView] = useState(false);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const nodeRef = useRef<Element | null>(null);

  const ref = useCallback(
    (node: Element | null) => {
      // Cleanup previous observer
      if (observerRef.current) {
        observerRef.current.disconnect();
        observerRef.current = null;
      }

      if (!node) {
        nodeRef.current = null;
        return;
      }

      nodeRef.current = node;

      if (typeof IntersectionObserver === 'undefined') {
        setInView(true);
        return;
      }

      observerRef.current = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting) {
            setInView(true);
            if (once) {
              observerRef.current?.disconnect();
              observerRef.current = null;
            }
          } else if (!once) {
            setInView(false);
          }
        },
        { threshold, rootMargin },
      );

      observerRef.current.observe(node);
    },
    [threshold, rootMargin, once],
  );

  return { ref, inView };
}
