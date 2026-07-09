import {
  ExecutionContext,
  NestInterceptor,
  CallHandler,
  Injectable,
  Logger,
} from '@nestjs/common';
import { Observable, tap } from 'rxjs';
//#endregion

@Injectable()
export class LoggerInterceptor implements NestInterceptor {
  private readonly logger = new Logger('HTTP');

  intercept<T>(
    context: ExecutionContext,
    next: CallHandler<T>,
  ): Observable<T> | Promise<Observable<T>> {
    const request = context.switchToHttp().getRequest();
    const response = context.switchToHttp().getResponse();
    const method = request.method;
    const url = request.url;
    const now = Date.now();

    return next.handle().pipe(
      tap(() => {
        const delay = Date.now() - now;
        const statusCode = response.statusCode;
        this.logger.log(
          `[${method}] ${url} - Status: ${statusCode} - Time: ${delay}ms`,
        );
      }),
    );
  }
}
