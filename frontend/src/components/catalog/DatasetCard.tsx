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

import React from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Database, ShieldCheck, ArrowRight, HardDrive } from 'lucide-react';
import { type TenantConfig } from '@common/src/types/tenant';
import { Badge } from '@/components/ui/badge';

interface DatasetCardProps {
  tenant: TenantConfig;
  onSelect: (tenant: TenantConfig) => void;
}

export const DatasetCard: React.FC<DatasetCardProps> = ({ tenant, onSelect }) => {
  return (
    <Card className="group hover:border-primary/50 transition-all duration-300 shadow-sm hover:shadow-md bg-card overflow-hidden flex flex-col">
      <CardHeader className="pb-4">
        <div className="flex justify-between items-start mb-2">
          <div className="p-2 bg-primary/10 rounded-lg text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors duration-300">
            <Database className="w-5 h-5" />
          </div>
          <Badge variant="secondary" className="text-[10px] font-bold uppercase tracking-wider">
            {tenant.scan_budget_gb}GB Budget
          </Badge>
        </div>
        <CardTitle className="text-xl font-bold line-clamp-1">{tenant.name || tenant.dataset_id}</CardTitle>
        <CardDescription className="text-xs font-mono text-muted-foreground uppercase tracking-tight">
          {tenant.project_id} • {tenant.dataset_id}
        </CardDescription>
      </CardHeader>
      <CardContent className="flex-1">
        <p className="text-sm text-muted-foreground leading-relaxed line-clamp-3">
          {tenant.description || "No description provided for this dataset."}
        </p>
      </CardContent>
      <CardFooter className="pt-4 border-t border-border/50 bg-muted/20">
        <Button 
          variant="ghost" 
          className="w-full justify-between hover:bg-primary hover:text-primary-foreground group/btn"
          onClick={() => onSelect(tenant)}
        >
          <span className="font-bold text-sm">Explore Dataset</span>
          <ArrowRight className="w-4 h-4 transform group-hover/btn:translate-x-1 transition-transform" />
        </Button>
      </CardFooter>
    </Card>
  );
};
