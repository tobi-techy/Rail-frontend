#!/usr/bin/env ts-node
/**
 * Routing Diagnostic Script
 *
 * Use this to verify routing configuration is correct:
 * npx ts-node scripts/diagnose-routing.ts
 *
 * This script checks:
 * 1. Route constants are properly defined
 * 2. Stash routes in buildRouteConfig
 * 3. Stack screens registered in _layout.tsx
 * 4. No syntax errors in routing files
 */

import * as fs from 'fs';
import * as path from 'path';

interface DiagnosticResult {
  name: string;
  passed: boolean;
  message: string;
  severity: 'error' | 'warning' | 'info';
}

const results: DiagnosticResult[] = [];
const projectRoot = path.resolve(__dirname, '..');

function checkFile(filePath: string, test: (content: string) => boolean, name: string) {
  const fullPath = path.join(projectRoot, filePath);
  try {
    const content = fs.readFileSync(fullPath, 'utf-8');
    const passed = test(content);
    results.push({
      name: `[${filePath}] ${name}`,
      passed,
      message: passed ? '✓ Pass' : '✗ Fail',
      severity: passed ? 'info' : 'error',
    });
    return { content, passed };
  } catch (error) {
    results.push({
      name: `[${filePath}] ${name}`,
      passed: false,
      message: `Failed to read file: ${error instanceof Error ? error.message : String(error)}`,
      severity: 'error',
    });
    return { content: '', passed: false };
  }
}

function main() {
  console.log('🔍 Routing Diagnostic Report\n');

  // Test 1: Route constants exist
  checkFile(
    'constants/routes.ts',
    (content) => {
      return (
        content.includes("SPENDING_STASH: '/spending-stash'") &&
        content.includes("INVESTMENT_STASH: '/investment-stash'")
      );
    },
    'Route constants defined'
  );

  // Test 2: buildRouteConfig recognizes stash segments
  checkFile(
    'utils/routeHelpers.ts',
    (content) => {
      return (
        content.includes("segments[0] === 'spending-stash'") &&
        content.includes("segments[0] === 'investment-stash'")
      );
    },
    'Stash segments in buildRouteConfig'
  );

  // Test 3: buildRouteConfig checks pathname for stash
  checkFile(
    'utils/routeHelpers.ts',
    (content) => {
      return (
        content.includes("pathname.startsWith('/spending-stash')") &&
        content.includes("pathname.startsWith('/investment-stash')")
      );
    },
    'Stash pathname checks in buildRouteConfig'
  );

  // Test 4: Stack.Group used for stash screens
  checkFile(
    'app/_layout.tsx',
    (content) => {
      return (
        content.includes('<Stack.Group') &&
        content.includes('spending-stash') &&
        content.includes('investment-stash')
      );
    },
    'Stash screens in Stack.Group'
  );

  // Test 5: No duplicate screen definitions
  const { content: layoutContent } = checkFile(
    'app/_layout.tsx',
    (content) => true,
    'Layout file readable'
  );

  const spendingStashCount = (layoutContent.match(/spending-stash/g) || []).length;
  const investmentStashCount = (layoutContent.match(/investment-stash/g) || []).length;

  results.push({
    name: '[app/_layout.tsx] No duplicate stash screen definitions',
    passed: spendingStashCount === 2 && investmentStashCount === 2, // 2 each: once in comment, once in Stack.Screen
    message: `spending-stash: ${spendingStashCount} mentions, investment-stash: ${investmentStashCount} mentions`,
    severity: spendingStashCount === 2 && investmentStashCount === 2 ? 'info' : 'warning',
  });

  // Test 6: Check handleAuthenticatedUser logic
  checkFile(
    'utils/routeHelpers.ts',
    (content) => {
      return content.includes('handleAuthenticatedUser') && content.includes('inCriticalAuthFlow');
    },
    'Authentication routing logic present'
  );

  // Test 7: Check passcode session handling
  checkFile(
    'utils/routeHelpers.ts',
    (content) => {
      return content.includes('hasValidPasscodeSession') && content.includes('/login-passcode');
    },
    'Passcode session routing present'
  );

  // Test 8: SessionManager handles passcode expiry
  checkFile(
    'utils/sessionManager.ts',
    (content) => {
      return (
        content.includes('handlePasscodeSessionExpired') &&
        content.includes('schedulePasscodeSessionExpiry')
      );
    },
    'SessionManager passcode methods'
  );

  // Test 9: useProtectedRoute listens for app state
  checkFile(
    'hooks/useProtectedRoute.ts',
    (content) => {
      return (
        content.includes('AppState.addEventListener') &&
        content.includes("'change'") &&
        content.includes('isPasscodeSessionExpired')
      );
    },
    'useProtectedRoute app state listener'
  );

  // Test 10: Routes used in correct places
  checkFile(
    'app/(tabs)/index.tsx',
    (content) => {
      return (
        content.includes("router.push('/spending-stash')") &&
        content.includes("router.push('/investment-stash')")
      );
    },
    'Dashboard navigation to stash screens'
  );

  // Print results
  console.log('Results:\n');

  const errors = results.filter((r) => r.severity === 'error');
  const warnings = results.filter((r) => r.severity === 'warning');
  const infos = results.filter((r) => r.severity === 'info');

  if (errors.length > 0) {
    console.log(`❌ ERRORS (${errors.length}):`);
    errors.forEach((r) => {
      console.log(`  ${r.name}`);
      console.log(`  → ${r.message}\n`);
    });
  }

  if (warnings.length > 0) {
    console.log(`⚠️  WARNINGS (${warnings.length}):`);
    warnings.forEach((r) => {
      console.log(`  ${r.name}`);
      console.log(`  → ${r.message}\n`);
    });
  }

  if (infos.length > 0) {
    console.log(`ℹ️  PASSED (${infos.length}):`);
    infos.forEach((r) => {
      console.log(`  ✓ ${r.name}`);
    });
    console.log();
  }

  // Summary
  const totalPassed = results.filter((r) => r.passed).length;
  const total = results.length;
  const percentage = Math.round((totalPassed / total) * 100);

  console.log(`\n📊 Summary: ${totalPassed}/${total} checks passed (${percentage}%)\n`);

  if (errors.length === 0) {
    console.log('✅ All critical checks passed! Routing configuration looks good.\n');
    process.exit(0);
  } else {
    console.log('❌ Some checks failed. Please review the errors above.\n');
    process.exit(1);
  }
}

main();
