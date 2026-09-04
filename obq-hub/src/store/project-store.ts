/*
Copyright 2026 Google LLC

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

    https://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
*/
import { create } from 'zustand'

export interface ElenaTip {
  title?: string
  message: string
  advice?: string
  quick_fixes?: Array<{ label: string, action: string }>
  action?: string
  action_label?: string
  action_url?: string
}

interface ProjectState {
  isElenaDrawerOpen: boolean
  activeTip: ElenaTip | null
  
  setElenaTip: (tip: ElenaTip | null) => void
  openElenaDrawer: () => void
  closeElenaDrawer: () => void
  
  // Pivot Logic: Quick Fix Actions
  lastFixAction: string | null
  applyFix: (action: string) => void
  clearFix: () => void
}

/**
 * Global Project Store
 * Manages Elena's Tips and Drawer state for the Cloud-Native Pivot.
 */
export const useProjectStore = create<ProjectState>((set) => ({
  isElenaDrawerOpen: false,
  activeTip: null,
  lastFixAction: null,
  
  setElenaTip: (tip) => set({ activeTip: tip }),
  openElenaDrawer: () => set({ isElenaDrawerOpen: true }),
  closeElenaDrawer: () => set({ isElenaDrawerOpen: false }),
  
  applyFix: (action) => {
    console.log(`[Store] Applying fix: ${action}`)
    set({ 
      isElenaDrawerOpen: false, 
      activeTip: null,
      lastFixAction: action 
    })
  },
  clearFix: () => set({ lastFixAction: null })
}))
