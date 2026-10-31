/**
 * @file index.ts
 * @module lib/errors
 * @description Enterprise domain error hierarchy and HTTP error response formatting
 * for UtsavMate-AI. Provides strongly-typed operational errors with HTTP status codes,
 * machine-readable error codes, and structured context serialization.
 */

/**
 * Base application error for all domain, operational, and HTTP errors.
 */
export class AppError extends Error {
  public readonly statusCode: number;
  public readonly code: string;
  public readonly isOperational: boolean;
  public readonly details?: unknown;

  constructor(
    message: string,
    statusCode: number = 500,
    code: string = "INTERNAL_ERROR",
    isOperational: boolean = true,
    details?: unknown
  ) {
    super(message);
    this.name = this.constructor.name;
    this.statusCode = statusCode;
    this.code = code;
    this.isOperational = isOperational;
    this.details = details;

    // Restore prototype chain for accurate instanceof checks across transpilation targets
    Object.setPrototypeOf(this, new.target.prototype);

    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor);
    }
  }

  /**
   * Serialize error for structured logging or JSON response payloads.
   */
  public toJSON(): Record<string, unknown> {
    return {
      name: this.name,
      message: this.message,
      statusCode: this.statusCode,
      code: this.code,
      isOperational: this.isOperational,
      ...(this.details !== undefined ? { details: this.details } : {}),
    };
  }
}

/**
 * Thrown when client input fails schema validation, constraint checks, or payload formatting (HTTP 400).
 */
export class ValidationError extends AppError {
  constructor(message: string = "Validation failed", details?: unknown) {
    super(message, 400, "VALIDATION_ERROR", true, details);
  }
}

/**
 * Thrown when a requested resource (event, task, budget item, vendor) cannot be found (HTTP 404).
 */
export class NotFoundError extends AppError {
  constructor(resource: string = "Resource", identifier?: string, details?: unknown) {
    const message = identifier
      ? `${resource} with id '${identifier}' not found`
      : `${resource} not found`;
    super(message, 404, "NOT_FOUND", true, {
      resource,
      identifier,
      ...(details !== undefined ? { context: details } : {}),
    });
  }
}

/**
 * Thrown when persistence operations (filesystem write, JSON parsing, disk read) fail (HTTP 500).
 */
export class StorageError extends AppError {
  constructor(message: string = "Storage operation failed", details?: unknown) {
    super(message, 500, "STORAGE_ERROR", true, details);
  }
}

/**
 * Thrown when external AI generation or model inference fails, times out, or is throttled (HTTP 502/503).
 */
export class AiServiceError extends AppError {
  constructor(
    message: string = "AI service request failed",
    statusCode: number = 502,
    details?: unknown
  ) {
    super(message, statusCode, "AI_SERVICE_ERROR", true, details);
  }
}

/**
 * Type guard to verify whether an unknown thrown value is an AppError instance.
 */
export function isAppError(error: unknown): error is AppError {
  return error instanceof AppError;
}

/**
 * Standardized API response formatter for Next.js route handlers.
 * Translates unknown thrown errors into consistent HTTP status codes and response bodies.
 */
export function formatErrorResponse(error: unknown): {
  status: number;
  body: {
    success: false;
    error: string;
    code: string;
    details?: unknown;
  };
} {
  if (isAppError(error)) {
    return {
      status: error.statusCode,
      body: {
        success: false,
        error: error.message,
        code: error.code,
        ...(error.details !== undefined ? { details: error.details } : {}),
      },
    };
  }

  if (error instanceof Error) {
    return {
      status: 500,
      body: {
        success: false,
        error: error.message || "An unexpected internal server error occurred",
        code: "INTERNAL_SERVER_ERROR",
      },
    };
  }

  return {
    status: 500,
    body: {
      success: false,
      error: "An unexpected error occurred",
      code: "UNKNOWN_ERROR",
    },
  };
}
