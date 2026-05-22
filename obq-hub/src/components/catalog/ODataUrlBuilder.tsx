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
import { Copy, Check, Database, Globe, Link as LinkIcon, Table, Sigma, ListTree, Activity, ChevronLeft, ChevronRight, Loader2, Search, Info } from 'lucide-react';
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
import { useVisualQueryStore } from '@/store/visual-query';
import { mapErrorToElenaAdvice } from '@/lib/error-mapping';
import { ErdCanvas } from '@/components/query-builder/erd-canvas';
import { ErdErrorBoundary } from '@/components/query-builder/erd-error-boundary';
import { compileODataUrl } from '@/lib/odata-compiler';

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
  const [exportingPBI, setExportingPBI] = useState(false);
  const [activeTab, setActiveTab] = useState<'canvas' | 'fields' | 'aggregations'>('canvas');
  const [liveAnnouncement, setLiveAnnouncement] = useState<string>('');
  const [leftCollapsed, setLeftCollapsed] = useState(false);
  const [rightCollapsed, setRightCollapsed] = useState(false);
  const [tableSearchQuery, setTableSearchQuery] = useState('');
  const selected_paths = useVisualQueryStore(state => state.selected_paths);
  const loadDatasetMetrics = useVisualQueryStore(state => state.loadDatasetMetrics);
  const isFallbackMode = useVisualQueryStore(state => state.isFallbackMode);
  const datasetMetrics = useVisualQueryStore(state => state.datasetMetrics);
  const nodes = useVisualQueryStore(state => state.nodes);

  // Track previous selected paths for aria-live announcements (Story 13.2)
  const prevSelectedPathsRef = useRef<string[]>([]);
  useEffect(() => {
    const prevPaths = prevSelectedPathsRef.current;
    if (JSON.stringify(prevPaths) !== JSON.stringify(selected_paths)) {
      const added = selected_paths.filter(p => !prevPaths.includes(p));
      const removed = prevPaths.filter(p => !selected_paths.includes(p));

      if (added.length > 0) {
        const expansionPath = added.find(p => p.includes('->'));
        const columnPath = added.find(p => p.includes('.'));
        const rootPath = added.find(p => !p.includes('->') && !p.includes('.'));

        if (expansionPath) {
          const [source, target] = expansionPath.split('->');
          const expandedTable = source === selectedTable ? target : source;
          setLiveAnnouncement(`OData Query updated: added ${expandedTable} expansion`);
        } else if (columnPath) {
          const [table, col] = columnPath.split('.');
          setLiveAnnouncement(`OData Query updated: selected column ${col} on ${table} table`);
        } else if (rootPath) {
          setLiveAnnouncement(`Query updated for primary table ${rootPath}. All columns selected.`);
        }
      } else if (removed.length > 0) {
        const expansionPath = removed.find(p => p.includes('->'));
        const columnPath = removed.find(p => p.includes('.'));
        const rootPath = removed.find(p => !p.includes('->') && !p.includes('.'));

        if (expansionPath) {
          const [source, target] = expansionPath.split('->');
          const expandedTable = source === selectedTable ? target : source;
          setLiveAnnouncement(`OData Query updated: removed ${expandedTable} expansion`);
        } else if (columnPath) {
          const [table, col] = columnPath.split('.');
          setLiveAnnouncement(`OData Query updated: unselected column ${col} on ${table} table`);
        } else if (rootPath) {
          setLiveAnnouncement(`OData Query cleared`);
        }
      }
      prevSelectedPathsRef.current = selected_paths;
    }
  }, [selected_paths, selectedTable]);
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

      // Load Dataset Metrics for performance guardrails (Story 12.1)
      loadDatasetMetrics(selectedProject, selectedDataset);

      // Reset state and clear canvas when dataset changes (Story 8.2 Patch & 12.1)
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
        useVisualQueryStore.getState().clearCanvas();
      }
    } else {
      setAvailableTables([]);
      setSelectedTable('');
      setUsageData(null);
      setLocalConnectionState('listening');
      useVisualQueryStore.getState().clearCanvas();
    }
  }, [selectedProject, selectedDataset, setElenaTip, openElenaDrawer, loadDatasetMetrics]);



  useEffect(() => {
    if (selectedProject && selectedDataset) {
      const serviceRoot = `${normalizedPublicBase}/v1/${selectedProject}/${selectedDataset}`;
      
      let url = '';
      if (selected_paths.length > 0) {
        url = compileODataUrl(serviceRoot, selectedTable, selected_paths);
      } else if (selectedTable) {
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
  }, [selectedProject, selectedDataset, selectedTable, selectedExpands, selectedExpandColumns, selectedColumns, selectedGroupBy, selectedAggs, publicServiceRoot, selected_paths, normalizedPublicBase]);

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
                    useVisualQueryStore.getState().clearCanvas();
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
                    useVisualQueryStore.getState().clearCanvas();
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

            {/* Table catalog Search & List */}
            {selectedDataset && (
              <div className="flex-1 flex flex-col min-h-0 space-y-2 pt-2 border-t border-border">
                <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1">
                  <Table className="w-3.5 h-3.5 text-primary" />
                  Table Catalog ({availableTables.length})
                </label>
                
                {/* Catalog Search input */}
                <div className="relative">
                  <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
                  <Input
                    type="text"
                    placeholder="Search tables..."
                    value={tableSearchQuery}
                    onChange={(e) => setTableSearchQuery(e.target.value)}
                    className="h-8 pl-8 text-xs bg-muted/20 border-border"
                  />
                </div>

                {/* Table List Container */}
                <div className="flex-1 overflow-y-auto pr-1 space-y-1 min-h-0 scrollbar-thin">
                  {loadingTables ? (
                    <div className="flex flex-col items-center justify-center py-8 text-muted-foreground text-xs gap-2 animate-pulse">
                      <Loader2 className="w-5 h-5 animate-spin text-primary" />
                      <span>Discovering tables...</span>
                    </div>
                  ) : fetchError ? (
                    <div className="p-3 text-[10px] text-destructive bg-destructive/10 rounded border border-destructive/20">
                      <p className="font-bold">Error loading catalog</p>
                      <p className="mt-1">{fetchError}</p>
                    </div>
                  ) : availableTables.length === 0 ? (
                    <div className="text-center py-6 text-xs text-muted-foreground">
                      No tables available.
                    </div>
                  ) : (
                    (() => {
                      const filtered = availableTables
                        .filter(t => t.toLowerCase().includes(tableSearchQuery.toLowerCase()))
                        .sort((a, b) => a.localeCompare(b));
                      
                      if (filtered.length === 0) {
                        return (
                          <div className="text-center py-4 text-[10px] text-muted-foreground italic">
                            No matching tables
                          </div>
                        );
                      }

                      return filtered.map(table => {
                        const isSelected = selectedTable === table;
                        return (
                          <button
                            key={table}
                            onClick={() => {
                              setSelectedTable(table); 
                              setSelectedExpands([]); 
                              setSelectedGroupBy([]);
                              setSelectedAggs({});
                              useVisualQueryStore.getState().clearCanvas();
                              useVisualQueryStore.getState().toggleNodeSelection(table);
                              useVisualQueryStore.getState().setActiveTable(table);
                            }}
                            className={`w-full flex items-center justify-between text-left px-3 py-2 rounded text-xs transition-all duration-150 group cursor-pointer ${
                              isSelected
                                ? 'bg-primary/10 text-primary border-l-4 border-primary font-semibold shadow-sm'
                                : 'hover:bg-muted/50 text-foreground font-medium border-l-4 border-transparent'
                            }`}
                          >
                            <span className="truncate pr-2">{table}</span>
                            {isSelected && (
                              <span className="text-[8px] font-bold uppercase bg-primary/20 text-primary px-1.5 py-0.5 rounded leading-none">
                                Active
                              </span>
                            )}
                          </button>
                        );
                      });
                    })()
                  )}
                </div>
              </div>
            )}
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

        {/* Center Panel (Maximized schema canvas) */}
        <div className="flex-1 h-full relative overflow-hidden bg-muted/5 flex flex-col">
          {/* Header */}
          <div className="h-12 border-b border-border bg-card/60 backdrop-blur px-4 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Interactive Workspace</span>
              {selectedTable && (
                <>
                  <span className="text-muted-foreground/30">|</span>
                  <div className="flex items-center gap-1 text-primary">
                    <Table className="w-4 h-4" />
                    <span className="text-xs font-bold">{selectedTable}</span>
                  </div>
                </>
              )}
            </div>

            {selectedTable && (
              <Button 
                variant="outline" 
                size="sm" 
                className="h-7 px-2.5 text-[10px] border-red-500/30 text-red-500 hover:bg-red-500/10 cursor-pointer font-bold uppercase"
                onClick={() => {
                  useVisualQueryStore.getState().clearCanvas();
                  if (selectedTable) {
                    useVisualQueryStore.getState().toggleNodeSelection(selectedTable);
                    useVisualQueryStore.getState().setActiveTable(selectedTable);
                    useVisualQueryStore.getState().loadNeighborhood(selectedProject, selectedDataset, selectedTable);
                  }
                  toast.success("Canvas reset successfully");
                }}
              >
                Reset Canvas
              </Button>
            )}
          </div>

          {/* Loader Overlay for main catalog elements */}
          {(loadingTables || loadingMetadata || loadingUsage) && (
            <div className="absolute top-0 inset-x-0 h-0.5 bg-primary/10 overflow-hidden z-30">
              <div className="h-full bg-primary animate-progress-indeterminate w-1/3" />
            </div>
          )}

          <div className="flex-1 w-full h-full relative min-h-0">
            {isFallbackMode && !selectedTable ? (
              <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center bg-background/80 z-20">
                <div className="max-w-md space-y-6">
                  <div className="mx-auto w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                    <Database className="w-7 h-7" />
                  </div>
                  <div className="space-y-2">
                    <h4 className="text-base font-bold text-foreground">Massive Dataset Detected 🚀</h4>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      This dataset has <strong className="text-primary">{datasetMetrics?.tableCount} tables</strong> and <strong className="text-primary">{datasetMetrics?.relationshipCount} relationships</strong>. To guarantee sub-second render speeds, we've loaded this dataset in <strong>Neighborhood Fallback View</strong>.
                    </p>
                  </div>
                  <div className="w-full space-y-2 text-left bg-card p-4 rounded-lg border border-border shadow-sm">
                    <label className="text-[10px] font-bold uppercase text-muted-foreground tracking-wider block">
                      Select Root Table to Start Exploration
                    </label>
                    <Select 
                      value={selectedTable} 
                      onValueChange={(val) => {
                        setSelectedTable(val || '');
                        useVisualQueryStore.getState().setActiveTable(val);
                        useVisualQueryStore.getState().toggleNodeSelection(val || '');
                      }}
                    >
                      <SelectTrigger className="w-full h-9 bg-background border border-border shadow-sm rounded hover:border-primary/50 text-xs font-semibold">
                        <SelectValue placeholder="Search or select a table..." />
                      </SelectTrigger>
                      <SelectContent className="max-h-[250px]">
                        {availableTables.map(t => (
                          <SelectItem key={t} value={t} className="text-xs font-medium">
                            {t}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            ) : !selectedTable ? (
              <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center bg-card">
                <div className="max-w-sm space-y-4">
                  <div className="mx-auto w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary animate-pulse">
                    <ListTree className="w-6 h-6" />
                  </div>
                  <div className="space-y-1">
                    <h4 className="text-sm font-bold text-foreground">No Catalog Table Active</h4>
                    <p className="text-xs text-muted-foreground">
                      {selectedDataset
                        ? "Select a table from the catalog list on the left to start building your query visually."
                        : "Please select a GCP Project and BigQuery Dataset in the Left Sidebar to inspect available schemas."}
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="w-full h-full relative">
                <ErdErrorBoundary>
                  <ErdCanvas 
                    projectId={selectedProject} 
                    datasetId={selectedDataset} 
                    rootTable={selectedTable} 
                  />
                </ErdErrorBoundary>
              </div>
            )}
          </div>

          {/* Generated OData URL bottom takes width of interactive workspace */}
          {selectedTable && (
            <div className="p-4 border-t border-border bg-card/90 backdrop-blur-sm flex items-center gap-4 shrink-0 z-20 animate-fade-in">
              <div className="shrink-0">
                <label className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest block mb-0.5">
                  Generated OData URL
                </label>
                <span className="text-[10px] text-muted-foreground font-medium">Ready for reporting</span>
              </div>
              
              <div className="flex-1 flex gap-1.5 items-center">
                <Input 
                  readOnly 
                  id="generated-odata-url"
                  aria-label="Generated OData Service URL preview"
                  value={generatedUrl} 
                  placeholder="Compile state to generate URL..."
                  className="h-9 bg-background border-border font-mono text-[10px] text-primary focus-visible:ring-primary rounded pr-1 flex-1 shadow-inner"
                />
                
                <Button 
                  size="sm"
                  disabled={!generatedUrl || exporting}
                  onClick={handleExcelExport}
                  className="h-9 px-3 rounded bg-emerald-600 hover:bg-emerald-700 shadow-sm transition-all cursor-pointer font-bold text-xs uppercase tracking-wider text-white flex items-center gap-1.5"
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
                  <span>Excel</span>
                </Button>

                <Button 
                  size="sm"
                  disabled={!generatedUrl || exportingPBI}
                  onClick={handlePowerBIExport}
                  className="h-9 px-3 rounded bg-amber-500 hover:bg-amber-600 shadow-sm transition-all cursor-pointer font-bold text-xs uppercase tracking-wider text-white flex items-center gap-1.5"
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
                  <span>Power BI</span>
                </Button>

                <Button 
                  size="sm"
                  disabled={!generatedUrl}
                  onClick={handleCopy}
                  className={`h-9 px-3 rounded transition-all duration-300 cursor-pointer font-bold text-xs uppercase tracking-wider flex items-center gap-1.5 ${
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
                      <span>Copy URL</span>
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Right Sidebar Panel (340px, collapsible) */}
        <div 
          className={`h-full border-l border-border bg-card flex flex-col relative transition-all duration-300 ${
            rightCollapsed ? 'w-0 overflow-hidden border-l-0' : 'w-[340px] shrink-0'
          }`}
        >
          {selectedTable ? (
            <div className="flex-1 flex flex-col h-full overflow-hidden">
              <div className="flex-1 overflow-y-auto p-4 space-y-4 min-h-0 scrollbar-thin">
                {/* Query Summary & Mapping Tree */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between pb-2 border-b border-border">
                    <div className="flex items-center gap-1.5 text-foreground">
                      <ListTree className="w-4.5 h-4.5 text-primary" />
                      <span className="text-[11px] font-bold uppercase tracking-wider">Projection & Joins</span>
                    </div>
                  </div>

                  {/* Primary Table & Columns */}
                  <div className="space-y-2.5">
                    <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest">Primary Table</p>
                    <div className="p-2 bg-muted/40 border border-border rounded flex items-center justify-between">
                      <span className="text-xs font-bold text-foreground">{selectedTable}</span>
                      <span className="text-[8px] font-bold text-primary bg-primary/10 px-1.5 py-0.5 rounded uppercase">Root</span>
                    </div>

                    <div className="space-y-1.5">
                      <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest">Columns Selected ($select)</p>
                      {(() => {
                        const cols = selected_paths.length > 0 
                          ? selected_paths.filter(p => p.startsWith(`${selectedTable}.`)).map(p => p.split('.')[1])
                          : selectedColumns;
                        
                        if (cols.length === 0) {
                          return (
                            <p className="text-[10px] text-muted-foreground italic bg-muted/20 p-2.5 rounded border border-dashed border-border leading-relaxed">
                              All columns projected ($select is empty)
                            </p>
                          );
                        }

                        return (
                          <div className="flex flex-wrap gap-1 max-h-[100px] overflow-y-auto p-0.5 scrollbar-thin">
                            {cols.map(c => (
                              <button
                                key={c}
                                onClick={() => {
                                  if (selected_paths.length > 0) {
                                    useVisualQueryStore.getState().toggleColumnSelection(selectedTable, c);
                                  } else {
                                    setSelectedColumns(prev => prev.filter(col => col !== c));
                                  }
                                }}
                                className="group flex items-center gap-1 text-[9px] font-bold bg-primary/10 text-primary hover:bg-red-50 hover:text-red-600 px-1.5 py-0.5 rounded border border-primary/20 transition-all cursor-pointer"
                                title={`Remove ${c} column`}
                              >
                                <span>{c}</span>
                                <span className="text-[7px] opacity-60 group-hover:opacity-100">✕</span>
                              </button>
                            ))}
                          </div>
                        );
                      })()}

                      {/* Add Column Dropdown */}
                      {(() => {
                        const currentCols = selected_paths.length > 0 
                          ? selected_paths.filter(p => p.startsWith(`${selectedTable}.`)).map(p => p.split('.')[1])
                          : selectedColumns;
                        const unselectedCols = properties.filter(prop => !currentCols.includes(prop.name));
                        if (unselectedCols.length === 0) return null;
                        return (
                          <div className="space-y-1 pt-1">
                            <select
                              id="add-column-select"
                              value=""
                              className="w-full h-8 rounded border border-border bg-background px-2 py-0.5 text-[10px] font-semibold shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring cursor-pointer"
                              onChange={(e) => {
                                const val = e.target.value;
                                if (val) {
                                  if (selected_paths.length > 0) {
                                    useVisualQueryStore.getState().toggleColumnSelection(selectedTable, val);
                                  } else {
                                    setSelectedColumns(prev => [...prev, val]);
                                  }
                                  toast.success(`Projected column ${val}`);
                                }
                              }}
                            >
                              <option value="">+ Add Column</option>
                              {unselectedCols.map(prop => (
                                <option key={prop.name} value={prop.name}>
                                  {prop.name}
                                </option>
                              ))}
                            </select>
                          </div>
                        );
                      })()}
                    </div>
                  </div>

                  {/* Joins ($expand) */}
                  <div className="space-y-2">
                    <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest">Expanded Relationships ($expand)</p>
                    
                    {(() => {
                      const expanded = selected_paths.length > 0
                        ? selected_paths.filter(p => p.includes('->')).map(p => {
                            const [source, target] = p.split('->');
                            if (source === selectedTable) return target;
                            if (target === selectedTable) return source;
                            return null;
                          }).filter(Boolean) as string[]
                        : selectedExpands;

                      return (
                        <div className="space-y-2">
                          {expanded.length === 0 ? (
                            <p className="text-[10px] text-muted-foreground italic bg-muted/20 p-2.5 rounded border border-dashed border-border leading-relaxed">
                              No relationships expanded yet. Double-click relationship edges or nodes on canvas to expand dynamically.
                            </p>
                          ) : (
                            <div className="space-y-2 max-h-[160px] overflow-y-auto p-0.5 scrollbar-thin">
                              {expanded.map(expTable => {
                                const expCols = selected_paths.length > 0
                                  ? selected_paths.filter(p => p.startsWith(`${expTable}.`)).map(p => p.split('.')[1])
                                  : (selectedExpandColumns[expTable] || []);

                                return (
                                  <div key={expTable} className="p-2.5 bg-muted/30 border border-border rounded space-y-1.5 animate-in slide-in-from-top-1">
                                    <div className="flex items-center justify-between">
                                      <span className="text-[10px] font-bold text-foreground truncate pr-2">{expTable}</span>
                                      <button
                                        onClick={() => {
                                          if (selected_paths.length > 0) {
                                            useVisualQueryStore.getState().toggleNodeSelection(expTable);
                                          } else {
                                            setSelectedExpands(prev => prev.filter(t => t !== expTable));
                                          }
                                        }}
                                        className="text-[9px] font-bold text-destructive hover:underline cursor-pointer"
                                        title={`Remove ${expTable} join`}
                                      >
                                        Remove
                                      </button>
                                    </div>

                                    <div className="flex flex-wrap gap-0.5">
                                      {expCols.length === 0 ? (
                                        <span className="text-[8px] text-muted-foreground italic">All fields selected</span>
                                      ) : (
                                        expCols.map(col => (
                                          <button
                                            key={col}
                                            onClick={() => {
                                              if (selected_paths.length > 0) {
                                                useVisualQueryStore.getState().toggleColumnSelection(expTable, col);
                                              } else {
                                                setSelectedExpandColumns(prev => ({
                                                  ...prev,
                                                  [expTable]: (prev[expTable] || []).filter(c => c !== col)
                                                }));
                                              }
                                            }}
                                            className="group flex items-center gap-0.5 text-[8px] font-bold bg-card text-muted-foreground hover:bg-red-50 hover:text-red-600 px-1.5 py-0.5 rounded border border-border cursor-pointer transition-all"
                                            title={`Remove ${col} column`}
                                          >
                                            <span>{col}</span>
                                            <span className="text-[6px] opacity-60 group-hover:opacity-100">✕</span>
                                          </button>
                                        ))
                                      )}
                                    </div>

                                    {/* Add Column Dropdown for Expanded Table */}
                                    {(() => {
                                      const expNode = nodes.find(n => n.id === expTable);
                                      const expNodeCols = (expNode?.data as any)?.columns || [];
                                      if (expNodeCols.length === 0) return null;

                                      const unselectedExpCols = expNodeCols.filter(
                                        (c: any) => !expCols.includes(c.name)
                                      );
                                      if (unselectedExpCols.length === 0) return null;

                                      return (
                                        <div className="space-y-0.5 pt-1">
                                          <select
                                            id={`add-column-select-${expTable}`}
                                            value=""
                                            className="w-full h-7 rounded border border-border bg-background px-1.5 py-0.5 text-[9px] font-medium shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring cursor-pointer"
                                            onChange={(e) => {
                                              const val = e.target.value;
                                              if (val) {
                                                if (selected_paths.length > 0) {
                                                  useVisualQueryStore.getState().toggleColumnSelection(expTable, val);
                                                } else {
                                                  setSelectedExpandColumns(prev => ({
                                                    ...prev,
                                                    [expTable]: [...(prev[expTable] || []), val]
                                                  }));
                                                }
                                                toast.success(`Projected column ${val} on ${expTable}`);
                                              }
                                            }}
                                          >
                                            <option value="">+ Add Column</option>
                                            {unselectedExpCols.map((c: any) => (
                                              <option key={c.name} value={c.name}>
                                                {c.name}
                                              </option>
                                            ))}
                                          </select>
                                        </div>
                                      );
                                    })()}
                                  </div>
                                );
                              })}
                            </div>
                          )}

                          {/* Standard Dropdown to add expands */}
                          {navProps.length > 0 && (
                            <div className="space-y-1 pt-1.5 border-t border-border">
                              <select
                                id="add-join-select"
                                className="w-full h-8 rounded border border-border bg-background px-2 py-0.5 text-[10px] font-semibold shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring cursor-pointer"
                                onChange={(e) => {
                                  const targetVal = e.target.value;
                                  if (targetVal) {
                                    if (selected_paths.length > 0) {
                                      const store = useVisualQueryStore.getState();
                                      const edges = store.edges;
                                      const edge = edges.find(ed => (ed.source === selectedTable && ed.target === targetVal) || (ed.source === targetVal && ed.target === selectedTable));
                                      
                                      // Ensure root table is in selected_paths
                                      let currentPaths = store.selected_paths;
                                      if (!currentPaths.includes(selectedTable)) {
                                        store.toggleNodeSelection(selectedTable);
                                        currentPaths = useVisualQueryStore.getState().selected_paths;
                                      }
                                      
                                      // Ensure target table is in selected_paths
                                      if (!currentPaths.includes(targetVal)) {
                                        store.toggleNodeSelection(targetVal);
                                        currentPaths = useVisualQueryStore.getState().selected_paths;
                                      }
                                      
                                      if (edge) {
                                        const joinKey = `${edge.source}->${edge.target}`;
                                        if (!currentPaths.includes(joinKey)) {
                                          useVisualQueryStore.getState().toggleEdgeSelection(edge.id);
                                        }
                                      } else {
                                        // No edge in store — directly add the join path
                                        const joinKey = `${selectedTable}->${targetVal}`;
                                        const reverseJoinKey = `${targetVal}->${selectedTable}`;
                                        const latestPaths = useVisualQueryStore.getState().selected_paths;
                                        if (!latestPaths.includes(joinKey) && !latestPaths.includes(reverseJoinKey)) {
                                          useVisualQueryStore.setState({ 
                                            selected_paths: [...latestPaths, joinKey] 
                                          });
                                        }
                                      }
                                    } else {
                                      setSelectedExpands(prev => prev.includes(targetVal) ? prev : [...prev, targetVal]);
                                    }
                                    e.target.value = ''; // reset dropdown
                                    toast.success(`Joined relationship ${targetVal}`);
                                  }
                                }}
                              >
                                <option value="">+ Add Join</option>
                                {navProps
                                  .filter(prop => !expanded.includes(prop.name))
                                  .map(prop => (
                                    <option key={prop.name} value={prop.name}>
                                      {prop.name}
                                    </option>
                                  ))}
                              </select>
                            </div>
                          )}
                        </div>
                      );
                    })()}
                  </div>
                </div>

                {/* Aggregations ($apply) */}
                <div className="space-y-3 pt-3 border-t border-border">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-1">
                      <Sigma className="w-3.5 h-3.5 text-success" /> Summarization ($apply)
                    </span>
                  </div>

                  <div className="space-y-2">
                    {/* Group By Selector */}
                    <div className="space-y-1.5">
                      <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest">Group By (Categorical)</p>
                      <div className="flex flex-wrap gap-1 max-h-[80px] overflow-y-auto p-0.5 scrollbar-thin">
                        {properties.filter(p => !p.isNumeric).map(prop => (
                          <button
                            key={prop.name}
                            onClick={() => toggleGroupBy(prop.name)}
                            className={`px-2 py-0.5 rounded-full text-[9px] font-bold transition-all border cursor-pointer ${
                              selectedGroupBy.includes(prop.name)
                              ? 'bg-primary text-primary-foreground border-primary shadow-sm'
                              : 'bg-card text-muted-foreground border-border hover:border-primary/50'
                            }`}
                          >
                            {prop.name}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Calculations Selector */}
                    <div className="space-y-1.5">
                      <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest">Calculations (Numerical)</p>
                      <div className="space-y-1 max-h-[140px] overflow-y-auto p-0.5 scrollbar-thin">
                        {properties.filter(p => p.isNumeric).map(prop => (
                          <div key={prop.name} className="flex items-center justify-between bg-muted/30 px-2 py-1.5 rounded border border-border text-[10px]">
                            <span className="font-bold text-foreground truncate pr-1">{prop.name}</span>
                            <div className="flex gap-0.5">
                              {['sum', 'average', 'count'].map((func) => (
                                <button
                                  key={func}
                                  onClick={() => setAggregation(prop.name, func as any)}
                                  className={`px-1.5 py-0.5 rounded text-[8px] font-bold uppercase transition-all cursor-pointer ${
                                    selectedAggs[prop.name] === func
                                    ? 'bg-success/20 text-success border border-success/30 font-extrabold'
                                    : 'text-muted-foreground hover:bg-muted border border-transparent'
                                  }`}
                                >
                                  {func}
                                </button>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Inline budget dashboard indicators */}
              {selectedDataset && usageData && (
                <div className="p-4 border-t border-border bg-card shrink-0">
                  <div className="flex items-center justify-between text-[8px] font-bold uppercase tracking-wider text-muted-foreground mb-1">
                    <span>Query Budget Status</span>
                    <span>{(usageData.totalBytesBilled / usageData.budgetBytes * 100).toFixed(1)}%</span>
                  </div>
                  <div className="h-1.5 w-full bg-muted border border-border rounded overflow-hidden">
                    <div 
                      className={`h-full transition-all duration-500 ${
                        (usageData.totalBytesBilled / usageData.budgetBytes) > 0.9 
                          ? 'bg-red-500' 
                          : (usageData.totalBytesBilled / usageData.budgetBytes) > 0.7 
                            ? 'bg-yellow-500' 
                            : 'bg-green-500'
                      }`}
                      style={{ width: `${Math.min(100, (usageData.totalBytesBilled / usageData.budgetBytes * 100))}%` }}
                    />
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center p-6 text-center text-muted-foreground text-xs gap-3">
              <Info className="w-8 h-8 opacity-45" />
              <span>Select a catalog table to inspect visual properties, configure aggregations, and export query files.</span>
            </div>
          )}

          {/* Absolute floating Right Sidebar Panel toggle chevron */}
          <button
            onClick={() => setRightCollapsed(!rightCollapsed)}
            className="absolute left-[-14px] top-1/2 -translate-y-1/2 z-50 bg-background border border-border rounded-full p-0.5 shadow-md hover:bg-muted cursor-pointer transition-transform text-foreground hover:text-primary"
            aria-label={rightCollapsed ? "Expand right sidebar" : "Collapse right sidebar"}
          >
            {rightCollapsed ? <ChevronLeft className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {/* Mobile Sticky Bar (Story 4.5) */}
      <MobileActionBar 
        url={generatedUrl} 
        projectName={selectedProject} 
        datasetName={selectedDataset} 
      />
    </div>
  );
};
