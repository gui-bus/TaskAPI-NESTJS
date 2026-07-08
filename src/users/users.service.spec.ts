/// <reference types="multer" />
import { PrismaService } from 'src/prisma/prisma.service';
import { UsersService } from './users.service';
import { HashingServiceProtocol } from 'src/auth/hash/hashing.service';
import { Test, TestingModule } from '@nestjs/testing';
import { CreateUserDto } from './dto/createUser.dto';
import { UpdateUserDto } from './dto/updateUser.dto';
import { TokenPayloadDto } from 'src/auth/dto/tokenPayload.dto';
import * as fs from 'node:fs/promises';

// Mock fs/promises to prevent unit tests from writing to the filesystem
jest.mock('node:fs/promises', () => ({
  writeFile: jest.fn(),
}));

describe('UsersService', () => {
  let userService: UsersService;
  let prismaService: PrismaService;
  let hashingService: HashingServiceProtocol;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        {
          provide: PrismaService,
          useValue: {
            $transaction: jest.fn(),
            user: {
              count: jest.fn(),
              findMany: jest.fn(),
              findFirst: jest.fn(),
              create: jest.fn(),
              update: jest.fn(),
            },
            task: {
              updateMany: jest.fn(),
            },
          },
        },
        {
          provide: HashingServiceProtocol,
          useValue: {
            hash: jest.fn(),
          },
        },
      ],
    }).compile();

    userService = module.get<UsersService>(UsersService);
    prismaService = module.get<PrismaService>(PrismaService);
    hashingService = module.get<HashingServiceProtocol>(HashingServiceProtocol);
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should define users service', () => {
    expect(userService).toBeDefined();
  });

  describe('listAllUsers', () => {
    it('should retrieve a paginated list of users', async () => {
      const mockUsers = [
        {
          id: 1,
          firstName: 'John',
          lastName: 'Doe',
          email: 'john@example.com',
        },
      ];
      const count = 1;

      const transactionSpy = jest
        .spyOn(prismaService, '$transaction')
        .mockResolvedValue([count, mockUsers]);

      const result = await userService.listAllUsers({ limit: 10, offset: 0 });

      expect(transactionSpy).toHaveBeenCalled();
      expect(result.users).toEqual(mockUsers);
      expect(result.params.totalItems).toBe(1);
      expect(result.params.totalPages).toBe(1);
    });

    it('should throw DATABASE_ERROR if transaction fails', async () => {
      jest
        .spyOn(prismaService, '$transaction')
        .mockRejectedValue(new Error('DB error'));

      await expect(userService.listAllUsers()).rejects.toThrow(
        'Erro ao acessar o banco de dados.',
      );
    });
  });

  describe('findUserById', () => {
    it('should retrieve a user by ID successfully', async () => {
      const mockUser = {
        id: 1,
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com',
      };
      const findFirstSpy = jest
        .spyOn(prismaService.user, 'findFirst')
        .mockResolvedValue(mockUser);

      const result = await userService.findUserById(1);

      expect(findFirstSpy).toHaveBeenCalledWith({
        where: { id: 1, deletedAt: null },
        include: { tasks: true },
        omit: { password: true },
      });
      expect(result).toEqual(mockUser);
    });

    it('should throw USER_NOT_FOUND when user does not exist', async () => {
      jest.spyOn(prismaService.user, 'findFirst').mockResolvedValue(null);

      await expect(userService.findUserById(99)).rejects.toThrow(
        'Este usuário não foi encontrado.',
      );
    });
  });

  describe('createUser', () => {
    it('should create a new user successfully', async () => {
      const createUserDto: CreateUserDto = {
        firstName: 'John',
        lastName: 'Doe',
        email: 'john.doe@example.com',
        password: 'password123',
      };

      const hashSpy = jest
        .spyOn(hashingService, 'hash')
        .mockResolvedValue('HASH_MOCK_EXAMPLE');
      const createSpy = jest
        .spyOn(prismaService.user, 'create')
        .mockResolvedValue({
          id: 1,
          ...createUserDto,
          password: 'HASH_MOCK_EXAMPLE',
        });

      await userService.createUser(createUserDto);

      expect(hashSpy).toHaveBeenCalled();
      expect(createSpy).toHaveBeenCalledWith({
        data: {
          firstName: createUserDto.firstName,
          lastName: createUserDto.lastName,
          email: createUserDto.email,
          password: 'HASH_MOCK_EXAMPLE',
        },
        omit: { password: true },
      });
    });

    it('should throw Prisma P2002 error if email is duplicate', async () => {
      const createUserDto: CreateUserDto = {
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com',
        password: 'password123',
      };

      const prismaError = new Error('Unique constraint failed');
      (prismaError as any).code = 'P2002';

      jest.spyOn(hashingService, 'hash').mockResolvedValue('HASH_MOCK');
      jest.spyOn(prismaService.user, 'create').mockRejectedValue(prismaError);

      await expect(userService.createUser(createUserDto)).rejects.toThrow(
        'Falha ao criar o usuário.',
      );
    });
  });

  describe('updateUser', () => {
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

    it('should update user profile successfully when authorized', async () => {
      const updateUserDto: UpdateUserDto = {
        firstName: 'Johnny',
        password: 'newpassword123',
      };

      const mockUser = {
        id: 1,
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com',
      };

      jest.spyOn(prismaService.user, 'findFirst').mockResolvedValue(mockUser);
      const hashSpy = jest
        .spyOn(hashingService, 'hash')
        .mockResolvedValue('NEW_HASH');
      const updateSpy = jest
        .spyOn(prismaService.user, 'update')
        .mockResolvedValue({ ...mockUser, firstName: 'Johnny' });

      const result = await userService.updateUser(
        1,
        updateUserDto,
        tokenPayload,
      );

      expect(hashSpy).toHaveBeenCalledWith('newpassword123');
      expect(updateSpy).toHaveBeenCalledWith({
        where: { id: 1 },
        data: {
          firstName: 'Johnny',
          lastName: undefined,
          password: 'NEW_HASH',
        },
        omit: { password: true },
      });
      expect(result.user.firstName).toBe('Johnny');
    });

    it('should throw UNAUTHORIZED if updating another user profile', async () => {
      const mockUser = {
        id: 2,
        firstName: 'Jane',
        lastName: 'Doe',
        email: 'jane@example.com',
      };

      jest.spyOn(prismaService.user, 'findFirst').mockResolvedValue(mockUser);

      await expect(
        userService.updateUser(2, { firstName: 'Jane' }, tokenPayload),
      ).rejects.toThrow('Acesso não autorizado.');
    });

    it('should throw USER_NOT_FOUND if user is missing', async () => {
      jest.spyOn(prismaService.user, 'findFirst').mockResolvedValue(null);

      await expect(
        userService.updateUser(1, { firstName: 'Johnny' }, tokenPayload),
      ).rejects.toThrow('Este usuário não foi encontrado.');
    });
  });

  describe('deleteUser', () => {
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

    it('should soft delete user and tasks successfully when authorized', async () => {
      const mockUser = {
        id: 1,
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com',
      };

      jest.spyOn(prismaService.user, 'findFirst').mockResolvedValue(mockUser);
      const transactionSpy = jest
        .spyOn(prismaService, '$transaction')
        .mockResolvedValue([mockUser, { count: 5 }]);

      const result = await userService.deleteUser(1, tokenPayload);

      expect(transactionSpy).toHaveBeenCalled();
      expect(result.message).toBe('Usuário excluído com sucesso');
    });

    it('should throw UNAUTHORIZED if deleting another user profile', async () => {
      const mockUser = {
        id: 2,
        firstName: 'Jane',
        lastName: 'Doe',
        email: 'jane@example.com',
      };

      jest.spyOn(prismaService.user, 'findFirst').mockResolvedValue(mockUser);

      await expect(userService.deleteUser(2, tokenPayload)).rejects.toThrow(
        'Acesso não autorizado.',
      );
    });
  });

  describe('uploadAvatar', () => {
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

    const mockFile: any = {
      originalname: 'profile.png',
      buffer: Buffer.from('mock content'),
    };

    it('should write file and update user database entry successfully', async () => {
      const mockUser = {
        id: 1,
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com',
        avatar: null,
      };

      jest.spyOn(prismaService.user, 'findFirst').mockResolvedValue(mockUser);
      const updateSpy = jest
        .spyOn(prismaService.user, 'update')
        .mockResolvedValue({ ...mockUser, avatar: 'avatar_John_Doe.png' });

      const result = await userService.uploadAvatar(tokenPayload, mockFile);

      expect(fs.writeFile).toHaveBeenCalled();
      expect(updateSpy).toHaveBeenCalledWith({
        where: { id: 1 },
        data: { avatar: 'avatar_John_Doe.png' },
        omit: { password: true },
      });
      expect(result.message).toBe('Avatar atualizado com sucesso');
    });

    it('should throw USER_NOT_FOUND if user to update does not exist', async () => {
      jest.spyOn(prismaService.user, 'findFirst').mockResolvedValue(null);

      await expect(
        userService.uploadAvatar(tokenPayload, mockFile),
      ).rejects.toThrow('Este usuário não foi encontrado.');
    });

    it('should throw USER_UPDATE_FAILED if writing file fails', async () => {
      jest
        .spyOn(prismaService.user, 'findFirst')
        .mockResolvedValue({ id: 1 } as any);
      jest.spyOn(fs, 'writeFile').mockRejectedValue(new Error('Write failed'));

      await expect(
        userService.uploadAvatar(tokenPayload, mockFile),
      ).rejects.toThrow('Falha ao atualizar o usuário.');
    });
  });
});
