/*
Copyright 2026 Google LLC

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

    https://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
*/
# Stage 1: Build
FROM node:20-slim AS builder

WORKDIR /app

# Install dependencies from root
COPY package*.json ./
COPY odata-v4-gcp/package*.json ./odata-v4-gcp/

RUN npm install

# Copy source code
COPY common ./common
COPY odata-v4-gcp ./odata-v4-gcp
COPY obq-gateway ./obq-gateway

# Build backend (using the root's tsc and package scripts)
RUN npm run build:backend

# Stage 2: Production
FROM node:20-slim

WORKDIR /app
ENV NODE_ENV=production

# Copy root dependencies and built backend
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/obq-gateway/dist ./obq-gateway/dist

# Expose the default Fastify port
EXPOSE 3001

# Start the server (using the root's start script)
CMD ["npm", "run", "start"]
