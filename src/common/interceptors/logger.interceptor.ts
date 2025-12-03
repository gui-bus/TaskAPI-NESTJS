//#region Imports
import {
  ExecutionContext,
  NestInterceptor,
  CallHandler,
  Injectable,
} from '@nestjs/common';
import { Observable, tap } from 'rxjs';
//#endregion

@Injectable()
export class LoggerInterceptor implements NestInterceptor {
  intercept<T>(
    context: ExecutionContext,
    next: CallHandler<T>,
  ): Observable<T> | Promise<Observable<T>> {
    const request = context.switchToHttp().getRequest();
    const method = request.method;
    const url = request.url;
    const now = Date.now();

    console.log(`[REQUEST] ${method} ${url} ${Date.now() - now}ms`);

    return next
      .handle()
      .pipe(
        tap(() =>
          console.log(`[RESPONSE] ${method} ${url} ${Date.now() - now}ms`),
        ),
      );
  }
}
