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
import { Copy, Check, Database, Globe, Link as LinkIcon, Table, Sigma, ListTree, Activity, ChevronLeft, Loader2 } from 'lucide-react';
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
          const [, target] = expansionPath.split('->');
          setLiveAnnouncement(`OData Query updated: added ${target} expansion`);
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
          const [, target] = expansionPath.split('->');
          setLiveAnnouncement(`OData Query updated: removed ${target} expansion`);
        } else if (columnPath) {
          const [table, col] = columnPath.split('.');
          setLiveAnnouncement(`OData Query updated: unselected column ${col} on ${table} table`);
        } else if (rootPath) {
          setLiveAnnouncement(`OData Query cleared`);
        }
      }
      prevSelectedPathsRef.current = selected_paths;
    }
  }, [selected_paths]);
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
    <Card className="w-full border-border shadow-sm bg-card rounded-md overflow-hidden relative">
      <a 
        href="#query-summary-sidebar" 
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-[100] focus:px-4 focus:py-2.5 focus:bg-primary focus:text-primary-foreground focus:rounded-md focus:shadow-lg focus:border focus:border-border focus:outline focus:outline-2 focus:outline-offset-2 focus:outline-primary transition-all text-xs font-bold uppercase tracking-wider"
      >
        Skip to Query Summary Sidebar
      </a>

      {/* Accessible Live Region Announcements */}
      <div className="sr-only" aria-live="polite" aria-atomic="true">
        {liveAnnouncement}
      </div>
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
            <label htmlFor="gcp-project-select" className="text-sm font-bold text-foreground uppercase tracking-tight flex items-center gap-2">
              <Database className="w-4 h-4 text-primary" />
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
              <SelectTrigger id="gcp-project-select" className="h-12 border-border focus:ring-primary rounded">
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
            <label htmlFor="bq-dataset-select" className="text-sm font-bold text-foreground uppercase tracking-tight flex items-center gap-2">
              <Database className="w-4 h-4 text-primary" />
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
              <SelectTrigger id="bq-dataset-select" className="h-12 border-border focus:ring-primary rounded">
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
          <label htmlFor="primary-table-select" className="text-sm font-bold text-foreground uppercase tracking-tight flex items-center gap-2">
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
                // Clear canvas and seed Zustand selection state
                useVisualQueryStore.getState().clearCanvas();
                useVisualQueryStore.getState().toggleNodeSelection(val);
                useVisualQueryStore.getState().setActiveTable(val);
              } 
            }}
            value={selectedTable}
          >
            <SelectTrigger id="primary-table-select" className="h-12 border-border focus:ring-primary rounded">
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

        {/* Tab Interface for Visual Query Builder */}
        {(selectedTable || isFallbackMode) && (
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
            <div className="lg:col-span-3 space-y-6">
            {isEnabled ? (
              <>
                {/* Tab Switcher */}
                <div className="flex border-b border-border gap-2">
                  <button
                    onClick={() => setActiveTab('canvas')}
                    className={`px-4 py-2.5 text-xs font-bold uppercase tracking-wider border-b-2 transition-all cursor-pointer ${
                      activeTab === 'canvas'
                        ? 'border-primary text-primary'
                        : 'border-transparent text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    Interactive Canvas (ERD)
                  </button>
                  <button
                    onClick={() => setActiveTab('fields')}
                    className={`px-4 py-2.5 text-xs font-bold uppercase tracking-wider border-b-2 transition-all cursor-pointer ${
                      activeTab === 'fields'
                        ? 'border-primary text-primary'
                        : 'border-transparent text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    Fields Selector
                  </button>
                  <button
                    onClick={() => setActiveTab('aggregations')}
                    className={`px-4 py-2.5 text-xs font-bold uppercase tracking-wider border-b-2 transition-all cursor-pointer ${
                      activeTab === 'aggregations'
                        ? 'border-primary text-primary'
                        : 'border-transparent text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    Summarization
                  </button>
                </div>

                {/* Tab Contents */}
                {activeTab === 'canvas' && (
                  <div className="space-y-6 animate-in fade-in duration-300">
                    <div className="flex justify-between items-center px-1">
                      <div className="space-y-0.5">
                        <h3 className="text-sm font-bold uppercase tracking-tight flex items-center gap-1.5 text-primary">
                          <Activity className="w-4 h-4" />
                          Schema Exploration Canvas
                        </h3>
                        <p className="text-[10px] text-muted-foreground">
                          Inspect your dataset ERD schema relationships in real time.
                        </p>
                      </div>
                      {selectedTable && (
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="h-8 px-3 text-xs border-red-500/30 text-red-500 hover:bg-red-500/10 cursor-pointer"
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

                    {isFallbackMode && !selectedTable ? (
                      <div className="flex flex-col items-center justify-center p-12 border-2 border-dashed border-border rounded-xl bg-card text-center space-y-6 max-w-2xl mx-auto shadow-sm">
                        <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                          <Database className="w-8 h-8" />
                        </div>
                        <div className="space-y-2">
                          <h4 className="text-lg font-bold text-foreground">Massive Dataset Detected 🚀</h4>
                          <p className="text-sm text-muted-foreground max-w-md">
                            This dataset has <strong className="text-primary">{datasetMetrics?.tableCount} tables</strong> and <strong className="text-primary">{datasetMetrics?.relationshipCount} relationships</strong>. To guarantee sub-second render speeds, we've loaded this dataset in <strong>Neighborhood Fallback View</strong>.
                          </p>
                        </div>
                        <div className="w-full max-w-sm space-y-2">
                          <label className="text-xs font-bold uppercase text-muted-foreground tracking-wider block text-left">
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
                            <SelectTrigger className="w-full h-11 bg-background border border-border shadow-sm rounded-lg hover:border-primary/50 focus:ring-2 focus:ring-primary/20 transition-all font-medium text-foreground">
                              <SelectValue placeholder="Search or select a table..." />
                            </SelectTrigger>
                            <SelectContent className="max-h-[300px]">
                              {availableTables.map(t => (
                                <SelectItem key={t} value={t} className="font-medium">
                                  {t}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    ) : (
                      <ErdErrorBoundary>
                        <ErdCanvas 
                          projectId={selectedProject} 
                          datasetId={selectedDataset} 
                          rootTable={selectedTable} 
                        />
                      </ErdErrorBoundary>
                    )}
                  </div>
                )}

                {activeTab === 'fields' && (
                  <div className="space-y-6 animate-in fade-in duration-300">
                    {/* Columns Selector */}
                    <div className="space-y-4 p-6 bg-muted/20 border border-border rounded">
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

                    {/* Visual Join Builder */}
                    <div className="space-y-4 p-6 bg-accent/20 border border-accent rounded">
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

                              {selectedExpands.includes(prop.name) && (
                                <ExpandColumnSelector 
                                  projectId={selectedProject}
                                  datasetId={selectedDataset}
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
                  </div>
                )}

                {activeTab === 'aggregations' && (
                  <div className="space-y-4 p-6 bg-muted/20 border border-border rounded animate-in fade-in duration-300">
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
              </>
            ) : (
              <>
                {/* Fallback original simple column layout when isEnabled is false */}
                <div className="space-y-4 p-6 bg-muted/20 border border-border rounded">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-foreground">
                      <ListTree className="w-4 h-4 text-primary" />
                      <h3 className="text-sm font-bold uppercase tracking-tight">Select Columns</h3>
                    </div>
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
                        </Button>
                      ))
                    )}
                  </div>
                </div>
              </>
            )}
            </div>

            {/* Right Column: Query Summary Sidebar (Story 13.2) */}
            <div 
              id="query-summary-sidebar"
              tabIndex={-1}
              className="lg:col-span-2 space-y-6 bg-muted/10 p-6 rounded-xl border border-border/80 shadow-sm flex flex-col justify-between focus:outline-none focus:ring-1 focus:ring-primary/30"
              aria-label="Query Summary and Alternative Builder"
            >
              <div className="space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between pb-3 border-b border-border">
                  <div className="flex items-center gap-2 text-foreground">
                    <ListTree className="w-5 h-5 text-primary" />
                    <h3 className="text-sm font-bold uppercase tracking-wider">Query Summary</h3>
                  </div>
                  <span className="text-[10px] font-bold text-muted-foreground bg-secondary px-2 py-0.5 rounded border border-border uppercase">
                    Alternative Builder
                  </span>
                </div>

                {/* Primary Table & Columns */}
                <div className="space-y-3">
                  <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Primary Table</p>
                  <div className="p-3 bg-background border border-border rounded-lg flex items-center justify-between">
                    <span className="text-sm font-bold text-foreground">{selectedTable}</span>
                    <span className="text-[10px] font-bold text-primary bg-primary/10 px-2 py-0.5 rounded uppercase">Root</span>
                  </div>

                  <div className="space-y-2">
                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Columns Selected</p>
                    {(() => {
                      const cols = selected_paths.length > 0 
                        ? selected_paths.filter(p => p.startsWith(`${selectedTable}.`)).map(p => p.split('.')[1])
                        : selectedColumns;
                      
                      if (cols.length === 0) {
                        return <p className="text-xs text-muted-foreground italic bg-background p-3 rounded-lg border border-dashed border-border">All columns projected ($select is empty)</p>;
                      }

                      return (
                        <div className="flex flex-wrap gap-1.5 max-h-[120px] overflow-y-auto p-1">
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
                              className="group flex items-center gap-1 text-[10px] font-bold bg-primary/10 text-primary hover:bg-red-50 hover:text-red-600 px-2 py-1 rounded border border-primary/20 transition-all cursor-pointer"
                              title={`Remove ${c} column`}
                            >
                              <span>{c}</span>
                              <span className="text-[8px] opacity-60 group-hover:opacity-100">✕</span>
                            </button>
                          ))}
                        </div>
                      );
                    })()}

                    {/* Add Column Dropdown (Story 13.2) */}
                    {(() => {
                      const currentCols = selected_paths.length > 0 
                        ? selected_paths.filter(p => p.startsWith(`${selectedTable}.`)).map(p => p.split('.')[1])
                        : selectedColumns;
                      const unselectedCols = properties.filter(prop => !currentCols.includes(prop.name));
                      if (unselectedCols.length === 0) return null;
                      return (
                        <div className="space-y-1.5 pt-1.5 border-t border-border/50">
                          <label htmlFor="add-column-select" className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest block">
                            Add Column
                          </label>
                          <select
                            id="add-column-select"
                            value=""
                            className="w-full h-8 rounded border border-input bg-background px-2 py-0.5 text-xs font-semibold shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring cursor-pointer"
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
                            <option value="">-- Choose column to project --</option>
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
                <div className="space-y-4">
                  <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Expanded Relationships</p>
                  
                  {(() => {
                    const expanded = selected_paths.length > 0
                      ? selected_paths.filter(p => p.includes('->') && p.split('->')[0] === selectedTable).map(p => p.split('->')[1])
                      : selectedExpands;

                    return (
                      <div className="space-y-2.5">
                        {expanded.length === 0 ? (
                          <p className="text-xs text-muted-foreground italic bg-background p-3 rounded-lg border border-dashed border-border">No relationships expanded yet.</p>
                        ) : (
                          <div className="space-y-2 max-h-[200px] overflow-y-auto p-1">
                            {expanded.map(expTable => {
                              const expCols = selected_paths.length > 0
                                ? selected_paths.filter(p => p.startsWith(`${expTable}.`)).map(p => p.split('.')[1])
                                : (selectedExpandColumns[expTable] || []);

                              return (
                                <div key={expTable} className="p-3 bg-background border border-border rounded-lg space-y-2 animate-in slide-in-from-top-1">
                                  <div className="flex items-center justify-between">
                                    <span className="text-xs font-bold text-foreground">{expTable}</span>
                                    <button
                                      onClick={() => {
                                        if (selected_paths.length > 0) {
                                          const edges = useVisualQueryStore.getState().edges;
                                          const edge = edges.find(e => (e.source === selectedTable && e.target === expTable) || (e.source === expTable && e.target === selectedTable));
                                          if (edge) {
                                            useVisualQueryStore.getState().toggleNodeSelection(expTable);
                                          } else {
                                            useVisualQueryStore.getState().toggleNodeSelection(expTable);
                                          }
                                        } else {
                                          setSelectedExpands(prev => prev.filter(t => t !== expTable));
                                        }
                                      }}
                                      className="text-[10px] font-bold text-destructive hover:underline cursor-pointer"
                                      title={`Remove ${expTable} join`}
                                    >
                                      Remove
                                    </button>
                                  </div>

                                  <div className="flex flex-wrap gap-1">
                                    {expCols.length === 0 ? (
                                      <span className="text-[9px] text-muted-foreground italic">All fields selected</span>
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
                                          className="group flex items-center gap-1 text-[9px] font-bold bg-muted text-muted-foreground hover:bg-red-50 hover:text-red-600 px-1.5 py-0.5 rounded border border-border cursor-pointer transition-all"
                                          title={`Remove ${col} column`}
                                        >
                                          <span>{col}</span>
                                          <span className="text-[7px] opacity-60 group-hover:opacity-100">✕</span>
                                        </button>
                                      ))
                                    )}
                                  </div>

                                  {/* Add Column Dropdown for Expanded Table (Story 13.2) */}
                                  {(() => {
                                    const expNode = nodes.find(n => n.id === expTable);
                                    const expNodeCols = (expNode?.data as any)?.columns || [];
                                    if (expNodeCols.length === 0) return null;

                                    const unselectedExpCols = expNodeCols.filter(
                                      (c: any) => !expCols.includes(c.name)
                                    );
                                    if (unselectedExpCols.length === 0) return null;

                                    return (
                                      <div className="space-y-1 pt-1.5 border-t border-border/50">
                                        <label
                                          htmlFor={`add-column-select-${expTable}`}
                                          className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest block"
                                        >
                                          Add Column
                                        </label>
                                        <select
                                          id={`add-column-select-${expTable}`}
                                          value=""
                                          className="w-full h-8 rounded border border-input bg-background px-2 py-0.5 text-[10px] font-medium shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring cursor-pointer"
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
                                          <option value="">-- Choose column --</option>
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

                        {/* Standard Dropdown to add expands (parity builder) */}
                        {navProps.length > 0 && (
                          <div className="space-y-2 pt-2 border-t border-border">
                            <label htmlFor="add-join-select" className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest block">
                              Add Related Table (Join)
                            </label>
                            <div className="flex gap-2">
                              <select
                                id="add-join-select"
                                className="flex-1 h-9 rounded-md border border-input bg-background px-3 py-1 text-xs font-medium shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                                onChange={(e) => {
                                  const targetVal = e.target.value;
                                  if (targetVal) {
                                    if (selected_paths.length > 0) {
                                      const edges = useVisualQueryStore.getState().edges;
                                      const edge = edges.find(ed => (ed.source === selectedTable && ed.target === targetVal) || (ed.source === targetVal && ed.target === selectedTable));
                                      
                                      if (!selected_paths.includes(targetVal)) {
                                        useVisualQueryStore.getState().toggleNodeSelection(targetVal);
                                      }
                                      if (edge) {
                                        const joinKey = `${edge.source}->${edge.target}`;
                                        if (!selected_paths.includes(joinKey)) {
                                          useVisualQueryStore.getState().toggleEdgeSelection(edge.id);
                                        }
                                      } else {
                                        useVisualQueryStore.getState().toggleNodeSelection(targetVal);
                                      }
                                    } else {
                                      setSelectedExpands(prev => prev.includes(targetVal) ? prev : [...prev, targetVal]);
                                    }
                                    e.target.value = ''; // reset dropdown
                                    toast.success(`Joined relationship ${targetVal}`);
                                  }
                                }}
                              >
                                <option value="">-- Choose table to join --</option>
                                {navProps
                                  .filter(prop => !expanded.includes(prop.name))
                                  .map(prop => (
                                    <option key={prop.name} value={prop.name}>
                                      {prop.name} (Automatic Join)
                                    </option>
                                  ))}
                              </select>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })()}
                </div>
              </div>

              {/* URL Preview & Actions */}
              <div className="space-y-3 pt-4 border-t border-border">
                <div className="flex justify-between items-end">
                  <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                    Generated OData Service URL
                  </label>
                </div>
                
                <div className="flex gap-1.5">
                  <Input 
                    readOnly 
                    id="generated-odata-url"
                    aria-label="Generated OData Service URL preview"
                    value={generatedUrl} 
                    placeholder="Compile state to generate URL..."
                    className="h-10 bg-muted/30 border-border font-mono text-xs text-primary focus-visible:ring-primary rounded"
                  />
                  
                  <Button 
                    size="icon"
                    disabled={!generatedUrl || exporting}
                    onClick={handleExcelExport}
                    className="h-10 w-10 shrink-0 rounded bg-emerald-500 hover:bg-emerald-600 shadow-sm transition-all"
                    title="Connect to Excel"
                  >
                    {exporting ? (
                      <Loader2 className="w-4 h-4 animate-spin text-white" />
                    ) : (
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4 text-white">
                        <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
                        <polyline points="14 2 14 8 20 8" />
                        <path d="M8 13h2" /><path d="M8 17h2" /><path d="M10 9H8" />
                      </svg>
                    )}
                  </Button>

                  <Button 
                    size="icon"
                    disabled={!generatedUrl || exportingPBI}
                    onClick={handlePowerBIExport}
                    className="h-10 w-10 shrink-0 rounded bg-amber-500 hover:bg-amber-600 shadow-sm transition-all"
                    title="Connect to Power BI"
                  >
                    {exportingPBI ? (
                      <Loader2 className="w-4 h-4 animate-spin text-white" />
                    ) : (
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4 text-white">
                        <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                        <line x1="9" y1="17" x2="9" y2="8" />
                        <line x1="15" y1="17" x2="15" y2="12" />
                      </svg>
                    )}
                  </Button>

                  <Button 
                    size="icon"
                    disabled={!generatedUrl}
                    onClick={handleCopy}
                    className={`h-10 w-10 shrink-0 rounded transition-all duration-300 ${
                      copied 
                      ? 'bg-success hover:bg-success/90 shadow-sm' 
                      : 'bg-primary hover:bg-primary/90 shadow-sm'
                    }`}
                    title="Copy URL"
                  >
                    {copied ? <Check className="w-4 h-4 text-success-foreground" /> : <Copy className="w-4 h-4 text-primary-foreground" />}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* URL Preview & Copy */}
        {!selectedTable && (
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
                disabled={!generatedUrl || exportingPBI}
                onClick={handlePowerBIExport}
                className={`h-14 w-14 rounded-md transition-all duration-300 ${
                  exportingPBI 
                  ? 'bg-amber-600 hover:bg-amber-600 shadow-sm animate-in fade-in' 
                  : 'bg-amber-500 hover:bg-amber-600 shadow-sm animate-in fade-in'
                }`}
                title="Connect to Power BI"
              >
                {exportingPBI ? (
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
                    <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                    <line x1="9" y1="17" x2="9" y2="8" />
                    <line x1="15" y1="17" x2="15" y2="12" />
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
        )}
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
