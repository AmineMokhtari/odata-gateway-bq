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
import { test } from 'node:test'
import * as assert from 'node:assert'
import { checkTenantAccess } from '../../src/middleware/auth/access-control.js'

test('Access Control Rule Engine', async (t) => {
  const mockConfig: any = {
    access_rules: {
      emails: ['elena@example.com'],
      groups: ['Marketing']
    }
  }

  await t.test('should allow access for matching email', () => {
    const user: any = { email: 'elena@example.com', groups: [] }
    assert.equal(checkTenantAccess(user, mockConfig), true)
  })

  await t.test('should allow access for matching group', () => {
    const user: any = { email: 'other@example.com', groups: ['Marketing', 'Public'] }
    assert.equal(checkTenantAccess(user, mockConfig), true)
  })

  await t.test('should deny access for no match', () => {
    const user: any = { email: 'malicious@hacker.com', groups: ['Unprivileged'], sub: '123' }
    assert.equal(checkTenantAccess(user, mockConfig), false)
  })

  await t.test('should deny access when no rules defined (Deny by Default)', () => {
    const user: any = { email: 'any@example.com', groups: [], sub: '456' }
    assert.equal(checkTenantAccess(user, {} as any), false)
  })

  await t.test('should allow access when anonymousMode is true and no rules are defined', () => {
    const user: any = { sub: 'anonymous', groups: [] }
    assert.equal(checkTenantAccess(user, {} as any, true), true)
  })

  await t.test('should still deny access in anonymousMode if rules exist but do not match', () => {
    const user: any = { sub: 'anonymous', groups: [] }
    assert.equal(checkTenantAccess(user, mockConfig, true), false)
  })
})
