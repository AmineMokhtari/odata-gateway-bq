/**
 * Copyright 2026 Amine MOKHTARI
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

'use client'

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Badge } from '@/components/ui/badge';
import { Zap, Wifi, CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils';

export type ConnectionState = 'listening' | 'verifying' | 'connected' | 'blocked';

interface SuccessPulseBadgeProps {
  state: ConnectionState;
  lastActive?: number | null;
}

import { AlertCircle } from 'lucide-react';
import { useProjectStore } from '@/store/project-store';

export const SuccessPulseBadge: React.FC<SuccessPulseBadgeProps> = ({ state, lastActive }) => {
  const { openElenaDrawer, activeTip } = useProjectStore();

  const getRelativeTime = (time: number) => {
    const seconds = Math.floor((Date.now() - time) / 1000);
    if (seconds < 60) return 'Just now';
    const minutes = Math.floor(seconds / 60);
    return `${minutes}m ago`;
  };

  const handleBadgeClick = () => {
    if (state === 'blocked' && activeTip) {
      openElenaDrawer();
    }
  };

  return (
    <div 
      className={cn(
        "flex flex-col items-center gap-3 transition-transform active:scale-95",
        state === 'blocked' && "cursor-pointer"
      )}
      onClick={handleBadgeClick}
      data-testid="pulse-badge"
      data-state={state}
    >
      <div className="relative">
        <AnimatePresence mode="wait">
          {state === 'connected' && (
            <motion.div
              key="connected-pulse"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ 
                scale: [1, 1.4, 1],
                opacity: [0.3, 0.1, 0.3]
              }}
              transition={{ 
                duration: 2, 
                repeat: Infinity,
                ease: "easeInOut"
              }}
              className="absolute inset-0 rounded-full bg-success"
            />
          )}
          {state === 'blocked' && (
            <motion.div
              key="blocked-pulse"
              animate={{ 
                scale: [1, 1.2, 1],
                opacity: [0.5, 0.2, 0.5]
              }}
              transition={{ 
                duration: 1.5, 
                repeat: Infinity,
                ease: "easeInOut"
              }}
              className="absolute inset-0 rounded-full bg-destructive"
            />
          )}
          {state === 'listening' && (
            <motion.div
              key="listening-pulse"
              animate={{ 
                opacity: [0.4, 0.8, 0.4]
              }}
              transition={{ 
                duration: 3, 
                repeat: Infinity,
                ease: "easeInOut"
              }}
              className="absolute inset-0 rounded-full bg-warning/20"
            />
          )}
        </AnimatePresence>

        <motion.div
          animate={state === 'verifying' ? { rotate: 360 } : {}}
          transition={state === 'verifying' ? { duration: 2, repeat: Infinity, ease: "linear" } : {}}
          className={cn(
            "relative z-10 w-16 h-16 rounded-full flex items-center justify-center border-4 border-background shadow-xl transition-colors duration-500",
            state === 'listening' && "bg-warning",
            state === 'verifying' && "bg-primary",
            state === 'connected' && "bg-success",
            state === 'blocked' && "bg-destructive"
          )}
        >
          {state === 'listening' && <Wifi className="w-8 h-8 text-warning-foreground animate-pulse" />}
          {state === 'verifying' && <Zap className="w-8 h-8 text-primary-foreground" />}
          {state === 'connected' && <CheckCircle2 className="w-8 h-8 text-success-foreground" />}
          {state === 'blocked' && <AlertCircle className="w-8 h-8 text-destructive-foreground animate-bounce" />}
        </motion.div>
      </div>

      <div className="text-center space-y-1">
        <Badge 
          className={cn(
            "px-3 py-1 font-bold uppercase tracking-tighter transition-colors duration-500",
            state === 'listening' && "bg-warning/10 text-warning hover:bg-warning/20",
            state === 'verifying' && "bg-accent text-primary hover:bg-accent/80",
            state === 'connected' && "bg-success/10 text-success hover:bg-success/20",
            state === 'blocked' && "bg-destructive/10 text-destructive hover:bg-destructive/20"
          )}
        >
          {state === 'listening' && 'Listening...'}
          {state === 'verifying' && 'Verifying...'}
          {state === 'connected' && 'Connection Active'}
          {state === 'blocked' && 'Action Required'}
        </Badge>
        
        {state === 'connected' && lastActive && (
          <p className="text-[10px] font-bold text-muted-foreground uppercase">
            Last seen {getRelativeTime(lastActive)}
          </p>
        )}
        {state === 'listening' && (
          <p className="text-[10px] font-bold text-muted-foreground uppercase animate-pulse">
            Waiting for Excel / Power BI
          </p>
        )}
        {state === 'blocked' && (
          <p className="text-[10px] font-bold text-destructive uppercase">
            Click for Elena&apos;s Tip
          </p>
        )}
      </div>
    </div>
  );
};
