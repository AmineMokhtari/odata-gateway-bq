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

import { UserIdentity } from '../../plugins/auth.js'
import { type TenantConfig } from '../../../../common/src/types/tenant.js'

/**
 * Evaluates access rules for a tenant.
 * Meets Story 5.2 requirements for OR logic (User OR Group match).
 * [Patch 1 & 2] Enforce Deny-by-Default and Case-Insensitive matching.
 * [Anonymous Mode] If anonymousMode is true and no rules are defined, allow access.
 */
export function checkTenantAccess(user: UserIdentity, config: TenantConfig, anonymousMode = false): boolean {
  const { access_rules } = config

  // [Patch 1] Deny by default if no rules are defined, UNLESS anonymousMode is active
  if (!access_rules || (!access_rules.emails && !access_rules.groups)) {
    return anonymousMode
  }

  const userEmail = user.email?.toLowerCase()
  const userGroups = user.groups.map(g => g.toLowerCase())

  // [Patch 2] 1. Check Emails (Case-Insensitive)
  if (userEmail && access_rules.emails) {
    const isEmailAllowed = access_rules.emails.some((e: string) => e.toLowerCase() === userEmail)
    if (isEmailAllowed) return true
  }

  // [Patch 2] 2. Check Groups (Case-Insensitive)
  if (access_rules.groups) {
    const allowedGroups = access_rules.groups.map((g: string) => g.toLowerCase())
    const isGroupAllowed = userGroups.some(group => allowedGroups.includes(group))
    if (isGroupAllowed) {
      return true
    }
  }

  return false
}
