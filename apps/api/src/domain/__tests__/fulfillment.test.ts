import { describe, expect, it } from 'vitest';
import { isAuthorizedToRedeem, normalizeCollectionCode } from '../fulfillment';

describe('collection codes', () => {
  it('strips spaces so a spoken voucher matches the stored code', () => {
    expect(normalizeCollectionCode('849 204')).toBe('849204');
    expect(normalizeCollectionCode('  849   204  ')).toBe('849204');
  });

  it('allows the assigned hub manager and the demo path with no manager id', () => {
    expect(isAuthorizedToRedeem('manager-1', 'manager-1')).toBe(true);
    expect(isAuthorizedToRedeem('', 'manager-1')).toBe(true);
  });

  it('rejects a manager from a different hub', () => {
    expect(isAuthorizedToRedeem('manager-2', 'manager-1')).toBe(false);
  });
});
