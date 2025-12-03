//#region Imports
import { HttpException, HttpStatus } from '@nestjs/common';
//#endregion

//#region Interfaces
interface AppErrorParams {
  message: string;
  code: string;
  status: HttpStatus;
}
//#endregion

/**
 * Represents a standardized application error used across the entire backend.
 *
 * `AppError` extends NestJS's {@link HttpException}, enriching it with an
 * internal `code` that allows clients and services to perform more granular
 * error handling beyond HTTP status codes.
 *
 * @class
 * @extends HttpException
 *
 * @param params - Error configuration object.
 * @param params.message - Human-readable message describing the error.
 * @param params.code - Internal error identifier (e.g., `"TASK_NOT_FOUND"`).
 * @param params.status - HTTP status associated with the error.
 *
 * @example
 * ```ts
 * throw new AppError({
 *   message: 'Task not found',
 *   code: 'TASK_NOT_FOUND',
 *   status: HttpStatus.NOT_FOUND
 * });
 * ```
 *
 * @example
 * ```ts
 * throw new AppError({
 *   message: 'Database unavailable',
 *   code: 'DATABASE_ERROR',
 *   status: HttpStatus.INTERNAL_SERVER_ERROR
 * });
 * ```
 */
export class AppError extends HttpException {
  constructor(params: AppErrorParams) {
    super(
      {
        status: params.status,
        message: params.message,
        code: params.code,
      },
      params.status,
    );
  }
}
