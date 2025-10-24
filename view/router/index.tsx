import React from 'react'
import { createHashRouter, RouterProvider } from 'react-router-dom'

import Layout from '../components/Layout'
import MainPage from '../pages/main'
import SettingPage from '../pages/setting'

const router = createHashRouter([
  {
    path: '/',
    element: <Layout />,
    children: [
      {
        index: true,
        element: <MainPage />,
      },
      {
        path: 'setting',
        element: <SettingPage />,
      },
      {
        path: 'mcp',
        element: <div>MCP Page</div>,
      },
      {
        path: 'provider',
        element: <div>Provider Page</div>,
      },
    ],
  },
])

function AppRouter() {
  return <RouterProvider router={router} />
}

export default AppRouter
