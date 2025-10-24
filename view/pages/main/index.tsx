import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'

import TaskStatusPanel from './widgets/TaskStatusPanel'
import VoiceInputModule from './widgets/VoiceInputModule'
import HistoryMessageList from './widgets/HistoryMessageList'
import { Button } from '../../components/ui'

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
  const navigate = useNavigate()

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
      
      {/* 顶部工具栏 */}
      <div className="absolute top-4 right-4 z-20">
        <Button
          size="sm"
          onClick={() => navigate('/setting')}
          icon={
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          }
          title="设置"
        />
      </div>

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
      {/* <div className="flex-1 overflow-hidden relative z-10">
        <HistoryMessageList messages={historyMessages} />
      </div> */}
    </div>
  )
}
