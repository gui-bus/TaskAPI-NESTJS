//#region Imports
import { AppError } from './appError';
import { ErrorCodes } from '../messages';
//#endregion

/**
 * Throws a standardized {@link AppError} based on a predefined error code.
 *
 * This helper centralizes the error-throwing process, ensuring that all errors
 * in the application follow a consistent structure defined in `ErrorCodes`.
 *
 * @param errorCode - A key referencing an entry inside `ErrorCodes`.
 *
 * @throws {AppError} Always throws an `AppError` containing the associated
 *          HTTP status, message, and internal code.
 *
 * @example
 * ```ts
 * if (!task) {
 *   throwError('TASK_NOT_FOUND');
 * }
 * ```
 *
 * @example
 * ```ts
 * // Forces a generic fallback error
 * throwError('DATABASE_ERROR');
 * ```
 */
export function throwError(errorCode: keyof typeof ErrorCodes): never {
  throw new AppError(ErrorCodes[errorCode]);
}
