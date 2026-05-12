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
import { Copy, Check, Database, Globe, Link as LinkIcon, Table, Sigma, ListTree, Activity, ChevronLeft, Loader2 } from 'lucide-react';
import { useEntityMetadata } from '@/hooks/useEntityMetadata';
import { Checkbox } from '@/components/ui/checkbox';
import { UsageDashboard } from './UsageDashboard';
import { toast } from 'sonner';
import { type TenantConfig } from '@common/src/types/tenant';
import { SuccessPulseBadge, type ConnectionState } from './SuccessPulseBadge';
import { useConnectionStatus } from '@/hooks/useConnectionStatus';
import { MobileActionBar } from '@/components/MobileActionBar';
import { useProjectStore } from '@/store/project-store';
import { downloadODataODC } from '@/lib/excel-generator';

interface ODataUrlBuilderProps {
  tenants: TenantConfig[];
  isEnabled?: boolean;
  initialProjectId?: string;
  initialDatasetId?: string;
  onBack?: () => void;
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

  if (loading) return <div className="text-[10px] text-primary italic">Discovering fields...</div>;

  return (
    <div className="mt-2 pl-4 py-1 space-y-2 border-l-2 border-primary/20 animate-in slide-in-from-left-1">
       <div className="flex items-center justify-between">
         <p className="text-[9px] font-bold text-primary/60 uppercase tracking-widest">Granular Fields ($select)</p>
         {selectedColumns.length > 0 && (
           <Button 
            variant="ghost" 
            size="sm" 
            className="h-4 px-1 text-[8px] text-primary hover:text-primary"
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
                 ? 'bg-primary text-primary-foreground shadow-sm'
                 : 'bg-card text-muted-foreground border border-border hover:border-primary/50'
             }`}
           >
             {p.name}
           </Button>
         ))}
       </div>
    </div>
  );
};

export const ODataUrlBuilder: React.FC<ODataUrlBuilderProps> = ({ 
  tenants, 
  isEnabled = false,
  initialProjectId = '',
  initialDatasetId = '',
  onBack
}) => {
  const [selectedProject, setSelectedProject] = useState<string>(initialProjectId);
  const [selectedDataset, setSelectedDataset] = useState<string>(initialDatasetId);
  const [selectedTable, setSelectedTable] = useState<string>('');
  const [availableTables, setAvailableTables] = useState<string[]>([]);
  const [selectedExpands, setSelectedExpands] = useState<string[]>([]);
  const [selectedExpandColumns, setSelectedExpandColumns] = useState<Record<string, string[]>>({});
  const [selectedColumns, setSelectedColumns] = useState<string[]>([]);
  const [selectedGroupBy, setSelectedGroupBy] = useState<string[]>([]);
  const [selectedAggs, setSelectedAggs] = useState<Record<string, 'sum' | 'average' | 'min' | 'max' | 'count'>>({});
  const [usageData, setUsageData] = useState<UsageData | null>(null);
  const [loadingUsage, setLoadingUsage] = useState(false);
  const [loadingTables, setLoadingTables] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [generatedUrl, setGeneratedUrl] = useState<string>('');
  const [copied, setCopied] = useState(false);
  const [exporting, setExporting] = useState(false);

  const baseUrl = (typeof window !== 'undefined') 
    ? `${window.location.origin}/web/api/gateway` 
    : (process.env.NEXT_PUBLIC_GATEWAY_URL || 'http://127.0.0.1:3005');
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
      setLoadingTables(true);
      setFetchError(null);
      setLocalConnectionState('verifying');
      // Fetch Tables
      fetch(serviceRoot)
        .then(async (res) => {
          // Guard: proxy may return plain-text errors (e.g. "Internal Server Error")
          const contentType = res.headers.get('content-type') || '';
          if (!contentType.includes('application/json')) {
            const text = await res.text();
            throw new Error(`Gateway returned non-JSON response (${res.status}): ${text.slice(0, 120)}`);
          }
          const data = await res.json();
          console.log('[ODataBuilder] Tables response:', data);
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
          setFetchError(err.message || 'Failed to connect to gateway');
          setLocalConnectionState('listening');
        })
        .finally(() => setLoadingTables(false));

      // Fetch Usage (Story 6.4)
      setLoadingUsage(true);
      fetch(`${serviceRoot}/usage`)
        .then(async (res) => {
          // Guard: proxy may return plain-text errors — don't attempt JSON parse
          const contentType = res.headers.get('content-type') || '';
          if (!res.ok || !contentType.includes('application/json')) {
            // Usage is non-critical: silently ignore errors
            return null;
          }
          return res.json();
        })
        .then(data => { if (data) setUsageData(data); })
        .catch(err => {
          if (err.message && !/fetch/i.test(err.message)) {
            console.error('Failed to fetch usage:', err);
          }
        })
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
  }, [selectedProject, selectedDataset, selectedTable, selectedExpands, selectedExpandColumns, selectedColumns, selectedGroupBy, selectedAggs, normalizedBase]);

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

  const handleExcelExport = () => {
    if (generatedUrl) {
      setExporting(true);
      const filename = selectedTable ? `${selectedProject}_${selectedTable}` : `${selectedProject}_OData`;
      downloadODataODC(generatedUrl, filename);
      
      toast.success('Excel Connection Created!', {
        description: 'Open the downloaded .odc file to start your analysis.',
      });
      
      setTimeout(() => setExporting(false), 2000);
    }
  };

  return (
    <Card className="w-full border-border shadow-sm bg-card rounded-md overflow-hidden">
      <CardHeader className="bg-muted/30 border-b border-border pb-6">
        <div className="flex justify-between items-start mb-2">
          <div className="flex items-center gap-2 text-primary">
            <Globe className="w-5 h-5" />
            <span className="text-xs font-bold uppercase tracking-widest">Connection Builder</span>
          </div>
          {onBack && (
            <Button variant="ghost" size="sm" onClick={onBack} className="h-8 px-2 text-xs gap-1">
              <ChevronLeft className="w-4 h-4" />
              Back to Catalog
            </Button>
          )}
        </div>
        <CardTitle className="text-2xl font-sans font-bold text-foreground">
          Generate Your OData Feed
        </CardTitle>
        <CardDescription className="text-muted-foreground">
          Select your data target to create a native connection string for your BI tools.
        </CardDescription>
        {(loadingTables || loadingMetadata || loadingUsage) && (
          <div className="mt-4 space-y-2 animate-in fade-in">
            <div className="flex justify-between items-center text-[10px] font-bold uppercase tracking-widest text-primary">
              <span>Synchronizing BigQuery Metadata</span>
              <span className="animate-pulse">Loading...</span>
            </div>
            <div className="h-1 w-full bg-primary/10 rounded-full overflow-hidden">
              <div className="h-full bg-primary animate-progress-indeterminate w-1/3" />
            </div>
          </div>
        )}
      </CardHeader>
      
      <CardContent className="p-8 space-y-8">
        {/* Connection Pulse Status (Story 4.3) */}
        <div className="flex justify-center py-4 border-b border-secondary">
          <SuccessPulseBadge state={localConnectionState} lastActive={lastActive} />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Project Selection */}
          <div className="space-y-2">
            <label className="text-sm font-bold text-foreground uppercase tracking-tight flex items-center gap-2">
              <Database className="w-4 h-4 text-primary" />
              GCP Project
            </label>
            <Select 
              value={selectedProject}
              onValueChange={(val: string | null) => { if (val) { setSelectedProject(val); setSelectedDataset(''); } }}
            >
              <SelectTrigger className="h-12 border-border focus:ring-primary rounded">
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
            <label className="text-sm font-bold text-foreground uppercase tracking-tight flex items-center gap-2">
              <Database className="w-4 h-4 text-primary" />
              BigQuery Dataset
            </label>
            <Select 
              disabled={!selectedProject} 
              onValueChange={(val: string | null) => { if (val) setSelectedDataset(val); }}
              value={selectedDataset}
            >
              <SelectTrigger className="h-12 border-border focus:ring-primary rounded">
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
          <label className="text-sm font-bold text-foreground uppercase tracking-tight flex items-center gap-2">
            <Table className="w-4 h-4 text-primary" />
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
            <SelectTrigger className="h-12 border-border focus:ring-primary rounded">
              <div className="flex items-center gap-2">
                {loadingTables && <Loader2 className="w-4 h-4 animate-spin text-primary" />}
                <SelectValue placeholder={
                  loadingTables 
                    ? "Discovering tables..." 
                    : (selectedDataset ? "Select Table" : "First select dataset")
                } />
              </div>
            </SelectTrigger>
            <SelectContent>
              {fetchError && !loadingTables && (
                <div className="p-4 text-xs text-destructive bg-destructive/10 rounded border border-destructive/20 text-center">
                  <p className="font-bold mb-1">Connection Error</p>
                  <p>{fetchError}</p>
                </div>
              )}
              {availableTables.length === 0 && !loadingTables && !fetchError && (
                <div className="p-4 text-xs text-muted-foreground text-center">
                  No tables found in this dataset.
                </div>
              )}
              {!loadingTables && !fetchError && availableTables.map(table => (
                <SelectItem key={table} value={table}>{table}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          {selectedTable && tableDescription && (
            <p className="text-xs text-muted-foreground bg-secondary p-2 rounded border-l-2 border-primary/50 animate-in fade-in slide-in-from-left-1">
              {tableDescription}
            </p>
          )}
        </div>

        {/* Primary Column Selection (Story 8.2 Patch) */}
        {selectedTable && (
          <div className="space-y-4 p-6 bg-muted/20 border border-border rounded animate-in fade-in slide-in-from-top-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-foreground">
                <ListTree className="w-4 h-4 text-primary" />
                <h3 className="text-sm font-bold uppercase tracking-tight">Select Columns</h3>
              </div>
              <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Visual $select</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {loadingMetadata ? (
                <div className="flex items-center gap-2 py-4 text-sm text-muted-foreground animate-pulse">
                  <Loader2 className="w-4 h-4 animate-spin text-primary" />
                  Introspecting table schema...
                </div>
              ) : (
                properties.map(prop => (
                  <Button
                    key={prop.name}
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setSelectedColumns(prev => 
                        prev.includes(prop.name) ? prev.filter(c => c !== prop.name) : [...prev, prop.name]
                      );
                    }}
                    className={`h-auto min-h-8 py-1.5 px-4 rounded text-[10px] font-bold transition-all flex flex-col items-start gap-0.5 ${
                      selectedColumns.includes(prop.name)
                      ? 'bg-primary text-primary-foreground border-primary shadow-sm shadow-primary/10'
                      : 'bg-card text-muted-foreground border border-border hover:border-primary/50 hover:bg-accent'
                    }`}
                  >
                    <span>{prop.name}</span>
                    {prop.description && (
                      <span className={`text-[8px] font-medium leading-tight text-left max-w-[120px] line-clamp-1 ${
                        selectedColumns.includes(prop.name) ? 'text-primary-foreground/80' : 'text-muted-foreground/80'
                      }`}>
                        {prop.description}
                      </span>
                    )}
                  </Button>
                ))
              )}
            </div>
          </div>
        )}

        {/* Visual Join Builder (Story 6.2) */}
        {isEnabled && selectedTable && (
          <div className="space-y-4 p-6 bg-accent/20 border border-accent rounded animate-in fade-in slide-in-from-top-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-primary">
                <LinkIcon className="w-4 h-4" />
                <h3 className="text-sm font-bold uppercase tracking-tight">Related Data (Joins)</h3>
              </div>
              <span className="text-[10px] font-bold text-primary/60 uppercase tracking-widest">Visual $expand</span>
            </div>
            
            {navProps.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {navProps.map(prop => (
                  <div key={prop.name} className={`flex flex-col space-y-2 bg-card p-4 rounded border transition-all cursor-pointer group ${
                    selectedExpands.includes(prop.name) ? 'border-primary/50 ring-1 ring-primary/10' : 'border-border hover:border-primary/30'
                  }`}
                       onClick={() => toggleExpand(prop.name)}>
                    <div className="flex items-center space-x-3">
                      <Checkbox 
                        id={`expand-${prop.name}`} 
                        checked={selectedExpands.includes(prop.name)}
                        onCheckedChange={() => toggleExpand(prop.name)}
                        className="border-border data-[state=checked]:bg-primary"
                      />
                      <div className="space-y-0.5">
                        <label 
                          htmlFor={`expand-${prop.name}`}
                          className="text-xs font-bold text-foreground leading-none cursor-pointer"
                        >
                          {prop.name}
                        </label>
                        <p className="text-[10px] text-muted-foreground font-medium">Automatic Join</p>
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
            ) : (
              <div className="p-4 bg-card/50 rounded border border-dashed border-primary/20 text-center space-y-2">
                <div className="flex justify-center">
                  <div className="bg-primary/10 p-2 rounded-full">
                    <LinkIcon className="w-5 h-5 text-primary opacity-50" />
                  </div>
                </div>
                <p className="text-xs font-bold text-foreground">No automatic joins discovered</p>
                <p className="text-[10px] text-muted-foreground max-w-xs mx-auto">
                  Elena suggests defining <span className="font-bold">Foreign Keys</span> in BigQuery to enable automatic relationship discovery.
                </p>
              </div>
            )}
          </div>
        )}

        {/* Visual Aggregation Builder (Story 6.3) */}
        {isEnabled && selectedTable && (
          <div className="space-y-4 p-6 bg-muted/20 border border-border rounded animate-in fade-in slide-in-from-top-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-foreground">
                <Sigma className="w-4 h-4 text-success" />
                <h3 className="text-sm font-bold uppercase tracking-tight">Summarize Data</h3>
              </div>
              <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Visual $apply</span>
            </div>
            
            <div className="space-y-6">
              {/* Grouping Section */}
              <div className="space-y-3">
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-1">
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
                        ? 'bg-primary text-primary-foreground border-primary shadow-sm'
                        : 'bg-card text-muted-foreground border border-border hover:border-primary/50'
                      }`}
                    >
                      {prop.name}
                    </Button>
                  ))}
                </div>
              </div>

              {/* Aggregation Section */}
              <div className="space-y-3">
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-1">
                  <Sigma className="w-3 h-3" /> Calculations (Numerical)
                </p>
                <div className="space-y-2">
                  {properties.filter(p => p.isNumeric).map(prop => (
                    <div key={prop.name} className="flex items-center justify-between bg-card p-3 rounded border border-border">
                      <span className="text-xs font-bold text-foreground">{prop.name}</span>
                      <div className="flex gap-1">
                        {['sum', 'average', 'count'].map((func) => (
                          <Button
                            key={func}
                            variant="ghost"
                            size="sm"
                            onClick={() => setAggregation(prop.name, func as any)}
                            className={`h-7 px-3 rounded text-[9px] font-bold uppercase transition-all ${
                              selectedAggs[prop.name] === func
                              ? 'bg-success/10 text-success hover:bg-success/20'
                              : 'text-muted-foreground hover:bg-muted'
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
            <label className="text-sm font-bold text-foreground uppercase tracking-tight">
              OData Service Root
            </label>
            {generatedUrl && (
              <span className="text-[10px] font-bold text-green-600 bg-green-50 px-2 py-0.5 rounded border border-green-100 uppercase">
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
                className="h-14 bg-muted/30 border-border font-mono text-sm text-primary focus-visible:ring-primary pr-4 rounded-md"
              />
              <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity">
                <span className="text-[10px] font-bold text-muted-foreground uppercase">Read Only</span>
              </div>
            </div>
            
            <Button 
              size="icon"
              disabled={!generatedUrl || exporting}
              onClick={handleExcelExport}
              className={`h-14 w-14 rounded-md transition-all duration-300 ${
                exporting 
                ? 'bg-emerald-600 hover:bg-emerald-600 shadow-sm' 
                : 'bg-emerald-500 hover:bg-emerald-600 shadow-sm'
              }`}
              title="Connect to Excel"
            >
              {exporting ? (
                <Loader2 className="w-6 h-6 animate-spin text-white" />
              ) : (
                <svg 
                  viewBox="0 0 24 24" 
                  fill="none" 
                  stroke="currentColor" 
                  strokeWidth="2" 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  className="w-6 h-6 text-white"
                >
                  <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
                  <polyline points="14 2 14 8 20 8" />
                  <path d="M8 13h2" />
                  <path d="M8 17h2" />
                  <path d="M10 9H8" />
                </svg>
              )}
            </Button>

            <Button 
              size="icon"
              disabled={!generatedUrl}
              onClick={handleCopy}
              className={`h-14 w-14 rounded-md transition-all duration-300 ${
                copied 
                ? 'bg-success hover:bg-success/90 shadow-sm' 
                : 'bg-primary hover:bg-primary/90 shadow-sm'
              }`}
              title="Copy URL"
            >
              {copied ? <Check className="w-6 h-6 text-success-foreground" /> : <Copy className="w-6 h-6 text-primary-foreground" />}
            </Button>
          </div>
          
          <p className="text-xs text-muted-foreground italic">
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
