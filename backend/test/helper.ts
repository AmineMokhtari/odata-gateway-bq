import * as test from 'node:test'
import Fastify from 'fastify'
import fp from 'fastify-plugin'
import appPlugin, { options as appOptions } from '../src/app.js'
import { Readable } from 'node:stream'

export type TestContext = {
  after: typeof test.after
}

// Mock fetch globally for all tests that build the app
globalThis.fetch = (async (url: string | URL | Request) => {
  const urlStr = String(url)
  if (urlStr.includes('.well-known/openid-configuration')) {
    return {
      ok: true,
      status: 200,
      json: async () => ({ jwks_uri: 'http://localhost/jwks.json' })
    }
  }
  if (urlStr.includes('jwks.json')) {
    return {
      ok: true,
      status: 200,
      json: async () => ({ keys: [] })
    }
  }
  return { ok: false, status: 404, json: async () => ({}), text: async () => 'Not Found' }
}) as typeof fetch

// Fill in this config with all the configurations
// needed for testing the application
function config () {
  return {
    getBQClient: () => ({
      projectId: 'test-project',
      dataset: (id: string) => ({
        getMetadata: async () => [{ location: 'US' }],
        table: (id: string) => ({ getMetadata: async () => [{}] })
      }),
      query: async (opts?: any) => {
        const sql = opts?.query?.toLowerCase() || ''
        if (sql.includes('information_schema.columns')) {
          return [[{ column_name: 'id', data_type: 'INT64', is_nullable: 'NO' }]]
        }
        if (sql.includes('information_schema.tables')) {
          return [[{ table_name: 'Sales' }]]
        }
        return [[]]
      },
      createQueryJob: async (opts?: any) => {
        if (opts?.dryRun) {
          return [{ metadata: { statistics: { totalBytesProcessed: '1024' } } }]
        }
        return [{
          id: 'mock-job-id',
          metadata: { statistics: { totalBytesProcessed: '1024', query: { totalRows: '100' } } },
          getMetadata: async () => [{ statistics: { query: { totalRows: '100' } } }],
          getQueryResultsStream: () => new Readable({ objectMode: true, read() { this.push({ id: 1 }); this.push(null) } }),
          cancel: async () => {}
        }]
      },
      job: (id: string) => ({
        get: async () => [{ 
          id, 
          metadata: { statistics: { query: { totalRows: '100' } } },
          getQueryResultsStream: () => new Readable({ objectMode: true, read() { this.push({ id: 2 }); this.push(null) } })
        }]
      })
    }),
    storageService: {
      writeLog: async () => {}
    },
    logger: { level: 'silent' }
  }
}

// Automatically build and tear down our instance
async function build (t: TestContext, extraOptions: any = {}) {
  const app = Fastify(appOptions)

  // fastify-plugin ensures that all decorators
  // are exposed for testing purposes, this is
  // different from the production setup
  await app.register(fp(appPlugin), { ...config(), ...extraOptions })
  await app.ready()

  // Safely polyfill missing relationships for any tests that manually seed cache
  const originalSet = app.metadataCache.set.bind(app.metadataCache)
  app.metadataCache.set = (key: string, value: any) => {
    if (value && Array.isArray(value.tables)) {
      value.tables.forEach((table: any) => {
        if (!table.relationships) table.relationships = []
      })
    }
    return originalSet(key, value)
  }

  // Tear down our app after we are done
  // eslint-disable-next-line no-void
  t.after(() => void app.close())

  return app
}

export {
  config,
  build
}
