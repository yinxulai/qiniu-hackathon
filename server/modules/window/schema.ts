import { responseSchema } from '@server/helpers/schema'
import { routerSchema } from '@taicode/common-server'
import { z } from 'zod'

// ==================== 基础数据模型 ====================

export const WindowTypeSchema = z.enum(['panel', 'debug', 'setting']).describe('窗口类型')

export type WindowType = z.infer<typeof WindowTypeSchema>

// ==================== API Schema 定义 ====================

const createWindowDescription = `
创建指定类型的窗口

**功能说明：**
- 创建 panel（主面板）、debug（调试）或 setting（设置）窗口
- 如果窗口已存在，则显示已有窗口
`

export const CreateWindowSchema = routerSchema({
  operationId: 'createWindow',
  summary: '创建窗口',
  tags: ['窗口管理'],
  description: createWindowDescription,
  body: z.object({
    type: WindowTypeSchema.describe('要创建的窗口类型'),
  }),
  response: responseSchema(z.boolean()),
})

const showWindowDescription = `
显示主窗口

**功能说明：**
- 显示并聚焦主窗口
- 如果窗口未创建，则创建新窗口
`

export const ShowWindowSchema = routerSchema({
  operationId: 'showWindow',
  summary: '显示主窗口',
  tags: ['窗口管理'],
  description: showWindowDescription,
  response: responseSchema(z.boolean()),
})

const hideWindowDescription = `
隐藏主窗口

**功能说明：**
- 隐藏主窗口但不关闭
- 可通过快捷键或托盘图标重新显示
`

export const HideWindowSchema = routerSchema({
  operationId: 'hideWindow',
  summary: '隐藏主窗口',
  tags: ['窗口管理'],
  description: hideWindowDescription,
  response: responseSchema(z.boolean()),
})

const toggleWindowDescription = `
切换主窗口显示/隐藏状态

**功能说明：**
- 如果窗口可见则隐藏
- 如果窗口隐藏则显示
`

export const ToggleWindowSchema = routerSchema({
  operationId: 'toggleWindow',
  summary: '切换窗口显示状态',
  tags: ['窗口管理'],
  description: toggleWindowDescription,
  response: responseSchema(z.boolean()),
})

const reloadWindowDescription = `
重新加载主窗口

**功能说明：**
- 重新加载主窗口的内容
- 用于开发调试或刷新界面
`

export const ReloadWindowSchema = routerSchema({
  operationId: 'reloadWindow',
  summary: '重新加载窗口',
  tags: ['窗口管理'],
  description: reloadWindowDescription,
  response: responseSchema(z.boolean()),
})

const quitAppDescription = `
退出应用程序

**功能说明：**
- 关闭所有窗口并退出应用
- 清理所有资源
`

export const QuitAppSchema = routerSchema({
  operationId: 'quitApp',
  summary: '退出应用',
  tags: ['窗口管理'],
  description: quitAppDescription,
  response: responseSchema(z.boolean()),
})

const navigateDescription = `
导航到指定路由

**功能说明：**
- 在主窗口中导航到指定路由
- 支持 hash 路由
`

export const NavigateSchema = routerSchema({
  operationId: 'navigate',
  summary: '导航到指定路由',
  tags: ['窗口管理'],
  description: navigateDescription,
  body: z.object({
    route: z.string().min(1).describe('目标路由路径，如 /setting、/debug 等'),
  }),
  response: responseSchema(z.boolean()),
})
