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

import React from 'react';
import { BudgetGauge } from '@/components/catalog/BudgetGauge';
import { CostSavingTips } from '@/components/catalog/CostSavingTips';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ChevronLeft, Code, ExternalLink, Info } from 'lucide-react';
import Link from 'next/link';
import { mapErrorToElenaAdvice } from '@/lib/error-mapping';
import { ElenaAdviceCard } from '@/components/catalog/ElenaAdviceCard';

interface ExplainPageProps {
  params: Promise<{
    projectId: string;
    datasetId: string;
    entitySet: string;
  }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default async function ExplainPage({ params, searchParams }: ExplainPageProps) {
  const { projectId, datasetId, entitySet } = await params;
  const sParams = await searchParams;
  
  // Construct the OData query string from search params
  const odataQuery = Object.entries(sParams)
    .map(([key, val]) => `${key}=${val}`)
    .join('&');

  const baseUrl = process.env.NEXT_PUBLIC_GATEWAY_URL || 'http://127.0.0.1:3005';
  
  // Fetch detailed explanation from the backend
  let explainData = null;
  try {
    const response = await fetch(
      `${baseUrl}/v1/${projectId}/${datasetId}/${entitySet}?${odataQuery}&explain=true`,
      { cache: 'no-store' }
    );
    if (response.ok) {
      explainData = await response.json();
    }
  } catch (err) {
    console.error('Failed to fetch explain data:', err);
  }

  return (
    <div className="min-h-screen bg-slate-50 py-12 lg:py-20">
      <div className="container mx-auto px-6 space-y-12">
        {/* Navigation & Header */}
        <div className="space-y-4">
          <Link 
            href="/catalog" 
            className="inline-flex items-center text-sm font-bold text-indigo-700 hover:text-indigo-800 uppercase tracking-widest gap-1 group"
          >
            <ChevronLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
            Back to Catalog
          </Link>
          <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight font-inter">
            Query Governance Audit
          </h1>
          <div className="flex flex-wrap gap-3">
            <span className="px-2 py-0.5 bg-slate-200 text-slate-600 rounded text-[10px] font-bold uppercase">{projectId}</span>
            <span className="px-2 py-0.5 bg-slate-200 text-slate-600 rounded text-[10px] font-bold uppercase">{datasetId}</span>
            <span className="px-2 py-0.5 bg-indigo-100 text-indigo-700 rounded text-[10px] font-bold uppercase">{entitySet}</span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 items-start">
          {/* Main Column: Gauge & SQL */}
          <div className="lg:col-span-2 space-y-12">
            {explainData && explainData.estimatedBytes > explainData.budgetBytes && (
              <ElenaAdviceCard 
                advice={mapErrorToElenaAdvice('BudgetExceeded', datasetId)}
              />
            )}
            
            {explainData ? (
              <>
                {/* Visual Gauge */}
                <BudgetGauge 
                  estimatedBytes={explainData.estimatedBytes} 
                  budgetBytes={explainData.budgetBytes} 
                />

                {/* SQL Preview */}
                <Card className="border-slate-200 shadow-lg rounded-3xl overflow-hidden">
                  <CardHeader className="bg-slate-900 text-white border-b border-slate-800 py-4 flex flex-row items-center justify-between">
                    <CardTitle className="text-sm font-bold uppercase tracking-widest flex items-center gap-2">
                      <Code className="w-4 h-4 text-indigo-400" />
                      Generated BigQuery SQL
                    </CardTitle>
                    <div className="flex gap-2">
                      <span className="text-[10px] font-bold text-slate-500 uppercase">ReadOnly</span>
                    </div>
                  </CardHeader>
                  <CardContent className="p-0 bg-slate-900">
                    <pre className="p-8 overflow-x-auto text-indigo-200 font-mono text-sm leading-relaxed">
                      {explainData.sql}
                    </pre>
                  </CardContent>
                </Card>
              </>
            ) : (
              <div className="p-12 text-center bg-white border border-dashed border-slate-300 rounded-3xl space-y-4">
                <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center mx-auto text-slate-400">
                  <Info className="w-6 h-6" />
                </div>
                <p className="text-slate-500 font-medium">Could not retrieve query audit data. Please ensure your OIDC session is active.</p>
              </div>
            )}
          </div>

          {/* Sidebar: Tips & Metadata */}
          <div className="space-y-8">
            <CostSavingTips />
            
            <div className="p-6 bg-white border border-slate-200 rounded-2xl shadow-sm space-y-4">
              <h3 className="font-bold text-slate-900 flex items-center gap-2">
                <ExternalLink className="w-4 h-4 text-indigo-600" />
                Technical Reference
              </h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                The estimated scan size is provided by BigQuery&apos;s Dry-Run API and includes the cost of all projected columns across the filtered range.
              </p>
              <div className="pt-2">
                <Link href="/docs/knowledge-base" className="text-xs font-bold text-indigo-700 underline decoration-indigo-200">
                  Read about Scan Budgets &rarr;
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
