export type Result = { success: true } | { success: false; error: string };

export type ResultWithValue<T> =
  | { success: true; value: T }
  | { success: false; error: string };

export function OkResult(): Result; // No args → VoidResult
export function OkResult<T>(value: T): ResultWithValue<T>; // With value → Result<T>
export function OkResult<T>(value?: T): ResultWithValue<T> | Result {
  return value === undefined ? { success: true } : { success: true, value };
}

// Overloaded Err function (works for both)
export function ErrResult(error: string): Result;
export function ErrResult<T>(error: string): ResultWithValue<T>;
export function ErrResult<T>(error: string): ResultWithValue<T> | Result {
  return { success: false, error };
}
