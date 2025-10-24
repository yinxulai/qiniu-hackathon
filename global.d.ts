import '@taicode/common-base'

declare module '@taicode/common-base' {
  interface UserErrorTypes {
    MCP_SERVER_NOT_FOUND: unknown
    INVALID_INPUT: never
    UNAUTHORIZED: never
    NOT_FOUND: never
  }

  interface SystemErrorTypes {
    UNKNOWN_ERROR: unknown
    NOT_IMPLEMENTED: unknown
  }
}
