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
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Database,
  ArrowRight,
  BookOpen,
  ShieldCheck,
  Activity,
  Copy,
  FileSpreadsheet,
  Download,
  Key,
  Compass,
  Zap
} from 'lucide-react';

export default function LandingPage() {
  return (
    <div className="flex flex-col min-h-screen bg-slate-50">
      {/* Hero Section - Pure Presentation */}
      <section className="relative overflow-hidden py-16 lg:py-24 border-b border-border bg-gradient-to-b from-indigo-50/30 to-slate-50">
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(45rem_50rem_at_top,theme(colors.indigo.100/50),theme(colors.slate.50))]" />

        <div className="container mx-auto px-6">
          <div className="max-w-4xl mx-auto text-center space-y-8">
            <Badge className="bg-primary/10 text-primary border-primary/20 hover:bg-primary/15 px-4 py-1 font-semibold uppercase tracking-wider text-xs rounded-full">
              Enterprise Data Catalog & Query Bridge
            </Badge>

            <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold text-foreground tracking-tight font-sans leading-tight">
              Welcome to OData Gateway for BigQuery Hub
            </h1>

            <div className="text-lg md:text-xl text-muted-foreground leading-relaxed max-w-3xl mx-auto space-y-4">
              <p>
                OData Gateway for BigQuery is a self-service <strong className="font-semibold text-slate-900 bg-primary/5 px-1.5 py-0.5 rounded border border-primary/10">Data Catalog</strong> designed for Google BigQuery.
              </p>
              <p>
                It enables business analysts, developers, and standard applications like <strong className="font-semibold text-slate-900">Microsoft Excel</strong> and <strong className="font-semibold text-slate-900">Power BI</strong> to securely connect directly to BigQuery tables—<span className="text-slate-900 font-semibold underline decoration-primary/20">without installing local database drivers (ODBC/JDBC)</span> or managing complex cloud IAM credentials.
              </p>
            </div>


            <div className="flex flex-wrap items-center justify-center gap-4">
              <Link href="/catalog">
                <Button size="lg" className="h-14 px-8 text-base font-bold rounded-xl shadow-lg shadow-primary/20 hover:scale-[1.02] transition-all duration-300 gap-2 cursor-pointer">
                  <Compass className="w-5 h-5" />
                  Explore the Catalog
                  <ArrowRight className="w-5 h-5" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Practical Guide - 60-Second Onboarding */}
      <section className="py-20 bg-background">
        <div className="container mx-auto px-6">
          <div className="max-w-3xl mx-auto text-center mb-16 space-y-4">
            <h2 className="text-3xl font-extrabold text-foreground tracking-tight font-sans">
              Quick Connect: Get Started in 60 Seconds
            </h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Follow these three practical steps to connect your spreadsheets and BI applications directly to live BigQuery tables.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Step 1 */}
            <Card className="border-border bg-card/40 backdrop-blur-sm overflow-hidden hover:shadow-md transition-shadow relative">
              <CardContent className="p-8 space-y-6">
                <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-sm">
                  1
                </div>
                <div className="space-y-2">
                  <h3 className="text-lg font-bold text-foreground font-sans flex items-center gap-2">
                    <Database className="w-5 h-5 text-primary" />
                    Browse the Catalog
                  </h3>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Enter the <b>Data Catalog</b>, choose a GCP project, and browse the available BigQuery datasets. Select a table to instantly review column types, descriptions, and <b>Required</b> constraint tags.
                  </p>
                </div>
                <div className="pt-2 flex flex-wrap gap-1.5 border-t border-border/50">
                  <Badge variant="outline" className="text-[10px] gap-1 px-2 py-0.5 border-blue-500/20 bg-blue-500/5 text-blue-500 font-extrabold">
                    <Key className="w-2.5 h-2.5" /> PK (Primary Key)
                  </Badge>
                  <Badge variant="outline" className="text-[10px] gap-1 px-2 py-0.5 border-violet-500/20 bg-violet-500/5 text-violet-500 font-extrabold">
                    <LinkIcon className="w-2.5 h-2.5" /> FK (Foreign Key)
                  </Badge>
                </div>
              </CardContent>
            </Card>

            {/* Step 2 */}
            <Card className="border-border bg-card/40 backdrop-blur-sm overflow-hidden hover:shadow-md transition-shadow relative">
              <CardContent className="p-8 space-y-6">
                <div className="w-10 h-10 rounded-full bg-emerald-500/10 text-emerald-600 flex items-center justify-center font-bold text-sm">
                  2
                </div>
                <div className="space-y-2">
                  <h3 className="text-lg font-bold text-foreground font-sans flex items-center gap-2">
                    <Download className="w-5 h-5 text-emerald-600" />
                    Generate Connections
                  </h3>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    On the dataset details header, use the direct action controls to copy the feed URL or click <b>Export Excel (.odc)</b> or <b>Export Power BI (.pbids)</b> to instantly download pre-configured data profiles.
                  </p>
                </div>
                <div className="pt-2 flex flex-wrap gap-1.5 border-t border-border/50">
                  <span className="text-[10px] text-muted-foreground font-medium flex items-center gap-1.5">
                    <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-500" />
                    Office Connections (.odc)
                  </span>
                  <span className="text-[10px] text-muted-foreground font-medium flex items-center gap-1.5">
                    <Download className="w-3.5 h-3.5 text-amber-500" />
                    Power BI Profiles (.pbids)
                  </span>
                </div>
              </CardContent>
            </Card>

            {/* Step 3 */}
            <Card className="border-border bg-card/40 backdrop-blur-sm overflow-hidden hover:shadow-md transition-shadow relative">
              <CardContent className="p-8 space-y-6">
                <div className="w-10 h-10 rounded-full bg-indigo-500/10 text-indigo-600 flex items-center justify-center font-bold text-sm">
                  3
                </div>
                <div className="space-y-2">
                  <h3 className="text-lg font-bold text-foreground font-sans flex items-center gap-2">
                    <ShieldCheck className="w-5 h-5 text-indigo-600" />
                    Authenticate & Load
                  </h3>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Double-click the downloaded connection file to launch Excel or Power BI. Choose <b>Organizational Account</b> as your connection method, sign in using your standard work email, and load your live data!
                  </p>
                </div>
                <div className="pt-2 flex items-center gap-2 text-[10px] text-muted-foreground border-t border-border/50">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span>Secure OIDC Token Isolation (No IAM Sprawl)</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Core Technical Capabilities */}
      <section className="py-20 bg-slate-50 border-t border-border">
        <div className="container mx-auto px-6">
          <div className="max-w-3xl mx-auto text-center mb-16 space-y-4">
            <h2 className="text-3xl font-extrabold text-foreground tracking-tight font-sans">
              Key Platform Governance & Features
            </h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              OData Gateway for BigQuery (OBQ)) Hub integrates robust administrative and cost-protection controls into your data workspace.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              {
                title: "Dry-Run Cost Gate",
                desc: "Every visual query is pre-estimated. Queries exceeding your Department Scan Budget are auto-blocked to prevent surprise Cloud billing.",
                icon: Zap,
                color: "text-amber-500 bg-amber-500/10 border-amber-500/20"
              },
              {
                title: "OData v4 Compliant",
                desc: "Follows native OData v4 protocols. Supports query folding ($select, $filter, $expand, $apply) to run computations on the database server.",
                icon: Database,
                color: "text-blue-500 bg-blue-500/10 border-blue-500/20"
              },
              {
                title: "Elena Narrative Tips",
                desc: "Converts complex SQL/residency errors into intuitive, actionable troubleshooting drawer tips to recover access in seconds.",
                icon: Activity,
                color: "text-primary bg-primary/10 border-primary/20"
              },
              {
                title: "OIDC Single Sign-On",
                desc: "Secured using OAuth2/OIDC. Operates as a secure Trusted Subsystem so you never have to expose raw database keys or passwords.",
                icon: ShieldCheck,
                color: "text-indigo-500 bg-indigo-500/10 border-indigo-500/20"
              }
            ].map((item, index) => (
              <div key={index} className="bg-background border border-border p-6 rounded-2xl shadow-sm hover:shadow-md transition-all space-y-4">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center border shrink-0 ${item.color}`}>
                  <item.icon className="w-5 h-5" />
                </div>
                <h3 className="text-base font-bold text-foreground font-sans">{item.title}</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}

// Inline alias for LinkIcon
const LinkIcon = Key;
