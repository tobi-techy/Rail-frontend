/**
 * API Services Index
 * Central export point for all API services
 */

export { authService } from './auth.service';
export { portfolioService } from './portfolio.service';
export { walletService } from './wallet.service';
export { userService } from './user.service';
export { passcodeService } from './passcode.service';
export { onboardingService } from './onboarding.service';
export { kycService } from './kyc.service';
export { stationService } from './station.service';
export { fundingService } from './funding.service';
export { allocationService } from './allocation.service';
export { passkeyService } from './passkey.service';
export { marketService } from './market.service';
export { investmentService } from './investment.service';
export { notificationService } from './notification.service';

// Re-export for convenience
export { default as auth } from './auth.service';
export { default as portfolio } from './portfolio.service';
export { default as wallet } from './wallet.service';
export { default as user } from './user.service';
export { default as passcode } from './passcode.service';
export { default as onboarding } from './onboarding.service';
export { default as kyc } from './kyc.service';
export { default as station } from './station.service';
export { default as funding } from './funding.service';
export { default as allocation } from './allocation.service';
export { default as market } from './market.service';
export { default as investment } from './investment.service';
export { default as notification } from './notification.service';
