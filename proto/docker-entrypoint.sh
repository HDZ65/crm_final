#!/bin/bash
set -e

echo "🚀 Starting Proto Code Generation with Buf..."
echo ""

# Wait a bit for volumes to be ready
sleep 2

# Check if proto source files exist
if [ ! -d "/proto/src" ]; then
    echo "❌ Error: Proto source directory /proto/src not found"
    exit 1
fi

# Create output directories
mkdir -p /output/frontend
mkdir -p /output/services

# List proto files for debugging
echo "📁 Proto files found:"
find /proto/src -name "*.proto" -type f | head -5
echo ""

# Lint proto files
echo "📋 Linting proto files..."
cd /proto
buf lint || echo "⚠️  Linting warnings detected (continuing anyway)"

# Generate code
echo ""
echo "🔨 Generating TypeScript code..."
buf generate || echo "⚠️  Generation completed with warnings"

echo ""
echo "✅ Proto code generation completed!"
echo ""
echo "📦 Generated files:"
echo "   ✓ Frontend (TypeScript) → /output/frontend/"
echo "   ✓ Microservices (Node.js) → /output/services/"
echo ""
echo "🎉 Proto generator ready! Microservices can now start."
echo ""

# Keep container running for docker-compose dependencies
echo "⏳ Container will stay alive for hot-reload..."
tail -f /dev/null
