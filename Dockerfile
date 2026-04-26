# Build context = repo root (for Cloud Run "Deploy from repo").
# Backend source lives in backend/
FROM node:22-bookworm-slim

WORKDIR /app

COPY backend/package.json backend/package-lock.json ./
RUN npm ci

COPY backend/tsconfig.json ./
COPY backend/src ./src
RUN npm run build

ENV NODE_ENV=production
EXPOSE 8080

CMD ["node", "dist/index.js"]
