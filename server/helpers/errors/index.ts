interface ServerErrorTypes {
  NOT_IMPLEMENTED: never
  INVALID_INPUT: never
  UNAUTHORIZED: never
  UNKNOWN_ERROR: never
  NOT_FOUND: never
}

export type ServerErrorType = keyof ServerErrorTypes

export class ServerError extends Error {
  public readonly type: ServerErrorType
  constructor(type: ServerErrorType) {
    super(type)
    this.type = type
  }

  static is(error: unknown): error is ServerError {
    return error instanceof ServerError
  }
}
