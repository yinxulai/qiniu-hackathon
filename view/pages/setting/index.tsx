import React, { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Tabs, TabsList, TabsTrigger, TabsContent, Button } from '../../components/ui'
import { McpManager } from './components/McpManager'
import { ProviderManager } from './components/ProviderManager'
import { AboutPage } from './components/AboutPage'

export default function SettingPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [activeTab, setActiveTab] = useState('mcp')

  useEffect(() => {
    const tab = searchParams.get('tab')
    if (tab && ['mcp', 'provider', 'about'].includes(tab)) {
      setActiveTab(tab)
    }
  }, [searchParams])

  return (
    <div className="h-screen w-full bg-transparent flex flex-col">
      {/* 顶部导航栏 */}
      <div className="flex items-center justify-between p-4 border-b border-white/20 drag-region">
        <div className="flex items-center gap-3">
          <Button
            size="sm"
            onClick={() => navigate('/')}
            icon={
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
            }
          >
            返回
          </Button>
          <div>
            <h1 className="text-lg font-semibold text-white">设置</h1>
            <p className="text-xs text-white/60">配置您的语音助手</p>
          </div>
        </div>
        
        <div className="text-xs text-white/40">
          版本 1.0.0
        </div>
      </div>

      {/* 主内容区域 */}
      <div className="flex-1 overflow-hidden no-drag-region">
        <div className="h-full overflow-y-auto p-4">
          <Tabs 
            value={activeTab} 
            onValueChange={setActiveTab}
            defaultValue="mcp" 
            className="w-full"
          >
            <TabsList className="grid w-full grid-cols-3 mb-6">
              <TabsTrigger value="mcp">MCP 管理</TabsTrigger>
              <TabsTrigger value="provider">模型供应商</TabsTrigger>
              <TabsTrigger value="about">关于</TabsTrigger>
            </TabsList>

            <TabsContent value="mcp">
              <McpManager />
            </TabsContent>

            <TabsContent value="provider">
              <ProviderManager />
            </TabsContent>

            <TabsContent value="about">
              <AboutPage />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  )
}
