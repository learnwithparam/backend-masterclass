# =============================================================================
# Multi-Stage Dockerfile for Order Service
#
# KEY CONCEPT: Multi-stage builds create small, secure production images.
# Stage 1 (builder) has everything needed to compile TypeScript — Node.js,
# npm, devDependencies (typescript, ts-jest, etc.). This stage can be 500MB+.
# Stage 2 (runner) starts fresh with ONLY the compiled JavaScript and
# production dependencies. This stage is typically 50-100MB.
# =============================================================================

# Stage 1: Build — Compile TypeScript to JavaScript
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files first — Docker caches this layer. If dependencies
# haven't changed, npm ci is skipped on rebuild (huge time saver).
COPY package*.json ./
COPY tsconfig*.json ./

# npm ci is preferred over npm install in Docker:
# - Uses exact versions from package-lock.json (reproducible builds)
# - Faster than npm install (skips dependency resolution)
# - Fails if lock file is out of sync (catches mistakes)
RUN npm ci

# Copy the microservice source code
COPY after/order-service ./after/order-service

# Create a local tsconfig just for building the order service
RUN echo '{"extends": "../../tsconfig.json", "compilerOptions": {"outDir": "../../dist/order", "rootDir": "."}, "include": ["**/*"]}' > after/order-service/tsconfig.json

# Compile TypeScript
RUN npm run build:order

# Stage 2: Production Runtime — Minimal image with only compiled JS
FROM node:20-alpine AS runner

WORKDIR /app
ENV NODE_ENV=production

# Install ONLY production dependencies — devDependencies (typescript,
# jest, ts-jest, etc.) are NOT installed. This keeps the image small.
COPY package*.json ./
RUN npm ci --omit=dev

# Copy the compiled JS from the builder stage — no TypeScript source
# code exists in the production image.
COPY --from=builder /app/dist/order ./dist

# Create a thin ESM entry point that imports and starts the server.
# The main index.js uses a CJS guard (require.main === module) which
# doesn't fire in ESM — so we need an explicit starter script.
RUN echo 'import { startServer } from "./index.js"; startServer(3000);' > dist/start.js

# KEY CONCEPT: Run as non-root user for security. If the Node.js process
# is compromised, the attacker has limited permissions. The 'node' user
# is built into the node:alpine image.
USER node

EXPOSE 3000

# Run compiled JavaScript directly — no tsx, no ts-node in production.
CMD ["node", "dist/start.js"]
