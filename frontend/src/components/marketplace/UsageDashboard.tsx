'use client'

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Activity, ShieldCheck, Zap, History, ChevronRight } from 'lucide-react';
import { motion } from 'framer-motion';

interface UsageJob {
  id: string;
  creationTime: string;
  bytes: number;
  status: 'DONE' | 'FAILURE' | 'PENDING';
}

interface UsageDashboardProps {
  totalBytesBilled: number;
  budgetBytes: number;
  lastJobs: UsageJob[];
  loading?: boolean;
}

export const UsageDashboard: React.FC<UsageDashboardProps> = ({ 
  totalBytesBilled, 
  budgetBytes, 
  lastJobs,
  loading = false 
}) => {
  const usedGb = totalBytesBilled / (1024 * 1024 * 1024);
  const budgetGb = budgetBytes / (1024 * 1024 * 1024);
  const percent = Math.min(Math.round((usedGb / budgetGb) * 100), 100);
  
  const formatter = new Intl.NumberFormat('en-US', { 
    maximumFractionDigits: 2,
    minimumFractionDigits: 2 
  });

  return (
    <Card className="border-slate-200 shadow-xl bg-white rounded-3xl overflow-hidden">
      <CardHeader className="bg-slate-50 border-b border-slate-100 pb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-indigo-700">
            <Activity className="w-5 h-5" />
            <span className="text-xs font-bold uppercase tracking-widest">Personal Usage Hub</span>
          </div>
          <div className="flex items-center gap-1.5 bg-emerald-50 text-emerald-700 px-2.5 py-1 rounded-full border border-emerald-100">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span className="text-[10px] font-bold uppercase">Budget Safe</span>
          </div>
        </div>
        <CardTitle className="text-2xl font-inter font-bold text-slate-900 mt-2">
          Your Monthly Consumption
        </CardTitle>
      </CardHeader>
      
      <CardContent className="p-8 space-y-10">
        {/* Main Gauge / Progress */}
        <div className="space-y-4">
          <div className="flex justify-between items-end">
            <div className="space-y-1">
              <p className="text-sm font-medium text-slate-500 uppercase tracking-tight">Total Scanned</p>
              <h2 className="text-4xl font-inter font-black text-slate-900">
                {formatter.format(usedGb)} <span className="text-lg font-bold text-slate-400">GB</span>
              </h2>
            </div>
            <div className="text-right">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Monthly Limit</p>
              <p className="text-sm font-bold text-slate-700">{formatter.format(budgetGb)} GB</p>
            </div>
          </div>
          
          <div className="relative pt-2">
            <Progress value={percent} className="h-4 bg-slate-100" />
            <motion.div 
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              style={{ left: `${percent}%` }}
              className="absolute top-0 -mt-8 -ml-4 flex flex-col items-center"
            >
              <span className="bg-indigo-600 text-white text-[10px] font-bold px-2 py-0.5 rounded shadow-lg">
                {percent}%
              </span>
              <div className="w-0 h-0 border-l-[4px] border-l-transparent border-r-[4px] border-r-transparent border-t-[4px] border-t-indigo-600" />
            </motion.div>
          </div>

          <div className="flex items-center gap-2 bg-indigo-50 p-4 rounded-2xl border border-indigo-100">
            <Zap className="w-5 h-5 text-indigo-600 fill-indigo-200" />
            <p className="text-xs font-medium text-indigo-900">
              {percent < 80 
                ? `You have ${formatter.format(budgetGb - usedGb)} GB remaining. You're doing great!` 
                : "You're approaching your limit. Try using filters to save budget."}
            </p>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <History className="w-4 h-4 text-slate-400" />
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-tight">Recent Queries</h3>
          </div>
          
          <div className="space-y-3">
            {lastJobs.map((job) => (
              <div key={job.id} className="flex items-center justify-between p-4 bg-white border border-slate-100 rounded-2xl hover:border-indigo-100 hover:shadow-md transition-all group">
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                    job.status === 'DONE' ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'
                  }`}>
                    <Activity className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-900 group-hover:text-indigo-700 transition-colors">
                      Job: {job.id.substring(0, 8)}...
                    </p>
                    <p className="text-[10px] text-slate-400 font-medium">
                      {new Date(job.creationTime).toLocaleString()}
                    </p>
                  </div>
                </div>
                <div className="text-right flex items-center gap-4">
                  <div className="space-y-0.5">
                    <p className="text-[10px] font-bold text-slate-700 uppercase">
                      {(job.bytes / (1024 * 1024)).toFixed(2)} MB
                    </p>
                    <span className={`text-[9px] font-black uppercase tracking-widest ${
                      job.status === 'DONE' ? 'text-emerald-500' : 'text-rose-500'
                    }`}>
                      {job.status}
                    </span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-indigo-400 transition-colors" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
