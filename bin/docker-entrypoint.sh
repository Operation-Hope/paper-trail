#!/bin/bash
set -e

echo "Starting Paper Trail backend..."

# Run database initialization if needed
echo "Checking database schema..."
python bin/init_db.py

# Start Flask development server
echo "Starting Flask server..."
exec flask run --host=0.0.0.0 --port=5001 --reload

