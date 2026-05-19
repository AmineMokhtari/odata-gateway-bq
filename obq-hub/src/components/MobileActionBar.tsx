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
import { Button } from '@/components/ui/button';
import { Copy, Database, Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface MobileActionBarProps {
  url: string;
  projectName: string;
  datasetName: string;
}

export const MobileActionBar: React.FC<MobileActionBarProps> = ({ url, projectName, datasetName }) => {
  const [copied, setCopied] = React.useState(false);

  const handleCopy = () => {
    if (url) {
      navigator.clipboard.writeText(url);
      setCopied(true);
      toast.success('URL Copied!', {
        description: 'Ready to use in Excel Mobile or Power BI.',
      });
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (!url) return null;

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 p-4 bg-background/90 backdrop-blur-lg border-t border-border shadow-[0_-10px_20px_-5px_rgba(0,0,0,0.1)] animate-in slide-in-from-bottom duration-500">
      <div className="container mx-auto flex items-center justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 mb-1">
            <Database className="w-3 h-3 text-primary" />
            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-tighter truncate">
              {projectName} / {datasetName}
            </span>
          </div>
          <p className="text-xs font-bold text-foreground truncate mono">
            {url}
          </p>
        </div>
        
        <Button 
          size="lg"
          onClick={handleCopy}
          className={cn(
            "h-12 px-6 rounded-md font-bold shadow transition-all active:scale-95 shrink-0",
            copied 
              ? "bg-success hover:bg-success/90 shadow-sm text-success-foreground" 
              : "bg-primary hover:bg-primary/90 shadow-sm text-primary-foreground"
          )}
        >
          {copied ? <Check className="w-5 h-5 mr-2" /> : <Copy className="w-5 h-5 mr-2" />}
          {copied ? 'Copied' : 'Copy URL'}
        </Button>
      </div>
    </div>
  );
};
