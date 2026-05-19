# Stage 1: Build
FROM node:20-slim AS builder

WORKDIR /app

# Install dependencies
COPY package*.json ./
COPY common/package*.json ./common/
COPY obq-hub/package*.json ./obq-hub/

RUN npm install

# Copy source code
COPY common ./common
COPY obq-hub ./obq-hub

# Build frontend
RUN npm run build --prefix obq-hub

# Stage 2: Production
FROM node:20-slim

WORKDIR /app
ENV NODE_ENV=production

# Copy standalone build
COPY --from=builder /app/obq-hub/.next/standalone ./
COPY --from=builder /app/obq-hub/.next/static ./obq-hub/.next/static
COPY --from=builder /app/obq-hub/public ./obq-hub/public

# Expose Next.js default port
EXPOSE 3000

# Start the server
CMD ["node", "obq-hub/server.js"]
