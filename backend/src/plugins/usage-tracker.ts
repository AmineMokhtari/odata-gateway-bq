import fp from 'fastify-plugin'
import { BigQueryStorageService, AuditEvent } from '../services/bq-storage.js'
import { config } from '../config.js'

export interface UsageData {
  totalBytesProcessed: number
  queryCount: number
}

export interface PulseData {
  lastActive: number
}

export interface UsageTrackerOptions {
  storageService?: BigQueryStorageService
}

export default fp<UsageTrackerOptions>(async (fastify, opts) => {
  const usageStore = new Map<string, UsageData>()
  const pulseStore = new Map<string, PulseData>()
  
  // Initialize Storage Service (Story 8.5)
  const billingProject = config.billingProjectId
  const storageService = opts.storageService || new BigQueryStorageService(billingProject)

  /**
   * Tracks usage and user pulses per tenant.
   * Meets Story 4.3 (Success Pulse) and Story 8.5 (Persistent Logs).
   */
  fastify.decorate('usageTracker', {
    recordUsage: (projectId: string, datasetId: string, bytes: number, userEmail: string = 'system', correlationId: string = 'none') => {
      const key = `${projectId}:${datasetId}`
      const current = usageStore.get(key) || { totalBytesProcessed: 0, queryCount: 0 }
      
      usageStore.set(key, {
        totalBytesProcessed: current.totalBytesProcessed + bytes,
        queryCount: current.queryCount + 1
      })

      // Persistent Log (Story 8.5)
      storageService.writeLog({
        timestamp: new Date().toISOString(),
        projectId,
        datasetId,
        userEmail,
        correlationId,
        action: 'QUERY',
        bytesProcessed: bytes,
        status: 'SUCCESS'
      }).catch((err: any) => console.error('Failed to log usage to BigQuery:', err))
    },
    getUsage: (projectId: string, datasetId: string): UsageData => {
      return usageStore.get(`${projectId}:${datasetId}`) || { totalBytesProcessed: 0, queryCount: 0 }
    },
    recordPulse: (projectId: string, datasetId: string, userId: string, correlationId: string = 'none') => {
      const key = `${projectId}:${datasetId}:${userId}`
      pulseStore.set(key, { lastActive: Date.now() })

      // Persistent Log (Story 8.5)
      storageService.writeLog({
        timestamp: new Date().toISOString(),
        projectId,
        datasetId,
        userEmail: userId,
        correlationId,
        action: 'PULSE',
        bytesProcessed: 0,
        status: 'SUCCESS'
      }).catch((err: any) => console.error('Failed to log pulse to BigQuery:', err))
    },
    getPulse: (projectId: string, datasetId: string, userId: string): PulseData | undefined => {
      return pulseStore.get(`${projectId}:${datasetId}:${userId}`)
    },
    clear: () => {
      usageStore.clear()
      pulseStore.clear()
    }
  })
}, {
  name: 'usage-tracker'
})

declare module 'fastify' {
  interface FastifyInstance {
    usageTracker: {
      recordUsage: (projectId: string, datasetId: string, bytes: number, userEmail?: string, correlationId?: string) => void
      getUsage: (projectId: string, datasetId: string) => UsageData
      recordPulse: (projectId: string, datasetId: string, userId: string, correlationId?: string) => void
      getPulse: (projectId: string, datasetId: string, userId: string) => PulseData | undefined
      clear: () => void
    }
  }
}
