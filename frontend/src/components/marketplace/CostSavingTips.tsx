'use client'

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Lightbulb, Calendar, Columns, Filter, CheckCircle2 } from 'lucide-react';

export const CostSavingTips: React.FC = () => {
  const tips = [
    {
      icon: Calendar,
      title: 'Filter by Date',
      desc: 'Limit your query to a specific time range using $filter=Date gt 2024-01-01.',
      benefit: 'Can reduce scan by up to 90%'
    },
    {
      icon: Columns,
      title: 'Select Fewer Columns',
      desc: 'Instead of "Select *", explicitly request only the fields you need using $select.',
      benefit: 'Significantly reduces bandwidth and cost'
    },
    {
      icon: Filter,
      title: 'Use Equality Filters',
      desc: 'Prefer exact matches (eq) over "contains" or "endswith" where possible.',
      benefit: 'Better performance on indexed columns'
    }
  ];

  return (
    <Card className="border-indigo-100 bg-indigo-50/30 rounded-2xl shadow-sm h-full">
      <CardHeader className="pb-4">
        <CardTitle className="text-xl font-inter font-bold text-slate-900 flex items-center gap-2">
          <Lightbulb className="w-5 h-5 text-amber-500 fill-amber-200" />
          Governance Tips
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {tips.map((tip, i) => (
          <div key={i} className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-full bg-white border border-indigo-100 flex items-center justify-center shrink-0 shadow-sm text-indigo-600">
              <tip.icon className="w-5 h-5" />
            </div>
            <div className="space-y-1">
              <h4 className="font-bold text-slate-900 text-sm leading-tight">{tip.title}</h4>
              <p className="text-xs text-slate-500 leading-relaxed">{tip.desc}</p>
              <div className="flex items-center gap-1.5 pt-1 text-[10px] font-bold text-emerald-600 uppercase">
                <CheckCircle2 className="w-3 h-3" />
                {tip.benefit}
              </div>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
};
