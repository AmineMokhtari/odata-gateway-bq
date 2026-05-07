import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ShieldCheck, ArrowRight, Zap, Database, Lock } from 'lucide-react';

export const HeroSection: React.FC = () => {
  return (
    <section className="relative overflow-hidden bg-slate-50 py-16 lg:py-24">
      {/* Background visual element */}
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(45rem_50rem_at_top,theme(colors.indigo.100),theme(colors.slate.50))]" />
      
      <div className="container mx-auto px-6">
        <div className="flex flex-col lg:flex-row items-center gap-12">
          {/* Story Content */}
          <div className="flex-1 space-y-8 text-center lg:text-left">
            <Badge className="bg-indigo-100 text-indigo-700 hover:bg-indigo-100 border-none px-4 py-1 font-semibold uppercase tracking-wider">
              Zero-Driver Data Gateway
            </Badge>
            
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold text-slate-900 leading-tight font-inter">
              Stop the <span className="text-indigo-700 underline decoration-indigo-200">SQL Tax</span>. <br />
              Unlock BigQuery for Excel in 15 Minutes.
            </h1>
            
            <p className="text-lg md:text-xl text-slate-600 max-w-2xl mx-auto lg:mx-0 leading-relaxed">
              Still waiting 48 hours for a CSV export? Meet the zero-driver bridge that puts petabyte-scale data directly into your spreadsheets, protected by a proactive "Dry-Run" circuit breaker.
            </p>
            
            <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4">
              <Button size="lg" className="bg-indigo-700 hover:bg-indigo-800 text-white px-8 h-14 text-lg font-bold rounded-xl shadow-lg shadow-indigo-200 group">
                Deploy for Free
                <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Button>
              <Button variant="ghost" className="text-indigo-700 hover:text-indigo-800 hover:bg-indigo-50 font-semibold h-14 px-6 text-lg">
                Watch Elena&apos;s Story
              </Button>
            </div>
            
            <div className="flex items-center justify-center lg:justify-start gap-6 pt-4">
              <div className="flex items-center gap-2 text-slate-500 font-medium">
                <ShieldCheck className="w-5 h-5 text-emerald-600" />
                <span>OIDC Certified</span>
              </div>
              <div className="flex items-center gap-2 text-slate-500 font-medium">
                <Lock className="w-5 h-5 text-emerald-600" />
                <span>Zero IAM Sprawl</span>
              </div>
            </div>
          </div>

          {/* Visual Trust Pipeline */}
          <div className="flex-1 w-full max-w-lg lg:max-w-none">
            <div className="relative p-8 bg-white rounded-3xl border border-slate-200 shadow-2xl shadow-indigo-100 overflow-hidden group">
              <div className="absolute top-0 right-0 p-4">
                <Badge variant="outline" className="text-emerald-700 border-emerald-200 bg-emerald-50 font-bold px-2 py-0.5">
                  LIVE PIPELINE
                </Badge>
              </div>
              
              <h3 className="text-slate-900 font-bold mb-8 uppercase text-sm tracking-widest text-center lg:text-left">
                The Audit-Execute Request Pipeline
              </h3>
              
              <div className="space-y-6 relative">
                {/* Connecting Line */}
                <div className="absolute left-[19px] top-4 bottom-4 w-0.5 bg-slate-100 -z-0" />
                
                {[
                  { icon: Lock, label: 'Identity Verified', desc: 'Microsoft Entra ID / OIDC', color: 'indigo' },
                  { icon: ShieldCheck, label: 'Policy Authorized', desc: 'Internal Rule-Based Access', color: 'indigo' },
                  { icon: Zap, label: 'Cost Audited', desc: 'Mandatory Dry-Run Gating', color: 'amber' },
                  { icon: Database, label: 'BigQuery Streamed', desc: 'Direct Zero-Buffering Pipe', color: 'emerald' }
                ].map((step, i) => (
                  <div key={i} className="flex items-start gap-4 relative z-10 group/item">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center border-4 border-white shadow-md bg-${step.color}-600 text-white shrink-0 group-hover/item:scale-110 transition-transform`}>
                      <step.icon className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-900 leading-tight">{step.label}</h4>
                      <p className="text-sm text-slate-500 font-medium">{step.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
              
              {/* Fake Scan Indicator for Visual Interest */}
              <div className="mt-10 p-4 bg-slate-50 rounded-xl border border-slate-100 space-y-3">
                <div className="flex justify-between text-xs font-bold text-slate-400 uppercase tracking-tighter">
                  <span>ESTIMATED SCAN</span>
                  <span className="text-indigo-600">8.42 GB</span>
                </div>
                <div className="h-2 w-full bg-slate-200 rounded-full overflow-hidden">
                  <div className="h-full bg-indigo-600 w-[84%] relative">
                    <div className="absolute inset-0 bg-white/20 animate-pulse" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
