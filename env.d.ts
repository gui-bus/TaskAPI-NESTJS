declare namespace NodeJS {
  interface ProcessEnv {
    DATABASE_URL: string;
    JWT_SECRET: string;
    JWT_TOKEN_AUDIENCE: string;
    JWT_TOKEN_ISSUER: string;
    JWT_TTL: string;
  }
}
