import Store from 'electron-store'
import { v4 as uuidv4 } from 'uuid'
import { McpServer, McpServerSchema } from './schema'
import { UserError } from '@taicode/common-base'

const store = new Store<{ servers: McpServer[] }>({
  name: 'mcp-servers',
  defaults: { servers: [] },
})

export function createMcpServerService() {
  function listMcp(): McpServer[] {
    const data = store.get('servers', [])
    return data.map(server => McpServerSchema.parse(server)) // 验证数据
  }

  function addMcp(server: Omit<McpServer, 'id'>): McpServer {
    const servers = listMcp()
    const newServer: McpServer = {
      ...server,
      id: uuidv4(),
    }
    servers.push(newServer)
    store.set('servers', servers)
    return newServer
  }

  function updateMcp(id: string, updates: {
    name?: string | undefined
    transport?: 'stdio' | 'sse' | undefined
    enabled?: boolean | undefined
    config?: McpServer['config'] | undefined
  }): McpServer {
    const servers = listMcp()
    const index = servers.findIndex(s => s.id === id)
    if (index === -1) {
      throw new UserError('MCP_SERVER_NOT_FOUND', 'MCP server not found')
    }

    const current = servers[index]!
    const updated: McpServer = {
      id: current.id,
      name: updates.name ?? current.name,
      transport: updates.transport ?? current.transport,
      enabled: updates.enabled ?? current.enabled,
      config: updates.config ?? current.config,
    }

    servers[index] = updated
    store.set('servers', servers)
    return updated
  }

  function enableMcp(id: string): boolean {
    return updateMcp(id, { enabled: true }) !== null
  }

  function disableMcp(id: string): boolean {
    return updateMcp(id, { enabled: false }) !== null
  }

  function deleteMcp(id: string): boolean {
    const servers = listMcp()
    const filtered = servers.filter(s => s.id !== id)
    if (filtered.length === servers.length) return false
    store.set('servers', filtered)
    return true
  }

  function listEnabledMcp(): McpServer[] {
    return listMcp().filter(s => s.enabled)
  }

  return {
    listMcp,
    addMcp,
    updateMcp,
    enableMcp,
    disableMcp,
    deleteMcp,
    listEnabledMcp,
  }
}
