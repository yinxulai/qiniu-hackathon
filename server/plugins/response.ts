
import fastifyPlugin from 'fastify-plugin'
import { FastifyInstance, FastifyPluginAsync } from 'fastify'
import { hasZodFastifySchemaValidationErrors, isResponseSerializationError } from 'fastify-type-provider-zod'
import { fromError } from 'zod-validation-error'

import { createErrorResponse } from '@server/helpers/response'
import { SystemError } from '@taicode/common-base'

export function createResponseHandler(): FastifyPluginAsync {
  return fastifyPlugin(async function plugin(app: FastifyInstance) {
    app.setNotFoundHandler(async (request, reply) => {
      return reply
        .code(500)
        .send(createErrorResponse('NOT_IMPLEMENTED', request.url))
    })

    app.setErrorHandler((error, _request, reply) => {
      if (SystemError.is(error)) {
        const serverError: SystemError = error
        return reply
          .code(400)
          .send(createErrorResponse(serverError.type, serverError.message))
      }

      if (hasZodFastifySchemaValidationErrors(error)) {
        return reply
          .code(400)
          .send(createErrorResponse('INVALID_INPUT', fromError(error)?.message))
      }

      if (isResponseSerializationError(error)) {
        return reply
          .code(400)
          .send(createErrorResponse('INVALID_INPUT', fromError(error)?.message))
      }

      return reply
        .code(500)
        .send(createErrorResponse('UNKNOWN_ERROR', error.message))
    })
  })
}
