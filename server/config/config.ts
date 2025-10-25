import { z } from 'zod'

const configSchema = z.object({
  port: z.number().default(28731),
  debug: z.boolean().default(false),
})

export type Config = z.infer<typeof configSchema>

export function loadConfig() {
  return configSchema.parse({
    port: 28731,
    debug: false,
  })
}
