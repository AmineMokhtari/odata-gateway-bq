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
import { useRouter } from 'next/navigation';
import { type TenantConfig } from '@common/src/types/tenant';
import { DatasetCatalog } from '@/components/catalog/DatasetCatalog';

interface CatalogViewProps {
  tenants: TenantConfig[];
  isQueryBuilderEnabled: boolean;
}

export const CatalogView: React.FC<CatalogViewProps> = ({ tenants, isQueryBuilderEnabled }) => {
  const router = useRouter();

  return (
    <div className="space-y-12 animate-in fade-in duration-500">
      <div className="max-w-3xl space-y-4">
        <h1 className="text-4xl font-bold text-foreground tracking-tight font-sans">
          Data Catalog
        </h1>
        <p className="text-xl text-muted-foreground leading-relaxed">
          Discover and connect to available BigQuery datasets. Select a dataset below to explore its schema and generate your OData connection.
        </p>
      </div>

      <DatasetCatalog 
        tenants={tenants} 
        onSelect={(tenant) => router.push(`/catalog/${tenant.project_id}/${tenant.dataset_id}`)} 
      />
    </div>
  );
};
