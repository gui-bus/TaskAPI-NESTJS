import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { SignInDto } from './dto/signin.dto';
import { AuthService } from './auth.service';
import { AuthTokenGuard } from './guard/authToken.guard';
import { TokenPayloadDto } from './dto/tokenPayload.dto';
import { TokenPayloadParam } from './param/tokenPayload.param';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

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
  @UseGuards(AuthTokenGuard)
  @Post('logout')
  logout(@TokenPayloadParam() tokenPayload: TokenPayloadDto) {
    return this.authService.logout(tokenPayload);
  }
}
