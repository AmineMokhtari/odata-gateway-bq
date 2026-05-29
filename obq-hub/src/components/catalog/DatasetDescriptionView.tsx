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

import React, { useState } from 'react';
import { 
  Database, 
  Table as TableIcon, 
  Columns, 
  ChevronLeft, 
  ArrowRight,
  Info,
  Search,
  Filter,
  ExternalLink,
  Copy,
  Check,
  FileSpreadsheet,
  Download
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { downloadODataODC, downloadODataPBIDS } from '@/lib/excel-generator';
import { toast } from 'sonner';

interface DatasetMetadata {
  projectId: string;
  datasetId: string;
  location: string;
  tables: Array<{
    name: string;
    description?: string;
    columns: Array<{
      name: string;
      type: string;
      isNullable: boolean;
      description?: string;
    }>;
  }>;
}

interface DatasetDescriptionViewProps {
  metadata: DatasetMetadata;
}

export const DatasetDescriptionView: React.FC<DatasetDescriptionViewProps> = ({ metadata }) => {
  const router = useRouter();
  const [selectedTableName, setSelectedTableName] = useState<string>(metadata.tables[0]?.name || '');
  const [searchQuery, setSearchQuery] = useState('');
  const [copied, setCopied] = useState(false);

  const selectedTable = metadata.tables.find(t => t.name === selectedTableName);

  const filteredTables = metadata.tables.filter(t => 
    t.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Dynamic OData URL targeting the service root of the dataset (not the selected table)
  const publicGatewayBase = process.env.NEXT_PUBLIC_GATEWAY_URL || 'http://127.0.0.1:3005';
  const normalizedPublicBase = publicGatewayBase.endsWith('/') ? publicGatewayBase.slice(0, -1) : publicGatewayBase;
  const odataUrl = `${normalizedPublicBase}/v1/${metadata.projectId}/${metadata.datasetId}`;

  const handleCopyUrl = () => {
    navigator.clipboard.writeText(odataUrl);
    setCopied(true);
    toast.success('OData URL copied to clipboard!', {
      description: 'Service root link is ready.',
    });
    setTimeout(() => setCopied(false), 2000);
  };

  const handleExcelExport = () => {
    const filename = `${metadata.projectId}_${metadata.datasetId}`;
    downloadODataODC(odataUrl, filename);
    toast.success('Excel Connection Created!', {
      description: 'Open the downloaded .odc file to start your analysis.',
    });
  };

  const handlePowerBIExport = () => {
    const filename = `${metadata.projectId}_${metadata.datasetId}`;
    downloadODataPBIDS(odataUrl, filename);
    toast.success('Power BI Connection Created!', {
      description: 'Open the downloaded .pbids file to start your analysis.',
    });
  };

  return (
    <div className="flex flex-col gap-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-primary font-bold uppercase tracking-widest text-[10px]">
             <Button variant="ghost" size="sm" onClick={() => router.push('/catalog')} className="h-6 px-1 gap-1 -ml-1 text-primary hover:bg-primary/10">
               <ChevronLeft className="w-3 h-3" />
               Back to Catalog
             </Button>
             <span className="text-muted-foreground opacity-50">/</span>
             <span>Dataset Details</span>
          </div>
          <h1 className="text-4xl font-bold text-foreground tracking-tight font-sans">
            {metadata.datasetId}
          </h1>
          <p className="text-sm text-muted-foreground flex items-center gap-2">
            <span className="font-mono text-[10px] bg-muted px-2 py-0.5 rounded border border-border">{metadata.projectId}</span>
            <span className="w-1 h-1 rounded-full bg-border" />
            <span className="uppercase tracking-tighter text-[10px] font-bold">{metadata.location}</span>
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          {/* COPY URL Button */}
          <Button
            variant="outline"
            size="default"
            onClick={handleCopyUrl}
            className="gap-2 border-border hover:border-primary/50 hover:bg-primary/[0.04] dark:hover:bg-primary/[0.08] hover:text-primary transition-all duration-300 shadow-sm active:scale-95 rounded-lg h-10 px-4 text-xs font-semibold"
          >
            {copied ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4 text-primary" />}
            {copied ? 'Copied!' : 'Copy URL'}
          </Button>

          {/* Export Excel Button */}
          <Button
            variant="outline"
            size="default"
            onClick={handleExcelExport}
            className="gap-2 border-border hover:border-emerald-500/50 hover:bg-emerald-500/[0.04] dark:hover:bg-emerald-500/[0.08] hover:text-emerald-600 dark:hover:text-emerald-400 transition-all duration-300 shadow-sm active:scale-95 rounded-lg h-10 px-4 text-xs font-semibold"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-500" />
            Export Excel (.odc)
          </Button>

          {/* Export Power BI Button */}
          <Button
            variant="outline"
            size="default"
            onClick={handlePowerBIExport}
            className="gap-2 border-border hover:border-amber-500/50 hover:bg-amber-500/[0.04] dark:hover:bg-amber-500/[0.08] hover:text-amber-600 dark:hover:text-amber-400 transition-all duration-300 shadow-sm active:scale-95 rounded-lg h-10 px-4 text-xs font-semibold"
          >
            <Download className="w-4 h-4 text-amber-500" />
            Export Power BI (.pbids)
          </Button>

          {/* Build OData Query Button */}
          <Link href={`/catalog/${metadata.projectId}/${metadata.datasetId}/builder`}>
            <Button size="lg" className="gap-2 shadow-sm shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all duration-300 rounded-lg h-10 text-xs font-semibold">
              <ArrowRight className="w-4 h-4" />
              Build OData Query
            </Button>
          </Link>
        </div>
      </div>

      <Card className="border-border bg-card/50 backdrop-blur-sm overflow-hidden">
        <div className="grid grid-cols-1 lg:grid-cols-12 min-h-[600px]">
          {/* Sidebar - Tables List */}
          <div className="lg:col-span-4 border-r border-border flex flex-col">
            <div className="p-4 border-b border-border bg-muted/20">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3 h-3 text-muted-foreground" />
                <Input 
                  placeholder="Filter tables..." 
                  className="pl-8 h-9 text-xs border-border bg-background/50"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>
            <div className="flex-1 overflow-y-auto">
              <div className="p-2 space-y-1">
                {filteredTables.map(table => (
                  <button
                    key={table.name}
                    onClick={() => setSelectedTableName(table.name)}
                    className={cn(
                      "w-full text-left px-4 py-3 rounded-md transition-all group flex items-center justify-between",
                      selectedTableName === table.name 
                        ? "bg-primary text-primary-foreground shadow-sm" 
                        : "hover:bg-muted text-foreground"
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <TableIcon className={cn("w-4 h-4", selectedTableName === table.name ? "text-primary-foreground" : "text-primary")} />
                      <div className="flex flex-col">
                        <span className="text-sm font-bold truncate max-w-[200px]">{table.name}</span>
                        <span className={cn("text-[10px] font-medium opacity-70", selectedTableName === table.name ? "" : "text-muted-foreground")}>
                          {table.columns.length} columns
                        </span>
                      </div>
                    </div>
                    {selectedTableName === table.name && <ArrowRight className="w-3 h-3" />}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Main Content - Table Details */}
          <div className="lg:col-span-8 flex flex-col">
            {selectedTable ? (
              <div className="flex-1 p-8 space-y-8 animate-in fade-in duration-300">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Badge variant="outline" className="bg-primary/5 text-primary border-primary/20 gap-1.5 px-3 py-1">
                      <TableIcon className="w-3 h-3" />
                      Table Schema
                    </Badge>
                  </div>
                  <div className="space-y-2">
                    <h2 className="text-3xl font-bold text-foreground font-sans tracking-tight">{selectedTable.name}</h2>
                    <p className="text-sm text-muted-foreground leading-relaxed max-w-2xl">
                      {selectedTable.description || "No description available for this table. Elena suggests adding descriptions in the BigQuery console to help your team discover data."}
                    </p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center gap-2 text-foreground font-bold uppercase tracking-widest text-[10px]">
                    <Columns className="w-3 h-3 text-primary" />
                    Columns & Metadata
                  </div>
                  <div className="border border-border rounded-xl overflow-hidden bg-background/50">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-muted/50 border-b border-border">
                          <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Column</th>
                          <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Type</th>
                          <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Description</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border/50">
                        {selectedTable.columns.map(column => (
                          <tr key={column.name} className="hover:bg-muted/30 transition-colors">
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-2">
                                <span className="text-sm font-bold text-foreground">{column.name}</span>
                                {!column.isNullable && (
                                  <Badge variant="ghost" className="h-4 px-1 text-[8px] border border-primary/20 text-primary uppercase font-bold">Required</Badge>
                                )}
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <code className="text-[10px] bg-muted px-2 py-0.5 rounded font-mono text-primary">{column.type}</code>
                            </td>
                            <td className="px-6 py-4">
                              <p className="text-xs text-muted-foreground leading-snug max-w-sm">
                                {column.description || "-"}
                              </p>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center p-20 text-center space-y-4 opacity-50">
                <Info className="w-12 h-12 text-muted-foreground" />
                <div className="space-y-1">
                  <h3 className="text-lg font-bold">No table selected</h3>
                  <p className="text-sm text-muted-foreground">Select a table from the sidebar to view its details.</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </Card>
    </div>
  );
};
