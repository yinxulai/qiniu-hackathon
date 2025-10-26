# Siwe - 智能语音助手

<div align="center">
  <h3>🎙️ 通过文字和语音控制电脑的智能工具</h3>
  <p>支持多种能力交叉执行复杂任务的桌面AI助手</p>

  ![License](https://img.shields.io/badge/license-MIT-blue.svg)
  ![Electron](https://img.shields.io/badge/Electron-38.3.0-blue.svg)
  ![TypeScript](https://img.shields.io/badge/TypeScript-5.9.3-blue.svg)
  ![React](https://img.shields.io/badge/React-19.2.0-blue.svg)
</div>

## ✨ 核心亮点

### 🤖 智能任务编排

- **多模态交互**：支持文字和语音双重输入方式
- **任务分解执行**：自动将复杂任务分解为可执行步骤
- **上下文感知**：具备任务间关联分析和状态记忆能力
- **实时反馈**：提供详细的任务执行过程和状态展示

### 🔌 插件化架构

- **MCP 协议集成**：基于 Model Context Protocol 的组件化能力扩展
- **开箱即用组件**：内置浏览器自动化、桌面操作、文件管理等核心能力
- **第三方扩展**：支持快速集成第三方 MCP 组件

### 🎯 智能场景应用

- **地理信息服务**：智能地址搜索、路线规划、位置分析
- **文件智能管理**：基于时间和地理位置的自动分类整理
- **跨应用编排**：支持多个应用程序间的任务协调

### 🏗️ 现代化技术栈

- **前后端分离**：Electron + Fastify + React 架构
- **类型安全**：全栈 TypeScript 开发，Zod 模式验证
- **多窗口设计**：独立的面板、调试、设置窗口
- **热重载开发**：Vite 构建系统，支持快速开发调试

## 🚀 快速开始

### 环境要求

- Node.js >= 18.0.0
- npm >= 8.0.0
- Windows/macOS/Linux

### 安装依赖

```bash
npm install
```

### 开发模式

```bash
npm run start
```

### 构建打包

```bash
# 打包应用
npm run package

# 创建安装包
npm run make
```

## 🏛️ 技术架构

### 整体架构图

```text
┌─────────────────────────────────────────────────────────────┐
│                    Siwe Desktop App                        │
├─────────────────────────────────────────────────────────────┤
│  Electron Main Process (Node.js Runtime)                   │
│  ┌─────────────────┐  ┌─────────────────────────────────┐  │
│  │  Fastify Server │  │     Window Management            │  │
│  │  (Port: 28731)  │  │  ┌─────────┐ ┌─────────────────┐ │  │
│  │                 │  │  │  Panel  │ │     Debug       │ │  │
│  │  RESTful API    │  │  │ Window  │ │    Window       │ │  │
│  │  OpenAPI Docs   │  │  └─────────┘ └─────────────────┘ │  │
│  └─────────────────┘  │  ┌─────────────────────────────┐ │  │
│                       │  │    Setting Window           │ │  │
│                       │  └─────────────────────────────┘ │  │
│                       └─────────────────────────────────────┘  │
├─────────────────────────────────────────────────────────────┤
│  Core Modules                                               │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────────────────┐ │
│  │ Auto Agent  │ │ MCP Server  │ │    Task Management      │ │
│  │             │ │             │ │                         │ │
│  │ LangChain   │ │ Protocol    │ │   Status Tracking       │ │
│  │ OpenAI      │ │ Management  │ │   Step Execution        │ │
│  │ Integration │ │             │ │                         │ │
│  └─────────────┘ └─────────────┘ └─────────────────────────┘ │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────────────────┐ │
│  │Voice Wakeup │ │ASR Config   │ │   Window Service        │ │
│  │             │ │             │ │                         │ │
│  │ Porcupine   │ │ Speech      │ │  Multi-Window Manager   │ │
│  │ Hotword     │ │ Recognition │ │  Global Shortcuts       │ │
│  │ Detection   │ │ Settings    │ │                         │ │
│  └─────────────┘ └─────────────┘ └─────────────────────────┘ │
├─────────────────────────────────────────────────────────────┤
│  MCP Components (External Tools)                            │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────────────────┐ │
│  │ Playwright  │ │ Desktop     │ │    Self Server          │ │
│  │ Browser     │ │ Commander   │ │                         │ │
│  │ Automation  │ │ OS Control  │ │  API Reflection         │ │
│  └─────────────┘ └─────────────┘ └─────────────────────────┘ │
├─────────────────────────────────────────────────────────────┤
│  Renderer Process (Chromium Runtime)                        │
│  ┌─────────────────────────────────────────────────────────┐ │
│  │                React Frontend                           │ │
│  │  ┌─────────────┐ ┌─────────────┐ ┌─────────────────────┐ │ │
│  │  │Panel Page   │ │ Debug Page  │ │   Setting Page      │ │ │
│  │  │             │ │             │ │                     │ │ │
│  │  │Task Display │ │API Testing  │ │  MCP Configuration  │ │ │
│  │  │Voice Input  │ │Log Viewing  │ │  Voice Settings     │ │ │
│  │  │Text Input   │ │             │ │  Model Config       │ │ │
│  │  └─────────────┘ └─────────────┘ └─────────────────────┘ │ │
│  └─────────────────────────────────────────────────────────┘ │
├─────────────────────────────────────────────────────────────┤
│  IPC Communication Layer                                    │
│  ┌─────────────────────────────────────────────────────────┐ │
│  │              Preload.ts Security Bridge                 │ │
│  │  ┌─────────────────────────────────────────────────────┐ │ │
│  │  │         HTTP API Client (Auto-generated)            │ │ │
│  │  │                                                     │ │ │
│  │  │  TypeScript SDK + OpenAPI Integration               │ │ │
│  │  └─────────────────────────────────────────────────────┘ │ │
│  └─────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

### 技术栈详情

#### 🖥️ 桌面应用框架

- **Electron 38.3.0**: 跨平台桌面应用开发
- **Electron Forge**: 完整的构建、打包和分发工具链
- **多窗口架构**: 独立的主面板、调试、设置窗口

#### 🔧 后端服务

- **Fastify**: 高性能 Node.js Web 框架
- **RESTful API**: HTTP API 替代传统 IPC 通信
- **Zod + TypeScript**: 端到端类型安全和运行时验证
- **OpenAPI 3.0**: 自动生成 API 文档和客户端 SDK

#### ⚛️ 前端界面

- **React 19.2.0**: 现代化组件框架
- **TailwindCSS v4**: 实用优先的 CSS 框架
- **React Router v7**: 声明式路由管理
- **MobX**: 状态管理解决方案

#### 🤖 AI & 语音

- **LangChain**: AI 应用开发框架
- **OpenAI Integration**: GPT 模型集成
- **MCP (Model Context Protocol)**: 外部工具连接协议
- **Porcupine**: 语音唤醒检测引擎

#### 🔨 开发工具

- **Vite**: 快速构建工具，支持热重载
- **TypeScript**: 静态类型检查
- **ESLint**: 代码质量检测
- **Path Mapping**: 模块路径别名支持

## 📁 项目结构

```text
siwe/
├── server/                 # Electron 主进程 + Fastify 服务器
│   ├── main.ts            # 应用入口点
│   ├── config/            # 配置管理
│   ├── modules/           # 功能模块
│   │   ├── auto-agent/    # AI 智能代理
│   │   ├── mcp-server/    # MCP 服务器管理
│   │   ├── window/        # 窗口管理服务
│   │   ├── asr-config/    # 语音识别配置
│   │   └── voice-wakeup/  # 语音唤醒服务
│   └── plugins/           # Fastify 插件
├── view/                  # React 前端界面
│   ├── App.tsx           # 应用根组件
│   ├── apis/             # 自动生成的 API 客户端
│   ├── pages/            # 页面组件
│   │   ├── panel/        # 主面板页面
│   │   ├── debug/        # 调试页面
│   │   └── setting/      # 设置页面
│   ├── hooks/            # React Hooks
│   └── services/         # 前端服务层
├── scripts/              # 构建脚本
├── static/               # 静态资源
└── product/              # 产品文档
```

## 🎯 核心功能

### 1. 多模态交互

- **语音输入**: 基于 Porcupine 的语音唤醒和识别
- **文字输入**: 实时文本处理和意图理解
- **快捷键**: `Ctrl+Shift+V` 显示/隐藏主窗口

### 2. 任务智能编排

- **自动分解**: 将复杂任务拆分为可执行步骤
- **状态跟踪**: 实时显示任务执行进度
- **错误处理**: 智能错误恢复和重试机制

### 3. MCP 生态集成

```typescript
// 默认集成的 MCP 服务器
const defaultServers = [
  {
    name: "playwright/mcp",
    command: "npx",
    args: ["playwright/mcp"],
  },
  {
    name: "desktop-commander", 
    command: "desktop-commander",
    args: [],
  },
  {
    name: "self-server-mcp",
    command: "node",
    args: ["./self-server-mcp/index.js"],
  }
]
```

### 4. 应用场景示例

#### 🌍 地理信息处理

```text
"帮我搜索上海虹桥站地址并规划到浦东机场的路线"
```

#### 📁 文件智能管理

```text
"帮我整理桌面照片到文件夹，按拍摄地点分组并重命名"
```

#### 🔄 复合任务执行

```text
"帮我搜索 10 天内访问的餐厅，规划美食串联路线"
```

## 🛠️ 开发指南

### API 客户端生成

```bash
# 从 OpenAPI 规范生成 TypeScript 客户端
node scripts/api-gen.js
```

生成的文件位于 `view/apis/` 目录，包含：

- 完整的 TypeScript 类型定义
- SDK 方法调用
- 请求/响应验证

### 添加新功能模块

1. **创建模块目录结构**:

```text
server/modules/your-module/
├── index.ts          # 模块导出
├── service.ts        # 业务逻辑
├── router.ts         # API 路由
└── schema.ts         # Zod 数据验证
```

2. **注册路由器**:

```typescript
// server/main.ts
fastify.register(createYourModuleRouter({}))
```

3. **更新前端客户端**:

```bash
node scripts/api-gen.js
```

### 配置管理

使用 `electron-store` 进行配置持久化：

```typescript
// MCP 服务器配置
const mcpStore = new Store({ name: 'mcp-servers' })

// AI 代理配置  
const agentStore = new Store({ name: 'auto-agent-config' })
```

## 🤝 贡献指南

1. Fork 本仓库
2. 创建特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 开启 Pull Request

## 📄 许可证

本项目基于 MIT 许可证开源 - 查看 [LICENSE](LICENSE) 文件了解详情。

## 👨‍💻 作者

**Alain** - [yinxulai@hotmail.com](mailto:yinxulai@hotmail.com)

---

<div align="center">
  <p>⭐ 如果这个项目对你有帮助，请考虑给它一个星标！</p>
</div>
