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
              className="absolute inset-0 rounded-full bg-emerald-500"
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
              className="absolute inset-0 rounded-full bg-red-500"
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
              className="absolute inset-0 rounded-full bg-amber-400/20"
            />
          )}
        </AnimatePresence>

        <motion.div
          animate={state === 'verifying' ? { rotate: 360 } : {}}
          transition={state === 'verifying' ? { duration: 2, repeat: Infinity, ease: "linear" } : {}}
          className={cn(
            "relative z-10 w-16 h-16 rounded-full flex items-center justify-center border-4 border-white shadow-xl transition-colors duration-500",
            state === 'listening' && "bg-amber-500",
            state === 'verifying' && "bg-indigo-600",
            state === 'connected' && "bg-emerald-600",
            state === 'blocked' && "bg-red-600"
          )}
        >
          {state === 'listening' && <Wifi className="w-8 h-8 text-white animate-pulse" />}
          {state === 'verifying' && <Zap className="w-8 h-8 text-white" />}
          {state === 'connected' && <CheckCircle2 className="w-8 h-8 text-white" />}
          {state === 'blocked' && <AlertCircle className="w-8 h-8 text-white animate-bounce" />}
        </motion.div>
      </div>

      <div className="text-center space-y-1">
        <Badge 
          className={cn(
            "px-3 py-1 font-bold uppercase tracking-tighter transition-colors duration-500",
            state === 'listening' && "bg-amber-100 text-amber-700 hover:bg-amber-100",
            state === 'verifying' && "bg-indigo-100 text-indigo-700 hover:bg-indigo-100",
            state === 'connected' && "bg-emerald-100 text-emerald-700 hover:bg-emerald-100",
            state === 'blocked' && "bg-red-100 text-red-700 hover:bg-red-100"
          )}
        >
          {state === 'listening' && 'Listening...'}
          {state === 'verifying' && 'Verifying...'}
          {state === 'connected' && 'Connection Active'}
          {state === 'blocked' && 'Action Required'}
        </Badge>
        
        {state === 'connected' && lastActive && (
          <p className="text-[10px] font-bold text-slate-400 uppercase">
            Last seen {getRelativeTime(lastActive)}
          </p>
        )}
        {state === 'listening' && (
          <p className="text-[10px] font-bold text-slate-400 uppercase animate-pulse">
            Waiting for Excel / Power BI
          </p>
        )}
        {state === 'blocked' && (
          <p className="text-[10px] font-bold text-red-400 uppercase">
            Click for Elena&apos;s Tip
          </p>
        )}
      </div>
    </div>
  );
};
