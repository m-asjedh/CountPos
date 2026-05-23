import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  message?: string;
}

function isApiResponse<T>(value: unknown): value is ApiResponse<T> {
  return (
    value !== null &&
    typeof value === 'object' &&
    'success' in value &&
    typeof (value as ApiResponse<T>).success === 'boolean'
  );
}

@Injectable()
export class ResponseInterceptor<T> implements NestInterceptor<
  T,
  ApiResponse<T>
> {
  intercept(
    _context: ExecutionContext,
    next: CallHandler<T | ApiResponse<T>>,
  ): Observable<ApiResponse<T>> {
    return next.handle().pipe(
      map((data: T | ApiResponse<T>): ApiResponse<T> => {
        if (isApiResponse<T>(data)) {
          return data;
        }
        return {
          success: true,
          data,
        };
      }),
    );
  }
}
