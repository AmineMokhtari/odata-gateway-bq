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

# Install dependencies
COPY package*.json ./
COPY odata-v4-gcp/package*.json ./odata-v4-gcp/
COPY obq-hub/package*.json ./obq-hub/

RUN npm install && npm install --prefix obq-hub

# Copy source code
COPY common ./common
COPY odata-v4-gcp ./odata-v4-gcp
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
