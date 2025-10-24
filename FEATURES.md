# 功能测试

本文档记录了 Voice Assistant 的功能实现和测试。

## 已实现功能

### 1. 窗口管理

- ✅ `createDebugWindow()` - 创建调试窗口（屏幕居中显示）
- ✅ `createSettingWindow()` - 创建设置窗口（屏幕居中显示）
- ✅ `createPanelWindow()` - 主面板窗口（屏幕右侧显示）

### 2. 系统托盘

- ✅ 系统托盘图标和菜单
- ✅ 托盘菜单包含调试窗口和设置窗口入口
- ✅ 语音激活快捷键支持

### 3. 页面路由

- ✅ 面板页面 (`/panel`)
- ✅ 调试页面 (`/debug`)  
- ✅ 设置页面 (`/setting`)

### 4. IPC 通信

- ✅ 语音激活事件
- ✅ 窗口显示/隐藏控制
- ✅ 新窗口创建请求
- ✅ 导航事件

## 窗口定位说明

- **主面板窗口** (`panel`): 位于屏幕右侧，高度占满屏幕，宽度320px
- **调试窗口** (`debug`): 屏幕居中显示，尺寸1200x800px
- **设置窗口** (`setting`): 屏幕居中显示，尺寸800x600px

## 测试方法

### 测试系统托盘功能

1. 启动应用后，查看系统托盘是否出现麦克风图标
2. 右键点击托盘图标，验证菜单包含：
   - 显示/隐藏主窗口
   - 语音激活
   - **调试窗口** (新增)
   - **设置窗口** (新增)
   - 设置
   - 关于
   - 重新加载
   - 退出

### 测试调试窗口

1. 在托盘菜单中点击"调试窗口"
2. 验证新窗口在屏幕中央打开，显示调试页面
3. 检查页面包含：
   - 系统信息显示
   - 服务器状态监控
   - 应用日志输出

### 测试设置窗口

1. 在托盘菜单中点击"设置窗口"
2. 验证新窗口在屏幕中央打开，显示设置页面
3. 检查页面包含：
   - 通用设置
   - 语音设置
   - 外观设置
   - 关于页面

### 测试快捷键

- `Ctrl+Shift+V` (Windows) 或 `Cmd+Shift+V` (Mac): 显示/隐藏主窗口
- `Ctrl+Shift+Space` (Windows) 或 `Cmd+Shift+Space` (Mac): 语音激活

## 开发信息

### 文件结构

```text
view/
├── App.tsx (路由根组件)
├── pages/
│   ├── panel/PanelPage.tsx (主面板)
│   ├── debug/DebugPage.tsx (调试页面)
│   └── setting/SettingPage.tsx (设置页面)
└── preload.ts (增强版 API)

server/
└── main.ts (窗口管理和托盘功能)
```

### API 接口

- `window.electronAPI.createDebugWindow()` - 创建调试窗口
- `window.electronAPI.createSettingWindow()` - 创建设置窗口

### 端口信息

- Vite 开发服务器: http://localhost:5174/
- 内置 API 服务器: http://localhost:[随机端口]

## 更新日志

### 2024-10-24

- ✅ 修复窗口定位：debug 和 setting 窗口现在默认在屏幕中央显示
- ✅ panel 窗口保持在屏幕右侧显示
- ✅ 所有窗口都有合适的默认尺寸和最小尺寸限制
