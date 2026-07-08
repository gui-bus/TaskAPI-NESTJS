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
@Controller('users')
export class UsersController {
  //#region Setup
  constructor(private readonly usersService: UsersService) {}
  //#endregion

  //#region Routes
  @Get()
  listAllUsers(@Query() paginationDto: PaginationDto) {
    return this.usersService.listAllUsers(paginationDto);
  }

  @Get(':id')
  findUserById(@Param('id', ParseIntPipe) id: number) {
    return this.usersService.findUserById(id);
  }

  @Post()
  createUser(@Body() createUserDto: CreateUserDto) {
    return this.usersService.createUser(createUserDto);
  }

  @UseGuards(AuthTokenGuard)
  @Patch(':id')
  updateUser(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateUserDto: UpdateUserDto,
    @TokenPayloadParam() tokenPayload: TokenPayloadDto,
  ) {
    return this.usersService.updateUser(id, updateUserDto, tokenPayload);
  }

  @UseGuards(AuthTokenGuard)
  @Delete(':id')
  deleteUser(
    @Param('id', ParseIntPipe) id: number,
    @TokenPayloadParam() tokenPayload: TokenPayloadDto,
  ) {
    return this.usersService.deleteUser(id, tokenPayload);
  }

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
