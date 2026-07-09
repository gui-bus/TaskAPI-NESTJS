import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateCategoryDto } from './dto/createCategory.dto';
import { TokenPayloadDto } from 'src/auth/dto/tokenPayload.dto';
import { throwError } from 'src/common/errors/core/errors.factory';
import { logError } from 'src/common/errors/helpers/logError';
import { PaginationDto } from 'src/common/dto/pagination.dto';

@Injectable()
export class CategoriesService {
  private readonly logger = new Logger(CategoriesService.name);

  constructor(private readonly prisma: PrismaService) {}

  private async findCategoryOrThrow(id: number, tokenPayload: TokenPayloadDto) {
    const category = await this.prisma.category.findUnique({
      where: { id },
    });

    if (!category) throwError('CATEGORY_NOT_FOUND');
    if (category.userId !== tokenPayload.sub) throwError('UNAUTHORIZED');

    return category;
  }

  async createCategory(dto: CreateCategoryDto, tokenPayload: TokenPayloadDto) {
    try {
      const category = await this.prisma.category.create({
        data: {
          name: dto.name,
          userId: tokenPayload.sub,
        },
      });
      return {
        message: 'Categoria criada com sucesso',
        category,
      };
    } catch (error) {
      logError(this.logger, error);
      throwError('INTERNAL_ERROR');
    }
  }

  async listCategories(
    paginationDto: PaginationDto,
    tokenPayload: TokenPayloadDto,
  ) {
    try {
      const { limit, offset } = paginationDto;

      const [total, categories] = await this.prisma.$transaction([
        this.prisma.category.count({ where: { userId: tokenPayload.sub } }),
        this.prisma.category.findMany({
          where: { userId: tokenPayload.sub },
          take: limit,
          skip: offset,
          orderBy: { createdAt: 'desc' },
        }),
      ]);

      return {
        total,
        limit,
        offset,
        categories,
      };
    } catch (error) {
      logError(this.logger, error);
      throwError('DATABASE_ERROR');
    }
  }

  async findCategoryById(id: number, tokenPayload: TokenPayloadDto) {
    return this.findCategoryOrThrow(id, tokenPayload);
  }

  async updateCategory(
    id: number,
    dto: CreateCategoryDto,
    tokenPayload: TokenPayloadDto,
  ) {
    await this.findCategoryOrThrow(id, tokenPayload);
    try {
      const updated = await this.prisma.category.update({
        where: { id },
        data: { name: dto.name },
      });
      return {
        message: 'Categoria atualizada com sucesso',
        category: updated,
      };
    } catch (error) {
      logError(this.logger, error);
      throwError('INTERNAL_ERROR');
    }
  }

  async deleteCategory(id: number, tokenPayload: TokenPayloadDto) {
    await this.findCategoryOrThrow(id, tokenPayload);
    try {
      await this.prisma.category.delete({
        where: { id },
      });
      return {
        message: 'Categoria excluída com sucesso',
      };
    } catch (error) {
      logError(this.logger, error);
      throwError('INTERNAL_ERROR');
    }
  }
}
