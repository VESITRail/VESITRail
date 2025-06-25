export type Result<TData, TError = string> =
  | { readonly isSuccess: true; readonly data: TData; readonly error?: never }
  | {
      readonly data?: never;
      readonly error: TError;
      readonly isSuccess: false;
    };

/**
 * Success result constructor
 */
export const success = <TData>(data: TData): Result<TData, never> =>
  ({
    data,
    isSuccess: true,
  } as const);

/**
 * Error result constructor
 */
export const failure = <TError = string>(
  error: TError
): Result<never, TError> =>
  ({
    error,
    isSuccess: false,
  } as const);

/**
 * Type guard to check if result is successful
 */
export const isSuccess = <TData, TError>(
  result: Result<TData, TError>
): result is { readonly isSuccess: true; readonly data: TData } =>
  result.isSuccess;

/**
 * Type guard to check if result is a failure
 */
export const isFailure = <TData, TError>(
  result: Result<TData, TError>
): result is { readonly isSuccess: false; readonly error: TError } =>
  !result.isSuccess;

/**
 * Extract data from successful result or throw error
 * Use with caution - prefer explicit success/failure checks
 */
export const unwrap = <TData, TError>(result: Result<TData, TError>): TData => {
  if (isSuccess(result)) {
    return result.data;
  }
  throw new Error(`Failed to unwrap result: ${String(result.error)}`);
};

/**
 * Extract data from successful result or return default value
 */
export const unwrapOr = <TData, TError, TDefault>(
  result: Result<TData, TError>,
  defaultValue: TDefault
): TData | TDefault => {
  return isSuccess(result) ? result.data : defaultValue;
};

/**
 * Transform successful result data while preserving error
 */
export const map = <TData, TError, TMapped>(
  result: Result<TData, TError>,
  mapper: (data: TData) => TMapped
): Result<TMapped, TError> => {
  return isSuccess(result)
    ? success(mapper(result.data))
    : failure(result.error);
};

/**
 * Transform error while preserving successful data
 */
export const mapError = <TData, TError, TMappedError>(
  result: Result<TData, TError>,
  mapper: (error: TError) => TMappedError
): Result<TData, TMappedError> => {
  return isFailure(result)
    ? failure(mapper(result.error))
    : success(result.data);
};

/**
 * Chain operations that return Results (flatMap)
 */
export const chain = <TData, TError, TMapped>(
  result: Result<TData, TError>,
  mapper: (data: TData) => Result<TMapped, TError>
): Result<TMapped, TError> => {
  return isSuccess(result) ? mapper(result.data) : failure(result.error);
};

/**
 * Execute side effects based on result state
 */
export const match = <TData, TError, TReturn>(
  result: Result<TData, TError>,
  handlers: {
    onSuccess: (data: TData) => TReturn;
    onFailure: (error: TError) => TReturn;
  }
): TReturn => {
  return isSuccess(result)
    ? handlers.onSuccess(result.data)
    : handlers.onFailure(result.error);
};

/**
 * Async version of map for promise-based transformations
 */
export const mapAsync = async <TData, TError, TMapped>(
  result: Result<TData, TError>,
  mapper: (data: TData) => Promise<TMapped>
): Promise<Result<TMapped, TError>> => {
  if (isSuccess(result)) {
    try {
      const mapped = await mapper(result.data);
      return success(mapped);
    } catch (error) {
      return failure(
        error instanceof Error ? error.message : String(error)
      ) as Result<TMapped, TError>;
    }
  }
  return failure(result.error);
};

/**
 * Async version of chain for promise-based operations
 */
export const chainAsync = async <TData, TError, TMapped>(
  result: Result<TData, TError>,
  mapper: (data: TData) => Promise<Result<TMapped, TError>>
): Promise<Result<TMapped, TError>> => {
  return isSuccess(result) ? await mapper(result.data) : failure(result.error);
};

/**
 * Combine multiple results into a single result
 * Returns success only if all results are successful
 */
export const combine = <TResults extends readonly Result<any, any>[]>(
  results: TResults
): Result<
  {
    [K in keyof TResults]: TResults[K] extends Result<infer U, any> ? U : never;
  },
  TResults[number] extends Result<any, infer E> ? E : never
> => {
  const data: any[] = [];

  for (const result of results) {
    if (isFailure(result)) {
      return failure(result.error);
    }
    data.push(result.data);
  }

  return success(data as any);
};

/**
 * Wrap a function that might throw into a Result
 */
export const attempt = <TData, TArgs extends readonly any[]>(
  fn: (...args: TArgs) => TData,
  ...args: TArgs
): Result<TData, string> => {
  try {
    return success(fn(...args));
  } catch (error) {
    return failure(error instanceof Error ? error.message : String(error));
  }
};

/**
 * Async version of attempt
 */
export const attemptAsync = async <TData, TArgs extends readonly any[]>(
  fn: (...args: TArgs) => Promise<TData>,
  ...args: TArgs
): Promise<Result<TData, string>> => {
  try {
    const data = await fn(...args);
    return success(data);
  } catch (error) {
    return failure(error instanceof Error ? error.message : String(error));
  }
};

// Utility types for extracting types from Results
export type ResultData<T> = T extends Result<infer U, any> ? U : never;
export type ResultError<T> = T extends Result<any, infer E> ? E : never;

// Common error types for better type safety
export type DatabaseError = {
  readonly message: string;
  readonly code?: string;
  readonly type: "DATABASE_ERROR";
};

export type ValidationError = {
  readonly message: string;
  readonly field?: string;
  readonly type: "VALIDATION_ERROR";
};

export type AuthError = {
  readonly message: string;
  readonly type: "AUTH_ERROR";
  readonly code?: "UNAUTHORIZED" | "FORBIDDEN" | "EXPIRED";
};

export type NetworkError = {
  readonly message: string;
  readonly status?: number;
  readonly type: "NETWORK_ERROR";
};

export type AppError =
  | AuthError
  | NetworkError
  | DatabaseError
  | ValidationError;

// Error constructors
export const databaseError = (
  message: string,
  code?: string
): DatabaseError => ({
  code,
  message,
  type: "DATABASE_ERROR",
});

export const validationError = (
  message: string,
  field?: string
): ValidationError => ({
  field,
  message,
  type: "VALIDATION_ERROR",
});

export const authError = (
  message: string,
  code?: "UNAUTHORIZED" | "FORBIDDEN" | "EXPIRED"
): AuthError => ({
  code,
  message,
  type: "AUTH_ERROR",
});

export const networkError = (
  message: string,
  status?: number
): NetworkError => ({
  type: "NETWORK_ERROR",
  status,
  message,
});
