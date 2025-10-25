import type { FastifyInstance } from 'fastify'
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

export function createASRConfigRouter(options: CreateASRConfigRouterOptions = {}) {
  return async function asrConfigRouter(fastify: FastifyInstance) {
    const asrConfigService = new ASRConfigService()

    // 获取 ASR 配置
    fastify.post('/asr/config/get', {
      schema: GetASRConfigSchema
    }, async (request, reply) => {
      try {
        const config = asrConfigService.getConfig()
        
        return {
          success: true,
          data: config,
          message: config ? '获取 ASR 配置成功' : '尚未配置 ASR'
        }
      } catch (error) {
        console.error('[ASRConfigRouter] Get config error:', error)
        return reply.code(500).send({
          success: false,
          data: null,
          message: '获取 ASR 配置失败'
        })
      }
    })

    // 更新 ASR 配置
    fastify.post('/asr/config/update', {
      schema: UpdateASRConfigSchema
    }, async (request, reply) => {
      try {
        const { appkey, token } = request.body as UpdateASRConfigInput
        
        // 验证输入
        if (!appkey.trim() || !token.trim()) {
          return reply.code(400).send({
            success: false,
            data: null,
            message: 'AppKey 和 Token 不能为空'
          })
        }
        
        const config = asrConfigService.updateConfig(appkey, token)
        
        return {
          success: true,
          data: config,
          message: 'ASR 配置更新成功'
        }
      } catch (error) {
        console.error('[ASRConfigRouter] Update config error:', error)
        return reply.code(500).send({
          success: false,
          data: null,
          message: '更新 ASR 配置失败'
        })
      }
    })

    // 删除 ASR 配置
    fastify.post('/asr/config/delete', {
      schema: DeleteASRConfigSchema
    }, async (request, reply) => {
      try {
        const success = asrConfigService.deleteConfig()
        
        return {
          success: true,
          data: success,
          message: success ? 'ASR 配置删除成功' : 'ASR 配置删除失败'
        }
      } catch (error) {
        console.error('[ASRConfigRouter] Delete config error:', error)
        return reply.code(500).send({
          success: false,
          data: false,
          message: '删除 ASR 配置失败'
        })
      }
    })
  }
}
