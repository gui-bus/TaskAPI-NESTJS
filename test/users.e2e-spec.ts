import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app/app.module';
import { PrismaService } from '../src/prisma/prisma.service';
import { HashingServiceProtocol } from '../src/auth/hash/hashing.service';
import { JwtService } from '@nestjs/jwt';
import * as fs from 'node:fs/promises';

// Mock fs/promises to prevent unit tests from writing to the filesystem
jest.mock('node:fs/promises', () => ({
  writeFile: jest.fn(),
}));

describe('UsersController (e2e)', () => {
  let app: INestApplication;
  let prismaService: PrismaService;
  let hashingService: HashingServiceProtocol;
  let jwtService: JwtService;
  let token: string;

  beforeAll(async () => {
    const mockPrismaService = {
      user: {
        findMany: jest.fn(),
        count: jest.fn(),
        findFirst: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
      },
      task: {
        updateMany: jest.fn(),
      },
      $transaction: jest.fn(),
    };

    const mockHashingService = {
      hash: jest.fn(),
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

    token = jwtService.sign(
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
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /users', () => {
    it('should list all users paginated', async () => {
      const mockUsers = [
        {
          id: 1,
          firstName: 'John',
          lastName: 'Doe',
          email: 'john@example.com',
        },
      ];
      jest
        .spyOn(prismaService, '$transaction')
        .mockResolvedValue([1, mockUsers]);

      const response = await request(app.getHttpServer())
        .get('/users?limit=5&offset=0')
        .expect(200);

      expect(response.body.users).toEqual(mockUsers);
      expect(response.body.params.limit).toBe(5);
    });
  });

  describe('GET /users/:id', () => {
    it('should find user by ID successfully', async () => {
      const mockUser = {
        id: 1,
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com',
      };
      jest
        .spyOn(prismaService.user, 'findFirst')
        .mockResolvedValue(mockUser as any);

      const response = await request(app.getHttpServer())
        .get('/users/1')
        .expect(200);

      expect(response.body).toEqual(mockUser);
    });

    it('should return 404 if user does not exist', async () => {
      jest.spyOn(prismaService.user, 'findFirst').mockResolvedValue(null);

      const response = await request(app.getHttpServer())
        .get('/users/99')
        .expect(404);

      expect(response.body.message).toBe('Este usuário não foi encontrado.');
    });
  });

  describe('POST /users', () => {
    it('should create a user successfully', async () => {
      const payload = {
        firstName: 'John',
        lastName: 'Doe',
        email: 'john.doe@example.com',
        password: 'Password@123',
      };

      const mockUser = {
        id: 1,
        firstName: 'John',
        lastName: 'Doe',
        email: 'john.doe@example.com',
      };

      jest.spyOn(hashingService, 'hash').mockResolvedValue('hashedpassword123');
      jest
        .spyOn(prismaService.user, 'create')
        .mockResolvedValue(mockUser as any);

      const response = await request(app.getHttpServer())
        .post('/users')
        .send(payload)
        .expect(201);

      expect(response.body.user).toEqual(mockUser);
    });

    it('should return 400 when invalid email is sent', async () => {
      const payload = {
        firstName: 'John',
        lastName: 'Doe',
        email: 'invalid-email',
        password: 'password123',
      };

      await request(app.getHttpServer())
        .post('/users')
        .send(payload)
        .expect(400);
    });
  });

  describe('PATCH /users/:id', () => {
    it('should update user successfully when authorized', async () => {
      const payload = { firstName: 'Johnny' };
      const mockUser = {
        id: 1,
        firstName: 'John',
        email: 'john@example.com',
        active: true,
      };

      jest
        .spyOn(prismaService.user, 'findFirst')
        .mockResolvedValue(mockUser as any);
      jest
        .spyOn(prismaService.user, 'update')
        .mockResolvedValue({ ...mockUser, firstName: 'Johnny' } as any);

      const response = await request(app.getHttpServer())
        .patch('/users/1')
        .set('Authorization', `Bearer ${token}`)
        .send(payload)
        .expect(200);

      expect(response.body.user.firstName).toBe('Johnny');
    });

    it('should return 401 when updating someone else profile', async () => {
      const mockUser = {
        id: 2,
        firstName: 'Jane',
        email: 'jane@example.com',
        active: true,
      };

      jest
        .spyOn(prismaService.user, 'findFirst')
        .mockResolvedValue(mockUser as any);

      await request(app.getHttpServer())
        .patch('/users/2')
        .set('Authorization', `Bearer ${token}`)
        .send({ firstName: 'Johnny' })
        .expect(401);
    });
  });

  describe('DELETE /users/:id', () => {
    it('should soft delete user when authorized', async () => {
      const mockUser = {
        id: 1,
        firstName: 'John',
        email: 'john@example.com',
        active: true,
      };

      jest
        .spyOn(prismaService.user, 'findFirst')
        .mockResolvedValue(mockUser as any);
      jest
        .spyOn(prismaService, '$transaction')
        .mockResolvedValue([mockUser, { count: 1 }]);

      const response = await request(app.getHttpServer())
        .delete('/users/1')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(response.body.message).toBe('Usuário excluído com sucesso');
    });
  });

  describe('POST /users/upload (avatar)', () => {
    it('should upload avatar successfully when authorized', async () => {
      const mockUser = {
        id: 1,
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com',
        active: true,
      };

      jest
        .spyOn(prismaService.user, 'findFirst')
        .mockResolvedValue(mockUser as any);
      jest.spyOn(prismaService.user, 'update').mockResolvedValue({
        ...mockUser,
        avatar: 'avatar_John_Doe.webp',
      } as any);
      const response = await request(app.getHttpServer())
        .post('/users/upload')
        .set('Authorization', `Bearer ${token}`)
        .attach('file', 'test/test.png', {
          filename: 'avatar.png',
          contentType: 'image/png',
        })
        .expect(201);

      expect(fs.writeFile).toHaveBeenCalled();
      expect(response.body.message).toBe('Avatar atualizado com sucesso');
    });

    it('should return 422 if invalid file type is uploaded', async () => {
      const mockUser = {
        id: 1,
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com',
        active: true,
      };

      jest
        .spyOn(prismaService.user, 'findFirst')
        .mockResolvedValue(mockUser as any);

      await request(app.getHttpServer())
        .post('/users/upload')
        .set('Authorization', `Bearer ${token}`)
        .attach('file', Buffer.from('mock file data'), 'avatar.txt')
        .expect(422);
    });
  });
});
