//#region Imports
import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { PaginationDto } from 'src/common/dto/pagination.dto';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/createUser.dto';
import { UpdateUserDto } from './dto/updateUser.dto';
import { AuthTokenGuard } from 'src/auth/guard/authToken.guard';
import { TokenPayloadParam } from 'src/auth/param/tokenPayload.param';
import { TokenPayloadDto } from 'src/auth/dto/tokenPayload.dto';
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
  //#endregion
}
