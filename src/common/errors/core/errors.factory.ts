import { AppError } from './appError';
import { ErrorCodes } from '../messages/tasks.errorCodes';

export const throwError = (errorCode: keyof typeof ErrorCodes) => {
  throw new AppError(ErrorCodes[errorCode]);
};
