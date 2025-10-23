/**
 * Authentication & Onboarding Flow Testing Script
 * 
 * This script tests the complete authentication and onboarding flow
 * to ensure all API integrations work correctly.
 * 
 * Usage:
 *   ts-node scripts/test-auth-flow.ts
 * 
 * Or with environment variables:
 *   API_BASE_URL=http://localhost:8080/api ts-node scripts/test-auth-flow.ts
 */

import axios, { AxiosInstance } from 'axios';

// Configuration
const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:8080/api';
const TEST_EMAIL = `test-${Date.now()}@example.com`;
const TEST_PASSWORD = 'TestPassword123!';
const TEST_PASSCODE = '1234';

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

// Test context
interface TestContext {
  email: string;
  password: string;
  userId?: string;
  accessToken?: string;
  refreshToken?: string;
  verificationCode?: string;
  passcode?: string;
}

const context: TestContext = {
  email: TEST_EMAIL,
  password: TEST_PASSWORD,
  passcode: TEST_PASSCODE,
};

// API client
const apiClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000,
});

// Add request interceptor for auth
apiClient.interceptors.request.use((config) => {
  if (context.accessToken) {
    config.headers.Authorization = `Bearer ${context.accessToken}`;
  }
  return config;
});

// Helper functions
function log(message: string, type: 'success' | 'error' | 'info' | 'warn' = 'info') {
  const color = {
    success: colors.green,
    error: colors.red,
    info: colors.blue,
    warn: colors.yellow,
  }[type];
  
  console.log(`${color}${message}${colors.reset}`);
}

function logStep(step: string) {
  console.log(`\n${colors.cyan}=== ${step} ===${colors.reset}\n`);
}

async function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Test functions
async function testRegistration() {
  logStep('Step 1: Registration');
  
  try {
    const response = await apiClient.post('/v1/auth/register', {
      email: context.email,
      password: context.password,
    });
    
    log('✓ Registration successful', 'success');
    log(`  Message: ${response.data.message}`, 'info');
    log(`  Identifier: ${response.data.identifier}`, 'info');
    
    return true;
  } catch (error: any) {
    log(`✗ Registration failed: ${error.response?.data?.message || error.message}`, 'error');
    if (error.response?.data?.code === 'USER_EXISTS') {
      log('  Note: User already exists, attempting to use existing account', 'warn');
      return true; // Continue with existing user
    }
    return false;
  }
}

async function testVerifyCode(code: string) {
  logStep('Step 2: Email Verification');
  
  try {
    const response = await apiClient.post('/v1/auth/verify-code', {
      email: context.email,
      code: code,
    });
    
    log('✓ Email verification successful', 'success');
    log(`  User ID: ${response.data.user.id}`, 'info');
    log(`  Email: ${response.data.user.email}`, 'info');
    log(`  Email Verified: ${response.data.user.emailVerified}`, 'info');
    log(`  Onboarding Status: ${response.data.user.onboardingStatus}`, 'info');
    
    // Store tokens
    context.userId = response.data.user.id;
    context.accessToken = response.data.accessToken;
    context.refreshToken = response.data.refreshToken;
    
    return true;
  } catch (error: any) {
    log(`✗ Email verification failed: ${error.response?.data?.message || error.message}`, 'error');
    log(`  Error Code: ${error.response?.data?.code}`, 'error');
    return false;
  }
}

async function testLogin() {
  logStep('Step 3: Login');
  
  try {
    const response = await apiClient.post('/v1/auth/login', {
      email: context.email,
      password: context.password,
    });
    
    log('✓ Login successful', 'success');
    log(`  User ID: ${response.data.user.id}`, 'info');
    log(`  Email Verified: ${response.data.user.emailVerified}`, 'info');
    log(`  Onboarding Status: ${response.data.user.onboardingStatus}`, 'info');
    
    // Update tokens
    context.userId = response.data.user.id;
    context.accessToken = response.data.accessToken;
    context.refreshToken = response.data.refreshToken;
    
    return true;
  } catch (error: any) {
    log(`✗ Login failed: ${error.response?.data?.message || error.message}`, 'error');
    return false;
  }
}

async function testGetOnboardingStatus() {
  logStep('Step 4: Get Onboarding Status');
  
  try {
    const response = await apiClient.get('/v1/onboarding/status');
    
    log('✓ Onboarding status retrieved', 'success');
    log(`  User ID: ${response.data.userId}`, 'info');
    log(`  Onboarding Status: ${response.data.onboardingStatus}`, 'info');
    log(`  KYC Status: ${response.data.kycStatus}`, 'info');
    log(`  Current Step: ${response.data.currentStep}`, 'info');
    log(`  Completed Steps: ${response.data.completedSteps.join(', ')}`, 'info');
    log(`  Can Proceed: ${response.data.canProceed}`, 'info');
    
    if (response.data.walletStatus) {
      log(`  Wallet Status:`, 'info');
      log(`    Total Wallets: ${response.data.walletStatus.totalWallets}`, 'info');
      log(`    Created Wallets: ${response.data.walletStatus.createdWallets}`, 'info');
      log(`    Pending Wallets: ${response.data.walletStatus.pendingWallets}`, 'info');
    }
    
    if (response.data.requiredActions.length > 0) {
      log(`  Required Actions:`, 'info');
      response.data.requiredActions.forEach((action: string) => {
        log(`    - ${action}`, 'info');
      });
    }
    
    return true;
  } catch (error: any) {
    log(`✗ Failed to get onboarding status: ${error.response?.data?.message || error.message}`, 'error');
    return false;
  }
}

async function testCreatePasscode() {
  logStep('Step 5: Create Passcode');
  
  try {
    const response = await apiClient.post('/v1/security/passcode', {
      passcode: context.passcode,
      confirmPasscode: context.passcode,
    });
    
    log('✓ Passcode created successfully', 'success');
    log(`  Message: ${response.data.message}`, 'info');
    log(`  Enabled: ${response.data.status.enabled}`, 'info');
    log(`  Locked: ${response.data.status.locked}`, 'info');
    log(`  Remaining Attempts: ${response.data.status.remainingAttempts}`, 'info');
    
    return true;
  } catch (error: any) {
    log(`✗ Passcode creation failed: ${error.response?.data?.message || error.message}`, 'error');
    log(`  Error Code: ${error.response?.data?.code}`, 'error');
    
    // If passcode already exists, it's not necessarily a failure
    if (error.response?.data?.code === 'PASSCODE_EXISTS') {
      log('  Note: Passcode already exists, continuing...', 'warn');
      return true;
    }
    return false;
  }
}

async function testGetPasscodeStatus() {
  logStep('Step 6: Get Passcode Status');
  
  try {
    const response = await apiClient.get('/v1/security/passcode');
    
    log('✓ Passcode status retrieved', 'success');
    log(`  Enabled: ${response.data.enabled}`, 'info');
    log(`  Locked: ${response.data.locked}`, 'info');
    log(`  Failed Attempts: ${response.data.failedAttempts}`, 'info');
    log(`  Remaining Attempts: ${response.data.remainingAttempts}`, 'info');
    
    return true;
  } catch (error: any) {
    log(`✗ Failed to get passcode status: ${error.response?.data?.message || error.message}`, 'error');
    return false;
  }
}

async function testVerifyPasscode() {
  logStep('Step 7: Verify Passcode');
  
  try {
    const response = await apiClient.post('/v1/security/passcode/verify', {
      passcode: context.passcode,
    });
    
    log('✓ Passcode verified successfully', 'success');
    log(`  Verified: ${response.data.verified}`, 'info');
    log(`  Session Token: ${response.data.sessionToken.substring(0, 20)}...`, 'info');
    log(`  Expires At: ${response.data.expiresAt}`, 'info');
    
    return true;
  } catch (error: any) {
    log(`✗ Passcode verification failed: ${error.response?.data?.message || error.message}`, 'error');
    return false;
  }
}

async function testRefreshToken() {
  logStep('Step 8: Refresh Token');
  
  try {
    const response = await apiClient.post('/v1/auth/refresh', {
      refreshToken: context.refreshToken,
    });
    
    log('✓ Token refresh successful', 'success');
    log(`  New Access Token: ${response.data.accessToken.substring(0, 20)}...`, 'info');
    log(`  Expires At: ${response.data.expiresAt}`, 'info');
    
    // Update access token
    context.accessToken = response.data.accessToken;
    
    return true;
  } catch (error: any) {
    log(`✗ Token refresh failed: ${error.response?.data?.message || error.message}`, 'error');
    return false;
  }
}

async function testResendCode() {
  logStep('Step 9: Resend Verification Code (Testing Rate Limit)');
  
  try {
    const response = await apiClient.post('/v1/auth/resend-code', {
      email: context.email,
    });
    
    log('✓ Resend code successful', 'success');
    log(`  Message: ${response.data.message}`, 'info');
    
    return true;
  } catch (error: any) {
    const errorCode = error.response?.data?.code;
    
    if (errorCode === 'ALREADY_VERIFIED') {
      log('✓ Email already verified (expected)', 'success');
      return true;
    } else if (errorCode === 'TOO_MANY_REQUESTS') {
      log('✓ Rate limiting working correctly', 'success');
      return true;
    } else {
      log(`✗ Resend code failed: ${error.response?.data?.message || error.message}`, 'error');
      return false;
    }
  }
}

async function testLogout() {
  logStep('Step 10: Logout');
  
  try {
    await apiClient.post('/v1/auth/logout');
    
    log('✓ Logout successful', 'success');
    
    // Clear tokens
    context.accessToken = undefined;
    context.refreshToken = undefined;
    
    return true;
  } catch (error: any) {
    log(`✗ Logout failed: ${error.response?.data?.message || error.message}`, 'error');
    return false;
  }
}

// Main test runner
async function runTests() {
  console.log(`${colors.cyan}╔═══════════════════════════════════════════════════════════╗${colors.reset}`);
  console.log(`${colors.cyan}║  Authentication & Onboarding Flow Test Suite             ║${colors.reset}`);
  console.log(`${colors.cyan}╚═══════════════════════════════════════════════════════════╝${colors.reset}\n`);
  
  log(`API Base URL: ${API_BASE_URL}`, 'info');
  log(`Test Email: ${context.email}`, 'info');
  log(`Test Password: ${context.password}`, 'info');
  log(`Test Passcode: ${context.passcode}`, 'info');
  
  const results: { [key: string]: boolean } = {};
  
  // Run tests
  results['Registration'] = await testRegistration();
  
  if (results['Registration']) {
    log('\n⚠️  Manual Step Required:', 'warn');
    log('  Please check the server logs or email for the verification code', 'warn');
    log('  For testing purposes, you can also check Redis or your verification service', 'warn');
    
    // In a real test, you'd need to retrieve the code from your verification service
    // For now, we'll prompt for it
    const readline = require('readline').createInterface({
      input: process.stdin,
      output: process.stdout,
    });
    
    const code = await new Promise<string>((resolve) => {
      readline.question('\nEnter the 6-digit verification code: ', (answer: string) => {
        readline.close();
        resolve(answer);
      });
    });
    
    if (code && code.length === 6) {
      results['Email Verification'] = await testVerifyCode(code);
    } else {
      log('Invalid code format, skipping verification test', 'warn');
      results['Email Verification'] = false;
    }
  }
  
  // Only continue if registration and verification succeeded
  if (results['Email Verification']) {
    results['Onboarding Status (Initial)'] = await testGetOnboardingStatus();
    results['Create Passcode'] = await testCreatePasscode();
    
    if (results['Create Passcode']) {
      await sleep(1000); // Wait for passcode to be fully created
      results['Get Passcode Status'] = await testGetPasscodeStatus();
      results['Verify Passcode'] = await testVerifyPasscode();
      results['Onboarding Status (After Passcode)'] = await testGetOnboardingStatus();
    }
    
    results['Refresh Token'] = await testRefreshToken();
    results['Resend Code'] = await testResendCode();
    results['Logout'] = await testLogout();
    
    // Test login with existing account
    results['Login (Existing User)'] = await testLogin();
  }
  
  // Summary
  logStep('Test Summary');
  
  const totalTests = Object.keys(results).length;
  const passedTests = Object.values(results).filter(Boolean).length;
  const failedTests = totalTests - passedTests;
  
  console.log(`\nResults:`);
  Object.entries(results).forEach(([test, passed]) => {
    const icon = passed ? '✓' : '✗';
    const color = passed ? colors.green : colors.red;
    console.log(`${color}  ${icon} ${test}${colors.reset}`);
  });
  
  console.log(`\n${colors.cyan}═══════════════════════════════════════════════════════════${colors.reset}`);
  console.log(`Total: ${totalTests} | Passed: ${colors.green}${passedTests}${colors.reset} | Failed: ${colors.red}${failedTests}${colors.reset}`);
  console.log(`${colors.cyan}═══════════════════════════════════════════════════════════${colors.reset}\n`);
  
  if (failedTests === 0) {
    log('🎉 All tests passed!', 'success');
    process.exit(0);
  } else {
    log(`⚠️  ${failedTests} test(s) failed`, 'error');
    process.exit(1);
  }
}

// Run tests
runTests().catch((error) => {
  log(`\n❌ Test suite failed: ${error.message}`, 'error');
  console.error(error);
  process.exit(1);
});
