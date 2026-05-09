import { create } from 'zustand'

export interface ElenaTip {
  message: string
  quick_fixes?: Array<{ label: string, action: string }>
  action?: string
}

interface ProjectState {
  isElenaDrawerOpen: boolean
  activeTip: ElenaTip | null
  
  setElenaTip: (tip: ElenaTip | null) => void
  openElenaDrawer: () => void
  closeElenaDrawer: () => void
  
  // Pivot Logic: Quick Fix Actions
  applyFix: (action: string) => void
}

/**
 * Global Project Store
 * Manages Elena's Tips and Drawer state for the Cloud-Native Pivot.
 */
export const useProjectStore = create<ProjectState>((set) => ({
  isElenaDrawerOpen: false,
  activeTip: null,
  
  setElenaTip: (tip) => set({ activeTip: tip }),
  openElenaDrawer: () => set({ isElenaDrawerOpen: true }),
  closeElenaDrawer: () => set({ isElenaDrawerOpen: false }),
  
  applyFix: (action) => {
    console.log(`[Store] Applying fix: ${action}`)
    // In a real app, this would trigger state changes in the URL builder
    // For the pivot demo, we just signal completion
    set({ isElenaDrawerOpen: false, activeTip: null })
  }
}))
