# Story 2.3: Sharded Metadata Cache

Status: done

## Story

As a System,
I want to store schemas in a sharded LRU cache,
so that discovery is < 2s.

## Acceptance Criteria

1. **Given** an introspected dataset metadata (from Story 2.2), **When** stored in the cache, **Then** it is keyed by a unique tenant identifier (e.g., `projectId:datasetId`).
2. **And** lookups for existing metadata return the cached object in < 10ms.
3. **And** the cache is sharded/isolated per tenant-URL to prevent cross-tenant metadata bleed.
4. **And** the cache respects a configurable TTL (default 24h) and maximum size.
5. **And** the system provides a way to invalidate/clear the cache for a specific tenant.

## Tasks / Subtasks

- [ ] Initialize LRU Cache for Metadata
  - [ ] Use `lru-cache` v10+ (already installed).
  - [ ] Create `src/plugins/metadata-cache.ts` using `fastify-plugin`.
- [ ] Implement Sharded Storage & Lookup (AC: 1, 2, 3)
  - [ ] Configure the cache with `max` and `ttl`.
  - [ ] Decorate the Fastify instance with `metadataCache`.
  - [ ] Implement helper methods for `get(key)`, `set(key, value)`, and `delete(key)`.
- [ ] Integrate with Introspection (AC: 1)
  - [ ] (Future Story 2.4 will perform the actual integration during OData EDM generation).
- [ ] Verify Cache Isolation & Performance (AC: 2, 5)
  - [ ] Create `test/plugins/metadata-cache.test.ts`.
  - [ ] Verify that different keys don't interfere.
  - [ ] Verify that `delete(key)` only removes the specified entry.

## Dev Notes

- **Architecture Compliance:** Sharded LRU cache isolated by tenant-URL.
- **Performance:** Target < 2s for discovery (EDM generation), where cache hits are < 10ms.
- **Source Tree:**
  - `src/plugins/metadata-cache.ts`
- **Isolation:** Use the `projectId:datasetId` string as the key to ensure strict multi-tenant separation.

## Dev Agent Record

### Agent Model Used

gemini-2.0-flash-thinking-exp-1219 (via Gemini CLI)
