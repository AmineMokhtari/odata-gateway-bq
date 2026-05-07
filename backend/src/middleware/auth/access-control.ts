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
