import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import * as test from 'node:test'
import helper from 'fastify-cli/helper.js'
import { existsSync } from 'node:fs'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const tsPath = join(__dirname, '..', 'src', 'app.ts')
const jsPath = join(__dirname, '..', 'app.js')
const AppPath = existsSync(tsPath) ? tsPath : jsPath

export type TestContext = {
  after: typeof test.after
}

// Mock fetch globally for all tests that build the app
// @ts-ignore
globalThis.fetch = async (url: any) => {
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
  return { ok: false, status: 404 }
}

// Fill in this config with all the configurations
// needed for testing the application
function config () {
  return {
    skipOverride: true // Register our application with fastify-plugin
  }
}

// Automatically build and tear down our instance
async function build (t: TestContext, extraOptions: any = {}) {
  // you can set all the options supported by the fastify CLI command
  const argv = [AppPath]

  // fastify-plugin ensures that all decorators
  // are exposed for testing purposes, this is
  // different from the production setup
  const app = await (helper as any).build(argv, { ...config(), ...extraOptions })

  // Tear down our app after we are done
  // eslint-disable-next-line no-void
  t.after(() => void app.close())

  return app
}

export {
  config,
  build
}
