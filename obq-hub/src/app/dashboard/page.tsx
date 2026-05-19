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

import { getGlobalUsage } from "@/app/actions/usage";
import { UsageDashboard } from "@/components/catalog/UsageDashboard";
import { ElenaAdviceCard } from "@/components/catalog/ElenaAdviceCard";
import { mapErrorToElenaAdvice } from "@/lib/error-mapping";
import { Activity, History } from "lucide-react";

export default async function DashboardPage() {
  const usage = await getGlobalUsage();
  const defaultAdvice = mapErrorToElenaAdvice("Welcome");
  defaultAdvice.title = "Welcome back!";
  defaultAdvice.message = "I've compiled your latest data usage stats for the month.";
  defaultAdvice.advice = "Elena says: Keep an eye on your consumption to avoid hitting your monthly quota early!";

  return (
    <div className="flex flex-col min-h-screen bg-slate-50">
      <main className="flex-1 container mx-auto px-6 py-12 lg:py-16">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          {/* Header Section */}
          <div className="lg:col-span-3 space-y-4 mb-4">
            <div className="flex items-center gap-3 text-indigo-600">
              <Activity className="w-8 h-8" />
              <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight font-sans">
                Personal Usage Hub
              </h1>
            </div>
            <p className="text-xl text-slate-500 max-w-3xl leading-relaxed">
              Monitor your data consumption and track your query history across all your BigQuery connections.
            </p>
          </div>

          {/* Main Dashboard Column */}
          <div className="lg:col-span-2 space-y-8">
            <UsageDashboard 
              totalBytesBilled={usage.totalBytesBilled} 
              budgetBytes={usage.budgetBytes} 
              lastJobs={usage.lastJobs} 
            />
          </div>

          {/* Sidebar / Advice Column */}
          <div className="space-y-8">
            <ElenaAdviceCard advice={defaultAdvice} />
            
            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4">
              <div className="flex items-center gap-2 text-slate-900 font-bold uppercase text-xs tracking-widest">
                <History className="w-4 h-4 text-indigo-600" />
                Quick Tips
              </div>
              <ul className="space-y-3">
                {[
                  "Use $select to only fetch the columns you need.",
                  "Apply $filter early to reduce scanned data.",
                  "Check the cost estimate before running large exports."
                ].map((tip, i) => (
                  <li key={i} className="text-sm text-slate-600 flex gap-3">
                    <span className="text-indigo-400 font-bold">•</span>
                    {tip}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
