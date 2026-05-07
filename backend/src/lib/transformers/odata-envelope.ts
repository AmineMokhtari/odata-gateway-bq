import { Transform, TransformCallback } from 'node:stream'

export interface ODataEnvelopeOptions {
  contextUrl: string
  nextLink?: string
  count?: number
}

/**
 * A Transform stream that wraps individual objects into an OData V4 JSON envelope.
 * Input: Objects (BigQuery rows)
 * Output: Chunks of stringified JSON conforming to { "@odata.context": "...", "value": [ ... ] }
 * Meets Story 3.4 requirements for O(1) memory usage.
 */
export class ODataEnvelopeTransformer extends Transform {
  private firstRow = true
  private contextUrl: string
  private nextLink?: string
  private count?: number

  constructor(options: ODataEnvelopeOptions) {
    super({ writableObjectMode: true })
    this.contextUrl = options.contextUrl
    this.nextLink = options.nextLink
    this.count = options.count
  }

  _transform(row: any, encoding: string, callback: TransformCallback): void {
    if (this.firstRow) {
      let head = `{"@odata.context":${JSON.stringify(this.contextUrl)}`
      if (this.count !== undefined) {
        head += `,"@odata.count":${this.count}`
      }
      head += `,"value":[`
      this.push(head)
      const canContinue = this.push(JSON.stringify(row))
      this.firstRow = false
      if (!canContinue) {
        this.once('drain', callback)
        return
      }
    } else {
      const canContinue = this.push(',' + JSON.stringify(row))
      if (!canContinue) {
        this.once('drain', callback)
        return
      }
    }
    callback()
  }

  _flush(callback: TransformCallback): void {
    if (this.firstRow) {
      // No rows were received
      const response: any = {
        '@odata.context': this.contextUrl,
        value: []
      }
      if (this.count !== undefined) {
        response['@odata.count'] = this.count
      }
      if (this.nextLink) {
        response['@odata.nextLink'] = this.nextLink
      }
      this.push(JSON.stringify(response))
    } else {
      let suffix = ']'
      if (this.nextLink) {
        suffix += `,"@odata.nextLink":${JSON.stringify(this.nextLink)}`
      }
      suffix += '}'
      this.push(suffix)
    }
    callback()
  }
}
