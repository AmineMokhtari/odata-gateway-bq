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

        <div className="max-w-5xl">
          {/* Main Action: URL Builder */}
          <ODataUrlBuilder tenants={tenants} isEnabled={isQueryBuilderEnabled} />
        </div>
      </main>
    </div>
  );
}
