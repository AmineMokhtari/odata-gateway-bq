import { FastifyPluginAsync } from 'fastify'

const authRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.get('/callback', async (request, reply) => {
    try {
      // @ts-ignore
      const { token } = await fastify.oidc.getAccessTokenFromAuthorizationCodeFlow(request)
      
      // Verify ID token using jose
      if (!token.id_token) {
        throw new Error('No id_token returned in OIDC callback')
      }
      const userIdentity = await fastify.verifyToken(token.id_token)
      
      // Store in session (filter identity to avoid leaking raw payload)
      const sessionUser = {
        sub: userIdentity.sub,
        email: userIdentity.email,
        groups: userIdentity.groups
      }
      request.session.set('user', sessionUser)
      request.session.set('tokens', token)
      
      // Redirect to frontend
      return reply.redirect('/')
    } catch (err: any) {
      fastify.log.error({ err: err.message }, 'OIDC callback failed')
      return reply.code(401).send({
        error: {
          code: 'AUTH_CALLBACK_FAILED',
          message: 'Failed to complete authentication'
        }
      })
    }
  })

  fastify.get('/session', async (request) => {
    const user = request.session.get('user')
    return {
      authenticated: !!user,
      user: user ? {
        email: user.email,
        sub: user.sub,
        groups: user.groups
      } : null
    }
  })

  fastify.post('/logout', async (request, reply) => {
    request.session.delete()
    return { success: true }
  })
}

export default authRoutes
