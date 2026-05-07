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

import { getTenants } from "@/app/actions/tenants";
import { ODataUrlBuilder } from "@/components/marketplace/ODataUrlBuilder";
import { ShieldCheck, Lock, Zap } from "lucide-react";

export default async function MarketplacePage() {
  const tenants = await getTenants();
  const isQueryBuilderEnabled = process.env.ENABLE_QUERY_BUILDER === 'true';

  return (
    <div className="flex flex-col min-h-screen bg-slate-50">
      <main className="flex-1 container mx-auto px-6 py-12 lg:py-20 space-y-16">
        {/* Page Header */}
        <div className="max-w-3xl space-y-4">
          <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight font-inter">
            Governed Data Marketplace
          </h1>
          <p className="text-xl text-slate-600 leading-relaxed">
            Connect your BI tools to BigQuery in 60 seconds. Select a dataset below to generate your secure, budget-governed OData connection.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 items-start">
          {/* Main Action: URL Builder */}
          <div className="lg:col-span-2">
            <ODataUrlBuilder tenants={tenants} isEnabled={isQueryBuilderEnabled} />
          </div>

          {/* Sidebar: Trust & Governance Info */}
          <div className="space-y-8">
            <div className="p-6 bg-white border border-slate-200 rounded-2xl shadow-sm space-y-4">
              <h3 className="font-bold text-slate-900 flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-emerald-600" />
                Agile Governance
              </h3>
              <p className="text-sm text-slate-500 leading-relaxed">
                Our &quot;Trusted Subsystem&quot; model verify your identity via O365 and authorizes you instantly based on department rules.
              </p>
              <ul className="space-y-3 pt-2">
                <li className="flex items-center gap-2 text-xs font-semibold text-slate-600">
                  <div className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
                  Zero IAM Sprawl
                </li>
                <li className="flex items-center gap-2 text-xs font-semibold text-slate-600">
                  <div className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
                  Mandatory TLS 1.3
                </li>
                <li className="flex items-center gap-2 text-xs font-semibold text-slate-600">
                  <div className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
                  Stateless Audit Trail
                </li>
              </ul>
            </div>

            <div className="p-6 bg-amber-50 border border-amber-100 rounded-2xl space-y-4">
              <h3 className="font-bold text-amber-900 flex items-center gap-2">
                <Zap className="w-5 h-5 text-amber-600" />
                Scan Budgets
              </h3>
              <p className="text-sm text-amber-800 leading-relaxed">
                Every query is audited before execution. If your request exceeds your team&apos;s 10GB scan budget, it will be automatically blocked to prevent cost leakage.
              </p>
              <div className="pt-2">
                <button className="text-xs font-bold text-amber-700 underline decoration-amber-200">
                  Learn how to optimize queries &rarr;
                </button>
              </div>
            </div>

            <div className="p-6 border border-dashed border-slate-300 rounded-2xl">
              <h3 className="font-bold text-slate-400 flex items-center gap-2 text-sm uppercase tracking-widest">
                <Lock className="w-4 h-4" />
                Verified Identity
              </h3>
              <div className="mt-4 flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-slate-200 animate-pulse" />
                <div className="h-4 w-32 bg-slate-100 rounded animate-pulse" />
              </div>
              <p className="mt-4 text-[10px] text-slate-400 font-medium">
                Your OIDC session is active. All queries will be logged as your organizational identity.
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
