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

import React, { useState, useMemo } from 'react';
import { Input } from '@/components/ui/input';
import { Search, Filter, ChevronLeft, ChevronRight } from 'lucide-react';
import { type TenantConfig } from '@common/src/types/tenant';
import { DatasetCard } from './DatasetCard';
import { Button } from '@/components/ui/button';

interface DatasetCatalogProps {
  tenants: TenantConfig[];
  onSelect: (tenant: TenantConfig) => void;
}

const ITEMS_PER_PAGE = 6;

export const DatasetCatalog: React.FC<DatasetCatalogProps> = ({ tenants, onSelect }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  const filteredTenants = useMemo(() => {
    return tenants.filter(t => {
      const searchStr = `${t.name} ${t.dataset_id} ${t.project_id} ${t.description}`.toLowerCase();
      return searchStr.includes(searchQuery.toLowerCase());
    });
  }, [tenants, searchQuery]);

  const totalPages = Math.ceil(filteredTenants.length / ITEMS_PER_PAGE);
  const paginatedTenants = filteredTenants.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
    setCurrentPage(1); // Reset to first page on search
  };

  return (
    <div className="space-y-8">
      {/* Search and Filter Form */}
      <div className="flex flex-col md:flex-row gap-4 items-center">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input 
            placeholder="Search datasets by name, ID, or description..." 
            className="pl-10 h-12 border-border bg-card"
            value={searchQuery}
            onChange={handleSearch}
          />
        </div>
        <Button variant="outline" className="h-12 gap-2 whitespace-nowrap">
          <Filter className="w-4 h-4" />
          Advanced Filters
        </Button>
      </div>

      {/* Catalog Grid */}
      {paginatedTenants.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {paginatedTenants.map((tenant) => (
            <DatasetCard 
              key={`${tenant.project_id}:${tenant.dataset_id}`} 
              tenant={tenant} 
              onSelect={onSelect}
            />
          ))}
        </div>
      ) : (
        <div className="py-20 text-center border-2 border-dashed border-border rounded-xl">
          <Search className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-20" />
          <h3 className="text-lg font-bold text-foreground">No datasets found</h3>
          <p className="text-muted-foreground">Try adjusting your search or filters.</p>
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between pt-4 border-t border-border/50">
          <p className="text-sm text-muted-foreground">
            Showing <span className="font-bold text-foreground">{(currentPage - 1) * ITEMS_PER_PAGE + 1}</span> to <span className="font-bold text-foreground">{Math.min(currentPage * ITEMS_PER_PAGE, filteredTenants.length)}</span> of <span className="font-bold text-foreground">{filteredTenants.length}</span> datasets
          </p>
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              size="sm" 
              disabled={currentPage === 1}
              onClick={() => setCurrentPage(prev => prev - 1)}
            >
              <ChevronLeft className="w-4 h-4 mr-1" />
              Previous
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage(prev => prev + 1)}
            >
              Next
              <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};
