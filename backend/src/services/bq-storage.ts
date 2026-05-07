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

import { BigQueryWriteClient } from '@google-cloud/bigquery-storage'
import protobuf from 'protobufjs'
import { config } from '../config.js'

/**
 * Audit event structure for persistent logging.
 */
export interface AuditEvent {
  timestamp: string
  projectId: string
  datasetId: string
  userEmail: string
  correlationId: string
  action: 'QUERY' | 'METADATA_REFRESH' | 'PULSE'
  bytesProcessed: number
  status: 'SUCCESS' | 'FAILURE'
}

/**
 * Service to handle persistent logging using BigQuery Storage Write API with Protobufs.
 * [Source: Story 8.5 Tech Debt Fix]
 */
export class BigQueryStorageService {
  private client!: BigQueryWriteClient
  private billingProjectId: string
  private auditDataset: string
  private auditTable: string
  
  private protoRoot: protobuf.Root
  private auditMessageType: protobuf.Type
  private descriptorProto: any

  constructor(
    billingProjectId: string = config.billingProjectId, 
    auditDataset: string = config.auditDataset, 
    auditTable: string = config.auditTable
  ) {
    this.client = new BigQueryWriteClient()
    this.billingProjectId = billingProjectId
    this.auditDataset = auditDataset
    this.auditTable = auditTable

    // Initialize Protobuf Schema
    this.protoRoot = protobuf.Root.fromJSON({
      nested: {
        AuditEvent: {
          fields: {
            timestamp: { type: 'string', id: 1 },
            projectId: { type: 'string', id: 2 },
            datasetId: { type: 'string', id: 3 },
            userEmail: { type: 'string', id: 4 },
            correlationId: { type: 'string', id: 5 },
            action: { type: 'string', id: 6 },
            bytesProcessed: { type: 'int64', id: 7 },
            status: { type: 'string', id: 8 }
          }
        }
      }
    })
    this.auditMessageType = this.protoRoot.lookupType('AuditEvent')
    
    // Create the descriptor that BigQuery Write API requires
    // @ts-ignore
    this.descriptorProto = this.protoRoot.toDescriptor('proto3')
  }

  /**
   * Writes an audit event to BigQuery using Protobuf binary serialization.
   * Uses the Default Stream for high performance.
   */
  async writeLog(event: AuditEvent): Promise<void> {
    const parent = `projects/${this.billingProjectId}/datasets/${this.auditDataset}/tables/${this.auditTable}`
    
    try {
      // 1. Verify and Encode the message
      const errMsg = this.auditMessageType.verify(event)
      if (errMsg) throw Error(errMsg)

      const message = this.auditMessageType.create(event)
      const buffer = this.auditMessageType.encode(message).finish()

      // 2. Prepare the request for the Write API
      const request = {
        writeStream: `${parent}/streams/_default`,
        protoRows: {
          writerSchema: {
            protoDescriptor: this.descriptorProto
          },
          rows: {
            serializedRows: [buffer]
          }
        }
      }

      // 3. Append Rows (gRPC call)
      // The client library expects an object that matches the AppendRowsRequest proto
      await this.client.appendRows(request as any)

      console.log(`[Audit-PB] Successfully streamed ${event.action} log for ${event.userEmail}`)
    } catch (err: any) {
      console.error('[Audit-PB] Failed to write to BigQuery Storage API:', err.message)
    }
  }
}
