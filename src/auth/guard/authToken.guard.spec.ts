import { ExecutionContext } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { AuthTokenGuard } from './authToken.guard';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from 'src/prisma/prisma.service';
import jwtConfig from '../config/jwt.config';
import { REQUEST_TOKEN_PAYLOAD_NAME } from '../common/auth.constants';

describe('AuthTokenGuard', () => {
  let guard: AuthTokenGuard;
  let jwtService: JwtService;
  let prismaService: PrismaService;

  const mockJwtConfig = {
    secret: 'mock-secret',
  };

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthTokenGuard,
        {
          provide: JwtService,
          useValue: {
            verifyAsync: jest.fn(),
          },
        },
        {
          provide: PrismaService,
          useValue: {
            user: {
              findFirst: jest.fn(),
            },
          },
        },
        {
          provide: jwtConfig.KEY,
          useValue: mockJwtConfig,
        },
      ],
    }).compile();

    guard = module.get<AuthTokenGuard>(AuthTokenGuard);
    jwtService = module.get<JwtService>(JwtService);
    prismaService = module.get<PrismaService>(PrismaService);
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(guard).toBeDefined();
  });

  const createMockContext = (
    authorizationHeader?: string,
  ): ExecutionContext => {
    const request = {
      headers: {
        authorization: authorizationHeader,
      },
    } as any;

    return {
      switchToHttp: () => ({
        getRequest: () => request,
      }),
    } as unknown as ExecutionContext;
  };

  it('should return true when a valid token is provided and user is active', async () => {
    const context = createMockContext('Bearer VALID_TOKEN');
    const mockPayload = { sub: 1, email: 'john@example.com' };

    const verifySpy = jest
      .spyOn(jwtService, 'verifyAsync')
      .mockResolvedValue(mockPayload);
    const findFirstSpy = jest
      .spyOn(prismaService.user, 'findFirst')
      .mockResolvedValue({ id: 1, active: true } as any);

    const result = await guard.canActivate(context);

    expect(result).toBe(true);
    expect(verifySpy).toHaveBeenCalledWith('VALID_TOKEN', mockJwtConfig);
    expect(findFirstSpy).toHaveBeenCalledWith({
      where: { id: 1, active: true },
    });
    expect(
      context.switchToHttp().getRequest()[REQUEST_TOKEN_PAYLOAD_NAME],
    ).toEqual(mockPayload);
  });

  it('should throw INVALID_TOKEN when authorization header is missing', async () => {
    const context = createMockContext(undefined);

    await expect(guard.canActivate(context)).rejects.toThrow(
      'Token inválido ou não encontrado.',
    );
  });

  it('should throw UNAUTHORIZED when verification fails', async () => {
    const context = createMockContext('Bearer INVALID_TOKEN');

    const verifySpy = jest
      .spyOn(jwtService, 'verifyAsync')
      .mockRejectedValue(new Error('JWT Error'));

    await expect(guard.canActivate(context)).rejects.toThrow(
      'Acesso não autorizado.',
    );
    expect(verifySpy).toHaveBeenCalled();
  });

  it('should throw UNAUTHORIZED when user is not active or found', async () => {
    const context = createMockContext('Bearer VALID_TOKEN');
    const mockPayload = { sub: 1, email: 'john@example.com' };

    jest.spyOn(jwtService, 'verifyAsync').mockResolvedValue(mockPayload);
    const findFirstSpy = jest
      .spyOn(prismaService.user, 'findFirst')
      .mockResolvedValue(null);

    await expect(guard.canActivate(context)).rejects.toThrow(
      'Acesso não autorizado.',
    );
    expect(findFirstSpy).toHaveBeenCalled();
  });
});
