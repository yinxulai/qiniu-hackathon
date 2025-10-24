import os from 'node:os'
import process from 'node:process'
import { app, screen } from 'electron'

export interface SystemInfo {
  // 应用信息
  appName: string
  appVersion: string
  electronVersion: string
  chromeVersion: string
  nodeVersion: string
  v8Version: string

  // 系统信息
  platform: string
  arch: string
  hostname: string
  locale: string

  // 内存信息
  totalMemory: number
  freeMemory: number

  // CPU 信息
  cpus: {
    model: string
    cores: number
  }

  // 显示器信息
  displays: Array<{
    id: number
    bounds: { x: number; y: number; width: number; height: number }
    size: { width: number; height: number }
    scaleFactor: number
    primary: boolean
  }>

  // 路径信息
  paths: {
    home: string
    appData: string
    userData: string
    temp: string
    exe: string
    desktop: string
    documents: string
    downloads: string
    music: string
    pictures: string
    videos: string
    logs: string
  }
}

export interface SystemSymbol {
  pathSeparator: string
  lineEnding: string
  devNull: string
}

export function createSystemService() {
  function getSystemInfo(): SystemInfo {
    const cpus = os.cpus()
    const displays = screen.getAllDisplays().map(display => ({
      id: display.id,
      bounds: display.bounds,
      size: display.size,
      scaleFactor: display.scaleFactor,
      primary: display.id === screen.getPrimaryDisplay().id,
    }))

    return {
      // 应用信息
      appName: app.getName(),
      appVersion: app.getVersion(),
      electronVersion: process.versions.electron,
      chromeVersion: process.versions.chrome,
      nodeVersion: process.versions.node,
      v8Version: process.versions.v8,

      // 系统信息
      platform: process.platform,
      arch: process.arch,
      hostname: os.hostname(),
      locale: app.getLocale(),

      // 内存信息
      totalMemory: os.totalmem(),
      freeMemory: os.freemem(),

      // CPU 信息
      cpus: {
        model: cpus[0]?.model || 'Unknown',
        cores: cpus.length,
      },

      // 显示器信息
      displays,

      // 路径信息
      paths: {
        home: app.getPath('home'),
        appData: app.getPath('appData'),
        userData: app.getPath('userData'),
        temp: app.getPath('temp'),
        exe: app.getPath('exe'),
        desktop: app.getPath('desktop'),
        documents: app.getPath('documents'),
        downloads: app.getPath('downloads'),
        music: app.getPath('music'),
        pictures: app.getPath('pictures'),
        videos: app.getPath('videos'),
        logs: app.getPath('logs'),
      },
    }
  }

  /** 返回能代表当前运行平台的字符串，一般是系统+cpu架构 */
  function getRuntimeSymbol(): string {
    // 格式: <platform>-<arch>
    // 例如: linux-x64, darwin-arm64, win32-x64
    return `${process.platform}-${process.arch}`
  }

  return { getSystemInfo, getSystemSymbol: getRuntimeSymbol }
}
