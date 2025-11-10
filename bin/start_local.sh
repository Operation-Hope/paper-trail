#!/bin/bash
# Local development startup script

set -e

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}Paper Trail - Local Development${NC}\n"

# Check if virtual environment is activated
if [ -z "$VIRTUAL_ENV" ]; then
    echo -e "${YELLOW}Warning: Virtual environment not activated${NC}"
    echo "Activating virtual environment..."
    if [ -d ".venv" ]; then
        source .venv/bin/activate
    else
        echo -e "${YELLOW}Virtual environment not found. Please create one first:${NC}"
        echo "  python -m venv .venv"
        echo "  source .venv/bin/activate  # Linux/macOS"
        echo "  .venv\\Scripts\\activate   # Windows"
        exit 1
    fi
fi

# Start Flask development server
echo -e "${GREEN}Starting Flask development server...${NC}"
echo -e "${BLUE}Frontend should be started separately in another terminal:${NC}"
echo -e "  ${YELLOW}cd frontend && pnpm run dev${NC}\n"

python -m app.main

