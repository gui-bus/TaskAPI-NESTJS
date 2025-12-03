//#region Imports
import { Logger } from '@nestjs/common';
//#endregion

/**
 * Logs detailed information about an application error using NestJS Logger.
 *
 * This helper standardizes error logging across the application, ensuring
 * consistent output and improving debuggability.
 *
 * - If the value is an instance of `Error`, it logs both the message and stack trace.
 * - If it's any other type, it logs a generic message alongside the stringified value.
 *
 * @example
 * ```ts
 * try {
 *   await service.doSomething();
 * } catch (err) {
 *   logError(this.logger, err);
 *   throw new InternalServerErrorException();
 * }
 * ```
 *
 * @param logger - The NestJS logger instance responsible for emitting logs.
 * @param error - Any unknown error thrown within the application flow.
 */
export function logError(logger: Logger, error: unknown) {
  if (error instanceof Error) {
    logger.error(error.message, error.stack);
  } else {
    logger.error('Unknown error', String(error));
  }
}
