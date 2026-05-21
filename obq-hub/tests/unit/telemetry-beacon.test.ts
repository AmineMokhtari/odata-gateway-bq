/**
 * Unit tests for the Telemetry Beacon utility and Zustand Store telemetry integration.
 * @story 14.2 - Asynchronous Batched Telemetry Beacon
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { createTelemetryEvent, sendTelemetryBatch } from '../../src/lib/telemetry-beacon'
import { useVisualQueryStore } from '../../src/store/visual-query'

describe('Telemetry Beacon Utility', () => {
  const originalNavigator = globalThis.navigator
  const originalFetch = globalThis.fetch

  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
    globalThis.navigator = originalNavigator
    globalThis.fetch = originalFetch
    vi.restoreAllMocks()
  })

  it('createTelemetryEvent should create a valid event with current timestamp', () => {
    const timestamp = 1700000000000
    vi.setSystemTime(new Date(timestamp))

    const event = createTelemetryEvent('table_expanded', { nodeId: 'Customers' })

    expect(event.type).toBe('table_expanded')
    expect(event.timestamp).toBe(timestamp)
    expect(event.metadata).toEqual({ nodeId: 'Customers' })
  })

  it('sendTelemetryBatch should use navigator.sendBeacon when available', () => {
    const mockSendBeacon = vi.fn().mockReturnValue(true)
    globalThis.navigator = {
      sendBeacon: mockSendBeacon,
    } as any

    const batch = {
      events: [createTelemetryEvent('canvas_cleared')],
      clientVersion: '1.0.0',
      sessionId: 'test-session',
    }

    const result = sendTelemetryBatch('http://localhost:3005/v1/telemetry', batch)

    expect(result).toBe(true)
    expect(mockSendBeacon).toHaveBeenCalledOnce()
    const [url, blob] = mockSendBeacon.mock.calls[0]
    expect(url).toBe('http://localhost:3005/v1/telemetry')
    expect(blob).toBeInstanceOf(Blob)
    expect(blob.type).toBe('application/json')
  })

  it('sendTelemetryBatch should fallback to fetch with keepalive when sendBeacon is not available', () => {
    globalThis.navigator = {} as any // No sendBeacon

    const mockFetch = vi.fn().mockResolvedValue({ ok: true })
    globalThis.fetch = mockFetch as any

    const batch = {
      events: [createTelemetryEvent('canvas_cleared')],
      clientVersion: '1.0.0',
      sessionId: 'test-session',
    }

    const result = sendTelemetryBatch('http://localhost:3005/v1/telemetry', batch)

    expect(result).toBe(true)
    expect(mockFetch).toHaveBeenCalledOnce()
    const [url, init] = mockFetch.mock.calls[0]
    expect(url).toBe('http://localhost:3005/v1/telemetry')
    expect(init.method).toBe('POST')
    expect(init.keepalive).toBe(true)
    expect(JSON.parse(init.body)).toEqual(batch)
  })
})

describe('Zustand Telemetry Store Integration', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    useVisualQueryStore.setState({
      event_queue: [],
      nodes: [],
      edges: [],
      selected_paths: [],
    })
  })

  afterEach(() => {
    vi.useRealTimers()
    vi.restoreAllMocks()
  })

  it('enqueueEvent should append event to event_queue and debounce flush', () => {
    const store = useVisualQueryStore.getState()
    const flushSpy = vi.spyOn(store, 'flushTelemetry')

    store.enqueueEvent('canvas_cleared')

    // Event should be in queue
    expect(useVisualQueryStore.getState().event_queue.length).toBe(1)
    expect(useVisualQueryStore.getState().event_queue[0].type).toBe('canvas_cleared')

    // Timer shouldn't have fired yet
    expect(flushSpy).not.toHaveBeenCalled()

    // Advance time by 2000ms
    vi.advanceTimersByTime(2000)

    expect(flushSpy).toHaveBeenCalledOnce()
  })

  it('flushTelemetry should empty the queue and send batch', () => {
    const mockSendBeacon = vi.fn().mockReturnValue(true)
    globalThis.navigator = { sendBeacon: mockSendBeacon } as any

    const store = useVisualQueryStore.getState()
    store.enqueueEvent('canvas_cleared')
    store.enqueueEvent('node_pinned', { nodeId: 'Customers' })

    expect(useVisualQueryStore.getState().event_queue.length).toBe(2)

    // Flush immediately
    store.flushTelemetry()

    // Queue should be cleared
    expect(useVisualQueryStore.getState().event_queue.length).toBe(0)

    // Telemetry beacon should have been sent
    expect(mockSendBeacon).toHaveBeenCalledOnce()
  })
})
