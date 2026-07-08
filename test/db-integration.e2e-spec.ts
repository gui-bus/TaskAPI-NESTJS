// Set test environment database URL before importing AppModule
process.env.DATABASE_URL = 'file:./test.db';

import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app/app.module';
import { PrismaService } from '../src/prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';
import { execSync } from 'child_process';
import * as path from 'path';
import * as fs from 'fs';

describe('Database E2E Integration (real db-integration)', () => {
  let app: INestApplication;
  let prismaService: PrismaService;
  let jwtService: JwtService;
  let token: string;
  let userId: number;

  beforeAll(async () => {
    // Synchronously push the schema to the test database
    try {
      execSync(
        'npx prisma db push --schema=prisma/schema.prisma --accept-data-loss',
        {
          stdio: 'inherit',
          env: {
            ...process.env,
            DATABASE_URL: 'file:./test.db',
            PRISMA_SKIP_ENV_REGISTRATION: '1',
          },
        },
      );
    } catch (error) {
      console.error('Failed to push schema to test database:', error);
    }

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true }));
    await app.init();

    prismaService = moduleFixture.get<PrismaService>(PrismaService);
    jwtService = moduleFixture.get<JwtService>(JwtService);
  });

  afterAll(async () => {
    await app.close();

    // Clean up physical SQLite database files
    const dbPath = path.resolve(__dirname, '../prisma/test.db');
    const filesToClean = [
      dbPath,
      `${dbPath}-journal`,
      `${dbPath}-wal`,
      `${dbPath}-shm`,
    ];

    filesToClean.forEach((file) => {
      if (fs.existsSync(file)) {
        try {
          fs.unlinkSync(file);
        } catch {
          // Ignore locks
        }
      }
    });
  });

  beforeEach(async () => {
    // Clear database tables to ensure test isolation
    await prismaService.task.deleteMany();
    await prismaService.user.deleteMany();

    // Create a mock user directly in the database
    const user = await prismaService.user.create({
      data: {
        firstName: 'Integration',
        lastName: 'User',
        email: 'integration@example.com',
        password: 'Password@123',
        active: true,
      },
    });

    userId = user.id;

    token = jwtService.sign(
      {
        sub: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
      },
      {
        audience: 'https://localhost:3000',
        issuer: 'https://localhost:3000',
      },
    );
  });

  describe('User Endpoints', () => {
    it('should fail to create a user with a duplicate email (Unique Constraint)', async () => {
      const payload = {
        firstName: 'Another',
        lastName: 'User',
        email: 'integration@example.com', // Duplicate email
        password: 'Password@123',
      };

      const response = await request(app.getHttpServer())
        .post('/users')
        .send(payload)
        .expect(409); // Conflict / Unique constraint failed

      expect(response.body.message).toBe('E-mail já cadastrado.');
    });

    it('should successfully create a new user with unique email', async () => {
      const payload = {
        firstName: 'Unique',
        lastName: 'User',
        email: 'unique@example.com',
        password: 'Password@123',
      };

      const response = await request(app.getHttpServer())
        .post('/users')
        .send(payload)
        .expect(201);

      expect(response.body.user.email).toBe('unique@example.com');

      const userInDb = await prismaService.user.findFirst({
        where: { email: 'unique@example.com' },
      });
      expect(userInDb).toBeDefined();
      expect(userInDb.firstName).toBe('Unique');
    });
  });

  describe('Task Endpoints', () => {
    it('should create and retrieve a task from the database', async () => {
      const createPayload = {
        name: 'Integration Task',
        description:
          'This is a description that has more than thirty characters.',
      };

      // 1. Create task via API
      const createResponse = await request(app.getHttpServer())
        .post('/tasks')
        .set('Authorization', `Bearer ${token}`)
        .send(createPayload)
        .expect(201);

      const taskId = createResponse.body.task.id;

      // 2. Fetch task via API
      const fetchResponse = await request(app.getHttpServer())
        .get(`/tasks/${taskId}`)
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(fetchResponse.body.name).toBe('Integration Task');

      // 3. Confirm task state in database
      const taskInDb = await prismaService.task.findFirst({
        where: { id: taskId },
      });
      expect(taskInDb).toBeDefined();
      expect(taskInDb.name).toBe('Integration Task');
      expect(taskInDb.userId).toBe(userId);
    });

    it('should soft delete a task in the database', async () => {
      // 1. Manually create task in database
      const task = await prismaService.task.create({
        data: {
          name: 'Task to Delete',
          description:
            'This is a description that has more than thirty characters.',
          userId: userId,
          completed: false,
        },
      });

      // 2. Send DELETE request
      await request(app.getHttpServer())
        .delete(`/tasks/${task.id}`)
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      // 3. Verify task is NOT returned via GET details API (soft-deleted)
      await request(app.getHttpServer())
        .get(`/tasks/${task.id}`)
        .set('Authorization', `Bearer ${token}`)
        .expect(404);

      // 4. Verify task still exists in physical database but with a deletedAt timestamp set
      const deletedTaskInDb = await prismaService.task.findFirst({
        where: { id: task.id },
      });
      expect(deletedTaskInDb).toBeDefined();
      expect(deletedTaskInDb.deletedAt).not.toBeNull();
    });
  });
});
