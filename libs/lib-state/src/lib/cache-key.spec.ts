import { cacheKey } from './cache-key';

describe('cacheKey', () => {
  it('sorts query parameters for stable cache reuse', () => {
    expect(cacheKey('users', 'list', 'tenant-a', { page: 1, status: 'active' }))
      .toBe(cacheKey('users', 'list', 'tenant-a', { status: 'active', page: 1 }));
  });
  it('separates scopes and parameter values', () => {
    expect(cacheKey('users', 'list', 'tenant-a', { page: 1 }))
      .not.toBe(cacheKey('users', 'list', 'tenant-b', { page: 1 }));
  });
});
