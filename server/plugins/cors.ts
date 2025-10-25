import cors from '@fastify/cors'
import { FastifyInstance, FastifyPluginAsync } from 'fastify'
import fastifyPlugin from 'fastify-plugin'

export function createCors(): FastifyPluginAsync {
  return fastifyPlugin(async function plugin(app: FastifyInstance) {
    app.register(cors, { origin: true, credentials: true })
  })
}
