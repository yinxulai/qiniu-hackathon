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
显示主面板窗口

**功能说明：**
- 显示并聚焦Siwei主面板窗口
- 窗口固定在屏幕右侧，宽度 320px
- 如果窗口未创建，则自动创建新窗口
- 支持快捷键 Ctrl+Shift+V 快速唤醒

**使用场景：**
- 用户需要打开Siwei界面进行交互
- 通过 API 或快捷键激活助手功能
`

export const ShowWindowSchema = routerSchema({
  operationId: 'showWindow',
  summary: '显示主窗口',
  tags: ['窗口管理'],
  description: showWindowDescription,
  response: responseSchema(z.boolean()),
})

const hideWindowDescription = `
隐藏主面板窗口

**功能说明：**
- 隐藏Siwei主面板窗口但不关闭进程
- 窗口状态和数据保持在内存中
- 可通过快捷键 Ctrl+Shift+V 或 API 重新显示
- 隐藏后助手仍在后台运行，可处理语音唤醒

**使用场景：**
- 用户完成交互后暂时隐藏界面
- 保持助手后台运行状态
`

export const HideWindowSchema = routerSchema({
  operationId: 'hideWindow',
  summary: '隐藏主窗口',
  tags: ['窗口管理'],
  description: hideWindowDescription,
  response: responseSchema(z.boolean()),
})

const toggleWindowDescription = `
切换主面板窗口显示/隐藏状态

**功能说明：**
- 智能切换窗口可见性状态
- 当窗口可见时自动隐藏
- 当窗口隐藏时自动显示并聚焦
- 相当于快捷键 Ctrl+Shift+V 的 API 实现

**使用场景：**
- 快速切换助手界面显示状态
- 一键式窗口管理操作
`

export const ToggleWindowSchema = routerSchema({
  operationId: 'toggleWindow',
  summary: '切换窗口显示状态',
  tags: ['窗口管理'],
  description: toggleWindowDescription,
  response: responseSchema(z.boolean()),
})

const reloadWindowDescription = `
重新加载主面板窗口

**功能说明：**
- 强制重新加载主窗口的 React 界面内容
- 清除当前界面状态并重新初始化
- 保持窗口位置和大小不变

**使用场景：**
- 开发调试时刷新前端代码变更
- 界面出现异常时恢复正常状态
- 强制更新界面数据和状态
`

export const ReloadWindowSchema = routerSchema({
  operationId: 'reloadWindow',
  summary: '重新加载窗口',
  tags: ['窗口管理'],
  description: reloadWindowDescription,
  response: responseSchema(z.boolean()),
})

const quitAppDescription = `
完全退出Siwei应用

**功能说明：**
- 关闭所有窗口（主面板、调试、设置窗口）
- 终止所有后台服务和 MCP 连接
- 清理内存资源和临时文件
- 注销全局快捷键绑定

**使用场景：**
- 完全关闭Siwei应用
- 系统关机前的安全退出
- 重启应用前的清理操作
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
- 根据窗口类型打开对应的功能窗口
- 如果窗口不存在则自动创建并初始化
- 如果窗口已存在则显示并聚焦到前台
- 每种窗口类型采用不同的布局和定位策略

**支持的窗口类型：**
- **panel**: 主面板窗口 - 屏幕右侧固定，320px 宽度，用于语音交互
- **debug**: 调试窗口 - 屏幕居中显示，1200x800px，用于开发调试和日志查看
- **setting**: 设置窗口 - 屏幕居中显示，800x600px，用于配置管理

**使用场景：**
- 根据功能需求打开对应的专用窗口
- 多窗口工作流管理
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
- 安全关闭指定类型的窗口实例
- 保存窗口状态和用户数据（如适用）
- 释放窗口相关的内存资源
- 如果窗口不存在或已关闭则返回 false

**注意事项：**
- 关闭主面板窗口不会退出应用，仅隐藏界面
- 调试和设置窗口关闭后会完全销毁实例
- 可通过 openWindow 重新创建已关闭的窗口

**使用场景：**
- 完成特定功能后关闭对应窗口
- 内存优化和窗口管理
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

// ==================== 语音交互 Schema ====================

const activateVoiceInputDescription = `
激活语音输入功能

**功能说明：**
- 自动显示主面板窗口并聚焦
- 向前端发送语音唤醒信号
- 启动语音输入模式，等待用户说话
- 相当于快捷键 Ctrl+Shift+Space 的 API 实现

**使用场景：**
- 语音唤醒检测到关键词后自动触发
- MCP 组件通过 API 调用激活语音功能
- 第三方集成通过 HTTP API 触发语音交互
`

export const ActivateVoiceInputSchema = routerSchema({
  operationId: 'activateVoiceInput',
  summary: '激活语音输入',
  tags: ['语音交互'],
  description: activateVoiceInputDescription,
  response: responseSchema(z.boolean()),
})
