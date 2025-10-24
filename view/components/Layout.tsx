import React, { useEffect } from 'react'
import { Outlet, useNavigate } from 'react-router-dom'

function Layout() {
  const navigate = useNavigate()

  useEffect(() => {
    // 监听主进程的导航事件
    const handleNavigate = (route: string) => {
      // 解析路由和查询参数
      if (route.includes('?tab=about')) {
        navigate('/setting?tab=about')
      } else {
        navigate(route)
      }
    }

    if (window.electronAPI) {
      window.electronAPI.onNavigate(handleNavigate)

      // 清理函数
      return () => {
        window.electronAPI.removeNavigateListener()
      }
    }
  }, [navigate])

  return (
    <div className="h-screen w-full bg-transparent drag-region">
      {/* 主内容区域 - 取消拖拽以允许交互 */}
      <div className="h-full w-full no-drag-region">
        <Outlet />
      </div>
    </div>
  )
}

export default Layout
