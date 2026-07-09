import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { SignInDto } from './dto/signin.dto';
import { AuthService } from './auth.service';
import { AuthTokenGuard } from './guard/authToken.guard';
import { TokenPayloadDto } from './dto/tokenPayload.dto';
import { TokenPayloadParam } from './param/tokenPayload.param';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiResponse,
} from '@nestjs/swagger';

@ApiTags('Autenticação')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @ApiOperation({
    summary: 'Autenticar usuário',
    description:
      'Verifica as credenciais do usuário (e-mail e senha) e retorna um token JWT de acesso se forem válidas.',
  })
  @ApiResponse({ status: 201, description: 'Autenticação bem-sucedida.' })
  @ApiResponse({ status: 401, description: 'Credenciais inválidas.' })
  @Post()
  signIn(@Body() signInDto: SignInDto) {
    return this.authService.autenticate(signInDto);
  }

  /**
   * Endpoint to log out the currently authenticated user.
   *
   * @post /auth/logout
   * @useGuard AuthTokenGuard
   */
  @ApiOperation({
    summary: 'Efetuar logout',
    description:
      'Encerra a sessão do usuário autenticado no cliente (stateless).',
  })
  @ApiBearerAuth()
  @ApiResponse({ status: 201, description: 'Logout efetuado com sucesso.' })
  @ApiResponse({ status: 401, description: 'Token inválido ou não fornecido.' })
  @UseGuards(AuthTokenGuard)
  @Post('logout')
  logout(@TokenPayloadParam() tokenPayload: TokenPayloadDto) {
    return this.authService.logout(tokenPayload);
  }
}
