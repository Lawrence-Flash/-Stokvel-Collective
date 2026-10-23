import { describe, expect, it } from 'vitest';
import {
  assertContributionQuantity,
  contributionAmount,
  isPoolExpired,
  nextPoolTotals,
  poolProgressPercent,
  roundMoney,
  savingsPercent,
  statusAfterContribution,
} from '../ledger';

describe('contributions', () => {
  it('prices a contribution as unit price times quantity, in cents', () => {
    expect(contributionAmount(89.99, 2)).toBe(179.98);
    expect(contributionAmount('10.50', 4)).toBe(42);
    expect(contributionAmount({ toString: () => '45.5' }, 3)).toBe(136.5);
  });

  it('rejects a quantity that would shrink or skip the pool', () => {
    expect(() => assertContributionQuantity(0)).toThrow('Quantity must be a positive whole number');
    expect(() => contributionAmount(10, -2)).toThrow('Quantity must be a positive whole number');
    expect(() => contributionAmount(10, 1.5)).toThrow('Quantity must be a positive whole number');
  });

  it('rejects a negative or non-numeric unit price', () => {
    expect(() => contributionAmount(-1, 1)).toThrow('Unit price must be a non-negative number');
    expect(() => contributionAmount('not-a-price', 1)).toThrow('Unit price must be a non-negative number');
  });
});

describe('balances', () => {
  it('adds successive member contributions onto the running pool balance', () => {
    const first = nextPoolTotals(0, 0, 2, contributionAmount(45.5, 2));
    const second = nextPoolTotals(first.currentQuantity, first.currentAmount, 1, contributionAmount(45.5, 1));

    expect(first).toEqual({ currentQuantity: 2, currentAmount: 91 });
    expect(second).toEqual({ currentQuantity: 3, currentAmount: 136.5 });
  });

  it('accepts a decimal string balance the way Prisma returns money', () => {
    expect(nextPoolTotals(35, '3149.65', 1, 89.99)).toEqual({
      currentQuantity: 36,
      currentAmount: 3239.64,
    });
  });

  it('rejects a non-finite stored balance', () => {
    expect(() => nextPoolTotals(1, 'n/a', 1, 10)).toThrow('Pool balance must be a finite number');
  });

  it('rounds to cents', () => {
    expect(roundMoney(10.126)).toBe(10.13);
    expect(roundMoney(10.124)).toBe(10.12);
    expect(roundMoney(10)).toBe(10);
  });
});

describe('pool progress and savings', () => {
  it('calculates savings against retail', () => {
    expect(savingsPercent(89.99, 119.99)).toBe(25);
  });

  it('returns zero savings when retail price is not positive', () => {
    expect(savingsPercent(10, 0)).toBe(0);
    expect(savingsPercent(10, -5)).toBe(0);
  });

  it('reports a negative saving when the bulk price is above retail', () => {
    expect(savingsPercent(150, 100)).toBe(-50);
  });

  it('calculates ordered progress and caps it at 100 percent', () => {
    expect(poolProgressPercent(35, 100)).toBe(35);
    expect(poolProgressPercent(140, 100)).toBe(100);
    expect(poolProgressPercent(1, 0)).toBe(0);
  });
});

describe('pool lifecycle thresholds', () => {
  const now = new Date('2026-10-23T12:00:00.000Z');

  it('keeps a pool open until the ordered quantity reaches the target', () => {
    expect(statusAfterContribution(99, 100)).toBe('OPEN');
    expect(statusAfterContribution(100, 100)).toBe('LOCKED');
    expect(statusAfterContribution(101, 100)).toBe('LOCKED');
  });

  it('treats the exact expiry timestamp as still open and any later instant as expired', () => {
    expect(isPoolExpired(now, now)).toBe(false);
    expect(isPoolExpired(new Date('2026-10-23T12:00:01.000Z'), now)).toBe(false);
    expect(isPoolExpired(new Date('2026-10-23T11:59:59.000Z'), now)).toBe(true);
  });
});
