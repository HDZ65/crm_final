# Proto Generator Dockerfile
# Generates TypeScript code from .proto files
FROM bufbuild/buf:1.28.1 AS buf
FROM node:20-alpine

# Install buf CLI
COPY --from=buf /usr/local/bin/buf /usr/local/bin/buf

WORKDIR /proto

# Install ts-proto for TypeScript generation
RUN npm install -g ts-proto@1.181.0

# Copy proto files and config at runtime via volumes
# See docker-compose.override.yml for volume mounts

CMD ["sh", "/proto/docker-entrypoint.sh"]
