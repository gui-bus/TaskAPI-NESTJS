import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app/app.module';
import { PrismaService } from '../src/prisma/prisma.service';
import { HashingServiceProtocol } from '../src/auth/hash/hashing.service';
import { JwtService } from '@nestjs/jwt';

describe('AuthController (e2e)', () => {
  let app: INestApplication;
  let prismaService: PrismaService;
  let hashingService: HashingServiceProtocol;
  let jwtService: JwtService;

  beforeAll(async () => {
    const mockPrismaService = {
      user: {
        findFirst: jest.fn(),
      },
    };

    const mockHashingService = {
      compare: jest.fn(),
    };

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(PrismaService)
      .useValue(mockPrismaService)
      .overrideProvider(HashingServiceProtocol)
      .useValue(mockHashingService)
      .compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true }));
    await app.init();

    prismaService = moduleFixture.get<PrismaService>(PrismaService);
    hashingService = moduleFixture.get<HashingServiceProtocol>(
      HashingServiceProtocol,
    );
    jwtService = moduleFixture.get<JwtService>(JwtService);
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /auth (signIn)', () => {
    it('should authenticate successfully with valid credentials', async () => {
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
        .mockResolvedValue(mockUser as any);
      const compareSpy = jest
        .spyOn(hashingService, 'compare')
        .mockResolvedValue(true);

      const response = await request(app.getHttpServer())
        .post('/auth')
        .send({ email: 'john@example.com', password: 'password123' })
        .expect(201);

      expect(findFirstSpy).toHaveBeenCalled();
      expect(compareSpy).toHaveBeenCalled();
      expect(response.body).toHaveProperty('token');
      expect(response.body.email).toBe('john@example.com');
    });

    it('should return 401 when user does not exist', async () => {
      const findFirstSpy = jest
        .spyOn(prismaService.user, 'findFirst')
        .mockResolvedValue(null);

      const response = await request(app.getHttpServer())
        .post('/auth')
        .send({ email: 'missing@example.com', password: 'password123' })
        .expect(401);

      expect(findFirstSpy).toHaveBeenCalled();
      expect(response.body.message).toBe('Credenciais inválidas.');
    });

    it('should return 400 when email is invalid', async () => {
      await request(app.getHttpServer())
        .post('/auth')
        .send({ email: 'notanemail', password: 'password123' })
        .expect(400);
    });
  });

  describe('POST /auth/logout', () => {
    it('should allow logout when authenticated', async () => {
      const token = jwtService.sign(
        {
          sub: 1,
          email: 'john@example.com',
          firstName: 'John',
          lastName: 'Doe',
        },
        {
          audience: 'https://localhost:3000',
          issuer: 'https://localhost:3000',
        },
      );

      const findFirstSpy = jest
        .spyOn(prismaService.user, 'findFirst')
        .mockResolvedValue({ id: 1, active: true } as any);

      const response = await request(app.getHttpServer())
        .post('/auth/logout')
        .set('Authorization', `Bearer ${token}`)
        .expect(201);

      expect(findFirstSpy).toHaveBeenCalled();
      expect(response.body.message).toContain('john@example.com');
    });

    it('should return 401 when no token is provided', async () => {
      await request(app.getHttpServer()).post('/auth/logout').expect(401);
    });
  });
});
