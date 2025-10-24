import { UserErrorType, SystemErrorType } from '@taicode/common-base'

// 成功响应类型定义
interface Response<T = unknown> {
  data: T
  status: string
  message: string
}

export function createSuccessResponse<T>(data: T){
  return { status: 'SUCCESS' as const, data, message: 'ok' }
}

export function createErrorResponse(status: UserErrorType | SystemErrorType, message = ''): Response {
  return { status, message, data: null } as const
}
