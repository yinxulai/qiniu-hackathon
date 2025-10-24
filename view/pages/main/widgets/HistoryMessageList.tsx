import React from 'react'
import { Card } from '../../../components/ui'

interface HistoryMessage {
  id: string
  title: string
  subtaskCount: number
  timestamp: Date
}

interface HistoryMessageListProps {
  messages: HistoryMessage[]
}

export default function HistoryMessageList({ messages }: HistoryMessageListProps) {
  const formatTime = (date: Date) => {
    const now = new Date()
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60))

    if (diffInMinutes < 1) {
      return '刚刚'
    } else if (diffInMinutes < 60) {
      return `${diffInMinutes} 分钟前`
    } else if (diffInMinutes < 1440) { // 24 hours
      const hours = Math.floor(diffInMinutes / 60)
      return `${hours} 小时前`
    } else {
      const days = Math.floor(diffInMinutes / 1440)
      return `${days} 天前`
    }
  }

  return (
    <div className="h-full flex flex-col">
      {/* 历史消息容器 */}
      <div className="flex-1 overflow-y-auto p-4 space-y-2">
        {messages.map((message, index) => {
          // 计算透明度：越往下越透明
          const opacity = Math.max(0.3, 1 - (index * 0.4))

          return (
            <Card
              hover
              key={message.id}
              style={{ opacity }}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0 pr-2">
                  <h5 className="text-white/90 text-sm font-medium leading-relaxed truncate group-hover:text-white transition-colors">
                    {message.title}
                  </h5>
                  <div className="flex items-center space-x-2 mt-1">
                    <span className="text-white/60 text-xs">
                      {message.subtaskCount} 个子任务
                    </span>
                    <span className="text-white/40 text-xs">
                      •
                    </span>
                    <span className="text-white/60 text-xs">
                      {formatTime(message.timestamp)}
                    </span>
                  </div>
                </div>

                {/* 右侧指示器 */}
                <div className="shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                  <svg className="w-4 h-4 text-white/60" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M8.59 16.59L13.17 12 8.59 7.41 10 6l6 6-6 6-1.41-1.41z" />
                  </svg>
                </div>
              </div>
            </Card>
          )
        })}

        {/* 无消息提示 */}
        {messages.length === 0 && (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center text-white/40">
              <svg className="w-12 h-12 mx-auto mb-2 opacity-50" fill="currentColor" viewBox="0 0 24 24">
                <path d="M20 2H4c-1.1 0-1.99.9-1.99 2L2 22l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm-2 12H6v-2h12v2zm0-3H6V9h12v2zm0-3H6V6h12v2z" />
              </svg>
              <p className="text-sm">暂无历史消息</p>
            </div>
          </div>
        )}
      </div>

    </div>
  )
}
