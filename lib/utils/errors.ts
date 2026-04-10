export class AppError extends Error {
  public readonly code: string;
  public readonly status: number;
  public readonly details: Record<string, unknown> | undefined;

  constructor(
    code: string,
    message: string,
    status = 400,
    details?: Record<string, unknown>,
  ) {
    super(message);
    this.name = "AppError";
    this.code = code;
    this.status = status;
    this.details = details;
  }
}

export function isAppError(err: unknown): err is AppError {
  return err instanceof AppError;
}

export function errorResponse(err: unknown): {
  error: { code: string; message: string };
  status: number;
} {
  if (isAppError(err)) {
    return {
      error: { code: err.code, message: err.message },
      status: err.status,
    };
  }
  if (err instanceof Error) {
    return {
      error: { code: "internal_error", message: err.message },
      status: 500,
    };
  }
  return {
    error: { code: "internal_error", message: "Unknown error" },
    status: 500,
  };
}

export function assert(
  condition: unknown,
  code: string,
  message: string,
  status = 400,
): asserts condition {
  if (!condition) {
    throw new AppError(code, message, status);
  }
}
