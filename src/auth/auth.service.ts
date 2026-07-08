import { Inject, Injectable } from '@nestjs/common';
import { SignInDto } from './dto/signin.dto';
import { PrismaService } from 'src/prisma/prisma.service';
import { HashingServiceProtocol } from './hash/hashing.service';
import { throwError } from 'src/common/errors/core/errors.factory';
import jwtConfig from './config/jwt.config';
import type { ConfigType } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import type { JwtSignOptions } from '@nestjs/jwt';
import { TokenPayloadDto } from './dto/tokenPayload.dto';

/**
 * Authentication Service.
 *
 * This service handles user authentication by validating user credentials
 * (email and password) using hashing comparison and generating JWT tokens
 * for authenticated sessions.
 */
@Injectable()
export class AuthService {
  /**
   * Creates an instance of AuthService.
   *
   * @param {PrismaService} prisma - Prisma client wrapper for database queries.
   * @param {HashingServiceProtocol} hashingService - Service to compare hashed passwords.
   * @param {ConfigType<typeof jwtConfig>} jwtConfiguration - JWT config object containing secret, ttl, etc.
   * @param {JwtService} jwtService - NestJS JWT service to sign access tokens.
   */
  constructor(
    private prisma: PrismaService,
    private readonly hashingService: HashingServiceProtocol,

    @Inject(jwtConfig.KEY)
    private readonly jwtConfiguration: ConfigType<typeof jwtConfig>,
    private readonly jwtService: JwtService,
  ) {}

  /**
   * Authenticates a user based on sign-in credentials.
   *
   * This method searches for the user by their email, verifies their password
   * using the hashing service, and returns an access token if validation succeeds.
   * To prevent user enumeration attacks, it returns a generic `INVALID_CREDENTIALS`
   * error code regardless of whether the email or password was incorrect.
   *
   * @async
   * @param {SignInDto} signInDto - The credentials payload containing email and password.
   * @returns {Promise<{
   *   id: number;
   *   firstName: string;
   *   lastName: string;
   *   email: string;
   *   token: string;
   * }>} The authenticated user's profile and JWT session token.
   *
   * @throws {AppError<'INVALID_CREDENTIALS'>} If the email does not exist or the password is incorrect.
   *
   * @example
   * const authSession = await authService.autenticate({
   *   email: "user@example.com",
   *   password: "password123"
   * });
   * console.log(authSession.token);
   */
  async autenticate(signInDto: SignInDto) {
    const user = await this.prisma.user.findFirst({
      where: {
        email: signInDto.email,
        active: true,
      },
    });

    if (!user) throwError('INVALID_CREDENTIALS');

    const isPasswordValid = await this.hashingService.compare(
      signInDto.password,
      user.password,
    );

    if (!isPasswordValid) throwError('INVALID_CREDENTIALS');

    const token = await this.jwtService.signAsync(
      {
        sub: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
      },
      {
        secret: this.jwtConfiguration.secret,
        expiresIn: this.jwtConfiguration.ttl as JwtSignOptions['expiresIn'],
        audience: this.jwtConfiguration.audience,
        issuer: this.jwtConfiguration.issuer,
      },
    );

    return {
      id: user.id,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      token,
    };
  }

  /**
   * Performs user logout.
   *
   * Since this API utilizes stateless JWTs, the server does not persist sessions.
   * This endpoint acts as a confirmation for the client to safely clear the token
   * locally. (Optionally, token blacklisting or session invalidation can be added here).
   *
   * @param {TokenPayloadDto} tokenPayload - The token payload of the authenticated user.
   * @returns {{ message: string }} A confirmation message of successful logout.
   */
  logout(tokenPayload: TokenPayloadDto) {
    return {
      message: `Logout efetuado com sucesso para o usuário ${tokenPayload.email}`,
    };
  }
}
