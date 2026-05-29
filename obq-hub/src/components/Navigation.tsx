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
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  Menu, 
  Database, 
  LayoutDashboard, 
  Lock,
  Activity
} from 'lucide-react';
import { 
  Sheet, 
  SheetContent, 
  SheetHeader, 
  SheetTitle, 
  SheetTrigger 
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

const navItems = [
  { name: 'Home', href: '/', icon: Activity },
  { name: 'Dashboard', href: '/dashboard', icon: Activity },
  { name: 'Catalog', href: '/catalog', icon: LayoutDashboard },
  { name: 'Query Builder', href: '/builder', icon: Database },
];

interface NavigationProps {
  userName?: string;
}

export const Navigation: React.FC<NavigationProps> = ({ userName = 'ANONYMOUS' }) => {
  const pathname = usePathname();

  return (
    <nav className="sticky top-0 z-50 w-full border-b border-border bg-background/80 backdrop-blur-md">
      <div className="container mx-auto px-6 h-16 flex items-center justify-between">
        {/* Logo Section */}
        <Link href="/" className="flex items-center gap-2 group">
          <div className="w-8 h-8 bg-primary rounded flex items-center justify-center text-primary-foreground shadow-sm transition-transform">
            <Database className="w-5 h-5" />
          </div>
          <span className="font-sans font-medium text-foreground tracking-tight text-lg">
            OData Gateway for BigQuery Hub
          </span>
        </Link>

        {/* Desktop Navigation */}
        <div className="hidden md:flex items-center gap-6">
          {/* User Identity Status */}
          <div className="flex items-center gap-2 px-3 py-1.5 bg-accent/50 border border-accent rounded-full">
            <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
            <span className="text-[10px] font-bold text-accent-foreground uppercase tracking-wider flex items-center gap-1.5">
              <Lock className="w-3 h-3" />
              {userName}
            </span>
          </div>

          <div className="h-4 w-[1px] bg-border" />

          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "text-sm font-medium transition-colors",
                pathname === item.href 
                  ? "text-primary" 
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {item.name}
            </Link>
          ))}
        </div>

        {/* Mobile Hamburger Menu */}
        <div className="md:hidden">
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" aria-label="Open Navigation Menu" className="h-10 w-10">
                <Menu className="w-6 h-6 text-muted-foreground" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[300px] sm:w-[400px] bg-background border-l border-border">
              <SheetHeader className="text-left border-b border-border pb-6 mb-6">
                <SheetTitle className="text-xl font-bold font-sans tracking-tight text-foreground">
                  Data Catalog
                </SheetTitle>
              </SheetHeader>
              <div className="flex flex-col gap-6">
                {navItems.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      "flex items-center gap-4 text-base font-medium p-4 rounded transition-colors",
                      pathname === item.href 
                        ? "bg-accent text-accent-foreground" 
                        : "text-foreground hover:bg-secondary"
                    )}
                  >
                    <item.icon className="w-6 h-6" />
                    {item.name}
                  </Link>
                ))}

                {/* Mobile User Identity Status */}
                <div className="mx-4 p-4 bg-accent/30 border border-accent rounded flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                    <span className="text-sm font-bold text-accent-foreground uppercase tracking-widest flex items-center gap-2">
                      <Lock className="w-4 h-4" />
                      {userName}
                    </span>
                  </div>
                  <span className="text-[10px] font-bold text-primary bg-background px-2 py-1 rounded shadow-sm uppercase tracking-tighter border border-border">Secure</span>
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </nav>
  );
};
