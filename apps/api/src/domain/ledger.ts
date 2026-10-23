const MONEY_SCALE = 100;

export function roundMoney(value: number): number {
  return Math.round((value + Number.EPSILON) * MONEY_SCALE) / MONEY_SCALE;
}

export function assertContributionQuantity(quantity: number): void {
  if (!Number.isInteger(quantity) || quantity < 1) {
    throw new Error('Quantity must be a positive whole number');
  }
}

export function contributionAmount(unitPrice: unknown, quantity: number): number {
  assertContributionQuantity(quantity);
  const price = Number(unitPrice);
  if (!Number.isFinite(price) || price < 0) {
    throw new Error('Unit price must be a non-negative number');
  }
  return roundMoney(price * quantity);
}

export interface PoolTotals {
  currentQuantity: number;
  currentAmount: number;
}

export function nextPoolTotals(
  currentQuantity: number,
  currentAmount: unknown,
  quantity: number,
  amount: number,
): PoolTotals {
  assertContributionQuantity(quantity);
  const balance = Number(currentAmount);
  if (!Number.isFinite(balance)) {
    throw new Error('Pool balance must be a finite number');
  }
  return {
    currentQuantity: currentQuantity + quantity,
    currentAmount: roundMoney(balance + amount),
  };
}

export function statusAfterContribution(
  updatedQuantity: number,
  targetQuantity: number,
): 'OPEN' | 'LOCKED' {
  return updatedQuantity >= targetQuantity ? 'LOCKED' : 'OPEN';
}

export function poolProgressPercent(currentQty: number, targetQty: number): number {
  if (targetQty <= 0) {
    return 0;
  }
  return Math.min(Math.round((currentQty / targetQty) * 100), 100);
}

export function savingsPercent(unitPrice: number, retailPrice: number): number {
  if (retailPrice <= 0) {
    return 0;
  }
  return Math.round(((retailPrice - unitPrice) / retailPrice) * 100);
}

export function isPoolExpired(expiresAt: Date, now: Date = new Date()): boolean {
  return now > expiresAt;
}
