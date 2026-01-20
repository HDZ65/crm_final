# Dockerfile for Proto Code Generation with Buf
FROM alpine:3.19

# Install Buf CLI and dependencies
RUN apk add --no-cache curl bash && \
    curl -sSL "https://github.com/bufbuild/buf/releases/latest/download/buf-Linux-x86_64" -o /usr/local/bin/buf && \
    chmod +x /usr/local/bin/buf && \
    apk del curl

# Set working directory
WORKDIR /proto

# Copy entrypoint script
COPY docker-entrypoint.sh /docker-entrypoint.sh
RUN chmod +x /docker-entrypoint.sh

# Default command
CMD ["/docker-entrypoint.sh"]
