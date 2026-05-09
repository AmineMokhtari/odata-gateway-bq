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
  Lock 
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
  { name: 'Marketplace', href: '/marketplace', icon: LayoutDashboard },
];

interface NavigationProps {
  userName?: string;
}

export const Navigation: React.FC<NavigationProps> = ({ userName = 'ANONYMOUS' }) => {
  const pathname = usePathname();

  return (
    <nav className="sticky top-0 z-50 w-full border-b border-slate-200 bg-white/80 backdrop-blur-md">
      <div className="container mx-auto px-6 h-16 flex items-center justify-between">
        {/* Logo Section */}
        <Link href="/" className="flex items-center gap-2 group">
          <div className="w-8 h-8 bg-indigo-700 rounded-lg flex items-center justify-center text-white shadow-lg shadow-indigo-100 group-hover:scale-110 transition-transform">
            <Database className="w-5 h-5" />
          </div>
          <span className="font-inter font-bold text-slate-900 tracking-tight text-lg">
            OData Gateway
          </span>
        </Link>

        {/* Desktop Navigation */}
        <div className="hidden md:flex items-center gap-6">
          {/* User Identity Status */}
          <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-50 border border-emerald-100 rounded-full">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider flex items-center gap-1.5">
              <Lock className="w-3 h-3" />
              {userName}
            </span>
          </div>

          <div className="h-4 w-[1px] bg-slate-200" />

          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "text-sm font-bold uppercase tracking-widest transition-colors",
                pathname === item.href 
                  ? "text-indigo-700" 
                  : "text-slate-500 hover:text-slate-900"
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
                <Menu className="w-6 h-6 text-slate-600" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[300px] sm:w-[400px]">
              <SheetHeader className="text-left border-b border-slate-100 pb-6 mb-6">
                <SheetTitle className="text-2xl font-black font-inter tracking-tighter">
                  Data Marketplace
                </SheetTitle>
              </SheetHeader>
              <div className="flex flex-col gap-6">
                {navItems.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      "flex items-center gap-4 text-lg font-bold p-4 rounded-xl transition-colors",
                      pathname === item.href 
                        ? "bg-indigo-50 text-indigo-700" 
                        : "text-slate-600 hover:bg-slate-50"
                    )}
                  >
                    <item.icon className="w-6 h-6" />
                    {item.name}
                  </Link>
                ))}

                {/* Mobile User Identity Status */}
                <div className="mx-4 p-4 bg-emerald-50 border border-emerald-100 rounded-2xl flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="text-sm font-bold text-emerald-800 uppercase tracking-widest flex items-center gap-2">
                      <Lock className="w-4 h-4" />
                      {userName}
                    </span>
                  </div>
                  <span className="text-[10px] font-bold text-emerald-600 bg-white px-2 py-1 rounded-lg shadow-sm uppercase tracking-tighter">Secure</span>
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </nav>
  );
};
