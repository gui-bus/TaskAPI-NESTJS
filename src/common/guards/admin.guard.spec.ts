import { ExecutionContext } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { AuthAdminGuard } from './admin.guard';

describe('AuthAdminGuard', () => {
  let guard: AuthAdminGuard;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [AuthAdminGuard],
    }).compile();

    guard = module.get<AuthAdminGuard>(AuthAdminGuard);
  });

  it('should be defined', () => {
    expect(guard).toBeDefined();
  });

  const createMockContext = (requestUsers?: any): ExecutionContext => {
    const request = {
      users: requestUsers,
    } as any;

    return {
      switchToHttp: () => ({
        getRequest: () => request,
      }),
    } as unknown as ExecutionContext;
  };

  it('should return true if the request users role is admin', () => {
    const context = createMockContext({ role: 'admin' });

    const result = guard.canActivate(context);

    expect(result).toBe(true);
  });

  it('should return false if the request users role is not admin', () => {
    const context = createMockContext({ role: 'regular' });

    const result = guard.canActivate(context);

    expect(result).toBe(false);
  });

  it('should return false if request users object is missing', () => {
    const context = createMockContext(undefined);

    const result = guard.canActivate(context);

    expect(result).toBe(false);
  });
});
