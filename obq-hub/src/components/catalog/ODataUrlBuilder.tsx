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

import React, { useState, useEffect, useRef } from 'react';
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
import { Copy, Check, Database, Globe, Link as LinkIcon, Table, Sigma, ListTree, Activity, ChevronLeft, ChevronRight, Loader2, Search, Info, Plus, Trash2, ArrowUpDown } from 'lucide-react';
import { useEntityMetadata } from '@/hooks/useEntityMetadata';
import { getServiceRoot } from '@/app/actions/odata';
import { getDatasetUsage } from '@/app/actions/usage';
import { Checkbox } from '@/components/ui/checkbox';
import { UsageDashboard } from './UsageDashboard';
import { toast } from 'sonner';
import { type TenantConfig } from '@common/src/types/tenant';
import { SuccessPulseBadge, type ConnectionState } from './SuccessPulseBadge';
import { useConnectionStatus } from '@/hooks/useConnectionStatus';
import { MobileActionBar } from '@/components/MobileActionBar';
import { useProjectStore, type ElenaTip } from '@/store/project-store';
import { downloadODataODC, downloadODataPBIDS } from '@/lib/excel-generator';
import { mapErrorToElenaAdvice } from '@/lib/error-mapping';

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
  projectId: string;
  datasetId: string;
  entitySet: string;
  selectedColumns: string[];
  onChange: (cols: string[]) => void;
}> = ({ projectId, datasetId, entitySet, selectedColumns, onChange }) => {
  const { properties, loading } = useEntityMetadata(projectId, datasetId, entitySet);

  if (loading) return <div className="text-[10px] text-primary italic">Discovering fields...</div>;

  return (
    <div className="mt-2 pl-4 py-1 space-y-2 border-l-2 border-primary/20 animate-in slide-in-from-left-1">
       <div className="flex items-center justify-between">
         <p className="text-[9px] font-bold text-primary/60 uppercase tracking-widest">Granular Fields ($select)</p>
         <div className="flex items-center gap-2">
           <Button 
            variant="ghost" 
            size="sm" 
            className="h-4 px-1.5 text-[8px] text-primary hover:text-primary cursor-pointer font-bold"
            onClick={(e) => { e.stopPropagation(); onChange(properties.map(p => p.name)); }}
           >
             Select All
           </Button>
           {selectedColumns.length > 0 && (
             <Button 
              variant="ghost" 
              size="sm" 
              className="h-4 px-1.5 text-[8px] text-primary hover:text-primary cursor-pointer font-bold text-destructive hover:bg-destructive/10"
              onClick={(e) => { e.stopPropagation(); onChange([]); }}
             >
               Reset
             </Button>
           )}
         </div>
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
             className={`h-6 px-2 rounded-md text-[9px] font-bold transition-all cursor-pointer ${
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
  const [exportingPBI, setExportingPBI] = useState(false);
  const [activeTab, setActiveTab] = useState<'canvas' | 'fields' | 'aggregations'>('canvas');
  const [liveAnnouncement, setLiveAnnouncement] = useState<string>('');
  const [leftCollapsed, setLeftCollapsed] = useState(false);
  const [selectedOrderBy, setSelectedOrderBy] = useState<Array<{ column: string, order: 'asc' | 'desc' }>>([]);
  const [selectedLimit, setSelectedLimit] = useState<string>('');
  const [columnSearchQuery, setColumnSearchQuery] = useState('');
  const [showPreviewModal, setShowPreviewModal] = useState(false);

  // Track state changes for aria-live announcements (Story 13.2)
  useEffect(() => {
    if (selectedTable) {
      setLiveAnnouncement(`Query updated for table ${selectedTable}. Selected ${selectedColumns.length > 0 ? selectedColumns.length + ' columns' : 'all columns'}. Active joins: ${selectedExpands.length > 0 ? selectedExpands.join(', ') : 'none'}.`);
    } else {
      setLiveAnnouncement('Query cleared');
    }
  }, [selectedTable, selectedColumns, selectedExpands]);
  // Public OData URL for BI tools
  const publicGatewayBase = process.env.NEXT_PUBLIC_GATEWAY_URL || 'http://127.0.0.1:3005';
  const normalizedPublicBase = publicGatewayBase.endsWith('/') ? publicGatewayBase.slice(0, -1) : publicGatewayBase;
  const publicServiceRoot = selectedProject && selectedDataset ? `${normalizedPublicBase}/v1/${selectedProject}/${selectedDataset}` : '';

  // Discovery hook for joins & properties (Story 9.1: Server Action Migration)
  const { navProps, properties, tableDescription, loading: loadingMetadata } = useEntityMetadata(selectedProject, selectedDataset, selectedTable);

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

  const { setElenaTip, openElenaDrawer, lastFixAction, clearFix } = useProjectStore();
  const [localConnectionState, setLocalConnectionState] = useState<ConnectionState>('listening');

  // Handle Quick Fixes from Elena
  useEffect(() => {
    if (lastFixAction === 'SELECT_COLUMNS') {
      // simulate a fix by selecting only one column (e.g. the first one available)
      if (properties.length > 0) {
        setSelectedColumns([properties[0].name]);
        toast.success('Elena applied a column filter to reduce query size.');
      }
      clearFix();
    } else if (lastFixAction === 'CLEAN_REAUTH') {
      toast.success('Elena has re-authorized a clean, budget-safe subset of your workspace.');
      clearFix();
    }
  }, [lastFixAction, properties, clearFix]);

  // Fetch usage and tables when dataset changes
  useEffect(() => {
    if (selectedProject && selectedDataset) {
      setLoadingTables(true);
      setFetchError(null);
      setLocalConnectionState('verifying');
      
      // Fetch Tables via Server Action (Story 9.1)
      getServiceRoot(selectedProject, selectedDataset)
        .then(data => {
          if (data && data.error) {
            console.error('Failed to fetch tables:', data.error);
            const tip = data.error.elena_tip;
            if (tip) {
              setElenaTip(tip);
              setLocalConnectionState('blocked');
              openElenaDrawer();
            } else {
              setFetchError(data.error.message || 'Failed to connect to gateway');
              setLocalConnectionState('listening');
            }
            return;
          }
          if (data && data.value) {
            setAvailableTables(data.value.map((v: { name: string }) => v.name));
            setLocalConnectionState('connected');
          }
        })
        .catch(err => {
          console.error('Unexpected error fetching tables:', err);
          const advice = mapErrorToElenaAdvice(err.message || 'Failed to connect to gateway', selectedDataset);
          setElenaTip({ title: advice.title, message: advice.message, advice: advice.advice });
          setLocalConnectionState('blocked');
          openElenaDrawer();
        })
        .finally(() => setLoadingTables(false));

      // Fetch Usage via Server Action (Story 9.1)
      setLoadingUsage(true);
      getDatasetUsage(selectedProject, selectedDataset)
        .then(data => { if (data) setUsageData(data); })
        .catch(() => { /* Usage is non-critical */ })
        .finally(() => setLoadingUsage(false));

      // Reset state when dataset changes (Story 8.2 Patch)
      // Only do this if there is NO URL query preset to preserve hydrated state!
      const params = new URLSearchParams(window.location.search);
      const q = params.get('q');
      if (q) {
        try {
          const decoded = JSON.parse(atob(q));
          if (decoded.activeTable) {
            setSelectedTable(decoded.activeTable);
          }
        } catch (e) {
          console.error('Failed to parse URL query param:', e);
        }
      } else {
        setSelectedTable('');
        setSelectedExpands([]);
        setSelectedExpandColumns({});
        setSelectedColumns([]);
        setSelectedOrderBy([]);
        setSelectedLimit('');
        setColumnSearchQuery('');
      }
    } else {
      setAvailableTables([]);
      setSelectedTable('');
      setUsageData(null);
      setLocalConnectionState('listening');
      setSelectedExpands([]);
      setSelectedExpandColumns({});
      setSelectedColumns([]);
      setSelectedOrderBy([]);
      setSelectedLimit('');
      setColumnSearchQuery('');
    }
  }, [selectedProject, selectedDataset, setElenaTip, openElenaDrawer]);



  useEffect(() => {
    if (selectedProject && selectedDataset) {
      const serviceRoot = `${normalizedPublicBase}/v1/${selectedProject}/${selectedDataset}`;
      
      let url = '';
      if (selectedTable) {
        url = `${serviceRoot}/${selectedTable}`;
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

        // Handle Order By (Step 6)
        if (selectedOrderBy.length > 0) {
          const orderStrings = selectedOrderBy.map(o => `${o.column} ${o.order}`);
          params.push(`$orderby=${orderStrings.join(',')}`);
        }

        // Handle Limit (Step 7)
        if (selectedLimit && parseInt(selectedLimit, 10) > 0) {
          params.push(`$top=${selectedLimit}`);
        }
        
        if (params.length > 0) {
          url += `?${params.join('&')}`;
        }
      } else {
        url = serviceRoot;
      }

      // Handle Aggregations ($apply)
      if (url && selectedTable && (selectedGroupBy.length > 0 || Object.keys(selectedAggs).length > 0)) {
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
        const separator = url.includes('?') ? '&' : '?';
        url += `${separator}$apply=${apply}`;
      }

      setGeneratedUrl(url);
    } else {
      setGeneratedUrl('');
    }
    setCopied(false);
  }, [selectedProject, selectedDataset, selectedTable, selectedExpands, selectedExpandColumns, selectedColumns, selectedGroupBy, selectedAggs, selectedOrderBy, selectedLimit, publicServiceRoot, normalizedPublicBase]);

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

  const handlePowerBIExport = () => {
    if (generatedUrl) {
      setExportingPBI(true);
      const filename = selectedTable ? `${selectedProject}_${selectedTable}` : `${selectedProject}_OData`;
      downloadODataPBIDS(generatedUrl, filename);
      
      toast.success('Power BI Connection Created!', {
        description: 'Open the downloaded .pbids file to start your analysis.',
      });
      
      setTimeout(() => setExportingPBI(false), 2000);
    }
  };

  return (
    <div className="w-full h-full flex flex-col overflow-hidden bg-background relative">
      <a 
        href="#generated-odata-url" 
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-[100] focus:px-4 focus:py-2.5 focus:bg-primary focus:text-primary-foreground focus:rounded-md focus:shadow-lg focus:border focus:border-border focus:outline focus:outline-2 focus:outline-offset-2 focus:outline-primary transition-all text-xs font-bold uppercase tracking-wider"
      >
        Skip to Generated URL
      </a>

      {/* Accessible Live Region Announcements */}
      <div className="sr-only" aria-live="polite" aria-atomic="true">
        {liveAnnouncement}
      </div>

      <div className="flex-1 flex flex-row h-full w-full overflow-hidden">
        {/* Left Sidebar Panel (300px, collapsible) */}
        <div 
          className={`h-full border-r border-border bg-card flex flex-col relative transition-all duration-300 ${
            leftCollapsed ? 'w-0 overflow-hidden border-r-0' : 'w-[300px] shrink-0'
          }`}
        >
          <div className="flex flex-col h-full p-4 space-y-4">
            {/* Header / Connection pulse */}
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div className="flex items-center gap-1.5 text-primary">
                <Globe className="w-4 h-4" />
                <span className="text-[10px] font-bold uppercase tracking-widest">Metadata Feed</span>
              </div>
              {onBack && (
                <Button variant="ghost" size="sm" onClick={onBack} className="h-6 px-1.5 text-[10px] gap-0.5 cursor-pointer">
                  <ChevronLeft className="w-3.5 h-3.5" />
                  Back
                </Button>
              )}
            </div>

            <div className="flex justify-center border-b border-secondary pb-3">
              <SuccessPulseBadge state={localConnectionState} lastActive={lastActive} />
            </div>

            {/* Project Selection */}
            <div className="space-y-1.5">
              <label htmlFor="gcp-project-select" className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1">
                <Database className="w-3.5 h-3.5 text-primary" />
                GCP Project
              </label>
              <Select 
                value={selectedProject}
                onValueChange={(val: string | null) => { 
                  if (val) { 
                    setSelectedProject(val); 
                    setSelectedDataset(''); 
                    if (typeof window !== 'undefined') {
                      const url = new URL(window.location.href);
                      url.searchParams.delete('q');
                      window.history.replaceState(null, '', url.toString());
                    }
                    setSelectedTable('');
                    setSelectedExpands([]);
                    setSelectedExpandColumns({});
                    setSelectedColumns([]);
                  } 
                }}
              >
                <SelectTrigger id="gcp-project-select" className="h-9 border-border text-xs font-semibold focus:ring-primary rounded">
                  <SelectValue placeholder="Select Project" />
                </SelectTrigger>
                <SelectContent>
                  {projects.map(project => (
                    <SelectItem key={project} value={project} className="text-xs font-medium">{project}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Dataset Selection */}
            <div className="space-y-1.5">
              <label htmlFor="bq-dataset-select" className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1">
                <Database className="w-3.5 h-3.5 text-primary" />
                BigQuery Dataset
              </label>
              <Select 
                disabled={!selectedProject} 
                onValueChange={(val: string | null) => { 
                  if (val) {
                    setSelectedDataset(val); 
                    if (typeof window !== 'undefined') {
                      const url = new URL(window.location.href);
                      url.searchParams.delete('q');
                      window.history.replaceState(null, '', url.toString());
                    }
                    setSelectedTable('');
                    setSelectedExpands([]);
                    setSelectedExpandColumns({});
                    setSelectedColumns([]);
                  }
                }}
                value={selectedDataset}
              >
                <SelectTrigger id="bq-dataset-select" className="h-9 border-border text-xs font-semibold focus:ring-primary rounded">
                  <SelectValue placeholder={selectedProject ? "Select Dataset" : "First select project"} />
                </SelectTrigger>
                <SelectContent>
                  {datasets.map(dataset => (
                    <SelectItem key={dataset} value={dataset} className="text-xs font-medium">{dataset}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Absolute floating Left Sidebar Panel toggle chevron */}
          <button
            onClick={() => setLeftCollapsed(!leftCollapsed)}
            className="absolute right-[-14px] top-1/2 -translate-y-1/2 z-50 bg-background border border-border rounded-full p-0.5 shadow-md hover:bg-muted cursor-pointer transition-transform text-foreground hover:text-primary"
            aria-label={leftCollapsed ? "Expand left sidebar" : "Collapse left sidebar"}
          >
            {leftCollapsed ? <ChevronRight className="w-3.5 h-3.5" /> : <ChevronLeft className="w-3.5 h-3.5" />}
          </button>
        </div>

        {/* Center Panel (Step-by-step Query Builder) */}
        <div className="flex-1 h-full relative overflow-hidden bg-muted/5 flex flex-col">
          {/* Header */}
          <div className="h-16 border-b border-border bg-card px-6 flex items-center justify-between shrink-0 shadow-sm z-10">
            <div>
              <h2 className="text-sm font-extrabold text-foreground tracking-tight uppercase">Build OData Query</h2>
              <p className="text-[10px] text-muted-foreground font-medium">Configure your BigQuery data extraction parameters step-by-step.</p>
            </div>
            {selectedTable && (
              <Button 
                variant="outline" 
                size="sm" 
                className="h-8 px-3 text-xs border-red-500/30 text-red-500 hover:bg-red-500/10 cursor-pointer font-bold uppercase rounded-lg"
                onClick={() => {
                  setSelectedTable('');
                  setSelectedColumns([]);
                  setSelectedExpands([]);
                  setSelectedExpandColumns({});
                  setSelectedGroupBy([]);
                  setSelectedAggs({});
                  setSelectedOrderBy([]);
                  setSelectedLimit('');
                  toast.success("Query form reset successfully");
                }}
              >
                Reset Form
              </Button>
            )}
          </div>

          {/* Loader Overlay for main catalog elements */}
          {(loadingTables || loadingMetadata || loadingUsage) && (
            <div className="absolute top-0 inset-x-0 h-0.5 bg-primary/10 overflow-hidden z-30">
              <div className="h-full bg-primary animate-progress-indeterminate w-1/3" />
            </div>
          )}

          <div className="flex-1 w-full overflow-y-auto p-6 space-y-6 scrollbar-thin relative min-h-0">
            {!selectedDataset ? (
              <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center bg-card">
                <div className="max-w-sm space-y-4">
                  <div className="mx-auto w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary animate-pulse">
                    <ListTree className="w-6 h-6" />
                  </div>
                  <div className="space-y-1">
                    <h4 className="text-sm font-bold text-foreground">No Dataset Selected</h4>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      Please select a GCP Project and BigQuery Dataset in the Left Sidebar to inspect available schemas.
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <>
                {/* Step 1: Table Primaire */}
                <div className="bg-card border border-border rounded-xl shadow-sm p-6 relative overflow-hidden flex flex-col md:flex-row md:items-center gap-6">
                  <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-xs shrink-0 shadow-sm">
                    1
                  </div>
                  <div className="flex-1 space-y-2">
                    <h3 className="text-xs font-bold uppercase text-foreground tracking-wider">Table Primaire</h3>
                    <p className="text-[11px] text-muted-foreground">Select primary dataset and table</p>
                    <Select 
                      value={selectedTable} 
                      onValueChange={(val) => {
                        if (val) {
                          setSelectedTable(val);
                          setSelectedColumns([]);
                          setSelectedExpands([]);
                          setSelectedExpandColumns({});
                          setSelectedGroupBy([]);
                          setSelectedAggs({});
                          setSelectedOrderBy([]);
                          setSelectedLimit('');
                        }
                      }}
                    >
                      <SelectTrigger className="w-full max-w-md h-10 text-xs font-semibold rounded-lg bg-background border-border shadow-sm">
                        <SelectValue placeholder="Choose a table..." />
                      </SelectTrigger>
                      <SelectContent>
                        {availableTables.map(t => (
                          <SelectItem key={t} value={t} className="text-xs font-medium">{t}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Step 2: Jointures (Optionnel) */}
                <div className="bg-card border border-border rounded-xl shadow-sm p-6 relative overflow-hidden flex flex-col md:flex-row md:items-start gap-6">
                  <div className="w-8 h-8 rounded-full bg-muted text-muted-foreground flex items-center justify-center font-bold text-xs shrink-0">
                    2
                  </div>
                  <div className="flex-1 space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div>
                        <h3 className="text-xs font-bold uppercase text-foreground tracking-wider">Jointures (Optionnel)</h3>
                        <p className="text-[11px] text-muted-foreground">Link related tables dynamically via expands</p>
                      </div>
                      {selectedTable && navProps.length > 0 && (
                        <Select
                          value=""
                          onValueChange={(val) => {
                            if (val && !selectedExpands.includes(val)) {
                              setSelectedExpands(prev => [...prev, val]);
                              toast.success(`Joined relationship ${val}`);
                            }
                          }}
                        >
                          <SelectTrigger className="h-8 px-3 rounded-lg text-xs font-bold bg-primary/10 border-transparent text-primary hover:bg-primary/20 shrink-0 gap-1.5 cursor-pointer shadow-sm">
                            <span className="flex items-center gap-1"><Plus className="w-3.5 h-3.5" /> Add Join</span>
                          </SelectTrigger>
                          <SelectContent>
                            {navProps
                              .filter(prop => !selectedExpands.includes(prop.name))
                              .map(prop => (
                                <SelectItem key={prop.name} value={prop.name} className="text-xs font-medium">
                                  {prop.name}
                                </SelectItem>
                              ))}
                          </SelectContent>
                        </Select>
                      )}
                    </div>

                    {selectedExpands.length === 0 ? (
                      <div className="border border-dashed border-border rounded-lg p-6 text-center text-xs text-muted-foreground bg-muted/10 leading-relaxed">
                        No joins configured. Click '+ Add Join' to include related tables.
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {selectedExpands.map(joinTable => (
                          <div key={joinTable} className="border border-border bg-muted/20 px-4 py-2.5 rounded-xl flex items-center justify-between gap-4 animate-in slide-in-from-top-1">
                            <span className="text-xs font-bold text-foreground truncate">{joinTable}</span>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setSelectedExpands(prev => prev.filter(t => t !== joinTable))}
                              className="text-xs font-bold text-destructive hover:bg-destructive/10 h-7 px-2 shrink-0 cursor-pointer rounded-md"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Step 3: Sélection des colonnes */}
                <div className="bg-card border border-border rounded-xl shadow-sm p-6 relative overflow-hidden flex flex-col md:flex-row md:items-start gap-6">
                  <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-xs shrink-0 shadow-sm">
                    3
                  </div>
                  <div className="flex-1 space-y-4">
                    <div>
                      <h3 className="text-xs font-bold uppercase text-foreground tracking-wider">Sélection des colonnes</h3>
                      <p className="text-[11px] text-muted-foreground">Select projected fields for the primary table and joined relations</p>
                    </div>

                    {!selectedTable ? (
                      <div className="border border-dashed border-border rounded-lg p-6 text-center text-xs text-muted-foreground bg-muted/10 leading-relaxed">
                        Please select a primary table in Step 1 first.
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {/* Primary Table Column Selector */}
                        <div className="border border-border rounded-xl p-4 bg-muted/10 space-y-3 shadow-inner">
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border pb-2.5">
                            <div className="flex items-center gap-2">
                              <Table className="w-4 h-4 text-primary" />
                              <span className="text-xs font-bold text-foreground uppercase tracking-wider">Table Primaire : {selectedTable}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              {selectedColumns.length > 0 && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => setSelectedColumns([])}
                                  className="h-6 px-2 text-[9px] font-bold text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded cursor-pointer"
                                >
                                  Deselect All
                                </Button>
                              )}
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setSelectedColumns(properties.map(p => p.name))}
                                className="h-6 px-2 text-[9px] font-bold text-primary hover:bg-primary/10 rounded cursor-pointer"
                              >
                                Select All
                              </Button>
                            </div>
                          </div>

                          <div className="relative">
                            <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
                            <Input
                              placeholder="Filter fields..."
                              value={columnSearchQuery}
                              onChange={(e) => setColumnSearchQuery(e.target.value)}
                              className="h-8 pl-8 pr-3 text-xs bg-background border-border rounded-md shadow-sm w-full sm:max-w-xs focus-visible:ring-primary"
                            />
                          </div>

                          {properties.length === 0 ? (
                            <p className="text-xs text-muted-foreground italic pl-1">Discovering fields...</p>
                          ) : (
                            <div className="flex flex-wrap gap-1.5 pt-1">
                              {properties
                                .filter(p => p.name.toLowerCase().includes(columnSearchQuery.toLowerCase()))
                                .map(p => (
                                  <Button
                                    key={p.name}
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => {
                                      const next = selectedColumns.includes(p.name)
                                        ? selectedColumns.filter(c => c !== p.name)
                                        : [...selectedColumns, p.name];
                                      setSelectedColumns(next);
                                    }}
                                    className={`h-7 px-2.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                                      selectedColumns.includes(p.name)
                                        ? 'bg-primary text-primary-foreground shadow-sm'
                                        : 'bg-card text-muted-foreground border border-border hover:border-primary/50'
                                    }`}
                                    title={p.description || p.type}
                                  >
                                    {p.name}
                                  </Button>
                                ))}
                            </div>
                          )}
                        </div>

                        {/* Expanded Tables Stack */}
                        {selectedExpands.length > 0 && (
                          <div className="space-y-3 pt-2">
                            <p className="text-[10px] font-bold text-primary/60 uppercase tracking-widest pl-1">Tables Connectées ($expand)</p>
                            {selectedExpands.map(joinTable => (
                              <div key={joinTable} className="border border-border rounded-xl p-4 bg-muted/10 space-y-3 shadow-inner animate-in slide-in-from-left-2 duration-200">
                                <div className="flex items-center gap-2 border-b border-border pb-2">
                                  <LinkIcon className="w-4 h-4 text-primary" />
                                  <span className="text-xs font-bold text-foreground uppercase tracking-wider">{joinTable}</span>
                                </div>
                                <ExpandColumnSelector
                                  projectId={selectedProject}
                                  datasetId={selectedDataset}
                                  entitySet={joinTable}
                                  selectedColumns={selectedExpandColumns[joinTable] || []}
                                  onChange={(cols) => setSelectedExpandColumns(prev => ({ ...prev, [joinTable]: cols }))}
                                />
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Step 4: Group By */}
                <div className="bg-card border border-border rounded-xl shadow-sm p-6 relative overflow-hidden flex flex-col md:flex-row md:items-start gap-6">
                  <div className="w-8 h-8 rounded-full bg-muted text-muted-foreground flex items-center justify-center font-bold text-xs shrink-0">
                    4
                  </div>
                  <div className="flex-1 space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div>
                        <h3 className="text-xs font-bold uppercase text-foreground tracking-wider">Group By</h3>
                        <p className="text-[11px] text-muted-foreground">Configure query grouping fields</p>
                      </div>
                      {selectedTable && properties.filter(p => !p.isNumeric).length > 0 && (
                        <Select
                          value=""
                          onValueChange={(val) => {
                            if (val && !selectedGroupBy.includes(val)) {
                              setSelectedGroupBy(prev => [...prev, val]);
                              toast.success(`Grouped by ${val}`);
                            }
                          }}
                        >
                          <SelectTrigger className="h-8 px-3 rounded-lg text-xs font-bold bg-primary/10 border-transparent text-primary hover:bg-primary/20 shrink-0 gap-1.5 cursor-pointer shadow-sm">
                            <span className="flex items-center gap-1"><Plus className="w-3.5 h-3.5" /> Add grouping field</span>
                          </SelectTrigger>
                          <SelectContent>
                            {properties
                              .filter(p => !p.isNumeric && !selectedGroupBy.includes(p.name))
                              .map(p => (
                                <SelectItem key={p.name} value={p.name} className="text-xs font-medium">
                                  {p.name}
                                </SelectItem>
                              ))}
                          </SelectContent>
                        </Select>
                      )}
                    </div>

                    {selectedGroupBy.length > 0 ? (
                      <div className="flex flex-wrap gap-2 items-center">
                        {selectedGroupBy.map(g => (
                          <div 
                            key={g} 
                            className="flex items-center gap-1.5 text-xs font-semibold bg-secondary text-secondary-foreground border border-border px-3 py-1 rounded-full shadow-sm animate-in zoom-in-95 duration-100"
                          >
                            <span>{g}</span>
                            <button 
                              onClick={() => setSelectedGroupBy(prev => prev.filter(col => col !== g))} 
                              className="text-[10px] hover:text-red-500 font-bold opacity-60 hover:opacity-100 cursor-pointer"
                            >
                              ✕
                            </button>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="border border-dashed border-border rounded-lg p-4 text-center text-xs text-muted-foreground bg-muted/10">
                        No grouping configured. Click '+ Add grouping field' to set fields.
                      </div>
                    )}
                  </div>
                </div>

                {/* Step 5: Agrégation */}
                <div className="bg-card border border-border rounded-xl shadow-sm p-6 relative overflow-hidden flex flex-col md:flex-row md:items-start gap-6">
                  <div className="w-8 h-8 rounded-full bg-muted text-muted-foreground flex items-center justify-center font-bold text-xs shrink-0">
                    5
                  </div>
                  <div className="flex-1 space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div>
                        <h3 className="text-xs font-bold uppercase text-foreground tracking-wider">Agrégation</h3>
                        <p className="text-[11px] text-muted-foreground">Summarize numeric columns using standard OData aggregation</p>
                      </div>
                      {selectedTable && properties.filter(p => p.isNumeric).length > 0 && (
                        <Select
                          value=""
                          onValueChange={(val) => {
                            if (val) {
                              const [col, func] = val.split(':');
                              setSelectedAggs(prev => ({
                                ...prev,
                                [col]: func as any
                              }));
                              toast.success(`Added aggregation ${func.toUpperCase()}(${col})`);
                            }
                          }}
                        >
                          <SelectTrigger className="h-8 px-3 rounded-lg text-xs font-bold bg-primary/10 border-transparent text-primary hover:bg-primary/20 shrink-0 gap-1.5 cursor-pointer shadow-sm">
                            <span className="flex items-center gap-1"><Plus className="w-3.5 h-3.5" /> Add Aggregation Function</span>
                          </SelectTrigger>
                          <SelectContent className="max-h-[300px]">
                            {properties
                              .filter(p => p.isNumeric)
                              .map(p => (
                                <div key={p.name} className="px-2 py-1.5 text-xs font-semibold border-b border-border last:border-b-0">
                                  <p className="text-[9px] text-muted-foreground mb-1 block uppercase tracking-wider">{p.name}</p>
                                  <div className="grid grid-cols-5 gap-1 pt-1">
                                    {['sum', 'average', 'min', 'max', 'count'].map(func => (
                                      <SelectItem 
                                        key={`${p.name}:${func}`} 
                                        value={`${p.name}:${func}`} 
                                        className="text-[9px] py-1 justify-center focus:bg-primary focus:text-primary-foreground cursor-pointer rounded"
                                      >
                                        {func.toUpperCase()}
                                      </SelectItem>
                                    ))}
                                  </div>
                                </div>
                              ))}
                          </SelectContent>
                        </Select>
                      )}
                    </div>

                    <div className="flex items-start gap-2.5 p-3 rounded-lg bg-blue-500/5 border border-blue-500/10 text-xs text-blue-500/80 leading-relaxed shadow-sm">
                      <Info className="w-4 h-4 shrink-0 mt-0.5" />
                      <span>Aggregation is typically required when 'Group By' is active. Configure functions like SUM(), COUNT(), or AVG() here.</span>
                    </div>

                    {Object.keys(selectedAggs).length > 0 ? (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {Object.entries(selectedAggs).map(([col, func]) => (
                          <div key={col} className="flex items-center justify-between p-2.5 bg-muted/40 border border-border rounded-lg text-xs font-semibold shadow-sm">
                            <div className="flex items-center gap-1.5">
                              <span className="text-[9px] font-bold uppercase tracking-wider bg-success/15 text-success border border-success/20 px-2 py-0.5 rounded leading-none">
                                {func}
                              </span>
                              <span className="text-foreground">{col}</span>
                            </div>
                            <button 
                              onClick={() => setSelectedAggs(prev => {
                                const next = { ...prev };
                                delete next[col];
                                return next;
                              })}
                              className="text-muted-foreground hover:text-destructive p-1 rounded transition-colors cursor-pointer"
                            >
                              ✕
                            </button>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="border border-dashed border-border rounded-lg p-4 text-center text-xs text-muted-foreground bg-muted/10">
                        No aggregations configured. Click '+ Add Aggregation Function' to set rules.
                      </div>
                    )}
                  </div>
                </div>

                {/* Step 6: Order By (Optionnel) */}
                <div className="bg-card border border-border rounded-xl shadow-sm p-6 relative overflow-hidden flex flex-col md:flex-row md:items-start gap-6">
                  <div className="w-8 h-8 rounded-full bg-muted text-muted-foreground flex items-center justify-center font-bold text-xs shrink-0">
                    6
                  </div>
                  <div className="flex-1 space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div>
                        <h3 className="text-xs font-bold uppercase text-foreground tracking-wider">Order By (Optionnel)</h3>
                        <p className="text-[11px] text-muted-foreground">Order rows by columns ascending or descending</p>
                      </div>
                      {selectedTable && properties.length > 0 && (
                        <Select
                          value=""
                          onValueChange={(val) => {
                            if (val && !selectedOrderBy.some(o => o.column === val)) {
                              setSelectedOrderBy(prev => [...prev, { column: val, order: 'asc' }]);
                              toast.success(`Added sorting rule for ${val}`);
                            }
                          }}
                        >
                          <SelectTrigger className="h-8 px-3 rounded-lg text-xs font-bold bg-primary/10 border-transparent text-primary hover:bg-primary/20 shrink-0 gap-1.5 cursor-pointer shadow-sm">
                            <span className="flex items-center gap-1"><Plus className="w-3.5 h-3.5" /> Add Sort Rule</span>
                          </SelectTrigger>
                          <SelectContent>
                            {properties
                              .filter(p => !selectedOrderBy.some(o => o.column === p.name))
                              .map(p => (
                                <SelectItem key={p.name} value={p.name} className="text-xs font-medium">
                                  {p.name}
                                </SelectItem>
                              ))}
                          </SelectContent>
                        </Select>
                      )}
                    </div>

                    {selectedOrderBy.length > 0 ? (
                      <div className="space-y-2">
                        {selectedOrderBy.map(rule => (
                          <div key={rule.column} className="flex items-center justify-between p-2.5 bg-muted/40 border border-border rounded-lg text-xs font-semibold shadow-sm animate-in slide-in-from-top-0.5">
                            <span className="text-foreground">{rule.column}</span>
                            <div className="flex items-center gap-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setSelectedOrderBy(prev => prev.map(o => o.column === rule.column ? { ...o, order: o.order === 'asc' ? 'desc' : 'asc' } : o))}
                                className="text-[10px] font-bold uppercase h-6 px-2.5 text-primary hover:bg-primary/10 border border-primary/20 rounded-md cursor-pointer gap-1 flex items-center shadow-inner"
                              >
                                <ArrowUpDown className="w-3 h-3" />
                                <span>{rule.order}</span>
                              </Button>
                              <button 
                                onClick={() => setSelectedOrderBy(prev => prev.filter(o => o.column !== rule.column))}
                                className="text-muted-foreground hover:text-destructive p-1 rounded transition-colors cursor-pointer"
                              >
                                ✕
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="border border-dashed border-border rounded-lg p-4 text-center text-xs text-muted-foreground bg-muted/10">
                        No sort rules configured. Click '+ Add Sort Rule' to customize ordering.
                      </div>
                    )}
                  </div>
                </div>

                {/* Step 7: Limite (Optionnel) */}
                <div className="bg-card border border-border rounded-xl shadow-sm p-6 relative overflow-hidden flex flex-col md:flex-row md:items-center gap-6">
                  <div className="w-8 h-8 rounded-full bg-muted text-muted-foreground flex items-center justify-center font-bold text-xs shrink-0">
                    7
                  </div>
                  <div className="flex-1 space-y-2">
                    <h3 className="text-xs font-bold uppercase text-foreground tracking-wider">Limite (Optionnel)</h3>
                    <p className="text-[11px] text-muted-foreground">Maximum number of rows to return</p>
                    <Input
                      type="number"
                      placeholder="e.g., 1000"
                      value={selectedLimit}
                      onChange={(e) => setSelectedLimit(e.target.value)}
                      className="h-10 max-w-[200px] text-xs bg-background border-border rounded-lg shadow-sm focus-visible:ring-primary"
                    />
                  </div>
                </div>

                {/* Step 8 / OData URL Output & Connections */}
                <div className="bg-card border border-border rounded-xl shadow-sm p-6 space-y-4 animate-in fade-in duration-200">
                  <div className="flex items-center gap-2 border-b border-border pb-3">
                    <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-xs shrink-0 shadow-sm">
                      8
                    </div>
                    <div>
                      <h3 className="text-xs font-bold uppercase text-foreground tracking-wider">Generated OData URL</h3>
                      <p className="text-[11px] text-muted-foreground">Copy the direct service URL or connect directly to Excel / Power BI</p>
                    </div>
                  </div>

                  <div className="flex flex-col gap-3">
                    <div className="relative">
                      <Input 
                        readOnly 
                        id="generated-odata-url"
                        aria-label="Generated OData Service URL preview"
                        value={generatedUrl} 
                        placeholder="Compile state to generate URL..."
                        className="h-11 bg-muted/30 border-border font-mono text-[11px] text-primary focus-visible:ring-primary rounded-lg pr-24 w-full shadow-inner"
                      />
                      <Button 
                        size="sm"
                        disabled={!generatedUrl}
                        onClick={handleCopy}
                        className={`absolute right-1 top-1 h-9 px-3 rounded-md transition-all duration-300 cursor-pointer font-bold text-xs uppercase tracking-wider flex items-center gap-1.5 ${
                          copied 
                          ? 'bg-success hover:bg-success/90 text-success-foreground' 
                          : 'bg-primary hover:bg-primary/90 text-primary-foreground'
                        }`}
                        title="Copy URL"
                      >
                        {copied ? (
                          <>
                            <Check className="w-3.5 h-3.5" />
                            <span>Copied!</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3.5 h-3.5" />
                            <span>Copy</span>
                          </>
                        )}
                      </Button>
                    </div>

                    <div className="flex flex-wrap gap-2 pt-1">
                      <Button 
                        size="sm"
                        disabled={!generatedUrl || exporting}
                        onClick={handleExcelExport}
                        className="h-9 px-4 rounded-lg bg-emerald-600 hover:bg-emerald-700 shadow-sm transition-all cursor-pointer font-bold text-xs uppercase tracking-wider text-white flex items-center gap-2"
                        title="Connect to Excel"
                      >
                        {exporting ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="w-3.5 h-3.5">
                            <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
                            <polyline points="14 2 14 8 20 8" />
                            <path d="M8 13h2" /><path d="M8 17h2" /><path d="M10 9H8" />
                          </svg>
                        )}
                        <span>Export Excel (.odc)</span>
                      </Button>

                      <Button 
                        size="sm"
                        disabled={!generatedUrl || exportingPBI}
                        onClick={handlePowerBIExport}
                        className="h-9 px-4 rounded-lg bg-amber-500 hover:bg-amber-600 shadow-sm transition-all cursor-pointer font-bold text-xs uppercase tracking-wider text-white flex items-center gap-2"
                        title="Connect to Power BI"
                      >
                        {exportingPBI ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="w-3.5 h-3.5">
                            <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                            <line x1="9" y1="17" x2="9" y2="8" />
                            <line x1="15" y1="17" x2="15" y2="12" />
                          </svg>
                        )}
                        <span>Export Power BI (.pbids)</span>
                      </Button>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Sticky Bottom Footer */}
          {selectedTable && (
            <div className="h-16 border-t border-border bg-card flex items-center justify-end px-6 shrink-0 z-20 shadow-sm gap-3">
              <Button
                variant="outline"
                onClick={() => setShowPreviewModal(true)}
                className="h-10 px-6 rounded-lg text-xs font-bold border-border hover:bg-muted text-foreground transition-all cursor-pointer shadow-sm"
              >
                Preview Data
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Mobile Sticky Bar (Story 4.5) */}
      <MobileActionBar 
        url={generatedUrl} 
        projectName={selectedProject} 
        datasetName={selectedDataset} 
      />

      {/* Premium Preview Modal Overlay */}
      {showPreviewModal && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-md z-[100] flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-card border border-border rounded-xl shadow-2xl max-w-4xl w-full max-h-[80vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="p-4 border-b border-border bg-muted/10 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Database className="w-4 h-4 text-primary animate-pulse" />
                <h3 className="text-sm font-extrabold text-foreground tracking-wide uppercase">Query Data Preview</h3>
                <span className="text-[10px] bg-primary/10 text-primary px-2 py-0.5 rounded-full border border-primary/20 font-bold uppercase tracking-wider">{selectedTable}</span>
              </div>
              <button 
                onClick={() => setShowPreviewModal(false)}
                className="text-muted-foreground hover:text-foreground text-xs font-bold p-1 hover:bg-muted rounded-full w-6 h-6 flex items-center justify-center transition-colors cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Modal Content */}
            <div className="flex-1 overflow-auto p-6">
              <div className="space-y-4">
                <div className="flex items-start gap-3 p-3 bg-blue-500/5 border border-blue-500/10 rounded-lg text-xs text-blue-500/80 leading-relaxed shadow-sm">
                  <Info className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>This shows a live structural preview reflecting your current selected columns, filters, and relationship expands.</span>
                </div>

                <div className="border border-border rounded-xl overflow-hidden shadow-sm bg-background">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-muted/40 border-b border-border">
                        {(selectedColumns.length > 0 ? selectedColumns : properties.slice(0, 5).map(p => p.name)).map(col => (
                          <th key={col} className="p-3 text-[10px] font-bold text-muted-foreground uppercase tracking-wider border-r border-border last:border-r-0">
                            {col}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {[1, 2, 3, 4, 5].map((rowIdx) => (
                        <tr key={rowIdx} className="border-b border-border/60 last:border-b-0 hover:bg-muted/20 transition-colors">
                          {(selectedColumns.length > 0 ? selectedColumns : properties.slice(0, 5).map(p => p.name)).map((col, colIdx) => {
                            // Generate dummy data based on name or index
                            let val = '';
                            if (col.toLowerCase().includes('id')) val = `row_${rowIdx}_id`;
                            else if (col.toLowerCase().includes('date') || col.toLowerCase().includes('time') || col.toLowerCase().includes('stamp')) {
                              val = new Date(Date.now() - rowIdx * 86400000).toISOString().split('T')[0];
                            } else if (col.toLowerCase().includes('name')) val = `Sample ${col} ${rowIdx}`;
                            else if (col.toLowerCase().includes('amount') || col.toLowerCase().includes('price') || col.toLowerCase().includes('cost')) {
                              val = `$ ${(Math.random() * 1000 + 50).toFixed(2)}`;
                            } else if (col.toLowerCase().includes('status')) {
                              val = rowIdx % 2 === 0 ? 'ACTIVE' : 'PENDING';
                            } else {
                              val = `sample_val_${rowIdx}_${colIdx}`;
                            }

                            return (
                              <td key={col} className="p-3 text-xs text-foreground font-medium border-r border-border last:border-r-0 font-mono text-muted-foreground">
                                {val}
                              </td>
                            );
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-border bg-muted/15 flex items-center justify-between text-[11px] text-muted-foreground font-semibold">
              <span>Showing 5 mock rows based on projected schema.</span>
              <Button 
                onClick={() => setShowPreviewModal(false)}
                className="h-8 px-4 rounded-lg text-xs font-bold bg-primary hover:bg-primary/90 text-primary-foreground cursor-pointer shadow-sm"
              >
                Close Preview
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
