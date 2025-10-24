import React from 'react'
import { createHashRouter, RouterProvider } from 'react-router-dom'

import Layout from '../components/Layout'

const router = createHashRouter([
  {
    path: '/',
    element: <Layout />,
    children: [
      {
        index: true,
        element: <div>Home Page</div>,
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
