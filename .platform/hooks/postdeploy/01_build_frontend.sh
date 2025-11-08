#!/bin/bash
set -e

echo "Building frontend..."
cd /var/app/current
npm run build

echo "Frontend build completed successfully"
