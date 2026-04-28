FROM node:18-alpine

WORKDIR /app

# 1. Copy dependency manifests first (layer caching)
COPY package.json package-lock.json* ./

# 2. Install production dependencies only
RUN npm ci --omit=dev

# 3. Copy source code
COPY . .

# Non-root user for security
USER node

EXPOSE 3000

CMD ["node", "index.js"]
