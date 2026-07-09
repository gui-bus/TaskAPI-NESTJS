import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import { CategoriesService } from './categories.service';
import { CreateCategoryDto } from './dto/createCategory.dto';
import { AuthTokenGuard } from 'src/auth/guard/authToken.guard';
import { TokenPayloadParam } from 'src/auth/param/tokenPayload.param';
import { TokenPayloadDto } from 'src/auth/dto/tokenPayload.dto';
import { PaginationDto } from 'src/common/dto/pagination.dto';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiResponse,
} from '@nestjs/swagger';

@ApiTags('Categorias')
@ApiBearerAuth()
@UseGuards(AuthTokenGuard)
@Controller('categories')
export class CategoriesController {
  constructor(private readonly categoriesService: CategoriesService) {}

  @ApiOperation({
    summary: 'Criar categoria',
    description: 'Cria uma nova categoria/tag para organizar as tarefas.',
  })
  @ApiResponse({ status: 201, description: 'Categoria criada com sucesso.' })
  @ApiResponse({ status: 401, description: 'Não autorizado.' })
  @Post()
  createCategory(
    @Body() dto: CreateCategoryDto,
    @TokenPayloadParam() tokenPayload: TokenPayloadDto,
  ) {
    return this.categoriesService.createCategory(dto, tokenPayload);
  }

  @ApiOperation({
    summary: 'Listar categorias',
    description: 'Retorna a lista paginada de categorias do usuário logado.',
  })
  @ApiResponse({ status: 200, description: 'Lista retornada com sucesso.' })
  @ApiResponse({ status: 401, description: 'Não autorizado.' })
  @Get()
  listCategories(
    @Query() paginationDto: PaginationDto,
    @TokenPayloadParam() tokenPayload: TokenPayloadDto,
  ) {
    return this.categoriesService.listCategories(paginationDto, tokenPayload);
  }

  @ApiOperation({
    summary: 'Buscar categoria por ID',
    description:
      'Busca os detalhes de uma categoria específica pertencente ao usuário logado.',
  })
  @ApiResponse({ status: 200, description: 'Categoria encontrada.' })
  @ApiResponse({ status: 401, description: 'Não autorizado.' })
  @ApiResponse({ status: 404, description: 'Categoria não encontrada.' })
  @Get(':id')
  findCategoryById(
    @Param('id', ParseIntPipe) id: number,
    @TokenPayloadParam() tokenPayload: TokenPayloadDto,
  ) {
    return this.categoriesService.findCategoryById(id, tokenPayload);
  }

  @ApiOperation({
    summary: 'Atualizar categoria',
    description: 'Renomeia uma categoria específica do usuário logado.',
  })
  @ApiResponse({
    status: 200,
    description: 'Categoria atualizada com sucesso.',
  })
  @ApiResponse({ status: 401, description: 'Não autorizado.' })
  @ApiResponse({ status: 404, description: 'Categoria não encontrada.' })
  @Put(':id')
  updateCategory(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: CreateCategoryDto,
    @TokenPayloadParam() tokenPayload: TokenPayloadDto,
  ) {
    return this.categoriesService.updateCategory(id, dto, tokenPayload);
  }

  @ApiOperation({
    summary: 'Excluir categoria',
    description: 'Remove uma categoria específica do usuário logado.',
  })
  @ApiResponse({ status: 200, description: 'Categoria excluída com sucesso.' })
  @ApiResponse({ status: 401, description: 'Não autorizado.' })
  @ApiResponse({ status: 404, description: 'Categoria não encontrada.' })
  @Delete(':id')
  deleteCategory(
    @Param('id', ParseIntPipe) id: number,
    @TokenPayloadParam() tokenPayload: TokenPayloadDto,
  ) {
    return this.categoriesService.deleteCategory(id, tokenPayload);
  }
}
