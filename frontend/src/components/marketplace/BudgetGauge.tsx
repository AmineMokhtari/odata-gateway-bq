'use client'

import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { formatBytes } from '@common/src/utils/units';
import { ShieldCheck, AlertTriangle, XCircle } from 'lucide-react';

interface BudgetGaugeProps {
  estimatedBytes: number;
  budgetBytes: number;
}

export const BudgetGauge: React.FC<BudgetGaugeProps> = ({ estimatedBytes, budgetBytes }) => {
  const percentage = Math.min((estimatedBytes / budgetBytes) * 100, 100);
  
  // State detection
  let state: 'safety' | 'caution' | 'blocked' = 'safety';
  if (percentage >= 100) state = 'blocked';
  else if (percentage >= 80) state = 'caution';

  const colors = {
    safety: 'bg-emerald-500',
    caution: 'bg-amber-500',
    blocked: 'bg-red-600'
  };

  const icons = {
    safety: <ShieldCheck className="w-12 h-12 text-emerald-600" />,
    caution: <AlertTriangle className="w-12 h-12 text-amber-600" />,
    blocked: <XCircle className="w-12 h-12 text-red-600" />
  };

  return (
    <div className="w-full space-y-8">
      {/* Visual Status Indicator */}
      <div className="flex flex-col items-center text-center space-y-4">
        <div className={cn(
          "w-24 h-24 rounded-full flex items-center justify-center border-4 border-white shadow-2xl",
          state === 'safety' && "bg-emerald-50",
          state === 'caution' && "bg-amber-50",
          state === 'blocked' && "bg-red-50"
        )}>
          {icons[state]}
        </div>
        <div>
          <h2 className={cn(
            "text-3xl font-extrabold font-inter uppercase tracking-tight",
            state === 'safety' && "text-emerald-700",
            state === 'caution' && "text-amber-700",
            state === 'blocked' && "text-red-700"
          )}>
            {state === 'blocked' ? 'Query Blocked' : state === 'caution' ? 'Caution' : 'Query Safe'}
          </h2>
          <p className="text-slate-500 font-medium max-w-sm mx-auto">
            {state === 'blocked' 
              ? "This request exceeds your organization's scan budget for this dataset."
              : "This request is within your departmental scan limits."}
          </p>
        </div>
      </div>

      {/* Progress Gauge */}
      <div className="space-y-4 p-8 bg-white border border-slate-200 rounded-3xl shadow-xl shadow-indigo-50">
        <div className="flex justify-between items-end">
          <div className="space-y-1">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Estimated Scan</span>
            <p className="text-2xl font-black text-slate-900 mono tracking-tighter">
              {formatBytes(estimatedBytes)}
            </p>
          </div>
          <div className="text-right space-y-1">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Allowed Budget</span>
            <p className="text-2xl font-black text-indigo-700 mono tracking-tighter">
              {formatBytes(budgetBytes)}
            </p>
          </div>
        </div>

        <div className="h-6 w-full bg-slate-100 rounded-full overflow-hidden border border-slate-200 p-1">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${percentage}%` }}
            transition={{ duration: 1.5, ease: "easeOut" }}
            className={cn(
              "h-full rounded-full relative",
              colors[state]
            )}
          >
            <div className="absolute inset-0 bg-white/20 animate-pulse" />
          </motion.div>
        </div>

        <div className="flex justify-between text-[10px] font-bold text-slate-400 uppercase">
          <span>0 GB</span>
          <span>{percentage.toFixed(0)}% of limit</span>
          <span>{formatBytes(budgetBytes)}</span>
        </div>
      </div>
    </div>
  );
};
