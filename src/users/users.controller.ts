/// <reference types="multer" />
//#region Imports
import {
  Body,
  Controller,
  Delete,
  Get,
  HttpStatus,
  Param,
  ParseFilePipeBuilder,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { PaginationDto } from 'src/common/dto/pagination.dto';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/createUser.dto';
import { UpdateUserDto } from './dto/updateUser.dto';
import { AuthTokenGuard } from 'src/auth/guard/authToken.guard';
import { TokenPayloadParam } from 'src/auth/param/tokenPayload.param';
import { TokenPayloadDto } from 'src/auth/dto/tokenPayload.dto';
import { FileInterceptor } from '@nestjs/platform-express';
//#endregion
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiResponse,
  ApiConsumes,
  ApiBody,
} from '@nestjs/swagger';

@ApiTags('Usuários')
@Controller('users')
export class UsersController {
  //#region Setup
  constructor(private readonly usersService: UsersService) {}
  //#endregion

  //#region Routes
  @ApiOperation({
    summary: 'Listar usuários',
    description: 'Retorna a lista paginada de todos os usuários cadastrados.',
  })
  @ApiResponse({ status: 200, description: 'Lista retornada com sucesso.' })
  @ApiResponse({
    status: 400,
    description: 'Parâmetros de paginação inválidos.',
  })
  @Get()
  listAllUsers(@Query() paginationDto: PaginationDto) {
    return this.usersService.listAllUsers(paginationDto);
  }

  @ApiOperation({
    summary: 'Buscar usuário por ID',
    description: 'Retorna os detalhes de um único usuário baseado no seu ID.',
  })
  @ApiResponse({ status: 200, description: 'Usuário encontrado.' })
  @ApiResponse({ status: 404, description: 'Usuário não encontrado.' })
  @Get(':id')
  findUserById(@Param('id', ParseIntPipe) id: number) {
    return this.usersService.findUserById(id);
  }

  @ApiOperation({
    summary: 'Criar usuário',
    description: 'Cria um novo usuário com os dados informados.',
  })
  @ApiResponse({ status: 201, description: 'Usuário criado com sucesso.' })
  @ApiResponse({ status: 400, description: 'Dados de entrada inválidos.' })
  @ApiResponse({ status: 409, description: 'E-mail já cadastrado.' })
  @Post()
  createUser(@Body() createUserDto: CreateUserDto) {
    return this.usersService.createUser(createUserDto);
  }

  @ApiOperation({
    summary: 'Atualizar usuário',
    description:
      'Atualiza o perfil do usuário autenticado correspondente ao ID.',
  })
  @ApiBearerAuth()
  @ApiResponse({ status: 200, description: 'Usuário atualizado com sucesso.' })
  @ApiResponse({ status: 401, description: 'Não autorizado.' })
  @ApiResponse({
    status: 403,
    description: 'Proibido de atualizar o perfil de outro usuário.',
  })
  @UseGuards(AuthTokenGuard)
  @Patch(':id')
  updateUser(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateUserDto: UpdateUserDto,
    @TokenPayloadParam() tokenPayload: TokenPayloadDto,
  ) {
    return this.usersService.updateUser(id, updateUserDto, tokenPayload);
  }

  @ApiOperation({
    summary: 'Excluir usuário',
    description: 'Exclui o usuário autenticado correspondente ao ID.',
  })
  @ApiBearerAuth()
  @ApiResponse({ status: 200, description: 'Usuário excluído com sucesso.' })
  @ApiResponse({ status: 401, description: 'Não autorizado.' })
  @ApiResponse({
    status: 403,
    description: 'Proibido de excluir o perfil de outro usuário.',
  })
  @UseGuards(AuthTokenGuard)
  @Delete(':id')
  deleteUser(
    @Param('id', ParseIntPipe) id: number,
    @TokenPayloadParam() tokenPayload: TokenPayloadDto,
  ) {
    return this.usersService.deleteUser(id, tokenPayload);
  }

  @ApiOperation({
    summary: 'Upload de avatar',
    description:
      'Permite que o usuário autenticado faça o upload de uma imagem de perfil (JPG, JPEG, PNG ou WEBP de até 1MB).',
  })
  @ApiBearerAuth()
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
          description: 'Arquivo de imagem de perfil.',
        },
      },
    },
  })
  @ApiResponse({ status: 201, description: 'Upload concluído com sucesso.' })
  @ApiResponse({
    status: 422,
    description: 'Tipo ou tamanho do arquivo inválido.',
  })
  @UseGuards(AuthTokenGuard)
  @UseInterceptors(FileInterceptor('file'))
  @Post('upload')
  async uploadAvatar(
    @TokenPayloadParam() tokenPayload: TokenPayloadDto,
    @UploadedFile(
      new ParseFilePipeBuilder()
        .addFileTypeValidator({
          fileType: /(jpg|jpeg|png|webp)$/,
          fallbackToMimetype: true,
          errorMessage:
            'O arquivo deve ser uma imagem (jpg, jpeg, png ou webp)',
        })
        .addMaxSizeValidator({
          maxSize: 1 * 1024 * 1024,
          errorMessage: 'O arquivo deve ter no máximo 1MB',
        })
        .build({
          errorHttpStatusCode: HttpStatus.UNPROCESSABLE_ENTITY,
        }),
    )
    file: Express.Multer.File,
  ) {
    return this.usersService.uploadAvatar(tokenPayload, file);
  }
  //#endregion
}
