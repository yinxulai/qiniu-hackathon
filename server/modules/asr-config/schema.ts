import { responseSchema } from '@server/helpers/schema'
import { routerSchema } from '@taicode/common-server'
import { z } from 'zod'

// ==================== 基础数据模型 ====================

export const ASRConfigSchema = z.object({
  appkey: z.string().min(1).describe('阿里云语音识别 AppKey'),
  token: z.string().min(1).describe('阿里云语音识别 Token'),
  updatedAt: z.string().optional().describe('最后更新时间'),
})

export type ASRConfig = z.infer<typeof ASRConfigSchema>

// ==================== API Schema 定义 ====================

const getASRConfigDescription = `
获取当前 ASR 语音识别配置

**功能说明：**
- 获取当前保存的阿里云语音识别服务配置
- 包含 AppKey 和 Token 等必要的连接信息
- 如果未配置则返回 null

**返回信息包括：**
- appkey: 阿里云语音识别 AppKey
- token: 阿里云语音识别 Token  
- updatedAt: 最后更新时间

**使用场景：**
- 设置界面显示当前配置状态
- 语音识别服务初始化时获取配置
- 验证配置是否已正确设置
`

export const GetASRConfigSchema = routerSchema({
  operationId: 'getASRConfig',
  summary: '获取 ASR 配置',
  tags: ['ASR 语音识别管理'],
  description: getASRConfigDescription,
  response: responseSchema(ASRConfigSchema.nullable()),
})

const updateASRConfigDescription = `
更新 ASR 语音识别配置

**功能说明：**
- 更新阿里云语音识别服务的连接配置
- 支持 AppKey 和 Token 的修改
- 自动更新配置的修改时间戳
- 配置更新后立即生效

**配置参数：**
- **appkey**: 阿里云语音识别 AppKey，在阿里云控制台获取
- **token**: 阿里云语音识别 Token，用于服务认证

**注意事项：**
- AppKey 和 Token 必须与阿里云账户匹配
- 建议在阿里云控制台验证配置的有效性
- 配置更新后需要重新连接语音识别服务

**使用场景：**
- 初始化设置语音识别服务
- 更新过期或失效的认证信息
- 切换不同的阿里云账户配置
`

export const UpdateASRConfigSchema = routerSchema({
  operationId: 'updateASRConfig',
  summary: '更新 ASR 配置',
  tags: ['ASR 语音识别管理'],
  description: updateASRConfigDescription,
  body: z.object({
    appkey: z.string().min(1).describe('阿里云语音识别 AppKey'),
    token: z.string().min(1).describe('阿里云语音识别 Token'),
  }),
  response: responseSchema(ASRConfigSchema),
})

export type UpdateASRConfigInput = z.infer<typeof UpdateASRConfigSchema.body>

const deleteASRConfigDescription = `
删除 ASR 语音识别配置

**功能说明：**
- 删除当前保存的阿里云语音识别配置
- 清除所有相关的认证信息
- 删除后语音识别功能将使用默认配置或进入 Mock 模式

**删除后的效果：**
- AppKey 和 Token 信息被完全清除
- 语音识别服务将无法正常连接
- 需要重新配置才能恢复语音功能

**使用场景：**
- 重置语音识别配置
- 清除敏感的认证信息
- 切换到其他语音识别服务前的清理
`

export const DeleteASRConfigSchema = routerSchema({
  operationId: 'deleteASRConfig',
  summary: '删除 ASR 配置',
  tags: ['ASR 语音识别管理'],
  description: deleteASRConfigDescription,
  response: responseSchema(z.boolean()),
})
