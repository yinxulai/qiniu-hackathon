import { z, ZodType } from 'zod'

import { listResultSchema, queryResultSchema, responseSchema as commonResponseSchema } from '@taicode/common-server'

export function queryResponseSchema<T extends ZodType>(t: T) {
  return responseSchema(queryResultSchema(t))
}

export function listResponseSchema<T extends ZodType>(t: T) {
  return responseSchema(listResultSchema(t))
}

export const userErrorStatus = [
  'INVALID_INPUT',
  'UNAUTHORIZED',
  'NOT_FOUND',
] as const

export const systemErrorStatus = [
  'UNKNOWN_ERROR',
  'NOT_IMPLEMENTED',
] as const

export function responseSchema<T extends ZodType>(t: T) {
  return commonResponseSchema(t, z.enum(userErrorStatus), z.enum(systemErrorStatus))
}
