#!/bin/bash
set -e

echo "Installing dependencies..."
cd /var/app/current
npm install --production

echo "Building backend..."
cd /var/app/current/backend
npm install --production
npm run build

echo "Dependencies and backend build completed"
