import { z } from 'zod'

const configSchema = z.object({
  port: z.number().default(3000),
  debug: z.boolean().default(false),
})

export type Config = z.infer<typeof configSchema>

export function loadConfig() {
  return configSchema.parse({
    port: Math.floor(Math.random() * 65535),
    debug: false,
  })
}
