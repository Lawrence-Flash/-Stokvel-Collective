# Stage 1: Build
FROM node:25-alpine AS builder
WORKDIR /app
RUN npm install -g pnpm
COPY package.json pnpm-workspace.yaml ./
COPY packages ./packages
COPY apps/api ./apps/api
RUN pnpm install
RUN pnpm --filter @stokvel/database prisma:generate
RUN pnpm --filter @stokvel/database build
RUN pnpm --filter @stokvel/api build

# Stage 2: Runtime Execution
FROM node:25-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
RUN npm install -g pnpm
COPY --from=builder /app ./
EXPOSE 4000
CMD ["node", "apps/api/dist/server.js"]
