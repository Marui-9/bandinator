#!/bin/bash

# Team-Wiki Setup Script
# This script sets up the development environment for Team-Wiki

set -e

echo "🚀 Setting up Team-Wiki..."

# Check Node.js version
echo "Checking Node.js version..."
NODE_VERSION=$(node --version | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 20 ]; then
  echo "❌ Node.js 20+ is required. Current version: $(node --version)"
  echo "Please install Node.js 20+ from https://nodejs.org/"
  exit 1
fi
echo "✅ Node.js $(node --version) detected"

# Install pnpm if not present
if ! command -v pnpm &> /dev/null; then
  echo "Installing pnpm..."
  npm install -g pnpm
fi
echo "✅ pnpm $(pnpm --version) detected"

# Install root dependencies
echo "Installing root dependencies..."
pnpm install

# Initialize Husky
echo "Setting up Husky..."
pnpm prepare

# Make Husky hooks executable
chmod +x .husky/pre-commit
chmod +x .husky/pre-push

# Create necessary directories
echo "Creating directories..."
mkdir -p data uploads

# Copy .env.example to .env if it doesn't exist
if [ ! -f .env ]; then
  echo "Creating .env file..."
  cp .env.example .env
  echo "⚠️  Please update .env with your configuration"
fi

echo ""
echo "✅ Setup complete!"
echo ""
echo "📋 Next steps:"
echo "1. Update .env file with your configuration"
echo "2. Run 'pnpm dev' to start development servers"
echo "3. Backend will be available at http://localhost:3001"
echo "4. Frontend will be available at http://localhost:3000"
echo ""
echo "📚 Other useful commands:"
echo "  pnpm test       - Run all tests"
echo "  pnpm lint       - Lint all packages"
echo "  pnpm build      - Build all packages"
echo "  pnpm format     - Format code with Prettier"
echo ""
