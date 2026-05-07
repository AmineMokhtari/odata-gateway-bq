# Stage 1: Build
FROM node:20-slim AS builder

WORKDIR /app

# Install dependencies
COPY package*.json ./
COPY common/package*.json ./common/
COPY frontend/package*.json ./frontend/

RUN npm install

# Copy source code
COPY common ./common
COPY frontend ./frontend

# Build frontend
RUN npm run build --prefix frontend

# Stage 2: Production
FROM node:20-slim

WORKDIR /app
ENV NODE_ENV=production

# Copy standalone build
COPY --from=builder /app/frontend/.next/standalone ./
COPY --from=builder /app/frontend/.next/static ./frontend/.next/static
COPY --from=builder /app/frontend/public ./frontend/public

# Expose Next.js default port
EXPOSE 3000

# Start the server
CMD ["node", "frontend/server.js"]
