import { responseSchema } from '@server/helpers/schema'
import { routerSchema } from '@taicode/common-server'
import { z } from 'zod'

// ==================== 窗口类型定义 ====================

// 窗口类型枚举
export const WindowType = z.enum(['panel', 'debug', 'setting'])
export type WindowType = z.infer<typeof WindowType>

// 窗口信息（简化版）
export const WindowInfo = z.object({
  type: WindowType,
  isVisible: z.boolean(),
})
export type WindowInfo = z.infer<typeof WindowInfo>

// ==================== API Schema 定义 ====================

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

// ==================== 通用窗口操作 Schema ====================

const openWindowDescription = `
打开指定类型的窗口

**功能说明：**
- 打开指定类型的窗口
- 如果窗口不存在则自动创建
- 如果已存在则显示并聚焦

**支持的窗口类型：**
- panel: 主面板窗口（屏幕右侧固定）
- debug: 调试窗口（居中显示）
- setting: 设置窗口（居中显示）
`

export const OpenWindowSchema = routerSchema({
  operationId: 'openWindow',
  summary: '打开指定窗口',
  tags: ['窗口管理'],
  description: openWindowDescription,
  body: z.object({
    type: WindowType.describe('窗口类型'),
  }),
  response: responseSchema(z.boolean()),
})

const closeWindowDescription = `
关闭指定类型的窗口

**功能说明：**
- 关闭指定类型的窗口
- 如果窗口不存在则返回 false
`

export const CloseWindowSchema = routerSchema({
  operationId: 'closeWindow',
  summary: '关闭指定窗口',
  tags: ['窗口管理'],
  description: closeWindowDescription,
  body: z.object({
    type: WindowType.describe('窗口类型'),
  }),
  response: responseSchema(z.boolean()),
})
