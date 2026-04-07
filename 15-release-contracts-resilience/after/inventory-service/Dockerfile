# =============================================================================
# Multi-Stage Dockerfile for Inventory Service
# Same pattern as the Order Service — see order-service/Dockerfile for
# detailed comments on each step.
# =============================================================================

# Stage 1: Build
FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./
COPY tsconfig*.json ./
RUN npm ci

COPY after/inventory-service ./after/inventory-service
RUN echo '{"extends": "../../tsconfig.json", "compilerOptions": {"outDir": "../../dist/inventory", "rootDir": "."}, "include": ["**/*"]}' > after/inventory-service/tsconfig.json
RUN npm run build:inventory

# Stage 2: Production Runtime
FROM node:20-alpine AS runner

WORKDIR /app
ENV NODE_ENV=production

COPY package*.json ./
RUN npm ci --omit=dev

COPY --from=builder /app/dist/inventory ./dist

USER node

EXPOSE 4150

CMD ["node", "dist/index.js"]
