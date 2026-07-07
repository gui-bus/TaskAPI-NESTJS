//#region Imports
import { Injectable, Logger } from '@nestjs/common';
import { PaginationDto } from 'src/common/dto/pagination.dto';
import { AppError } from 'src/common/errors/core/appError';
import { throwError } from 'src/common/errors/core/errors.factory';
import { isPrismaError } from 'src/common/errors/helpers/isPrismaError';
import { logError } from 'src/common/errors/helpers/logError';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateUserDto } from './dto/createUser.dto';
import { UpdateUserDto } from './dto/updateUser.dto';
import { HashingServiceProtocol } from 'src/auth/hash/hashing.service';
//#endregion

@Injectable()
export class UsersService {
  //#region Setup
  private readonly logger = new Logger(UsersService.name);

  constructor(
    private prisma: PrismaService,
    private readonly hashingService: HashingServiceProtocol,
  ) {}
  //#endregion

  //#region Private Utilities
  /**
   * Retrieves an active (non-deleted) user by ID or throws an error if not found.
   *
   * @private
   * @async
   * @param {number} id - Unique identifier of the user.
   * @returns {Promise<User>} The located active user.
   *
   * @throws {AppError<'USER_NOT_FOUND'>} If the user does not exist or is soft-deleted.
   *
   * @example
   * const user = await this.findActiveuserOrThrow(3);
   * console.log(user.name);
   */
  private async findActiveUserOrThrow(id: number) {
    const user = await this.prisma.user.findFirst({
      where: { id, deletedAt: null },
      omit: { password: true },
    });
    if (!user) throwError('USER_NOT_FOUND');
    return user;
  }
  //#endregion

  //#region User queries
  /**
   * Retrieves a paginated list of active (non-deleted) users.
   *
   * Executes a transactional query that returns both the total number of
   * available users and the paginated subset based on the provided
   * `limit` and `offset`. Users are ordered by creation date in descending order.
   *
   * @async
   * @param {PaginationDto} [paginationDto] - Optional pagination settings.
   * @param {number} [paginationDto.limit=10] - Maximum number of items to return.
   * @param {number} [paginationDto.offset=0] - Number of items to skip before starting the page.
   *
   * @returns {Promise<{
   *   users: User[],
   *   params: {
   *     totalItems: number,
   *     totalPages: number,
   *     limit: number,
   *     offset: number
   *   }
   * }>} An object containing the paginated users and metadata.
   *
   * @example
   * // Retrieves the first page (10 items)
   * const response = await userService.listAll({ limit: 10, offset: 0 });
   *
   * @example
   * // Retrieves the second page with a custom page size
   * const response = await userService.listAll({ limit: 5, offset: 5 });
   *
   * @example
   * // Retrieves all items without providing any pagination configuration
   * const response = await userService.listAll();
   *
   * @throws {AppError<'DATABASE_ERROR'>}
   * Thrown when an unexpected database failure occurs.
   */
  async listAllUsers(paginationDto?: PaginationDto) {
    const { limit = 10, offset = 0 } = paginationDto ?? {};

    try {
      const [totalItems, data] = await this.prisma.$transaction([
        this.prisma.user.count({
          where: { deletedAt: null },
        }),
        this.prisma.user.findMany({
          where: { deletedAt: null },
          take: limit,
          skip: offset,
          orderBy: { createdAt: 'desc' },
          omit: { password: true },
        }),
      ]);

      const totalPages = Math.ceil(totalItems / limit);

      return {
        users: data,
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
   * Retrieves a single user based on its ID.
   *
   * @async
   * @param {number} id - Unique identifier of the user.
   * @returns {Promise<User>} The located user.
   *
   * @throws {AppError<'USER_NOT_FOUND'>} If no user exists with the given ID.
   * @throws {AppError<'DATABASE_ERROR'>} For unexpected database issues.
   *
   * @example
   * const user = await usersService.findUserById(1);
   * console.log(user.name);
   */
  async findUserById(id: number) {
    try {
      const user = await this.prisma.user.findFirst({
        where: { id, deletedAt: null },
        include: {
          tasks: true,
        },
        omit: {
          password: true,
        },
      });
      if (!user) throwError('USER_NOT_FOUND');

      return user;
    } catch (error) {
      logError(this.logger, error);

      if (error instanceof AppError) {
        throw error;
      }

      if (isPrismaError(error)) {
        throw error;
      }

      throwError('DATABASE_ERROR');
    }
  }

  /**
   * Creates a new user with the provided data.
   *
   * @async
   * @param {CreateUserDto} createUserDto - Payload containing name and description of the new user.
   * @returns {Promise<{ message: string, user: User }>} A success message and the newly created user.
   *
   * @throws {AppError<'DATABASE_ERROR'>} For unexpected database issues.
   *
   * @example
   * const result = await usersService.createUser({ firstName: "Jonh", lastName: "Doe" });
   * console.log(result.user.id);
   */
  async createUser(createUserDto: CreateUserDto) {
    try {
      const passwordHash = await this.hashingService.hash(
        createUserDto.password,
      );

      const newUser = await this.prisma.user.create({
        data: {
          firstName: createUserDto.firstName,
          lastName: createUserDto.lastName,
          email: createUserDto.email,
          password: passwordHash,
        },
        omit: { password: true },
      });

      return {
        message: 'Usuário criado com sucesso',
        user: newUser,
      };
    } catch (error) {
      logError(this.logger, error);

      throwError('DATABASE_ERROR');
    }
  }

  /**
   * Updates an existing user identified by ID.
   *
   * @async
   * @param {number} id - Unique identifier of the user to update.
   * @param {UpdateUserDto} updateUserDto - Payload with fields to update.
   * @returns {Promise<{ message: string, user: User }>} A success message and the updated user.
   *
   * @throws {AppError<'USER_NOT_FOUND'>} If no user exists with the given ID.
   * @throws {AppError<'DATABASE_ERROR'>} For unexpected database issues.
   *
   * @example
   * await usersService.updateUser(2, { lastName: Smith });
   */
  async updateUser(id: number, updateUserDto: UpdateUserDto) {
    try {
      await this.findActiveUserOrThrow(id);

      let passwordHash: string | undefined;
      if (updateUserDto.password) {
        passwordHash = await this.hashingService.hash(updateUserDto.password);
      }

      const updated = await this.prisma.user.update({
        where: { id },
        data: {
          firstName: updateUserDto.firstName,
          lastName: updateUserDto.lastName,
          password: passwordHash,
        },
        omit: { password: true },
      });

      return {
        message: 'Usuário atualizado com sucesso',
        user: updated,
      };
    } catch (error) {
      logError(this.logger, error);

      if (isPrismaError(error)) {
        throw error;
      }

      throwError('DATABASE_ERROR');
    }
  }

  /**
   * Soft-deletes a user and their related tasks.
   *
   * @async
   * @param {number} id - The unique identifier of the user to be soft-deleted.
   * @returns {Promise<{ message: string; user: User }>}
   * Returns a confirmation message and the updated (soft-deleted) user.
   *
   * @throws {AppError<'USER_NOT_FOUND'>}
   * Thrown if the specified user does not exist or is already deleted.
   *
   * @throws {AppError<'DATABASE_ERROR'>}
   * Thrown in case of unexpected database failures during the operation.
   */
  async deleteUser(id: number) {
    try {
      await this.findActiveUserOrThrow(id);

      const now = new Date();

      const [deletedUser] = await this.prisma.$transaction([
        this.prisma.user.update({
          where: { id },
          data: { deletedAt: now },
          omit: { password: true },
        }),
        this.prisma.task.updateMany({
          where: { userId: id },
          data: { deletedAt: now },
        }),
      ]);

      return {
        message: 'Usuário excluído com sucesso',
        user: deletedUser,
      };
    } catch (error) {
      logError(this.logger, error);
      throwError('DATABASE_ERROR');
    }
  }
  //#endregion
}
