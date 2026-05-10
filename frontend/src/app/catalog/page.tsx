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
import { CatalogView } from "@/components/catalog/CatalogView";

export default async function CatalogPage() {
  const tenants = await getTenants();
  const isQueryBuilderEnabled = process.env.ENABLE_QUERY_BUILDER === 'true';

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <main className="flex-1 container mx-auto px-6 py-12 lg:py-20">
        <CatalogView tenants={tenants} isQueryBuilderEnabled={isQueryBuilderEnabled} />
      </main>
    </div>
  );
}
