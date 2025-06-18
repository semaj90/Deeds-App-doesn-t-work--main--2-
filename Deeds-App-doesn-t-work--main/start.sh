#!/bin/bash

echo "🚀 Starting Prosecutor Case Management App..."

# Make sure we have the .env file
if [ ! -f .env ]; then
    echo "❌ .env file not found. Please create one based on .env.example"
    exit 1
fi

# Install dependencies if needed
if [ ! -d node_modules ]; then
    echo "📦 Installing dependencies..."
    npm install
fi

# Start the database
echo "🐘 Starting PostgreSQL database..."
docker compose up -d

# Wait for database to be ready
echo "⏳ Waiting for database to be ready..."
sleep 5

# Run migrations
echo "🔄 Running database migrations..."
npm run db:push

echo "✅ Setup complete! Starting development server..."
npm run dev
