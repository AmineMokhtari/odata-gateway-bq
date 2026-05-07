# Stage 1: Build
FROM node:20-slim AS builder

WORKDIR /app

# Install dependencies from root
COPY package*.json ./
COPY common/package*.json ./common/

RUN npm install

# Copy source code
COPY common ./common
COPY backend ./backend

# Build backend (using the root's tsc and package scripts)
RUN npm run build:backend

# Stage 2: Production
FROM node:20-slim

WORKDIR /app
ENV NODE_ENV=production

# Copy root dependencies and built backend
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/backend/dist ./backend/dist

# Expose the default Fastify port
EXPOSE 3001

# Start the server (using the root's start script)
CMD ["npm", "run", "start"]
