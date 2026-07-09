import { PrismaService } from 'src/prisma/prisma.service';
import { TasksService } from './tasks.service';
import { Test, TestingModule } from '@nestjs/testing';
import { CreateTaskDto } from './dto/createTask.dto';
import { UpdateTaskDto } from './dto/updateTask.dto';
import { TokenPayloadDto } from 'src/auth/dto/tokenPayload.dto';

describe('TasksService', () => {
  let tasksService: TasksService;
  let prismaService: PrismaService;

  const mockTokenPayload: TokenPayloadDto = {
    sub: 1,
    email: 'john@example.com',
    firstName: 'John',
    lastName: 'Doe',
    iat: 123456,
    exp: 123456,
    aud: 'aud',
    iss: 'iss',
  };

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TasksService,
        {
          provide: PrismaService,
          useValue: {
            $transaction: jest.fn(),
            task: {
              count: jest.fn(),
              findMany: jest.fn(),
              findFirst: jest.fn(),
              create: jest.fn(),
              update: jest.fn(),
            },
            user: {
              findFirst: jest.fn(),
            },
          },
        },
      ],
    }).compile();

    tasksService = module.get<TasksService>(TasksService);
    prismaService = module.get<PrismaService>(PrismaService);
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should define tasks service', () => {
    expect(tasksService).toBeDefined();
  });

  describe('listAllTasks', () => {
    it('should retrieve a paginated list of tasks successfully', async () => {
      const mockTasks = [
        {
          id: 1,
          name: 'Task 1',
          description: 'Desc',
          completed: false,
          userId: 1,
        },
      ];
      const count = 1;

      const transactionSpy = jest
        .spyOn(prismaService, '$transaction')
        .mockResolvedValue([count, mockTasks]);

      const result = await tasksService.listAllTasks({ limit: 10, offset: 0 });

      expect(transactionSpy).toHaveBeenCalled();
      expect(result.tasks).toEqual(mockTasks);
      expect(result.params.totalItems).toBe(1);
      expect(result.params.totalPages).toBe(1);
    });

    it('should throw DATABASE_ERROR when transaction fails', async () => {
      jest
        .spyOn(prismaService, '$transaction')
        .mockRejectedValue(new Error('DB error'));

      await expect(tasksService.listAllTasks()).rejects.toThrow(
        'Erro ao acessar o banco de dados.',
      );
    });
  });

  describe('findTaskById', () => {
    it('should retrieve task by ID successfully when authorized', async () => {
      const mockTask = {
        id: 1,
        name: 'Task 1',
        description: 'Desc',
        status: 'PENDING',
        userId: 1,
      };
      const findFirstSpy = jest
        .spyOn(prismaService.task, 'findFirst')
        .mockResolvedValue(mockTask as any);

      const result = await tasksService.findTaskById(1, mockTokenPayload);

      expect(findFirstSpy).toHaveBeenCalledWith({
        where: { id: 1, deletedAt: null },
        include: { categories: true },
      });
      expect(result).toEqual(mockTask);
    });

    it('should throw TASK_NOT_FOUND if task does not exist', async () => {
      jest.spyOn(prismaService.task, 'findFirst').mockResolvedValue(null);

      await expect(
        tasksService.findTaskById(99, mockTokenPayload),
      ).rejects.toThrow('Esta tarefa não foi encontrada.');
    });

    it('should throw UNAUTHORIZED if task belongs to another user', async () => {
      const mockTask = {
        id: 1,
        name: 'Task 1',
        description: 'Desc',
        status: 'PENDING',
        userId: 2,
      };
      jest
        .spyOn(prismaService.task, 'findFirst')
        .mockResolvedValue(mockTask as any);

      await expect(
        tasksService.findTaskById(1, mockTokenPayload),
      ).rejects.toThrow('Acesso não autorizado.');
    });
  });

  describe('createTask', () => {
    it('should create task successfully when user is found', async () => {
      const createTaskDto: CreateTaskDto = {
        name: 'New Task',
        description: 'New Description',
      };

      const mockUser = { id: 1, firstName: 'John' };
      const mockTask = {
        id: 1,
        name: 'New Task',
        description: 'New Description',
        status: 'PENDING',
        userId: 1,
      };

      jest
        .spyOn(prismaService.user, 'findFirst')
        .mockResolvedValue(mockUser as any);
      const createSpy = jest
        .spyOn(prismaService.task, 'create')
        .mockResolvedValue(mockTask as any);

      const result = await tasksService.createTask(
        createTaskDto,
        mockTokenPayload,
      );

      expect(createSpy).toHaveBeenCalledWith({
        data: {
          name: 'New Task',
          description: 'New Description',
          status: 'PENDING',
          userId: 1,
          categories: undefined,
        },
        include: {
          categories: true,
        },
      });
      expect(result.task).toEqual(mockTask);
    });

    it('should throw USER_NOT_FOUND if creator does not exist', async () => {
      const createTaskDto: CreateTaskDto = {
        name: 'New Task',
        description: 'New Description',
      };

      jest.spyOn(prismaService.user, 'findFirst').mockResolvedValue(null);

      await expect(
        tasksService.createTask(createTaskDto, mockTokenPayload),
      ).rejects.toThrow('Este usuário não foi encontrado.');
    });
  });

  describe('updateTask', () => {
    it('should update task successfully when authorized', async () => {
      const updateTaskDto: UpdateTaskDto = {
        name: 'Updated Task',
        status: 'COMPLETED',
      };

      const mockTask = {
        id: 1,
        name: 'Task 1',
        description: 'Desc',
        status: 'PENDING',
        userId: 1,
      };

      jest
        .spyOn(prismaService.task, 'findFirst')
        .mockResolvedValue(mockTask as any);
      const updateSpy = jest
        .spyOn(prismaService.task, 'update')
        .mockResolvedValue({
          ...mockTask,
          name: 'Updated Task',
          status: 'COMPLETED',
        } as any);

      const result = await tasksService.updateTask(
        1,
        updateTaskDto,
        mockTokenPayload,
      );

      expect(updateSpy).toHaveBeenCalledWith({
        where: { id: 1 },
        data: {
          name: 'Updated Task',
          description: undefined,
          status: 'COMPLETED',
          categories: undefined,
        },
        include: {
          categories: true,
        },
      });
      expect(result.task.name).toBe('Updated Task');
      expect(result.task.status).toBe('COMPLETED');
    });

    it('should throw UNAUTHORIZED if updating another user task', async () => {
      const mockTask = {
        id: 1,
        name: 'Task 1',
        description: 'Desc',
        status: 'PENDING',
        userId: 2,
      };
      jest
        .spyOn(prismaService.task, 'findFirst')
        .mockResolvedValue(mockTask as any);

      await expect(
        tasksService.updateTask(1, { name: 'Updated' }, mockTokenPayload),
      ).rejects.toThrow('Acesso não autorizado.');
    });
  });

  describe('deleteTask', () => {
    it('should soft delete task successfully when authorized', async () => {
      const mockTask = {
        id: 1,
        name: 'Task 1',
        description: 'Desc',
        status: 'PENDING',
        userId: 1,
      };

      jest
        .spyOn(prismaService.task, 'findFirst')
        .mockResolvedValue(mockTask as any);
      const updateSpy = jest
        .spyOn(prismaService.task, 'update')
        .mockResolvedValue({ ...mockTask, deletedAt: new Date() } as any);

      const result = await tasksService.deleteTask(1, mockTokenPayload);

      expect(updateSpy).toHaveBeenCalled();
      expect(result.message).toBe('Tarefa excluída com sucesso');
    });

    it('should throw UNAUTHORIZED if deleting another user task', async () => {
      const mockTask = {
        id: 1,
        name: 'Task 1',
        description: 'Desc',
        status: 'PENDING',
        userId: 2,
      };
      jest
        .spyOn(prismaService.task, 'findFirst')
        .mockResolvedValue(mockTask as any);

      await expect(
        tasksService.deleteTask(1, mockTokenPayload),
      ).rejects.toThrow('Acesso não autorizado.');
    });
  });
});
