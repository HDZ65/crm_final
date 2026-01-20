# ==========================================
# Stage 1: Build
# ==========================================
FROM node:20-alpine AS builder

# Installer les dépendances système pour la compilation
RUN apk add --no-cache python3 make g++

WORKDIR /app

# Copier les fichiers de dépendances
COPY services/service-factures/package*.json ./

# Installer toutes les dépendances (y compris dev)
RUN npm install

# Copier le code source et les fichiers proto
COPY services/service-factures/ .
COPY proto/factures ./proto

# Build de l'application
RUN npm run build

# Nettoyer les devDependencies
RUN npm prune --production

# ==========================================
# Stage 2: Production
# ==========================================
FROM node:20-alpine AS production

# Créer un utilisateur non-root pour la sécurité
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nestjs -u 1001

WORKDIR /app

# Copier les node_modules de production depuis le builder
COPY --from=builder --chown=nestjs:nodejs /app/node_modules ./node_modules

# Copier le code compilé
COPY --from=builder --chown=nestjs:nodejs /app/dist ./dist

# Copier les fichiers proto (nécessaires pour gRPC)
COPY --from=builder --chown=nestjs:nodejs /app/proto ./proto

# Créer les dossiers de stockage
RUN mkdir -p /app/storage/pdfs /app/storage/temp && \
    chown -R nestjs:nodejs /app/storage

# Passer à l'utilisateur non-root
USER nestjs

# Exposer le port gRPC
EXPOSE 60051

# Variable d'environnement par défaut
ENV NODE_ENV=production
ENV GRPC_URL=0.0.0.0:50051

# Health check (utilise grpc-health-probe si disponible)
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('net').connect({port:60051,host:'0.0.0.0'}).on('connect',()=>process.exit(0)).on('error',()=>process.exit(1))"

# Démarrer l'application
CMD ["node", "dist/main.js"]
