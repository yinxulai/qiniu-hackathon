import React, { useState } from 'react'
import { Card, Button, TextInput, Switch, Modal } from '../../../components/ui'

interface McpServer {
  id: string
  name: string
  command: string
  args: string[]
  env?: Record<string, string>
  enabled: boolean
  status: 'connected' | 'disconnected' | 'error'
}

export function McpManager() {
  const [servers, setServers] = useState<McpServer[]>([
    {
      id: '1',
      name: 'PostgreSQL MCP',
      command: 'uvx',
      args: ['mcp-server-postgres', '--connection-string', 'postgresql://localhost/mydb'],
      enabled: true,
      status: 'connected'
    },
    {
      id: '2', 
      name: 'File System MCP',
      command: 'npx',
      args: ['-y', '@modelcontextprotocol/server-filesystem', '/path/to/allowed/files'],
      enabled: false,
      status: 'disconnected'
    }
  ])

  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [editingServer, setEditingServer] = useState<McpServer | null>(null)
  const [newServer, setNewServer] = useState({
    name: '',
    command: '',
    args: '',
    env: ''
  })

  const handleToggleServer = (id: string) => {
    setServers(servers.map(server => 
      server.id === id 
        ? { ...server, enabled: !server.enabled, status: server.enabled ? 'disconnected' : 'connected' }
        : server
    ))
  }

  const handleDeleteServer = (id: string) => {
    setServers(servers.filter(server => server.id !== id))
  }

  const handleAddServer = () => {
    if (!newServer.name || !newServer.command) return

    const server: McpServer = {
      id: Date.now().toString(),
      name: newServer.name,
      command: newServer.command,
      args: newServer.args ? newServer.args.split(' ') : [],
      env: newServer.env ? JSON.parse(newServer.env) : undefined,
      enabled: false,
      status: 'disconnected'
    }

    setServers([...servers, server])
    setNewServer({ name: '', command: '', args: '', env: '' })
    setIsAddModalOpen(false)
  }

  const handleEditServer = (server: McpServer) => {
    setEditingServer(server)
    setNewServer({
      name: server.name,
      command: server.command,
      args: server.args.join(' '),
      env: server.env ? JSON.stringify(server.env, null, 2) : ''
    })
    setIsAddModalOpen(true)
  }

  const handleUpdateServer = () => {
    if (!editingServer || !newServer.name || !newServer.command) return

    const updatedServer: McpServer = {
      ...editingServer,
      name: newServer.name,
      command: newServer.command,
      args: newServer.args ? newServer.args.split(' ') : [],
      env: newServer.env ? JSON.parse(newServer.env) : undefined
    }

    setServers(servers.map(server => 
      server.id === editingServer.id ? updatedServer : server
    ))
    setNewServer({ name: '', command: '', args: '', env: '' })
    setIsAddModalOpen(false)
    setEditingServer(null)
  }

  const getStatusColor = (status: McpServer['status']) => {
    switch (status) {
      case 'connected': return 'text-green-400'
      case 'disconnected': return 'text-gray-400'
      case 'error': return 'text-red-400'
      default: return 'text-gray-400'
    }
  }

  const getStatusText = (status: McpServer['status']) => {
    switch (status) {
      case 'connected': return '已连接'
      case 'disconnected': return '未连接'
      case 'error': return '错误'
      default: return '未知'
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-medium text-white">MCP 服务器管理</h3>
          <p className="text-sm text-white/60 mt-1">
            管理 Model Context Protocol 服务器连接
          </p>
        </div>
        <Button
          variant="primary"
          onClick={() => {
            setEditingServer(null)
            setNewServer({ name: '', command: '', args: '', env: '' })
            setIsAddModalOpen(true)
          }}
          icon={
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
          }
        >
          添加服务器
        </Button>
      </div>

      <div className="space-y-3">
        {servers.map((server) => (
          <Card key={server.id} className="p-4">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-3">
                  <h4 className="font-medium text-white">{server.name}</h4>
                  <span className={`text-xs ${getStatusColor(server.status)}`}>
                    {getStatusText(server.status)}
                  </span>
                </div>
                <div className="mt-2 text-sm text-white/60 space-y-1">
                  <div><span className="text-white/40">命令:</span> {server.command}</div>
                  <div><span className="text-white/40">参数:</span> {server.args.join(' ')}</div>
                  {server.env && (
                    <div><span className="text-white/40">环境变量:</span> {Object.keys(server.env).length} 个</div>
                  )}
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <Switch
                  checked={server.enabled}
                  onChange={() => handleToggleServer(server.id)}
                />
                <Button
                  size="sm"
                  onClick={() => handleEditServer(server)}
                  icon={
                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                  }
                />
                <Button
                  size="sm"
                  variant="danger"
                  onClick={() => handleDeleteServer(server.id)}
                  icon={
                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  }
                />
              </div>
            </div>
          </Card>
        ))}

        {servers.length === 0 && (
          <Card className="p-8 text-center">
            <div className="text-white/40">
              <svg className="w-12 h-12 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <p className="text-sm">暂无 MCP 服务器</p>
              <p className="text-xs mt-1">点击上方按钮添加新的服务器</p>
            </div>
          </Card>
        )}
      </div>

      {/* 添加/编辑服务器模态框 */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => {
          setIsAddModalOpen(false)
          setEditingServer(null)
        }}
        title={editingServer ? '编辑 MCP 服务器' : '添加 MCP 服务器'}
        className="max-w-lg"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-white mb-2">
              服务器名称
            </label>
            <TextInput
              value={newServer.name}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewServer({ ...newServer, name: e.target.value })}
              placeholder="例如: PostgreSQL MCP"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-white mb-2">
              命令
            </label>
            <TextInput
              value={newServer.command}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewServer({ ...newServer, command: e.target.value })}
              placeholder="例如: uvx 或 npx"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-white mb-2">
              参数
            </label>
            <TextInput
              value={newServer.args}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewServer({ ...newServer, args: e.target.value })}
              placeholder="例如: mcp-server-postgres --connection-string postgresql://..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-white mb-2">
              环境变量 (JSON 格式，可选)
            </label>
            <textarea
              className="w-full px-3 py-2 bg-black/50 border border-white/20 rounded-lg text-white text-sm min-h-20 no-drag-region placeholder-white/50"
              value={newServer.env}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setNewServer({ ...newServer, env: e.target.value })}
              placeholder='{"DATABASE_URL": "postgresql://..."}'
            />
          </div>

          <div className="flex gap-2 pt-4">
            <Button
              variant="primary"
              onClick={editingServer ? handleUpdateServer : handleAddServer}
              className="flex-1"
            >
              {editingServer ? '更新' : '添加'}
            </Button>
            <Button
              onClick={() => {
                setIsAddModalOpen(false)
                setEditingServer(null)
              }}
              className="flex-1"
            >
              取消
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
