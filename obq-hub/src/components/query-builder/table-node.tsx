import React from 'react'
import { Handle, Position } from '@xyflow/react'
import { Key, Filter, Database, Lock, Unlock, Share2 } from 'lucide-react'
import { useVisualQueryStore } from '@/store/visual-query'

interface Column {
  name: string
  type: string
  isNullable: boolean
}

interface TableNodeData {
  label: string
  isRoot?: boolean
  partitionColumn?: string | null
  requiresPartitionFilter?: boolean
  columns?: Column[]
  isPinned?: boolean
  isExpanded?: boolean
  projectId?: string
  datasetId?: string
  [key: string]: unknown
}

interface TableNodeComponentProps {
  id: string
  data: TableNodeData
  selected?: boolean
}

export const TableNode: React.FC<TableNodeComponentProps> = ({ id, data, selected }) => {
  const isRoot = data.isRoot ?? false
  const columns = data.columns ?? []
  const toggleNodePin = useVisualQueryStore(state => state.toggleNodePin)
  const isPinned = data.isPinned ?? false
  
  const selectedPaths = useVisualQueryStore(state => state.selected_paths)
  const toggleColumnSelection = useVisualQueryStore(state => state.toggleColumnSelection)
  const isSelected = selectedPaths.includes(id)
  
  return (
    <div 
      data-testid={`node-${id}`}
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === ' ' || e.key === 'Enter') {
          e.preventDefault()
          e.stopPropagation()
          useVisualQueryStore.getState().toggleNodeSelection(id)
        }
      }}
      className={`min-w-[220px] rounded-lg border bg-card text-card-foreground shadow-sm transition-all duration-200 focus:outline-none ${
        isSelected
          ? 'border-primary ring-2 ring-primary/30 shadow-md shadow-primary/5'
          : isPinned
            ? 'border-warning/70 ring-1 ring-warning/20 shadow-md shadow-warning/5'
            : 'border-border hover:border-muted-foreground/30'
      } ${
        isRoot 
          ? 'bg-primary/5 border-primary/30' 
          : 'bg-background'
      }`}
      aria-label={`Table node ${data.label}`}
    >
      {/* 4 Connection Handles for omnidirectional layouts */}
      <Handle type="target" position={Position.Top} className="opacity-0 group-hover:opacity-100" />
      <Handle type="source" position={Position.Right} className="opacity-0 group-hover:opacity-100" />
      <Handle type="target" position={Position.Bottom} className="opacity-0 group-hover:opacity-100" />
      <Handle type="source" position={Position.Left} className="opacity-0 group-hover:opacity-100" />
      
      {/* Header */}
      <div 
        className={`flex items-center justify-between px-3 py-2 border-b rounded-t-lg gap-2 transition-colors duration-200 ${
          isSelected
            ? 'bg-primary text-primary-foreground border-primary'
            : isRoot 
              ? 'bg-primary text-primary-foreground border-primary/70' 
              : 'bg-muted/50 border-border text-foreground'
        }`}
      >
        <div className="flex items-center gap-1.5 font-medium text-sm">
          <Database className="w-4 h-4" />
          <span>{data.label}</span>
          {data.partitionColumn && (
            <span className="text-[9px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-warning/20 text-warning-foreground border border-warning/40" title={`Partitioned by ${data.partitionColumn}`}>
              Partitioned
            </span>
          )}
        </div>
        <div className="flex items-center gap-1.5">
          {!isRoot && (
            <button
              onClick={(e) => {
                e.stopPropagation()
                const projId = data.projectId || ''
                const dsId = data.datasetId || ''
                if (projId && dsId) {
                  useVisualQueryStore.getState().expandNodeNeighborhood(projId, dsId, id)
                }
              }}
              className={`p-1 rounded transition-colors cursor-pointer ${
                isSelected
                  ? 'text-primary-foreground/60 hover:text-primary-foreground hover:bg-white/10'
                  : 'text-muted-foreground/60 hover:text-foreground hover:bg-muted'
              } ${data.isExpanded ? 'text-success font-bold' : ''}`}
              title={data.isExpanded ? 'Neighborhood Expanded' : 'Expand Relationships'}
              aria-label={`Expand relationships for ${data.label}`}
              disabled={data.isExpanded}
            >
              <Share2 className="w-3.5 h-3.5" />
            </button>
          )}
          <button
            onClick={(e) => {
              e.stopPropagation()
              toggleNodePin(id)
            }}
            className={`p-1 rounded transition-colors cursor-pointer ${
              isSelected
                ? 'text-primary-foreground/60 hover:text-primary-foreground hover:bg-white/10'
                : isRoot 
                  ? 'text-primary-foreground/60 hover:text-primary-foreground hover:bg-white/10' 
                  : 'text-muted-foreground/60 hover:text-foreground hover:bg-muted'
            } ${isPinned ? 'text-warning font-bold' : ''}`}
            title={isPinned ? 'Unlock Node Position' : 'Pin/Lock Node Position'}
          >
            {isPinned ? <Lock className={`w-3.5 h-3.5 text-warning`} /> : <Unlock className="w-3.5 h-3.5" />}
          </button>
          {isRoot && (
            <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-primary-foreground/20 text-primary-foreground">
              Root
            </span>
          )}
        </div>
      </div>

      {/* Columns Listing */}
      <div className="p-2 space-y-1 text-xs">
        {columns.length > 0 ? (
          columns.map((col, index) => {
            const isPartitionCol = data.partitionColumn === col.name
            const isColSelected = selectedPaths.includes(`${id}.${col.name}`)
            
            return (
              <div 
                key={index} 
                onClick={(e) => {
                  e.stopPropagation()
                  toggleColumnSelection(id, col.name)
                }}
                className={`flex items-center justify-between px-1.5 py-1 rounded cursor-pointer transition-all duration-150 ${
                  isColSelected
                    ? 'bg-primary/10 font-medium text-primary border-l-2 border-primary pl-1'
                    : isPartitionCol 
                      ? 'bg-warning/10 font-medium' 
                      : 'hover:bg-muted/40'
                }`}
              >
                <div className="flex items-center gap-1.5">
                  {isPartitionCol ? (
                    <Key className="w-3.5 h-3.5 text-warning" aria-label="Partitioning Column" />
                  ) : (
                    <div className={`w-1.5 h-1.5 rounded-full ${isColSelected ? 'bg-primary' : 'bg-muted-foreground/40'}`} />
                  )}
                  <span className={isColSelected ? 'text-primary' : isPartitionCol ? 'text-warning-foreground' : 'text-foreground'}>
                    {col.name}
                  </span>
                </div>
                <span className="text-[10px] text-muted-foreground font-mono">
                  {col.type}
                </span>
              </div>
            )
          })
        ) : (
          <button
            onClick={(e) => {
              e.stopPropagation()
              const projId = data.projectId || ''
              const dsId = data.datasetId || ''
              if (projId && dsId) {
                useVisualQueryStore.getState().expandNodeNeighborhood(projId, dsId, id)
              }
            }}
            className="w-full py-2 text-center text-muted-foreground hover:text-foreground hover:bg-muted/40 rounded transition-all italic text-[11px] cursor-pointer focus:outline-none focus:ring-1 focus:ring-primary focus:bg-muted/30"
            title="Press Enter or Click to expand neighborhood"
          >
            Double-click or press Enter to expand neighborhood
          </button>
        )}
      </div>

      {/* Footer Info (e.g. Partition Filters required) */}
      {isRoot && data.requiresPartitionFilter && (
        <div className="px-3 py-1 bg-warning/10 border-t border-warning/20 text-[10px] text-warning-foreground flex items-center gap-1">
          <Filter className="w-3.5 h-3.5 text-warning" />
          <span>Mandatory Partition Filter Required</span>
        </div>
      )}
    </div>
  )
}
