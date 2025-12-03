//#region Imports
import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Observable } from 'rxjs';
//#endregion

@Injectable()
export class AddHeaderInterceptor implements NestInterceptor {
  intercept<T>(
    context: ExecutionContext,
    next: CallHandler<any>,
  ): Observable<T> | Promise<Observable<T>> {
    const response = context.switchToHttp().getResponse();
    response.setHeader('X-Custom', '870427799418ccdf7ef8876ebfb98cf7');

    return next.handle();
  }
}
