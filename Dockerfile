# Stage 1: Build
FROM node:22-alpine AS builder

WORKDIR /usr/src/app

COPY package*.json ./
COPY prisma ./prisma/

RUN npm ci

COPY . .

RUN npx prisma generate
RUN npm run build

# Remove development node_modules and install only production dependencies
RUN npm prune --production

# Stage 2: Runtime
FROM node:22-alpine AS runner

WORKDIR /usr/src/app

ENV NODE_ENV=production

# Copy built application and required production packages
COPY --from=builder /usr/src/app/package*.json ./
COPY --from=builder /usr/src/app/node_modules ./node_modules
COPY --from=builder /usr/src/app/dist ./dist
COPY --from=builder /usr/src/app/prisma ./prisma

# Create placeholder folder for uploads/static assets if needed
RUN mkdir -p files

EXPOSE 3000

CMD ["node", "dist/src/main.js"]
