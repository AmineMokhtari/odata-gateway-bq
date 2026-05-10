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
    <Card className="border-border shadow-sm bg-card rounded-md overflow-hidden">
      <CardHeader className="bg-muted/30 border-b border-border pb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-primary">
            <Activity className="w-5 h-5" />
            <span className="text-xs font-bold uppercase tracking-widest">Personal Usage Hub</span>
          </div>
          <div className="flex items-center gap-1.5 bg-success/10 text-success px-2.5 py-1 rounded-full border border-success/20">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span className="text-[10px] font-bold uppercase">Budget Safe</span>
          </div>
        </div>
        <CardTitle className="text-2xl font-sans font-bold text-foreground mt-2">
          Your Monthly Consumption
        </CardTitle>
      </CardHeader>
      
      <CardContent className="p-8 space-y-10">
        {/* Main Gauge / Progress */}
        <div className="space-y-4">
          <div className="flex justify-between items-end">
            <div className="space-y-1">
              <p className="text-sm font-medium text-muted-foreground uppercase tracking-tight">Total Scanned</p>
              <h2 className="text-4xl font-sans font-black text-foreground">
                {formatter.format(usedGb)} <span className="text-lg font-bold text-muted-foreground">GB</span>
              </h2>
            </div>
            <div className="text-right">
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Monthly Limit</p>
              <p className="text-sm font-bold text-foreground">{formatter.format(budgetGb)} GB</p>
            </div>
          </div>
          
          <div className="relative pt-2">
            <Progress value={percent} className="h-4 bg-secondary" />
            <motion.div 
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              style={{ left: `${percent}%` }}
              className="absolute top-0 -mt-8 -ml-4 flex flex-col items-center"
            >
              <span className="bg-primary text-primary-foreground text-[10px] font-bold px-2 py-0.5 rounded shadow-lg">
                {percent}%
              </span>
              <div className="w-0 h-0 border-l-[4px] border-l-transparent border-r-[4px] border-r-transparent border-t-[4px] border-t-primary" />
            </motion.div>
          </div>

          <div className="flex items-center gap-2 bg-muted/20 p-4 rounded border border-border">
            <Zap className="w-5 h-5 text-primary fill-primary/10" />
            <p className="text-xs font-medium text-foreground">
              {percent < 80 
                ? `You have ${formatter.format(budgetGb - usedGb)} GB remaining. You're doing great!` 
                : "You're approaching your limit. Try using filters to save budget."}
            </p>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <History className="w-4 h-4 text-muted-foreground" />
            <h3 className="text-sm font-bold text-foreground uppercase tracking-tight">Recent Queries</h3>
          </div>
          
          <div className="space-y-3">
            {lastJobs.map((job) => (
              <div key={job.id} className="flex items-center justify-between p-4 bg-card border border-border rounded-md hover:border-primary/50 hover:shadow-sm transition-all group">
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                    job.status === 'DONE' ? 'bg-success/10 text-success' : 'bg-destructive/10 text-destructive'
                  }`}>
                    <Activity className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-foreground group-hover:text-primary transition-colors">
                      Job: {job.id.substring(0, 8)}...
                    </p>
                    <p className="text-[10px] text-muted-foreground font-medium">
                      {new Date(job.creationTime).toLocaleString()}
                    </p>
                  </div>
                </div>
                <div className="text-right flex items-center gap-4">
                  <div className="space-y-0.5">
                    <p className="text-[10px] font-bold text-foreground uppercase">
                      {(job.bytes / (1024 * 1024)).toFixed(2)} MB
                    </p>
                    <span className={`text-[9px] font-black uppercase tracking-widest ${
                      job.status === 'DONE' ? 'text-success' : 'text-destructive'
                    }`}>
                      {job.status}
                    </span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-border group-hover:text-primary transition-colors" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
