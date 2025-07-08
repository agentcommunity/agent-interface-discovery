'use client';

import { useState, useEffect, useRef } from 'react';

interface TypewriterProps {
  text: string;
  speed?: number;
  className?: string;
  onComplete?: () => void;
}

export function Typewriter({ text, speed = 20, className, onComplete }: TypewriterProps) {
  const [currentIndex, setCurrentIndex] = useState(0);

  // Use a ref to hold the onComplete callback. This prevents the effect from re-running
  // if the parent component re-renders and provides a new function instance.
  const onCompleteRef = useRef(onComplete);
  useEffect(() => {
    onCompleteRef.current = onComplete;
  }, [onComplete]);

  useEffect(() => {
    setCurrentIndex(0); // Reset for new text

    if (!text) {
      onCompleteRef.current?.();
      return;
    }

    const timer = setInterval(() => {
      setCurrentIndex((prevIndex) => {
        if (prevIndex >= text.length) {
          clearInterval(timer);
          onCompleteRef.current?.();
          return prevIndex;
        }
        return prevIndex + 1;
      });
    }, speed);

    // Cleanup function to stop the interval if the component unmounts mid-animation.
    return () => clearInterval(timer);
  }, [text, speed]); // Only re-run the effect if the text or speed changes.

  const displayText = text.slice(0, currentIndex);
  const isComplete = currentIndex >= text.length;

  return (
    <div className={className}>
      {displayText}
      {!isComplete && <span className="animate-pulse">|</span>}
    </div>
  );
}
