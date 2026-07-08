export class TokenPayloadDto {
  sub: number;
  email: string;
  firstName: string;
  lastName: string;
  iat: number;
  exp: number;
  aud: string;
  iss: string;
}
