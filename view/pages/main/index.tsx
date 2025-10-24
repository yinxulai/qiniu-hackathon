import React, { useState } from 'react'

import TaskStatusPanel from './widgets/TaskStatusPanel'
import VoiceInputModule from './widgets/VoiceInputModule'
import HistoryMessageList from './widgets/HistoryMessageList'

// 模拟数据类型
interface Task {
  id: string
  title: string
  status: 'pending' | 'running' | 'completed'
  subtasks: Array<{
    id: string
    title: string
    status: 'pending' | 'running' | 'completed'
  }>
}

interface HistoryMessage {
  id: string
  title: string
  subtaskCount: number
  timestamp: Date
}

export default function MainPage() {
  // 当前活跃任务状态
  const [activeTask, setActiveTask] = useState<Task | null>({
    id: '1',
    title: '整理桌面文件并按时间间隔自动按项目分组',
    status: 'running',
    subtasks: [
      { id: '1-1', title: '扫描桌面文件', status: 'completed' },
      { id: '1-2', title: '分析文件类型和创建时间', status: 'running' },
      { id: '1-3', title: '创建项目文件夹', status: 'pending' },
      { id: '1-4', title: '移动文件到对应文件夹', status: 'pending' }
    ]
  })

  // 历史消息列表
  const [historyMessages] = useState<HistoryMessage[]>([
    { id: '1', title: '整理桌面文件并按时间间隔自动按项目分组', subtaskCount: 4, timestamp: new Date(Date.now() - 10 * 60 * 1000) },
    { id: '2', title: '规划到上南南站的线路', subtaskCount: 3, timestamp: new Date(Date.now() - 30 * 60 * 1000) },
    { id: '3', title: '安装开发环境并配置项目', subtaskCount: 5, timestamp: new Date(Date.now() - 60 * 60 * 1000) },
    { id: '4', title: '创建新的文档模板', subtaskCount: 2, timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000) },
    { id: '5', title: '优化系统性能', subtaskCount: 6, timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000) }
  ])

  const handleVoiceInput = (text: string) => {
    console.log('Voice input:', text)
    // 处理语音输入逻辑
  }

  const handleTextInput = (text: string) => {
    console.log('Text input:', text)
    // 处理文本输入逻辑
  }

  return (
    <div className="h-screen w-full flex flex-col overflow-hidden relative">
      
      {/* 语音输入模块 */}
      <div className="p-4 relative z-10">
        <VoiceInputModule 
          onVoiceInput={handleVoiceInput}
          onTextInput={handleTextInput}
        />
      </div>

      {/* 当前任务状态面板 */}
      {activeTask && (
        <div className="px-4 pb-4 relative z-10">
          <TaskStatusPanel task={activeTask} />
        </div>
      )}

      {/* 历史消息列表 */}
      <div className="flex-1 overflow-hidden relative z-10">
        <HistoryMessageList messages={historyMessages} />
      </div>
    </div>
  )
}
