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

import { type FastifyPluginAsync } from 'fastify'
import { getGlobalUserUsage } from '../../services/usage-audit.js'
import { config } from '../../config.js'

const internal: FastifyPluginAsync = async (fastify, opts): Promise<void> => {
  fastify.get('/usage', async function (request, reply) {
    const user = request.user
    if (!user) {
      return reply.code(401).send({ error: { code: 'UNAUTHORIZED', message: 'User identity required' } })
    }

    try {
      const bq = fastify.getBQClient(config.billingProjectId)
      const usage = await getGlobalUserUsage(bq, user.email || user.sub)
      
      return {
        ...usage,
        userEmail: user.email || user.sub,
        budgetBytes: config.defaultScanBudgetGb * 1024 * 1024 * 1024
      }
    } catch (err: any) {
      request.log.error({ err: err.message, stack: err.stack }, 'Failed to fetch global usage history')
      return reply.code(400).send({ 
        error: { 
          code: 'HistoryFetchFailed', 
          message: 'Could not retrieve query history.',
          details: err.message
        } 
      })
    }
  })
}

export default internal
