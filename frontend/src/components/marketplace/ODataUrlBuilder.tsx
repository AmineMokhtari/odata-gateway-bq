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

import React, { useState, useEffect } from 'react';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Copy, Check, Database, Globe, Link as LinkIcon, Table, Sigma, ListTree, Activity } from 'lucide-react';
import { useEntityMetadata } from '@/hooks/useEntityMetadata';
import { Checkbox } from '@/components/ui/checkbox';
import { UsageDashboard } from './UsageDashboard';
import { toast } from 'sonner';
import { type TenantConfig } from '@common/src/types/tenant';
import { SuccessPulseBadge, type ConnectionState } from './SuccessPulseBadge';
import { useConnectionStatus } from '@/hooks/useConnectionStatus';
import { MobileActionBar } from '@/components/MobileActionBar';
import { useProjectStore } from '@/store/project-store';

interface ODataUrlBuilderProps {
  tenants: TenantConfig[];
  isEnabled?: boolean;
}

interface UsageData {
  totalBytesBilled: number;
  budgetBytes: number;
  lastJobs: Array<{
    id: string;
    creationTime: string;
    bytes: number;
    status: 'DONE' | 'FAILURE' | 'PENDING';
  }>;
}

const ExpandColumnSelector: React.FC<{
  baseUrl: string;
  entitySet: string;
  selectedColumns: string[];
  onChange: (cols: string[]) => void;
}> = ({ baseUrl, entitySet, selectedColumns, onChange }) => {
  const { properties, loading } = useEntityMetadata(baseUrl, entitySet);

  if (loading) return <div className="text-[10px] text-indigo-300 italic">Discovering fields...</div>;

  return (
    <div className="mt-2 pl-4 py-1 space-y-2 border-l-2 border-indigo-200/50 animate-in slide-in-from-left-1">
       <div className="flex items-center justify-between">
         <p className="text-[9px] font-bold text-indigo-400 uppercase tracking-widest">Granular Fields ($select)</p>
         {selectedColumns.length > 0 && (
           <Button 
            variant="ghost" 
            size="sm" 
            className="h-4 px-1 text-[8px] text-indigo-400 hover:text-indigo-600"
            onClick={(e) => { e.stopPropagation(); onChange([]); }}
           >
             Reset
           </Button>
         )}
       </div>
       <div className="flex flex-wrap gap-1">
         {properties.map(p => (
           <Button
             key={p.name}
             variant="ghost"
             size="sm"
             onClick={(e) => {
               e.stopPropagation();
               const next = selectedColumns.includes(p.name)
                 ? selectedColumns.filter(c => c !== p.name)
                 : [...selectedColumns, p.name];
               onChange(next);
             }}
             className={`h-6 px-2 rounded-md text-[9px] font-bold transition-all ${
               selectedColumns.includes(p.name)
               ? 'bg-indigo-600 text-white shadow-sm'
               : 'bg-white text-slate-500 border border-slate-100 hover:border-indigo-200'
             }`}
           >
             {p.name}
           </Button>
         ))}
       </div>
    </div>
  );
};

export const ODataUrlBuilder: React.FC<ODataUrlBuilderProps> = ({ tenants, isEnabled = false }) => {
  const [selectedProject, setSelectedProject] = useState<string>('');
  const [selectedDataset, setSelectedDataset] = useState<string>('');
  const [selectedTable, setSelectedTable] = useState<string>('');
  const [availableTables, setAvailableTables] = useState<string[]>([]);
  const [selectedExpands, setSelectedExpands] = useState<string[]>([]);
  const [selectedExpandColumns, setSelectedExpandColumns] = useState<Record<string, string[]>>({});
  const [selectedColumns, setSelectedColumns] = useState<string[]>([]);
  const [selectedGroupBy, setSelectedGroupBy] = useState<string[]>([]);
  const [selectedAggs, setSelectedAggs] = useState<Record<string, 'sum' | 'average' | 'min' | 'max' | 'count'>>({});
  const [usageData, setUsageData] = useState<UsageData | null>(null);
  const [loadingUsage, setLoadingUsage] = useState(false);
  const [generatedUrl, setGeneratedUrl] = useState<string>('');
  const [copied, setCopied] = useState(false);

  const baseUrl = process.env.NEXT_PUBLIC_GATEWAY_URL || 'http://localhost:3001';
  const normalizedBase = baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl;
  const serviceRoot = selectedProject && selectedDataset ? `${normalizedBase}/v1/${selectedProject}/${selectedDataset}` : '';

  // Discovery hook for joins & properties
  const { navProps, properties, tableDescription, loading: loadingMetadata } = useEntityMetadata(serviceRoot, selectedTable);

  // Hook for real-time connection status pulse
  const { state: connectionState, lastActive } = useConnectionStatus({ 
    projectId: selectedProject, 
    datasetId: selectedDataset 
  });

  // Derive unique projects from tenants list
  const projects = Array.from(new Set(tenants.map(t => t.project_id)));
  
  // Derive datasets for the selected project
  const datasets = tenants
    .filter(t => t.project_id === selectedProject)
    .map(t => t.dataset_id);

  const { setElenaTip, openElenaDrawer } = useProjectStore();
  const [localConnectionState, setLocalConnectionState] = useState<ConnectionState>('listening');

  // Fetch usage and tables when dataset changes
  useEffect(() => {
    if (serviceRoot) {
      setLocalConnectionState('verifying');
      // Fetch Tables
      fetch(serviceRoot)
        .then(async (res) => {
          const data = await res.json();
          if (!res.ok) {
            if (data.elena_tip) {
              setElenaTip(data.elena_tip);
              setLocalConnectionState('blocked');
              openElenaDrawer();
              toast.error('Query blocked by governance rules', {
                description: 'Elena has some tips to help you fix this.'
              });
            } else {
              setLocalConnectionState('listening');
            }
            return;
          }
          
          if (data.value) {
            setAvailableTables(data.value.map((v: { name: string }) => v.name));
            setLocalConnectionState('connected');
          }
        })
        .catch(err => {
          console.error('Failed to fetch tables:', err);
          setLocalConnectionState('listening');
        });

      // Fetch Usage (Story 6.4)
      setLoadingUsage(true);
      fetch(`${serviceRoot}/usage`)
        .then(res => res.json())
        .then(data => setUsageData(data))
        .catch(err => console.error('Failed to fetch usage:', err))
        .finally(() => setLoadingUsage(false));

      // Reset state when dataset changes (Story 8.2 Patch)
      setSelectedTable('');
      setSelectedExpands([]);
      setSelectedExpandColumns({});
      setSelectedColumns([]);
    } else {
      setAvailableTables([]);
      setSelectedTable('');
      setUsageData(null);
      setLocalConnectionState('listening');
    }
  }, [serviceRoot, setElenaTip, openElenaDrawer]);

  useEffect(() => {
    if (selectedProject && selectedDataset) {
      let url = `${normalizedBase}/v1/${selectedProject}/${selectedDataset}`;
      if (selectedTable) {
        url += `/${selectedTable}`;
        
        const params: string[] = [];
        
        // Handle Primary Select (Story 8.2 Patch)
        if (selectedColumns.length > 0) {
          params.push(`$select=${selectedColumns.join(',')}`);
        }

        // Handle Joins (Story 6.2 & 8.2)
        if (selectedExpands.length > 0) {
          const expandStrings = selectedExpands.map(name => {
            const cols = selectedExpandColumns[name];
            if (cols && cols.length > 0) {
              return `${name}($select=${cols.join(',')})`;
            }
            return name;
          });
          params.push(`$expand=${expandStrings.join(',')}`);
        }
        
        // Handle Aggregations ($apply)
        if (selectedGroupBy.length > 0 || Object.keys(selectedAggs).length > 0) {
          let apply = '';
          if (selectedGroupBy.length > 0) {
            apply += `groupby((${selectedGroupBy.join(',')})`;
            if (Object.keys(selectedAggs).length > 0) {
              const aggs = Object.entries(selectedAggs)
                .map(([col, func]) => `aggregate(${col} with ${func} as ${col}_${func})`)
                .join(',');
              apply += `,${aggs}`;
            }
            apply += ')';
          } else {
            // Pure aggregation without grouping
            apply = Object.entries(selectedAggs)
              .map(([col, func]) => `aggregate(${col} with ${func} as ${col}_${func})`)
              .join(',');
          }
          params.push(`$apply=${apply}`);
        }
        
        if (params.length > 0) {
          url += `?${params.join('&')}`;
        }
      }
      setGeneratedUrl(url);
    } else {
      setGeneratedUrl('');
    }
    setCopied(false);
  }, [selectedProject, selectedDataset, selectedTable, selectedExpands, selectedGroupBy, selectedAggs, normalizedBase]);

  const toggleExpand = (name: string) => {
    setSelectedExpands(prev => 
      prev.includes(name) ? prev.filter(n => n !== name) : [...prev, name]
    );
  };

  const toggleGroupBy = (name: string) => {
    setSelectedGroupBy(prev => 
      prev.includes(name) ? prev.filter(n => n !== name) : [...prev, name]
    );
  };

  const setAggregation = (col: string, func: any) => {
    setSelectedAggs(prev => {
      const next = { ...prev };
      if (next[col] === func) delete next[col];
      else next[col] = func;
      return next;
    });
  };

  const handleCopy = () => {
    if (generatedUrl) {
      navigator.clipboard.writeText(generatedUrl);
      setCopied(true);
      toast.success('OData URL copied to clipboard!', {
        description: 'You can now paste this into Excel or Power BI.',
      });
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <Card className="w-full max-w-2xl border-slate-200 shadow-xl bg-white rounded-2xl overflow-hidden">
      <CardHeader className="bg-slate-50 border-b border-slate-100 pb-6">
        <div className="flex items-center gap-2 text-indigo-700 mb-2">
          <Globe className="w-5 h-5" />
          <span className="text-xs font-bold uppercase tracking-widest">Connection Builder</span>
        </div>
        <CardTitle className="text-2xl font-inter font-bold text-slate-900">
          Generate Your OData Feed
        </CardTitle>
        <CardDescription className="text-slate-500">
          Select your data target to create a native connection string for your BI tools.
        </CardDescription>
      </CardHeader>
      
      <CardContent className="p-8 space-y-8">
        {/* Connection Pulse Status (Story 4.3) */}
        <div className="flex justify-center py-4 border-b border-slate-50">
          <SuccessPulseBadge state={localConnectionState} lastActive={lastActive} />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Project Selection */}
          <div className="space-y-2">
            <label className="text-sm font-bold text-slate-700 uppercase tracking-tight flex items-center gap-2">
              <Database className="w-4 h-4 text-indigo-600" />
              GCP Project
            </label>
            <Select onValueChange={(val: string | null) => { if (val) { setSelectedProject(val); setSelectedDataset(''); } }}>
              <SelectTrigger className="h-12 border-slate-200 focus:ring-indigo-500 rounded-lg">
                <SelectValue placeholder="Select Project" />
              </SelectTrigger>
              <SelectContent>
                {projects.map(project => (
                  <SelectItem key={project} value={project}>{project}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Dataset Selection */}
          <div className="space-y-2">
            <label className="text-sm font-bold text-slate-700 uppercase tracking-tight flex items-center gap-2">
              <Database className="w-4 h-4 text-indigo-600" />
              BigQuery Dataset
            </label>
            <Select 
              disabled={!selectedProject} 
              onValueChange={(val: string | null) => { if (val) setSelectedDataset(val); }}
              value={selectedDataset}
            >
              <SelectTrigger className="h-12 border-slate-200 focus:ring-indigo-500 rounded-lg">
                <SelectValue placeholder={selectedProject ? "Select Dataset" : "First select project"} />
              </SelectTrigger>
              <SelectContent>
                {datasets.map(dataset => (
                  <SelectItem key={dataset} value={dataset}>{dataset}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Table Selection */}
        <div className="space-y-2">
          <label className="text-sm font-bold text-slate-700 uppercase tracking-tight flex items-center gap-2">
            <Table className="w-4 h-4 text-indigo-600" />
            Primary Table
          </label>
          <Select 
            disabled={!selectedDataset} 
            onValueChange={(val: string | null) => { 
              if (val) { 
                setSelectedTable(val); 
                setSelectedExpands([]); 
                setSelectedGroupBy([]);
                setSelectedAggs({});
              } 
            }}
            value={selectedTable}
          >
            <SelectTrigger className="h-12 border-slate-200 focus:ring-indigo-500 rounded-lg">
              <SelectValue placeholder={selectedDataset ? "Select Table" : "First select dataset"} />
            </SelectTrigger>
            <SelectContent>
              {availableTables.map(table => (
                <SelectItem key={table} value={table}>{table}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          {selectedTable && tableDescription && (
            <p className="text-xs text-slate-500 bg-slate-50 p-2 rounded-md border-l-2 border-indigo-400 animate-in fade-in slide-in-from-left-1">
              {tableDescription}
            </p>
          )}
        </div>

        {/* Primary Column Selection (Story 8.2 Patch) */}
        {selectedTable && (
          <div className="space-y-4 p-6 bg-slate-50 border border-slate-100 rounded-2xl animate-in fade-in slide-in-from-top-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-slate-900">
                <ListTree className="w-4 h-4 text-indigo-600" />
                <h3 className="text-sm font-bold uppercase tracking-tight">Select Columns</h3>
              </div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Visual $select</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {properties.map(prop => (
                <Button
                  key={prop.name}
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setSelectedColumns(prev => 
                      prev.includes(prop.name) ? prev.filter(c => c !== prop.name) : [...prev, prop.name]
                    );
                  }}
                  className={`h-auto min-h-8 py-1.5 px-4 rounded-xl text-[10px] font-bold transition-all flex flex-col items-start gap-0.5 ${
                    selectedColumns.includes(prop.name)
                    ? 'bg-indigo-600 text-white border-indigo-600 shadow-md ring-2 ring-indigo-100'
                    : 'bg-white text-slate-600 hover:border-indigo-300 hover:bg-slate-50'
                  }`}
                >
                  <span>{prop.name}</span>
                  {prop.description && (
                    <span className={`text-[8px] font-medium leading-tight text-left max-w-[120px] line-clamp-1 ${
                      selectedColumns.includes(prop.name) ? 'text-indigo-200' : 'text-slate-400'
                    }`}>
                      {prop.description}
                    </span>
                  )}
                </Button>
              ))}
            </div>
          </div>
        )}

        {/* Visual Join Builder (Story 6.2) */}
        {isEnabled && selectedTable && navProps.length > 0 && (
          <div className="space-y-4 p-6 bg-indigo-50/50 border border-indigo-100 rounded-2xl animate-in fade-in slide-in-from-top-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-indigo-900">
                <LinkIcon className="w-4 h-4" />
                <h3 className="text-sm font-bold uppercase tracking-tight">Related Data (Joins)</h3>
              </div>
              <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest">Visual $expand</span>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {navProps.map(prop => (
                <div key={prop.name} className={`flex flex-col space-y-2 bg-white p-4 rounded-xl border transition-all cursor-pointer group ${
                  selectedExpands.includes(prop.name) ? 'border-indigo-300 ring-1 ring-indigo-100' : 'border-slate-100 hover:border-indigo-200'
                }`}
                     onClick={() => toggleExpand(prop.name)}>
                  <div className="flex items-center space-x-3">
                    <Checkbox 
                      id={`expand-${prop.name}`} 
                      checked={selectedExpands.includes(prop.name)}
                      onCheckedChange={() => toggleExpand(prop.name)}
                      className="border-indigo-200 data-[state=checked]:bg-indigo-600"
                    />
                    <div className="space-y-0.5">
                      <label 
                        htmlFor={`expand-${prop.name}`}
                        className="text-xs font-bold text-slate-900 leading-none cursor-pointer"
                      >
                        {prop.name}
                      </label>
                      <p className="text-[10px] text-slate-400 font-medium">Automatic Join</p>
                    </div>
                  </div>

                  {/* Nested Column Selector (Story 8.2) */}
                  {selectedExpands.includes(prop.name) && (
                    <ExpandColumnSelector 
                      baseUrl={serviceRoot}
                      entitySet={prop.type.split('.').pop() || prop.name}
                      selectedColumns={selectedExpandColumns[prop.name] || []}
                      onChange={(cols) => {
                        setSelectedExpandColumns(prev => ({
                          ...prev,
                          [prop.name]: cols
                        }));
                      }}
                    />
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Visual Aggregation Builder (Story 6.3) */}
        {isEnabled && selectedTable && (
          <div className="space-y-4 p-6 bg-slate-50 border border-slate-100 rounded-2xl animate-in fade-in slide-in-from-top-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-slate-900">
                <Sigma className="w-4 h-4 text-emerald-600" />
                <h3 className="text-sm font-bold uppercase tracking-tight">Summarize Data</h3>
              </div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Visual $apply</span>
            </div>
            
            <div className="space-y-6">
              {/* Grouping Section */}
              <div className="space-y-3">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1">
                  <ListTree className="w-3 h-3" /> Group By (Categorical)
                </p>
                <div className="flex flex-wrap gap-2">
                  {properties.filter(p => !p.isNumeric).map(prop => (
                    <Button
                      key={prop.name}
                      variant="outline"
                      size="sm"
                      onClick={() => toggleGroupBy(prop.name)}
                      className={`h-8 rounded-full text-[10px] font-bold transition-all ${
                        selectedGroupBy.includes(prop.name)
                        ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                        : 'bg-white text-slate-600 hover:border-indigo-200'
                      }`}
                    >
                      {prop.name}
                    </Button>
                  ))}
                </div>
              </div>

              {/* Aggregation Section */}
              <div className="space-y-3">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1">
                  <Sigma className="w-3 h-3" /> Calculations (Numerical)
                </p>
                <div className="space-y-2">
                  {properties.filter(p => p.isNumeric).map(prop => (
                    <div key={prop.name} className="flex items-center justify-between bg-white p-3 rounded-xl border border-slate-100">
                      <span className="text-xs font-bold text-slate-700">{prop.name}</span>
                      <div className="flex gap-1">
                        {['sum', 'average', 'count'].map((func) => (
                          <Button
                            key={func}
                            variant="ghost"
                            size="sm"
                            onClick={() => setAggregation(prop.name, func as any)}
                            className={`h-7 px-3 rounded-lg text-[9px] font-bold uppercase transition-all ${
                              selectedAggs[prop.name] === func
                              ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200'
                              : 'text-slate-400 hover:bg-slate-50'
                            }`}
                          >
                            {func}
                          </Button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* URL Preview & Copy */}
        <div className="space-y-3 pt-4">
          <div className="flex justify-between items-end">
            <label className="text-sm font-bold text-slate-700 uppercase tracking-tight">
              OData Service Root
            </label>
            {generatedUrl && (
              <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100 uppercase">
                Ready to Connect
              </span>
            )}
          </div>
          
          <div className="flex gap-2">
            <div className="relative flex-1 group">
              <Input 
                readOnly 
                value={generatedUrl} 
                placeholder="https://gateway.example.com/v1/project/dataset"
                className="h-14 bg-slate-50 border-slate-200 font-mono text-sm text-indigo-700 focus-visible:ring-indigo-500 pr-4 rounded-xl"
              />
              <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity">
                <span className="text-[10px] font-bold text-slate-400 uppercase">Read Only</span>
              </div>
            </div>
            
            <Button 
              size="icon"
              disabled={!generatedUrl}
              onClick={handleCopy}
              className={`h-14 w-14 rounded-xl transition-all duration-300 ${
                copied 
                ? 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-100' 
                : 'bg-indigo-700 hover:bg-indigo-800 shadow-indigo-100'
              } shadow-lg`}
            >
              {copied ? <Check className="w-6 h-6 text-white" /> : <Copy className="w-6 h-6 text-white" />}
            </Button>
          </div>
          
          <p className="text-xs text-slate-400 italic">
            * This URL follows the OData V4 standard. Use it as an &quot;OData Feed&quot; data source in Excel or Power BI.
          </p>
        </div>
      </CardContent>

      {/* Usage Dashboard (Story 6.4) */}
      {selectedDataset && usageData && (
        <div className="px-8 pb-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <UsageDashboard 
            totalBytesBilled={usageData.totalBytesBilled}
            budgetBytes={usageData.budgetBytes}
            lastJobs={usageData.lastJobs}
            loading={loadingUsage}
          />
        </div>
      )}

      {/* Mobile Sticky Bar (Story 4.5) */}
      <MobileActionBar 
        url={generatedUrl} 
        projectName={selectedProject} 
        datasetName={selectedDataset} 
      />
    </Card>
  );
};
