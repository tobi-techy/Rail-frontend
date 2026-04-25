/**
 * Miriam Impact Calculator
 * Computes the financial value delivered by the AI agent across categories.
 * This is the core churn-prevention mechanism — users must SEE what they paid for.
 */

export interface MonthlyImpact {
  month: string;
  feesAvoided: number;
  autoSaved: number;
  timeSavedMinutes: number;
  badPurchasesPrevented: number;
  totalValue: number;
}

export interface ImpactBreakdown {
  lifetimeFeesAvoided: number;
  lifetimeAutoSaved: number;
  lifetimeTimeSavedHours: number;
  lifetimeBadPurchasesPrevented: number;
  totalLifetimeValue: number;
  monthlyHistory: MonthlyImpact[];
}

const TIME_VALUE_PER_HOUR = 25; // Estimated value of user's time

/**
 * Calculate impact from a set of automation rules and their execution history.
 */
export function calculateImpact(
  automations: Array<{
    totalSaved: number;
    executions: number;
    type: 'round_up' | 'auto_transfer' | 'alert' | 'budget' | 'other';
  }>,
  alertsPrevented: Array<{
    amount: number;
    type: 'overspend' | 'duplicate' | 'subscription' | 'scam';
  }>
): ImpactBreakdown {
  let lifetimeFeesAvoided = 0;
  let lifetimeAutoSaved = 0;
  let lifetimeTimeSavedMinutes = 0;
  let lifetimeBadPurchasesPrevented = 0;

  for (const auto of automations) {
    switch (auto.type) {
      case 'round_up':
      case 'auto_transfer':
        lifetimeAutoSaved += auto.totalSaved;
        break;
      case 'alert':
        lifetimeFeesAvoided += auto.totalSaved;
        break;
      case 'budget':
        lifetimeAutoSaved += auto.totalSaved;
        break;
      default:
        lifetimeAutoSaved += auto.totalSaved;
    }
    // Each automation saves ~2 minutes of manual work
    lifetimeTimeSavedMinutes += auto.executions * 2;
  }

  for (const alert of alertsPrevented) {
    switch (alert.type) {
      case 'overspend':
        lifetimeBadPurchasesPrevented += alert.amount;
        break;
      case 'duplicate':
        lifetimeFeesAvoided += alert.amount;
        break;
      case 'subscription':
        lifetimeFeesAvoided += alert.amount;
        break;
      case 'scam':
        lifetimeBadPurchasesPrevented += alert.amount;
        break;
    }
  }

  const timeValue = (lifetimeTimeSavedMinutes / 60) * TIME_VALUE_PER_HOUR;
  const totalLifetimeValue = lifetimeFeesAvoided + lifetimeAutoSaved + timeValue + lifetimeBadPurchasesPrevented;

  // Generate mock monthly history for visualization
  // In production, this would come from the backend
  const monthlyHistory: MonthlyImpact[] = generateMonthlyHistory(totalLifetimeValue);

  return {
    lifetimeFeesAvoided,
    lifetimeAutoSaved,
    lifetimeTimeSavedHours: Math.round(lifetimeTimeSavedMinutes / 60),
    lifetimeBadPurchasesPrevented,
    totalLifetimeValue,
    monthlyHistory,
  };
}

function generateMonthlyHistory(totalValue: number): MonthlyImpact[] {
  const months: MonthlyImpact[] = [];
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const now = new Date();

  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const monthValue = totalValue / 6 * (0.7 + Math.random() * 0.6);
    months.push({
      month: monthNames[d.getMonth()],
      feesAvoided: monthValue * 0.2,
      autoSaved: monthValue * 0.5,
      timeSavedMinutes: monthValue * 0.1 * 60 / TIME_VALUE_PER_HOUR,
      badPurchasesPrevented: monthValue * 0.2,
      totalValue: monthValue,
    });
  }

  return months;
}

/**
 * Format impact value for display.
 */
export function formatImpactValue(value: number, currency = '$'): string {
  if (value >= 1000) {
    return `${currency}${(value / 1000).toFixed(1)}k`;
  }
  return `${currency}${value.toFixed(0)}`;
}

/**
 * Project annual savings based on current monthly trend.
 */
export function projectAnnualSavings(monthlyData: MonthlyImpact[]): number {
  if (monthlyData.length === 0) return 0;
  const avgMonthly = monthlyData.reduce((sum, m) => sum + m.totalValue, 0) / monthlyData.length;
  return avgMonthly * 12;
}
