import { describe, it, expect } from "vitest";
import {
  AppError,
  ValidationError,
  NotFoundError,
  StorageError,
  AiServiceError,
  isAppError,
  formatErrorResponse,
} from "../src/lib/errors";

describe("Domain Error Hierarchy", () => {
  it("creates AppError with default and custom status codes and codes", () => {
    const errDefault = new AppError("Something went wrong");
    expect(errDefault.message).toBe("Something went wrong");
    expect(errDefault.statusCode).toBe(500);
    expect(errDefault.code).toBe("INTERNAL_ERROR");
    expect(errDefault.isOperational).toBe(true);
    expect(errDefault.name).toBe("AppError");

    const json = errDefault.toJSON();
    expect(json.statusCode).toBe(500);
    expect(json.code).toBe("INTERNAL_ERROR");

    const errCustom = new AppError("Forbidden action", 403, "FORBIDDEN", true, { reason: "admin_only" });
    expect(errCustom.statusCode).toBe(403);
    expect(errCustom.code).toBe("FORBIDDEN");
    expect(errCustom.details).toEqual({ reason: "admin_only" });
  });

  it("creates ValidationError with 400 status and details", () => {
    const valErr = new ValidationError("Invalid payload", { field: "budget" });
    expect(valErr.statusCode).toBe(400);
    expect(valErr.code).toBe("VALIDATION_ERROR");
    expect(valErr.message).toBe("Invalid payload");
    expect(valErr.details).toEqual({ field: "budget" });
    expect(isAppError(valErr)).toBe(true);
  });

  it("creates NotFoundError with 404 status and resource info", () => {
    const notFound = new NotFoundError("Event", "evt-404");
    expect(notFound.statusCode).toBe(404);
    expect(notFound.code).toBe("NOT_FOUND");
    expect(notFound.message).toContain("Event with id 'evt-404' not found");
    expect(isAppError(notFound)).toBe(true);

    const genericNotFound = new NotFoundError("Resource");
    expect(genericNotFound.message).toBe("Resource not found");
  });

  it("creates StorageError with 500 status", () => {
    const storageErr = new StorageError("Disk full", { path: "/tmp/data" });
    expect(storageErr.statusCode).toBe(500);
    expect(storageErr.code).toBe("STORAGE_ERROR");
    expect(storageErr.details).toEqual({ path: "/tmp/data" });
    expect(isAppError(storageErr)).toBe(true);
  });

  it("creates AiServiceError with customizable gateway status code", () => {
    const aiErr = new AiServiceError("Gemini timed out", 504, { timeoutMs: 10000 });
    expect(aiErr.statusCode).toBe(504);
    expect(aiErr.code).toBe("AI_SERVICE_ERROR");
    expect(aiErr.details).toEqual({ timeoutMs: 10000 });
    expect(isAppError(aiErr)).toBe(true);
  });

  it("correctly identifies AppError instances via isAppError", () => {
    expect(isAppError(new AppError("app error"))).toBe(true);
    expect(isAppError(new ValidationError())).toBe(true);
    expect(isAppError(new Error("standard error"))).toBe(false);
    expect(isAppError("string error")).toBe(false);
    expect(isAppError(null)).toBe(false);
    expect(isAppError(undefined)).toBe(false);
  });

  it("formats error responses correctly for AppError, Error, and unknown", () => {
    const appResponse = formatErrorResponse(new NotFoundError("Task", "tsk-1"));
    expect(appResponse.status).toBe(404);
    expect(appResponse.body.success).toBe(false);
    expect(appResponse.body.code).toBe("NOT_FOUND");
    expect(appResponse.body.error).toContain("tsk-1");

    const stdResponse = formatErrorResponse(new Error("Unexpected crash"));
    expect(stdResponse.status).toBe(500);
    expect(stdResponse.body.success).toBe(false);
    expect(stdResponse.body.code).toBe("INTERNAL_SERVER_ERROR");
    expect(stdResponse.body.error).toBe("Unexpected crash");

    const unknownResponse = formatErrorResponse("raw string failure");
    expect(unknownResponse.status).toBe(500);
    expect(unknownResponse.body.success).toBe(false);
    expect(unknownResponse.body.code).toBe("UNKNOWN_ERROR");
  });
});
