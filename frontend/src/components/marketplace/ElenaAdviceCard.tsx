'use client'

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Lightbulb, Sparkles, XCircle, ArrowRight } from 'lucide-react';
import { ElenaAdvice } from '@/lib/error-mapping';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

interface ElenaAdviceCardProps {
  advice: ElenaAdvice;
  onClose?: () => void;
}

export const ElenaAdviceCard: React.FC<ElenaAdviceCardProps> = ({ advice, onClose }) => {
  return (
    <Card className="border-amber-200 bg-amber-50/50 rounded-2xl shadow-lg animate-in fade-in slide-in-from-top-4 duration-300 relative overflow-hidden">
      {/* Decorative background element */}
      <div className="absolute -right-4 -top-4 w-24 h-24 bg-amber-100 rounded-full blur-2xl opacity-50" />
      
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <CardTitle className="text-xl font-inter font-bold text-amber-900 flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-amber-500 fill-amber-200" />
            {advice.title}
          </CardTitle>
          {onClose && (
            <Button variant="ghost" size="icon" onClick={onClose} className="h-8 w-8 text-amber-700 hover:bg-amber-100 rounded-full">
              <XCircle className="w-5 h-5" />
            </Button>
          )}
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        <p className="text-sm font-medium text-amber-800 leading-relaxed">
          {advice.message}
        </p>
        
        <div className="flex items-start gap-3 bg-white/80 p-4 rounded-xl border border-amber-100 shadow-sm">
          <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center shrink-0">
            <Lightbulb className="w-4 h-4 text-amber-600" />
          </div>
          <div className="space-y-2">
            <p className="text-xs font-inter font-semibold text-amber-900 leading-relaxed italic">
              "{advice.advice}"
            </p>
            
            {advice.nextStepLink && (
              <Button 
                asChild
                variant="link" 
                className="h-auto p-0 text-amber-700 font-bold text-[10px] uppercase tracking-wider flex items-center gap-1 hover:text-amber-900"
              >
                <Link href={advice.nextStepLink?.href ?? '#'}>
                  {advice.nextStepLink?.label ?? 'Learn More'}
                  <ArrowRight className="w-3 h-3" />
                </Link>
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
