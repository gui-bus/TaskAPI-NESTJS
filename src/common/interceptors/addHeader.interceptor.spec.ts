import { ExecutionContext, CallHandler } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { AddHeaderInterceptor } from './addHeader.interceptor';
import { of } from 'rxjs';

describe('AddHeaderInterceptor', () => {
  let interceptor: AddHeaderInterceptor;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [AddHeaderInterceptor],
    }).compile();

    interceptor = module.get<AddHeaderInterceptor>(AddHeaderInterceptor);
  });

  it('should be defined', () => {
    expect(interceptor).toBeDefined();
  });

  it('should add X-Custom header to the response and call next.handle()', async () => {
    const mockResponse = {
      setHeader: jest.fn(),
    };

    const mockContext = {
      switchToHttp: () => ({
        getResponse: () => mockResponse,
      }),
    } as unknown as ExecutionContext;

    const mockCallHandler = {
      handle: jest.fn().mockReturnValue(of('response data')),
    } as unknown as CallHandler;

    const handleSpy = jest.spyOn(mockCallHandler, 'handle');

    const result$ = await interceptor.intercept(mockContext, mockCallHandler);

    expect(mockResponse.setHeader).toHaveBeenCalledWith(
      'X-Custom',
      '870427799418ccdf7ef8876ebfb98cf7',
    );
    expect(handleSpy).toHaveBeenCalled();

    result$.subscribe((val) => {
      expect(val).toBe('response data');
    });
  });
});
