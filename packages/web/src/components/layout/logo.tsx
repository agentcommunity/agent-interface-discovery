'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import {
  ContextMenu,
  ContextMenuTrigger,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
} from '@/components/ui/context-menu';
import Link from 'next/link';

interface LogoProps {
  className?: string;
  asLink?: boolean;
}

export function Logo({ className, asLink }: LogoProps) {
  const [isHovered, setIsHovered] = useState(false);

  const letterVariants = {
    initial: { opacity: 0 },
    hover: (i: number) => ({
      opacity: 1,
      transition: {
        delay: i * 0.1,
        duration: 0.3,
        ease: 'easeOut',
      },
    }),
  };

  const logoContent = (
    <div
      className={cn('flex items-center', className)}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <motion.div
        className="px-3 py-1.5 bg-background/80 backdrop-blur-sm border border-border/50 rounded-lg shadow-sm hover:shadow-md transition-shadow duration-300"
        whileHover={{ scale: 1.02 }}
        transition={{ duration: 0.2 }}
      >
        <div className="flex items-center font-inter text-xl font-semibold text-foreground">
          <h5>_a</h5>
          <AnimatePresence>
            {isHovered && (
              <>
                <motion.h5
                  custom={0}
                  variants={letterVariants}
                  initial="initial"
                  animate="hover"
                  exit="initial"
                >
                  g
                </motion.h5>
                <motion.h5
                  custom={1}
                  variants={letterVariants}
                  initial="initial"
                  animate="hover"
                  exit="initial"
                >
                  e
                </motion.h5>
                <motion.h5
                  custom={2}
                  variants={letterVariants}
                  initial="initial"
                  animate="hover"
                  exit="initial"
                >
                  n
                </motion.h5>
                <motion.h5
                  custom={3}
                  variants={letterVariants}
                  initial="initial"
                  animate="hover"
                  exit="initial"
                >
                  t
                </motion.h5>
              </>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );

  return (
    <ContextMenu>
      <ContextMenuTrigger asChild>
        {asLink ? (
          <Link href="/" aria-label="Home">
            {logoContent}
          </Link>
        ) : (
          logoContent
        )}
      </ContextMenuTrigger>
      <ContextMenuContent>
        {/* TODO: Ensure these files exist in /public/logo */}
        <ContextMenuItem asChild>
          <span> SVG</span>
          <a href="/logo/a.svg" download>
            Download _a.svg
          </a>
        </ContextMenuItem>
        <ContextMenuItem asChild>
          <a href="/logo/agent.svg" download>
            Download _agent.svg
          </a>
        </ContextMenuItem>
        <ContextMenuSeparator />
        <ContextMenuItem asChild>
          <a href="/logo/a.png" download>
            Download _a.png
          </a>
        </ContextMenuItem>
        <ContextMenuItem asChild>
          <a href="/logo/agent.png" download>
            Download _agent.png
          </a>
        </ContextMenuItem>
        <ContextMenuItem asChild>
          <a href="logo/agent_interface_discvovery.png" download>
            Download _agent Discovery Interface.png
          </a>
        </ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  );
}
