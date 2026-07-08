import { CanActivate, Inject, Injectable } from '@nestjs/common';
import { ExecutionContextHost } from '@nestjs/core/helpers/execution-context-host';
import { JwtService } from '@nestjs/jwt';
import { Request } from 'express';
import { throwError } from 'src/common/errors/core/errors.factory';
import jwtConfig from '../config/jwt.config';
import type { ConfigType } from '@nestjs/config';
import { REQUEST_TOKEN_PAYLOAD_NAME } from '../common/auth.constants';
import { PrismaService } from 'src/prisma/prisma.service';
import { TokenPayloadDto } from '../dto/tokenPayload.dto';

@Injectable()
export class AuthTokenGuard implements CanActivate {
  constructor(
    private readonly jwtService: JwtService,
    private readonly prisma: PrismaService,

    @Inject(jwtConfig.KEY)
    private readonly jwtConfiguration: ConfigType<typeof jwtConfig>,
  ) {}

  async canActivate(context: ExecutionContextHost): Promise<boolean> {
    const request: Request = context.switchToHttp().getRequest();
    const token = this.extractTokenFromHeader(request);

    if (!token) {
      throwError('INVALID_TOKEN');
    }

    try {
      const payload = await this.jwtService.verifyAsync(
        token,
        this.jwtConfiguration,
      );

      request[REQUEST_TOKEN_PAYLOAD_NAME] = payload;

      const isUserActive = await this.prisma.user.findFirst({
        where: {
          id: (payload as TokenPayloadDto).sub,
          active: true,
        },
      });

      if (!isUserActive) {
        throwError('UNAUTHORIZED');
      }
    } catch (error) {
      console.log(error);
      throwError('UNAUTHORIZED');
    }

    return true;
  }

  extractTokenFromHeader(request: Request) {
    const authorization = request.headers?.authorization;

    if (!authorization || typeof authorization !== 'string') return undefined;

    return authorization.split(' ')[1];
  }
}
