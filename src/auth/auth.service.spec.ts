import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { PrismaService } from 'src/prisma/prisma.service';
import { HashingServiceProtocol } from './hash/hashing.service';
import { JwtService } from '@nestjs/jwt';
import jwtConfig from './config/jwt.config';
import { SignInDto } from './dto/signin.dto';
import { TokenPayloadDto } from './dto/tokenPayload.dto';

describe('AuthService', () => {
  let authService: AuthService;
  let prismaService: PrismaService;
  let hashingService: HashingServiceProtocol;
  let jwtService: JwtService;

  const mockJwtConfig = {
    secret: 'mock-secret-key',
    ttl: 3600,
    audience: 'mock-audience',
    issuer: 'mock-issuer',
  };

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: PrismaService,
          useValue: {
            user: {
              findFirst: jest.fn(),
            },
          },
        },
        {
          provide: HashingServiceProtocol,
          useValue: {
            compare: jest.fn(),
          },
        },
        {
          provide: JwtService,
          useValue: {
            signAsync: jest.fn(),
          },
        },
        {
          provide: jwtConfig.KEY,
          useValue: mockJwtConfig,
        },
      ],
    }).compile();

    authService = module.get<AuthService>(AuthService);
    prismaService = module.get<PrismaService>(PrismaService);
    hashingService = module.get<HashingServiceProtocol>(HashingServiceProtocol);
    jwtService = module.get<JwtService>(JwtService);
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should define auth service', () => {
    expect(authService).toBeDefined();
  });

  describe('autenticate', () => {
    it('should successfully authenticate user and return token', async () => {
      const signInDto: SignInDto = {
        email: 'john@example.com',
        password: 'password123',
      };

      const mockUser = {
        id: 1,
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com',
        password: 'hashedpassword123',
        active: true,
      };

      const findFirstSpy = jest
        .spyOn(prismaService.user, 'findFirst')
        .mockResolvedValue(mockUser);
      const compareSpy = jest
        .spyOn(hashingService, 'compare')
        .mockResolvedValue(true);
      const signAsyncSpy = jest
        .spyOn(jwtService, 'signAsync')
        .mockResolvedValue('MOCK_JWT_TOKEN');

      const result = await authService.autenticate(signInDto);

      expect(findFirstSpy).toHaveBeenCalledWith({
        where: { email: 'john@example.com', active: true },
      });
      expect(compareSpy).toHaveBeenCalledWith(
        'password123',
        'hashedpassword123',
      );
      expect(signAsyncSpy).toHaveBeenCalledWith(
        {
          sub: 1,
          email: 'john@example.com',
          firstName: 'John',
          lastName: 'Doe',
        },
        {
          secret: 'mock-secret-key',
          expiresIn: 3600,
          audience: 'mock-audience',
          issuer: 'mock-issuer',
        },
      );
      expect(result).toEqual({
        id: 1,
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com',
        avatar: undefined,
        token: 'MOCK_JWT_TOKEN',
      });
    });

    it('should throw INVALID_CREDENTIALS when user does not exist', async () => {
      const signInDto: SignInDto = {
        email: 'missing@example.com',
        password: 'password123',
      };

      jest.spyOn(prismaService.user, 'findFirst').mockResolvedValue(null);

      await expect(authService.autenticate(signInDto)).rejects.toThrow(
        'Credenciais inválidas.',
      );
    });

    it('should throw INVALID_CREDENTIALS when password comparison fails', async () => {
      const signInDto: SignInDto = {
        email: 'john@example.com',
        password: 'wrongpassword',
      };

      const mockUser = {
        id: 1,
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com',
        password: 'hashedpassword123',
        active: true,
      };

      jest.spyOn(prismaService.user, 'findFirst').mockResolvedValue(mockUser);
      jest.spyOn(hashingService, 'compare').mockResolvedValue(false);

      await expect(authService.autenticate(signInDto)).rejects.toThrow(
        'Credenciais inválidas.',
      );
    });
  });

  describe('logout', () => {
    it('should return a logout confirmation message', () => {
      const tokenPayload: TokenPayloadDto = {
        sub: 1,
        email: 'john@example.com',
        firstName: 'John',
        lastName: 'Doe',
        iat: 123456,
        exp: 123456,
        aud: 'aud',
        iss: 'iss',
      };

      const result = authService.logout(tokenPayload);

      expect(result).toEqual({
        message: 'Logout efetuado com sucesso para o usuário john@example.com',
      });
    });
  });
});
