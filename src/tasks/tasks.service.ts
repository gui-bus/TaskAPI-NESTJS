//#region Imports
import { Injectable, Logger } from '@nestjs/common';
import { throwError } from 'src/common/errors/core/errors.factory';
import { UpdateTaskDto } from './dto/updateTask.dto';
import { CreateTaskDto } from './dto/createTask.dto';
import { PrismaService } from 'src/prisma/prisma.service';
import { isPrismaError } from 'src/common/errors/helpers/isPrismaError';
import { logError } from 'src/common/errors/helpers/logError';
import { AppError } from 'src/common/errors/core/appError';
import { PaginationDto } from 'src/common/dto/pagination.dto';
import { TokenPayloadDto } from 'src/auth/dto/tokenPayload.dto';
//#endregion

@Injectable()
export class TasksService {
  //#region Setup
  private readonly logger = new Logger(TasksService.name);

  constructor(private prisma: PrismaService) {}
  //#endregion

  //#region Private Utilities
  /**
   * Retrieves an active (non-deleted) task by ID or throws an error if not found.
   *
   * @private
   * @async
   * @param {number} id - Unique identifier of the task.
   * @param {TokenPayloadDto} tokenPayload - The token payload of the authenticated user.
   * @returns {Promise<Task>} The located active task.
   *
   * @throws {AppError<'TASK_NOT_FOUND'>} If the task does not exist or is soft-deleted.
   * @throws {AppError<'UNAUTHORIZED'>} If the authenticated user does not own the task.
   *
   * @example
   * const task = await this.findActiveTaskOrThrow(3, tokenPayload);
   * console.log(task.name);
   */
  private async findActiveTaskOrThrow(
    id: number,
    tokenPayload: TokenPayloadDto,
  ) {
    const task = await this.prisma.task.findFirst({
      where: { id, deletedAt: null },
    });

    if (!task) throwError('TASK_NOT_FOUND');

    if (task.userId !== tokenPayload.sub) throwError('UNAUTHORIZED');
    return task;
  }
  //#endregion

  //#region Task Queries
  /**
   * Retrieves a paginated list of active (non-deleted) tasks.
   *
   * Executes a transactional query that returns both the total number of
   * available tasks and the paginated subset based on the provided
   * `limit` and `offset`. Tasks are ordered by creation date in descending order.
   *
   * @async
   * @param {PaginationDto} [paginationDto] - Optional pagination settings.
   * @param {number} [paginationDto.limit=10] - Maximum number of items to return.
   * @param {number} [paginationDto.offset=0] - Number of items to skip before starting the page.
   *
   * @returns {Promise<{
   *   tasks: Task[],
   *   params: {
   *     totalItems: number,
   *     totalPages: number,
   *     limit: number,
   *     offset: number
   *   }
   * }>} An object containing the paginated tasks and metadata.
   *
   * @example
   * // Retrieves the first page (10 items)
   * const response = await taskService.listAll({ limit: 10, offset: 0 });
   *
   * @example
   * // Retrieves the second page with a custom page size
   * const response = await taskService.listAll({ limit: 5, offset: 5 });
   *
   * @example
   * // Retrieves all items without providing any pagination configuration
   * const response = await taskService.listAll();
   *
   * @throws {AppError<'DATABASE_ERROR'>}
   * Thrown when an unexpected database failure occurs.
   */
  async listAllTasks(paginationDto?: PaginationDto) {
    const { limit = 10, offset = 0 } = paginationDto ?? {};

    try {
      const [totalItems, data] = await this.prisma.$transaction([
        this.prisma.task.count({
          where: { deletedAt: null },
        }),
        this.prisma.task.findMany({
          where: { deletedAt: null },
          take: limit,
          skip: offset,
          orderBy: { createdAt: 'desc' },
        }),
      ]);

      const totalPages = Math.ceil(totalItems / limit);

      return {
        tasks: data,
        params: {
          totalItems,
          totalPages,
          limit,
          offset,
        },
      };
    } catch (error) {
      logError(this.logger, error);
      throwError('DATABASE_ERROR');
    }
  }

  /**
   * Retrieves a single task based on its ID.
   *
   * @async
   * @param {number} id - Unique identifier of the task.
   * @param {TokenPayloadDto} tokenPayload - The token payload of the authenticated user.
   * @returns {Promise<Task>} The located task.
   *
   * @throws {AppError<'TASK_NOT_FOUND'>} If no task exists with the given ID.
   * @throws {AppError<'UNAUTHORIZED'>} If the user is not the owner of this task.
   * @throws {AppError<'DATABASE_ERROR'>} For unexpected database issues.
   *
   * @example
   * const task = await tasksService.findTaskById(1, tokenPayload);
   * console.log(task.name);
   */
  async findTaskById(id: number, tokenPayload: TokenPayloadDto) {
    try {
      return await this.findActiveTaskOrThrow(id, tokenPayload);
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }

      logError(this.logger, error);

      if (isPrismaError(error)) {
        throw error;
      }

      throwError('DATABASE_ERROR');
    }
  }

  /**
   * Creates a new task with the provided data.
   *
   * @async
   * @param {CreateTaskDto} createTaskDto - Payload containing name and description of the new task.
   * @param {TokenPayloadDto} tokenPayload - The token payload of the authenticated user.
   * @returns {Promise<{ message: string, task: Task }>} A success message and the newly created task.
   *
   * @throws {AppError<'USER_NOT_FOUND'>} If the task owner user does not exist.
   * @throws {AppError<'TASK_CREATE_FAILED'>} If the database fails to create the task.
   *
   * @example
   * const result = await tasksService.createTask({ name: "Fix bug", description: "Resolve login issue" }, tokenPayload);
   * console.log(result.task.id);
   */
  async createTask(
    createTaskDto: CreateTaskDto,
    tokenPayload: TokenPayloadDto,
  ) {
    try {
      const user = await this.prisma.user.findFirst({
        where: { id: tokenPayload.sub, deletedAt: null },
      });

      if (!user) throwError('USER_NOT_FOUND');

      const newTask = await this.prisma.task.create({
        data: {
          name: createTaskDto.name,
          description: createTaskDto.description,
          completed: false,
          userId: tokenPayload.sub,
        },
      });

      return {
        message: 'Tarefa criada com sucesso',
        task: newTask,
      };
    } catch (error) {
      logError(this.logger, error);

      if (error instanceof AppError) {
        throw error;
      }

      throwError('TASK_CREATE_FAILED');
    }
  }

  /**
   * Updates an existing task identified by ID.
   *
   * @async
   * @param {number} id - Unique identifier of the task to update.
   * @param {UpdateTaskDto} updateTaskDto - Payload with fields to update.
   * @param {TokenPayloadDto} tokenPayload - The token payload of the authenticated user.
   * @returns {Promise<{ message: string, task: Task }>} A success message and the updated task.
   *
   * @throws {AppError<'TASK_NOT_FOUND'>} If no task exists with the given ID.
   * @throws {AppError<'UNAUTHORIZED'>} If the user is not the owner of the task.
   * @throws {AppError<'TASK_UPDATE_FAILED'>} For unexpected database update issues.
   *
   * @example
   * await tasksService.updateTask(2, { completed: true }, tokenPayload);
   */
  async updateTask(
    id: number,
    updateTaskDto: UpdateTaskDto,
    tokenPayload: TokenPayloadDto,
  ) {
    try {
      await this.findActiveTaskOrThrow(id, tokenPayload);

      const updated = await this.prisma.task.update({
        where: { id },
        data: {
          name: updateTaskDto.name,
          description: updateTaskDto.description,
          completed: updateTaskDto.completed,
        },
      });

      return {
        message: 'Tarefa atualizada com sucesso',
        task: updated,
      };
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }

      logError(this.logger, error);

      if (isPrismaError(error)) {
        throw error;
      }

      throwError('TASK_UPDATE_FAILED');
    }
  }

  /**
   * Soft-deletes a task from the database.
   *
   * @async
   * @param {number} id - Unique task identifier.
   * @param {TokenPayloadDto} tokenPayload - The token payload of the authenticated user.
   * @returns {Promise<{ message: string, task: Task }>} A success message and the removed task.
   *
   * @throws {AppError<'TASK_NOT_FOUND'>} If the specified task does not exist.
   * @throws {AppError<'UNAUTHORIZED'>} If the user is not the owner of the task.
   * @throws {AppError<'TASK_DELETE_FAILED'>} For unexpected database deletion issues.
   */
  async deleteTask(id: number, tokenPayload: TokenPayloadDto) {
    try {
      await this.findActiveTaskOrThrow(id, tokenPayload);

      const deleted = await this.prisma.task.update({
        where: { id },
        data: { deletedAt: new Date() },
      });

      return {
        message: 'Tarefa excluída com sucesso',
        task: deleted,
      };
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }

      logError(this.logger, error);

      if (isPrismaError(error)) throw error;

      throwError('TASK_DELETE_FAILED');
    }
  }
  //#endregion
}
