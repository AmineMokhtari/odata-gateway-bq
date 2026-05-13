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

import { HeroSection } from "@/components/marketing/hero-section";

export default function LandingPage() {
  return (
    <div className="flex flex-col min-h-screen">
      <HeroSection />
      
      {/* Social Proof / Trust Section */}
      <section className="py-12 bg-white border-y border-slate-100">
        <div className="container mx-auto px-6">
          <div className="flex flex-wrap items-center justify-center gap-8 md:gap-16 opacity-40 grayscale">
            <span className="text-2xl font-black text-slate-400 font-sans tracking-tighter">FINANCE_CORE</span>
            <span className="text-2xl font-black text-slate-400 font-sans tracking-tighter">DATA_OPS</span>
            <span className="text-2xl font-black text-slate-400 font-sans tracking-tighter">GOV_TECH</span>
            <span className="text-2xl font-black text-slate-400 font-sans tracking-tighter">CLOUD_ALB</span>
          </div>
        </div>
      </section>

      {/* Feature Highlight Section */}
      <section className="py-20 bg-slate-50">
        <div className="container mx-auto px-6">
          <div className="max-w-3xl mx-auto text-center mb-16">
            <h2 className="text-3xl font-bold text-slate-900 mb-4 font-sans">Built for Trusted Data Access</h2>
            <p className="text-lg text-slate-500 leading-relaxed">
              Why settle for risky CSV exports when you can have a live, audited, and governed connection directly to BigQuery?
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { 
                title: "No Drivers Needed", 
                desc: "Standard OData V4 protocol means no ODBC/JDBC drivers to install on user machines.",
                icon: "Zap"
              },
              { 
                title: "Dry-Run Safety", 
                desc: "Every query is audited and cost-estimated before execution. No more surprise billing.",
                icon: "ShieldCheck"
              },
              { 
                title: "Direct Streaming", 
                desc: "Massive results stream directly from BigQuery to your tool with zero server buffering.",
                icon: "Database"
              }
            ].map((feature, i) => (
              <div key={i} className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
                <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center mb-6">
                  {/* Icons are handled by Lucide in the actual component, using placeholders here for simplicity or can import */}
                  <div className="font-bold text-xl">{i+1}</div>
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-2 font-sans">{feature.title}</h3>
                <p className="text-slate-500 leading-relaxed">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
