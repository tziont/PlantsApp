import { NextResponse } from "next/server";
import mongoose from "mongoose";

/**
 * The closed set from SPEC 21, plus `INTERNAL_ERROR`. Route handlers must not
 * invent codes.
 *
 * `INTERNAL_ERROR` is the one addition: SPEC 21 has no code for a fault that is
 * neither the caller's nor a named dependency's, and reporting those as
 * `DATABASE_ERROR` would point debugging at the wrong layer.
 */
export type ApiErrorCode =
  | "UNAUTHORIZED"
  | "FORBIDDEN"
  | "VALIDATION_ERROR"
  | "CONTROLLER_NOT_FOUND"
  | "PLANT_NOT_FOUND"
  | "AI_SERVICE_ERROR"
  | "SENSOR_ERROR"
  | "DATABASE_ERROR"
  | "INTERNAL_ERROR";

const ERROR_DEFAULTS: Record<ApiErrorCode, { status: number; message: string }> =
  {
    UNAUTHORIZED: { status: 401, message: "You must be signed in." },
    FORBIDDEN: { status: 403, message: "You do not have access to this." },
    VALIDATION_ERROR: { status: 400, message: "The request was invalid." },
    CONTROLLER_NOT_FOUND: { status: 404, message: "Controller not found" },
    PLANT_NOT_FOUND: { status: 404, message: "Plant information not found" },
    // 502: the failure is in a dependency we called, not in this request.
    AI_SERVICE_ERROR: {
      status: 502,
      message: "Plant information is unavailable right now.",
    },
    SENSOR_ERROR: {
      status: 502,
      message: "The sensor could not be read right now.",
    },
    DATABASE_ERROR: { status: 500, message: "Something went wrong." },
    INTERNAL_ERROR: { status: 500, message: "Something went wrong." },
  };

/**
 * Thrown anywhere below a route handler; mapped to a response by
 * `toErrorResponse`. Services throw these instead of returning error shapes so
 * the happy path stays free of error plumbing.
 */
export class ApiError extends Error {
  /** Branded rather than relying on `instanceof`, which breaks across HMR. */
  readonly isApiError = true as const;

  constructor(
    readonly code: ApiErrorCode,
    message?: string,
  ) {
    super(message ?? ERROR_DEFAULTS[code].message);
    this.name = "ApiError";
  }
}

function isApiError(value: unknown): value is ApiError {
  return (
    typeof value === "object" &&
    value !== null &&
    (value as { isApiError?: unknown }).isApiError === true
  );
}

/** `{ error: { code, message } }` — the only error shape the API returns. */
export function errorResponse(code: ApiErrorCode, message?: string) {
  const { status, message: fallback } = ERROR_DEFAULTS[code];
  return NextResponse.json(
    { error: { code, message: message ?? fallback } },
    { status },
  );
}

/**
 * The single `catch` for a route handler.
 *
 * Anything unrecognised becomes a generic 500: raw driver and provider messages
 * can name collections, hosts or prompts, so they are logged and not returned
 * (SPEC 21, SPEC 22).
 */
export function toErrorResponse(error: unknown) {
  if (isApiError(error)) return errorResponse(error.code, error.message);

  if (error instanceof mongoose.Error.ValidationError) {
    return errorResponse("VALIDATION_ERROR");
  }

  // A CastError means the caller sent something unusable (a malformed id in the
  // path, a non-numeric moisture level), so it is a 400, not a server fault.
  if (error instanceof mongoose.Error.CastError) {
    return errorResponse("VALIDATION_ERROR");
  }

  // Duplicate key — a uniqueness rule the caller broke, not a server fault.
  if ((error as { code?: unknown } | null)?.code === 11000) {
    return errorResponse("VALIDATION_ERROR", "That value is already in use.");
  }

  if (
    error instanceof mongoose.Error ||
    (error as { name?: unknown } | null)?.name === "MongoServerError"
  ) {
    console.error("[api] database error", error);
    return errorResponse("DATABASE_ERROR");
  }

  console.error("[api] unhandled error", error);
  return errorResponse("INTERNAL_ERROR");
}
