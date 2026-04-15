#!/bin/bash

# Traveo - Dependency Update Script
# This script safely updates dependencies with testing

echo "🚀 Traveo Dependency Update Script"
echo "===================================="
echo ""

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Function to check if command succeeded
check_status() {
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✓ $1${NC}"
    else
        echo -e "${RED}✗ $1 failed${NC}"
        exit 1
    fi
}

# Create backup branch
echo -e "${YELLOW}Creating backup branch...${NC}"
git checkout -b dependency-updates-$(date +%Y%m%d)
check_status "Backup branch created"

# Update Backend Dependencies
echo ""
echo -e "${YELLOW}Updating Backend Dependencies...${NC}"
cd server

# Update safe packages first
echo "Updating safe packages (bcryptjs, dotenv, helmet, uuid)..."
npm update bcryptjs dotenv helmet uuid
check_status "Safe packages updated"

# Run backend tests
echo "Running backend tests..."
npm test
check_status "Backend tests passed"

# Ask about Express update
echo ""
echo -e "${YELLOW}Express 5 has breaking changes.${NC}"
read -p "Do you want to update Express to v5? (y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo "Updating Express to v5..."
    npm install express@5
    check_status "Express updated"
    
    echo "Running tests after Express update..."
    npm test
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✓ Tests passed with Express 5${NC}"
    else
        echo -e "${RED}✗ Tests failed with Express 5${NC}"
        echo "Rolling back Express..."
        npm install express@4
        echo -e "${YELLOW}Express rolled back to v4${NC}"
    fi
fi

# Ask about Mongoose update
echo ""
echo -e "${YELLOW}Mongoose 9 has breaking changes.${NC}"
read -p "Do you want to update Mongoose to v9? (y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo "Updating Mongoose to v9..."
    npm install mongoose@9
    check_status "Mongoose updated"
    
    echo "Running tests after Mongoose update..."
    npm test
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✓ Tests passed with Mongoose 9${NC}"
    else
        echo -e "${RED}✗ Tests failed with Mongoose 9${NC}"
        echo "Rolling back Mongoose..."
        npm install mongoose@8
        echo -e "${YELLOW}Mongoose rolled back to v8${NC}"
    fi
fi

# Update Frontend Dependencies
echo ""
echo -e "${YELLOW}Updating Frontend Dependencies...${NC}"
cd ../client

echo "Updating frontend packages..."
npm update
check_status "Frontend packages updated"

# Run frontend tests
echo "Running frontend tests..."
npm test
check_status "Frontend tests passed"

# Build frontend
echo "Building frontend..."
npm run build
check_status "Frontend build successful"

# Summary
echo ""
echo "===================================="
echo -e "${GREEN}✓ Dependency updates completed!${NC}"
echo "===================================="
echo ""
echo "Next steps:"
echo "1. Review changes: git diff"
echo "2. Test the application manually"
echo "3. Commit changes: git add . && git commit -m 'Update dependencies'"
echo "4. Merge to main: git checkout main && git merge dependency-updates-$(date +%Y%m%d)"
echo ""
echo "If something went wrong:"
echo "- Switch back: git checkout main"
echo "- Delete branch: git branch -D dependency-updates-$(date +%Y%m%d)"
