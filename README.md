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

### 🎯 功能亮点

#### 🤖 智能任务编排

- **多模态交互**：支持文字和语音双重输入方式
- **任务分解执行**：自动将复杂任务分解为可执行步骤
- **上下文感知**：具备任务间关联分析和状态记忆能力
- **连线唤醒词激活**：离线唤醒词激活+在线实时语音识别输入

#### 🔌 插件化生态

- **MCP 自控**: 应用本身可以基于 MCP 协议控制自己，几乎覆盖 100% 的功能
- **MCP Server**: 应用本身提供 MCP 接入支持，支持使用其他工具通过 MCP 控制
- **MCP 协议集成**：基于 Model Context Protocol 的组件化能力扩展
- **开箱即用组件**：内置浏览器自动化、桌面操作、文件管理等核心能力
- **第三方扩展**：支持快速集成第三方 MCP 组件

#### 🌍 智能场景应用

- **地理信息服务**：智能地址搜索、路线规划、位置分析
- **文件智能管理**：基于时间和地理位置的自动分类整理
- **跨应用编排**：支持多个应用程序间的任务协调

### 🛠️ 技术亮点

#### 🏗️ 现代化架构

- **前后端分离**：Electron + Fastify + React 架构
- **类型安全**：全栈 TypeScript 开发，Zod 模式验证
- **HTTP API 通信**：替代传统 IPC，便于调试和扩展
- **多窗口设计**：独立的面板、调试、设置窗口

#### ⚡ 开发体验

- **热重载开发**：Vite 构建系统，支持快速开发调试
- **API 自动生成**：从 OpenAPI 规范自动生成 TypeScript 客户端
- **端到端验证**：请求/响应数据的运行时类型检查
- **模块化开发**：清晰的模块划分和依赖注入

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
- **快捷键**: `Ctrl+Shift+V` 激活应用主窗口
- **快捷键**: `Ctrl+Shift+Space` 激活并启动实时声音识别

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

## 👨‍💻 作者

**Alain** - [yinxulai@hotmail.com](mailto:yinxulai@hotmail.com)
