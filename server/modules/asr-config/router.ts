import type { FastifyPluginAsync } from 'fastify'
import type { ZodTypeProvider } from 'fastify-type-provider-zod'
import { SystemError, UserError } from '@taicode/common-base'
import { createSuccessResponse } from '@server/helpers/response'
import { ASRConfigService } from './service'
import { 
  GetASRConfigSchema, 
  UpdateASRConfigSchema, 
  DeleteASRConfigSchema,
  type UpdateASRConfigInput 
} from './schema'

export interface CreateASRConfigRouterOptions {
  // 可以添加一些选项，比如权限验证等
}

export function createASRConfigRouter(options: CreateASRConfigRouterOptions = {}): FastifyPluginAsync {
  return async function asrConfigRouter(fastify) {
    const typedApp = fastify.withTypeProvider<ZodTypeProvider>()
    const asrConfigService = new ASRConfigService()

    // 获取 ASR 配置
    typedApp.post('/asr/config/get', {
      schema: GetASRConfigSchema
    }, async () => {
      const config = asrConfigService.getConfig()
      return createSuccessResponse(config)
    })

    // 更新 ASR 配置
    typedApp.post('/asr/config/update', {
      schema: UpdateASRConfigSchema
    }, async (request) => {
      const { appkey, token } = request.body
      
      // 验证输入
      if (!appkey.trim() || !token.trim()) {
        throw new UserError('INVALID_INPUT', 'AppKey 和 Token 不能为空')
      }
      
      const config = asrConfigService.updateConfig(appkey, token)
      return createSuccessResponse(config)
    })

    // 删除 ASR 配置
    typedApp.post('/asr/config/delete', {
      schema: DeleteASRConfigSchema
    }, async () => {
      const success = asrConfigService.deleteConfig()
      return createSuccessResponse(success)
    })
  }
}
