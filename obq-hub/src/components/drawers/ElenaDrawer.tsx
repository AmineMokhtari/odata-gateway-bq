'use client'

import React from 'react'
import { 
  Sheet, 
  SheetContent, 
  SheetHeader, 
  SheetTitle,
  SheetFooter
} from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { Sparkles, AlertTriangle, CheckCircle2 } from 'lucide-react'
import { useProjectStore } from '@/store/project-store'

/**
 * Elena's Advice Drawer
 * MD3-inspired slide-out guidance for blocked queries.
 */
export const ElenaDrawer: React.FC = () => {
  const { isElenaDrawerOpen, closeElenaDrawer, activeTip, applyFix } = useProjectStore()

  if (!activeTip) return null

  return (
    <Sheet open={isElenaDrawerOpen} onOpenChange={(open) => !open && closeElenaDrawer()}>
      <SheetContent side="right" className="w-full sm:max-w-md border-l border-accent shadow-2xl bg-white/95 backdrop-blur-md">
        <SheetHeader className="space-y-4 pb-6 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded bg-primary text-white shadow shadow-primary/20 animate-pulse">
              <Sparkles className="w-6 h-6" />
            </div>
            <div>
              <SheetTitle className="text-2xl font-bold text-foreground">
                {activeTip.title || "Elena's Advice"}
              </SheetTitle>
              <p className="text-xs font-bold text-primary uppercase tracking-widest">Self-Service Governance</p>
            </div>
          </div>
        </SheetHeader>

        <div className="py-10 space-y-8 h-[calc(100vh-200px)] overflow-y-auto pr-2">
          <div className="p-6 rounded bg-secondary border border-border space-y-4">
            <div className="flex items-start gap-4">
              <div className="mt-1">
                <AlertTriangle className="w-5 h-5 text-amber-500" />
              </div>
              <div className="space-y-2">
                <p className="text-sm font-medium text-foreground leading-relaxed italic">
                  &quot;{activeTip.message}&quot;
                </p>
                {activeTip.advice && (
                  <p className="text-xs text-muted-foreground font-medium border-t border-border pt-2">
                    {activeTip.advice}
                  </p>
                )}
              </div>
            </div>
          </div>

          {activeTip.quick_fixes && activeTip.quick_fixes.length > 0 && (
            <div className="space-y-4">
              <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-2">
                <CheckCircle2 className="w-3 h-3 text-green-600" />
                Suggested Quick Fixes
              </h4>
              <div className="grid grid-cols-1 gap-3">
                {activeTip.quick_fixes.map((fix, idx) => (
                  <Button
                    key={idx}
                    variant="outline"
                    className="h-auto py-4 px-6 justify-start text-left border-accent hover:border-primary/50 hover:bg-secondary rounded transition-all group"
                    onClick={() => applyFix(fix.action)}
                  >
                    <div className="space-y-1">
                      <p className="text-sm font-bold text-foreground group-hover:text-primary">{fix.label}</p>
                      <p className="text-[10px] text-muted-foreground font-medium italic">Apply this fix automatically to your query builder.</p>
                    </div>
                  </Button>
                ))}
              </div>
            </div>
          )}

          {activeTip.action && !activeTip.quick_fixes && (
            <div className="pt-4">
              <Button 
                onClick={() => {
                  if (activeTip.action === 'REFRESH_SESSION') {
                    const returnTo = encodeURIComponent(window.location.pathname + window.location.search);
                    window.location.href = `/web/api/auth/signin?callbackUrl=${returnTo}`;
                  } else if (activeTip.action === 'REDIRECT' && activeTip.action_url) {
                    window.location.href = activeTip.action_url;
                  } else {
                    applyFix(activeTip.action!);
                  }
                }}
                className="w-full h-12 bg-primary hover:bg-primary/90 text-white rounded shadow-sm"
              >
                {activeTip.action_label || (activeTip.action === 'REFRESH_SESSION' ? 'Refresh Session' : `Perform Action: ${activeTip.action}`)}
              </Button>
            </div>
          )}
        </div>

        <SheetFooter className="absolute bottom-0 left-0 right-0 p-8 border-t border-secondary bg-secondary/50">
          <Button variant="ghost" onClick={closeElenaDrawer} className="w-full h-12 rounded text-muted-foreground font-bold uppercase tracking-widest text-[10px]">
            Dismiss Guidance
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}
