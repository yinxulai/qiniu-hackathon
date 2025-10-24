# 产品文档

## 产品定位
todo
一个可以完全通过语音来控制电脑的工具，解决残障人士的一般电脑需求。

## 应用场景
todo


### 应用示例

- [] 帮我整理桌面的文件，按时间间隔自动按项目分组
- [] 帮我规划到上南南站的线路，中间需要互动出行方式

## 功能列表
- [] 语音激活交互
- [] 聊天记录查看
- [] 所有功能可以做到语音控制
- [] MCP 管理 (含环境自动安装)
- [] MCP 运行环境管理

### 次要功能

- [] 视觉识别（内容定位）
- [] 

### 模型选型

- 要支持内容识别和定位

### MCP 选择

- [浏览器] @playwright/mcp
- [桌面控制](https://github.com/NakaokaRei/swift-mcp-gui)


## 功能使用

### 核心流程图

```mermaid
flowchart TD
    Start([用户启动]) --> Wake{语音唤醒 NAME}
    
    Wake -->|成功| ShowUI[显示对话界面<br/>NAME: "在呢"]
    Wake -->|失败| Start
    
    ShowUI --> Input{选择输入方式}
    
    Input -->|文字| TextInput[输入文字指令<br/>按回车发送]
    Input -->|语音| VoiceInput[点击语音按钮<br/>开始录音]
    
    VoiceInput --> VoiceProcess[实时语音转文字<br/>5秒停顿自动发送]
    VoiceProcess -->|取消| Input
    VoiceProcess -->|完成| TaskAnalysis
    TextInput --> TaskAnalysis
    
    TaskAnalysis{指令类型识别}
    TaskAnalysis -->|新任务| NewTask[创建新任务]
    TaskAnalysis -->|子任务| SubTask[追加到当前任务]
    TaskAnalysis -->|控制指令| Control{控制类型}
    
    Control -->|终止| TerminateTask[任务状态→已终止]
    Control -->|关闭| Sleep[NAME进入休眠<br/>所有任务终止]
    
    NewTask --> Execute[任务执行面板]
    SubTask --> Execute
    
    Execute --> TaskDisplay[显示任务信息:<br/>📋 任务标题<br/>🟡 任务状态<br/>📝 任务描述]
    TaskDisplay --> StepDisplay[显示执行步骤:<br/>🔢 步骤序列<br/>✅ 完成状态]
    
    StepDisplay --> Processing{任务执行中}
    Processing -->|进行中| WaitInput[等待用户输入]
    Processing -->|完成| Complete[✅ 任务完成<br/>NAME缩略为图标]
    Processing -->|终止| TerminateTask
    
    WaitInput --> Input
    Complete --> History[归档到历史记录]
    TerminateTask --> History
    
    History --> Input
    Sleep --> Start
    
    style Start fill:#e1f5fe
    style Wake fill:#fff3e0
    style Execute fill:#f3e5f5
    style Complete fill:#e8f5e8
    style Sleep fill:#fce4ec
```

### 使用流程详细说明

#### 1. 语音唤醒 NAME

- **唤醒成功**：展示对话界面，NAME 头像出现并语音提示"在呢"
- **唤醒失败**：界面保持原状，无任何反应

#### 2. 指令输入

支持两种输入方式：

- **文字输入**：在对话框中输入文字，按回车发送指令
- **语音输入**：点击语音按钮后开始录音
  - 实时语音转文字显示在输入框中
  - 语音停顿超过 5 秒自动结束并发送指令
  - 可通过"取消"指令或点击终止按钮中断录音

#### 3. 任务执行与显示

接收指令后，系统在「任务分解面板」中展示任务执行过程：

**任务概览区域**：

- 任务标题：简要概括任务目标
- 任务状态：🟡 进行中 / 🔴 已终止 / ✅ 已完成
- 任务描述：详细说明执行要点和预期结果

**执行步骤区域**：

- 步骤描述：显示序列和各个执行步骤的简述
- 步骤状态：进行中的显示为序列号/ 已完成的打勾标记

#### 4. 任务控制

在任务执行过程中可以进行以下操作：

**终止任务**：

- 语音或文字输入"终止"指令
- 当前任务立即停止，状态变更为「已终止」

**追加指令**：

根据当前任务状态有不同的处理方式：

- **进行中任务**：未执行步骤置灰，插入新的执行步骤
- **已完成任务**：任务状态重新变为「进行中」，添加新的执行步骤
- **已终止任务**：不支持追加，需重新发起新任务

#### 5. 任务与指令类型识别

**子任务判断标准**：

- 使用延续性词汇：「然后」「接着」「再」「另外」
- 明确的补充意图：「补充一下」「追加」「还需要」
- 基于当前任务结果的进一步操作

**新任务判断标准**：

- 使用新任务标识词：「重新」「新建」「开始新的」
- 明确表示与当前任务无关的独立需求

**智能识别机制**：

- 系统自动分析指令语义和上下文关联度
- 不确定时提示用户确认：「这是要追加到当前任务还是开始新任务？」 //对话？可以先没有

#### 6. 历史记录管理

- 「已终止」或「已完成」的任务自动归档到历史记录
- 历史记录显示：任务标题、完成时间、子任务数量
- 支持查看和恢复历史任务

#### 7. NAME 其他状态

- **任务完成展示结果时**：NAME 缩略为小图标，节省界面空间
- **接收"关闭"指令**：NAME 进入休眠状态，所有进行中任务自动终止


