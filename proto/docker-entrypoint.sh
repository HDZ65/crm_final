#!/bin/sh
set -e

echo "=== Proto Generator ==="
echo "Generating TypeScript code from .proto files..."

# Check if proto files exist
if [ ! -d "/proto/src" ]; then
  echo "Warning: /proto/src not found. Checking packages/proto/src..."
  if [ -d "/app/packages/proto/src" ]; then
    cd /app/packages/proto
  else
    echo "No proto source directory found. Exiting."
    exit 0
  fi
fi

# Generate code using buf
if [ -f "buf.gen.yaml" ]; then
  echo "Running buf generate..."
  buf generate
  echo "Proto generation completed!"
else
  echo "buf.gen.yaml not found. Skipping generation."
fi

# Keep container running for a moment to allow dependent services to start
echo "Proto generator done."
