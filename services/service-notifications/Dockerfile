FROM node:20-alpine AS builder

WORKDIR /app

COPY services/service-notifications/package*.json ./
RUN npm install

COPY services/service-notifications/ .
COPY proto/notifications ./proto
RUN npm run build

FROM node:20-alpine

WORKDIR /app

COPY services/service-notifications/package*.json ./
RUN npm install --only=production

COPY --from=builder /app/dist ./dist
COPY --from=builder /app/proto ./proto

EXPOSE 50061
EXPOSE 3001

CMD ["node", "dist/main.js"]
