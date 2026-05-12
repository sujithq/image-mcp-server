#!/bin/bash

# Verification script for Azure Image MCP Server
# This script runs all checks to ensure the project is properly set up

echo "=========================================="
echo "Azure Image MCP Server - Verification"
echo "=========================================="
echo ""

# Color codes
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

check_mark="${GREEN}✓${NC}"
cross_mark="${RED}✗${NC}"

# Track failures
failures=0

# Check Node.js version
echo -n "Checking Node.js version... "
if command -v node > /dev/null 2>&1; then
  node_full_version=$(node -v)
  node_version=$(echo "$node_full_version" | cut -d'v' -f2 | cut -d'.' -f1)
  if [ "$node_version" -ge 18 ]; then
    echo -e "${check_mark} Node.js ${node_full_version}"
  else
    echo -e "${cross_mark} Node.js ${node_full_version} (requires >= 18)"
    failures=$((failures + 1))
  fi
else
  echo -e "${cross_mark} Node.js not found (requires >= 18)"
  failures=$((failures + 1))
fi

# Check if node_modules exists
echo -n "Checking dependencies... "
if [ -d "node_modules" ]; then
  echo -e "${check_mark} Dependencies installed"
else
  echo -e "${cross_mark} Dependencies not installed (run: npm install)"
  failures=$((failures + 1))
fi

# Run TypeScript compilation
echo -n "Running TypeScript compilation... "
if npm run build > /dev/null 2>&1; then
  echo -e "${check_mark} Build successful"
else
  echo -e "${cross_mark} Build failed"
  failures=$((failures + 1))
fi

# Run type checking
echo -n "Running type checking... "
if npm run typecheck > /dev/null 2>&1; then
  echo -e "${check_mark} No type errors"
else
  echo -e "${cross_mark} Type errors found"
  failures=$((failures + 1))
fi

# Run linting
echo -n "Running ESLint... "
if npm run lint > /dev/null 2>&1; then
  echo -e "${check_mark} No linting errors"
else
  echo -e "${cross_mark} Linting errors found"
  failures=$((failures + 1))
fi

# Run tests
echo -n "Running tests... "
test_output=$(npm test 2>&1)
test_status=$?
if [ "$test_status" -eq 0 ]; then
  test_count=$(printf '%s\n' "$test_output" | grep -o "[0-9]* passed" | head -1 | cut -d' ' -f1)
  echo -e "${check_mark} All tests passed ($test_count tests)"
else
  echo -e "${cross_mark} Tests failed"
  failures=$((failures + 1))
fi

# Check for required files
echo ""
echo "Checking required files:"
files=(".env.example" "README.md" "QUICKSTART.md" "package.json" "tsconfig.json" "src/index.ts")
for file in "${files[@]}"; do
  echo -n "  $file... "
  if [ -f "$file" ]; then
    echo -e "${check_mark}"
  else
    echo -e "${cross_mark}"
    failures=$((failures + 1))
  fi
done

# Check environment configuration
echo ""
echo -n "Checking .env configuration... "
if [ -f ".env" ]; then
  echo -e "${check_mark} .env file exists"

  required_vars=("AZURE_OPENAI_ENDPOINT" "AZURE_OPENAI_IMAGE_MODEL")
  for var in "${required_vars[@]}"; do
    if grep -q "^$var=" .env 2>/dev/null; then
      echo -e "  ${check_mark} $var is set"
    else
      echo -e "  ${YELLOW}⚠${NC} $var not set in .env"
    fi
  done
else
  echo -e "${YELLOW}⚠${NC} .env file not found (copy from .env.example)"
fi

# Check build output
echo ""
echo -n "Checking build output... "
if [ -d "dist" ] && [ -f "dist/index.js" ]; then
  echo -e "${check_mark} Build artifacts present"
else
  echo -e "${cross_mark} Build artifacts missing"
  failures=$((failures + 1))
fi

# Summary
echo ""
echo "=========================================="
if [ $failures -eq 0 ]; then
  echo -e "${GREEN}✓ All checks passed!${NC}"
  echo ""
  echo "Your Azure Image MCP Server is ready to use."
  echo "Next steps:"
  echo "  1. Configure your .env file with Azure credentials"
  echo "  2. Run: npm start"
  echo "  3. See QUICKSTART.md for VS Code integration"
  exit 0
else
  echo -e "${RED}✗ $failures check(s) failed${NC}"
  echo ""
  echo "Please fix the issues above before proceeding."
  exit 1
fi
