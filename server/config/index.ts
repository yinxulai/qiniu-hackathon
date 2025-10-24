import { loadConfig } from './config'

export const config = loadConfig()
export { loadConfig as getConfig } from './config'
export type { Config } from './config'
