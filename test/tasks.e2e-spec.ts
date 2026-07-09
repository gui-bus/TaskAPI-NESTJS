import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app/app.module';
import { PrismaService } from '../src/prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';

describe('TasksController (e2e)', () => {
  let app: INestApplication;
  let prismaService: PrismaService;
  let jwtService: JwtService;
  let token: string;

  beforeAll(async () => {
    const mockPrismaService = {
      task: {
        findMany: jest.fn(),
        count: jest.fn(),
        findFirst: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
      },
      user: {
        findFirst: jest.fn(),
      },
      $transaction: jest.fn(),
    };

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(PrismaService)
      .useValue(mockPrismaService)
      .compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true }));
    await app.init();

    prismaService = moduleFixture.get<PrismaService>(PrismaService);
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

  describe('GET /tasks', () => {
    it('should list all tasks paginated (public)', async () => {
      const mockTasks = [
        {
          id: 1,
          name: 'Task 1',
          description:
            'This is a description that has more than thirty characters.',
          status: 'PENDING',
          userId: 1,
        },
      ];

      jest
        .spyOn(prismaService, '$transaction')
        .mockResolvedValue([1, mockTasks]);

      const response = await request(app.getHttpServer())
        .get('/tasks?limit=10&offset=0')
        .expect(200);

      expect(response.body.tasks).toEqual(mockTasks);
      expect(response.body.params.totalItems).toBe(1);
    });
  });

  describe('GET /tasks/:id', () => {
    it('should find task by ID successfully when authorized', async () => {
      const mockTask = {
        id: 1,
        name: 'Task 1',
        description:
          'This is a description that has more than thirty characters.',
        status: 'PENDING',
        userId: 1,
      };

      jest
        .spyOn(prismaService.user, 'findFirst')
        .mockResolvedValue({ id: 1, active: true } as any);
      jest
        .spyOn(prismaService.task, 'findFirst')
        .mockResolvedValue(mockTask as any);

      const response = await request(app.getHttpServer())
        .get('/tasks/1')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(response.body).toEqual(mockTask);
    });

    it('should return 404 if task does not exist', async () => {
      jest
        .spyOn(prismaService.user, 'findFirst')
        .mockResolvedValue({ id: 1, active: true } as any);
      jest.spyOn(prismaService.task, 'findFirst').mockResolvedValue(null);

      const response = await request(app.getHttpServer())
        .get('/tasks/99')
        .set('Authorization', `Bearer ${token}`)
        .expect(404);

      expect(response.body.message).toBe('Esta tarefa não foi encontrada.');
    });

    it('should return 401 when viewing someone else task', async () => {
      const mockTask = {
        id: 1,
        name: 'Task 1',
        description:
          'This is a description that has more than thirty characters.',
        status: 'PENDING',
        userId: 2,
      };

      jest
        .spyOn(prismaService.user, 'findFirst')
        .mockResolvedValue({ id: 1, active: true } as any);
      jest
        .spyOn(prismaService.task, 'findFirst')
        .mockResolvedValue(mockTask as any);

      await request(app.getHttpServer())
        .get('/tasks/1')
        .set('Authorization', `Bearer ${token}`)
        .expect(401);
    });
  });

  describe('POST /tasks', () => {
    it('should create a task successfully', async () => {
      const payload = {
        name: 'New Task',
        description:
          'This is a description that has more than thirty characters.',
      };

      const mockTask = {
        id: 1,
        name: 'New Task',
        description:
          'This is a description that has more than thirty characters.',
        status: 'PENDING',
        userId: 1,
      };

      jest
        .spyOn(prismaService.user, 'findFirst')
        .mockResolvedValue({ id: 1, active: true } as any);
      jest
        .spyOn(prismaService.task, 'create')
        .mockResolvedValue(mockTask as any);

      const response = await request(app.getHttpServer())
        .post('/tasks')
        .set('Authorization', `Bearer ${token}`)
        .send(payload)
        .expect(201);

      expect(response.body.task).toEqual(mockTask);
    });

    it('should return 400 when name is empty', async () => {
      const payload = {
        name: '',
        description:
          'This is a description that has more than thirty characters.',
      };

      jest
        .spyOn(prismaService.user, 'findFirst')
        .mockResolvedValue({ id: 1, active: true } as any);

      await request(app.getHttpServer())
        .post('/tasks')
        .set('Authorization', `Bearer ${token}`)
        .send(payload)
        .expect(400);
    });
  });

  describe('PATCH /tasks/:id', () => {
    it('should update task successfully when authorized', async () => {
      const payload = { name: 'Updated Task', status: 'COMPLETED' };
      const mockTask = {
        id: 1,
        name: 'Task 1',
        description:
          'This is a description that has more than thirty characters.',
        status: 'PENDING',
        userId: 1,
      };

      jest
        .spyOn(prismaService.user, 'findFirst')
        .mockResolvedValue({ id: 1, active: true } as any);
      jest
        .spyOn(prismaService.task, 'findFirst')
        .mockResolvedValue(mockTask as any);
      jest
        .spyOn(prismaService.task, 'update')
        .mockResolvedValue({ ...mockTask, ...payload } as any);

      const response = await request(app.getHttpServer())
        .patch('/tasks/1')
        .set('Authorization', `Bearer ${token}`)
        .send(payload)
        .expect(200);

      expect(response.body.task.name).toBe('Updated Task');
      expect(response.body.task.status).toBe('COMPLETED');
    });
  });

  describe('DELETE /tasks/:id', () => {
    it('should soft delete task successfully when authorized', async () => {
      const mockTask = {
        id: 1,
        name: 'Task 1',
        description:
          'This is a description that has more than thirty characters.',
        status: 'PENDING',
        userId: 1,
      };

      jest
        .spyOn(prismaService.user, 'findFirst')
        .mockResolvedValue({ id: 1, active: true } as any);
      jest
        .spyOn(prismaService.task, 'findFirst')
        .mockResolvedValue(mockTask as any);
      jest
        .spyOn(prismaService.task, 'update')
        .mockResolvedValue({ ...mockTask, deletedAt: new Date() } as any);

      const response = await request(app.getHttpServer())
        .delete('/tasks/1')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(response.body.message).toBe('Tarefa excluída com sucesso');
    });
  });
});
