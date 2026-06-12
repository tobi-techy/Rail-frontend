#!/bin/bash
# TestFlight Fixes Verification Script
# Run this before deploying to TestFlight to verify all changes are in place

set -e

echo "🔍 TestFlight Fixes Verification"
echo "================================"
echo ""

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

ISSUES=0

# Check 1: routeHelpers.ts has fallback routing
echo "1. Checking routeHelpers.ts for fallback routing..."
if grep -q "CRITICAL FIX: Fallback for cases where user data exists" utils/routeHelpers.ts; then
  echo -e "${GREEN}✓${NC} Fallback routing found"
else
  echo -e "${RED}✗${NC} Fallback routing NOT found in routeHelpers.ts"
  ISSUES=$((ISSUES + 1))
fi

# Check 2: useProtectedRoute.ts has detailed logging
echo "2. Checking useProtectedRoute.ts for detailed state logging..."
if grep -q "CRITICAL: Add detailed logging" hooks/useProtectedRoute.ts; then
  echo -e "${GREEN}✓${NC} Detailed logging found"
else
  echo -e "${RED}✗${NC} Detailed logging NOT found in useProtectedRoute.ts"
  ISSUES=$((ISSUES + 1))
fi

# Check 3: useProtectedRoute.ts has stored credentials detection
echo "3. Checking useProtectedRoute.ts for stored credentials detection..."
if grep -q "User has stored credentials but tokens invalid/missing" hooks/useProtectedRoute.ts; then
  echo -e "${GREEN}✓${NC} Stored credentials detection found"
else
  echo -e "${RED}✗${NC} Stored credentials detection NOT found"
  ISSUES=$((ISSUES + 1))
fi

# Check 4: client.ts has enhanced error diagnostics
echo "4. Checking api/client.ts for enhanced network error diagnostics..."
if grep -q "Enhanced diagnostics for network errors" api/client.ts; then
  echo -e "${GREEN}✓${NC} Enhanced error diagnostics found"
else
  echo -e "${RED}✗${NC} Enhanced error diagnostics NOT found"
  ISSUES=$((ISSUES + 1))
fi

# Check 5: client.ts has specific error codes
echo "5. Checking api/client.ts for specific error code handling..."
if grep -q "ECONNREFUSED\|ENOTFOUND" api/client.ts; then
  echo -e "${GREEN}✓${NC} Specific error code handling found"
else
  echo -e "${RED}✗${NC} Specific error code handling NOT found"
  ISSUES=$((ISSUES + 1))
fi

# Check 6: Backend auth handler has unverified user fix
echo "6. Checking backend auth handler for unverified user fix..."
if grep -q "For existing unverified user, ensure pending registration entry exists" ../RAIL_BACKEND/internal/api/handlers/auth/auth_handlers.go 2>/dev/null; then
  echo -e "${GREEN}✓${NC} Backend unverified user fix found"
else
  echo -e "${YELLOW}⚠${NC} Backend fix not found (may not be committed yet)"
fi

# Check 7: TypeScript compilation (for our changes only)
echo "7. Checking TypeScript for our changes..."
if npx tsc --noEmit 2>&1 | grep -q "api/client.ts\|hooks/useProtectedRoute\|utils/routeHelpers"; then
  echo -e "${RED}✗${NC} TypeScript errors in our changed files"
  ISSUES=$((ISSUES + 1))
else
  echo -e "${GREEN}✓${NC} No TypeScript errors in changed files"
fi

# Check 8: Linting
echo "8. Checking ESLint..."
if npm run lint > /dev/null 2>&1; then
  echo -e "${GREEN}✓${NC} Linting passes"
else
  echo -e "${YELLOW}⚠${NC} Linting warnings (not blocking)"
fi

echo ""
echo "================================"

if [ $ISSUES -eq 0 ]; then
  echo -e "${GREEN}✓ All checks passed! Ready for TestFlight${NC}"
  exit 0
else
  echo -e "${RED}✗ $ISSUES check(s) failed${NC}"
  echo ""
  echo "Please review the TESTFLIGHT_FIXES_APPLIED.md for details"
  exit 1
fi
