import OpenApi from '@fastify/swagger'
import fastifyPlugin from 'fastify-plugin'
import { FastifyInstance, FastifyPluginAsync } from 'fastify'
import { createJsonSchemaTransform } from 'fastify-type-provider-zod'
import { config } from '@server/config'

export function createOpenapi(): FastifyPluginAsync {
  return fastifyPlugin(async function plugin(app: FastifyInstance) {
    const schemaTransform = createJsonSchemaTransform({ skipList: [] })

    await app.register(OpenApi, {
      transform: schemaTransform,
      openapi: {
        openapi: '3.0.0',
        info: {
          version: '1.0.0',
          title: 'Taicode Aiprod Service',
          description: 'Basic Aiprod services',
        },
        servers: [
          {
            url: `http://localhost:${config.port}`,
            description: 'Server URL'
          }
        ],
      }
    })

    await app.register(async app => {
      app.get('/openapi.json', async (_request, reply) => {
        return reply.send(app.swagger())
      })
    })
  })
}
